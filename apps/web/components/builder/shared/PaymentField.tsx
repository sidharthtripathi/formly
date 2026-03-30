"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFieldProps {
  field: {
    id: string;
    label: string;
    helpText?: string;
    required?: boolean;
    validation?: {
      amount?: number; // in cents
      currency?: string;
    };
  };
  value?: unknown;
  onChange?: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

export function PaymentField(props: PaymentFieldProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { label, helpText, required, validation } = props.field;
  const { error, disabled } = props;
  const amount = validation?.amount || 500; // $5.00 default
  const currency = validation?.currency || "usd";

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      // In production, this would call your API to create a PaymentIntent
      // and return the client secret
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency,
          fieldId: props.field.id,
        }),
      });
      const { clientSecret: secret } = await response.json();
      setClientSecret(secret);
    } catch {
      console.error("Failed to initialize payment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>

      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {!clientSecret ? (
        <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-4">
          <div className="space-y-1">
            <p className="text-2xl font-bold">
              ${(amount / 100).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">{currency.toUpperCase()}</p>
          </div>
          <Button onClick={handleCheckout} disabled={isLoading || disabled}>
            {isLoading ? "Loading..." : `Pay $${(amount / 100).toFixed(2)}`}
          </Button>
        </div>
      ) : (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
              labels: "floating",
            },
          }}
        >
          <PaymentForm
            fieldId={props.field.id}
            onComplete={(result) => props.onChange?.(result)}
          />
        </Elements>
      )}
    </div>
  );
}

function PaymentForm({
  fieldId,
  onComplete,
}: {
  fieldId: string;
  onComplete: (value: unknown) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message || "Payment failed");
      setIsProcessing(false);
    } else if (paymentIntent?.status === "succeeded") {
      onComplete({
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isProcessing || !stripe}>
        {isProcessing ? "Processing..." : "Complete Payment"}
      </Button>
    </form>
  );
}
