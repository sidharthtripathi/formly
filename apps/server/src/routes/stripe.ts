import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { db, users, subscriptions } from "../db/index.js";
import { eq } from "drizzle-orm";
import { AuthRequest } from "../middleware/auth.js";

const router = Router();

const stripeClient = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia" as const,
    })
  : null;

// POST /api/stripe/create-checkout - Create Stripe checkout session
router.post("/create-checkout", async (req: AuthRequest, res: Response) => {
  try {
    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    if (!process.env.STRIPE_PRO_PRICE_ID) {
      return res.status(500).json({ error: "Stripe price ID not configured" });
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!dbUser?.stripeCustomerId) {
      return res.status(400).json({ error: "No Stripe customer found" });
    }

    const session = await stripeClient.checkout.sessions.create({
      customer: dbUser.stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
    });

    return res.json({ data: { url: session.url } });
  } catch (error) {
    console.error("Create checkout error:", error);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// POST /api/stripe/portal - Create billing portal session
router.post("/portal", async (req: AuthRequest, res: Response) => {
  try {
    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!dbUser?.stripeCustomerId) {
      return res.status(400).json({ error: "No Stripe customer found" });
    }

    const session = await stripeClient.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: process.env.NEXT_PUBLIC_APP_URL,
    });

    return res.json({ data: { url: session.url } });
  } catch (error) {
    console.error("Create portal error:", error);
    return res.status(500).json({ error: "Failed to create portal session" });
  }
});

// POST /webhooks/stripe - Handle Stripe webhooks (raw body, no auth)
router.post("/", async (req: Request, res: Response) => {
  try {
    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(500).json({ error: "Stripe webhook secret not configured" });
    }

    const sig = req.headers["stripe-signature"] as string;
    const body = req.body; // Already parsed as raw buffer due to middleware

    let event: Stripe.Event;
    try {
      event = stripeClient.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return res.status(400).json({ error: "Invalid signature" });
    }

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await db
          .update(subscriptions)
          .set({
            status: sub.status as "active" | "canceled" | "past_due",
            stripePriceId: sub.items.data[0].price.id,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, sub.id));
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await db
          .update(users)
          .set({ plan: "free", updatedAt: new Date() })
          .where(eq(users.stripeCustomerId, sub.customer as string));
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const customerId = session.customer as string;
          const subscription = await stripeClient.subscriptions.retrieve(session.subscription as string);

          const user = await db.query.users.findFirst({
            where: eq(users.stripeCustomerId, customerId)
          });

          if (!user) {
            console.error("Webhook: User not found for customer:", customerId);
            break;
          }

          // Upsert subscription - update if exists, insert if not
          const existingSub = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.stripeSubscriptionId, subscription.id)
          });

          if (existingSub) {
            await db
              .update(subscriptions)
              .set({
                status: subscription.status as "active" | "canceled" | "past_due",
                stripePriceId: subscription.items.data[0].price.id,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.id, existingSub.id));
          } else {
            await db.insert(subscriptions).values({
              userId: user.id,
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0].price.id,
              status: subscription.status as "active" | "canceled" | "past_due",
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            });
          }

          // Update user to pro plan
          await db
            .update(users)
            .set({ plan: "pro", updatedAt: new Date() })
            .where(eq(users.id, user.id));
        }
        break;
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
});

export { router as stripeRouter };
