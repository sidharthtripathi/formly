import { Elysia } from "elysia";
import Stripe from "stripe";
import { db } from "../db";
import { users, subscriptions } from "../db/schema";
import { eq } from "drizzle-orm";

const stripeClient = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia" as const,
    })
  : null;

export const stripeRoutes = new Elysia()
  .post("/api/stripe/create-checkout", async ({ store }) => {
    if (!stripeClient) {
      return { error: "Stripe not configured" };
    }
    const user = store.user as { id: string };
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    const session = await stripeClient.checkout.sessions.create({
      customer: dbUser!.stripeCustomerId!,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
    });

    return { data: { url: session.url } };
  })
  .post("/api/stripe/portal", async ({ store }) => {
    if (!stripeClient) {
      return { error: "Stripe not configured" };
    }
    const user = store.user as { id: string };
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    const session = await stripeClient.billingPortal.sessions.create({
      customer: dbUser!.stripeCustomerId!,
      return_url: process.env.NEXT_PUBLIC_APP_URL,
    });

    return { data: { url: session.url } };
  })
  .post("/api/stripe/webhook", async ({ request }) => {
    if (!stripeClient) {
      return { error: "Stripe not configured" };
    }
    const sig = request.headers.get("stripe-signature")!;
    const body = await request.text();

    let event: Stripe.Event;
    try {
      event = stripeClient.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch {
      return { error: "Webhook signature verification failed" };
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
    }

    return { received: true };
  });