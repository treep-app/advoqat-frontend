import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Checkout Form component used inside the Elements provider
const CheckoutForm = ({ 
  sessionId,
  onSuccess,
  onCancel 
}: { 
  sessionId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/payment-success?session_id=${sessionId}`,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'An unexpected error occurred.');
      } else {
        // Payment succeeded
        onSuccess();
      }
    } catch {
      setErrorMessage('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {errorMessage && <div className="text-red-500 mt-4">{errorMessage}</div>}
      <div className="flex justify-between mt-6">
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </Button>
      </div>
    </form>
  );
};

// Main modal component
interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientSecret: string;
  sessionId: string;
  amount: number;
  title: string;
}

export default function StripeCheckoutModal({
  isOpen,
  onClose,
  onSuccess,
  clientSecret,
  sessionId,
  amount,
  title
}: StripeCheckoutModalProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Only set ready if we have both an open modal and a valid client secret
    // A valid client secret must be at least 10 characters
    if (isOpen && clientSecret && clientSecret.length > 10) {
      setReady(true);
    } else {
      setReady(false);
    }
  }, [isOpen, clientSecret]);

  const options = clientSecret ? {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0070f3',
        colorBackground: '#ffffff',
        colorText: '#30313d',
      },
    },
  } : {};

  useEffect(() => {
    // Debug logging to help troubleshoot
    if (isOpen) {
      console.log('Stripe modal should be opening', { isOpen, hasClientSecret: !!clientSecret, clientSecretLength: clientSecret?.length });
    }
  }, [isOpen, clientSecret]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose} forceMount={true}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <div className="text-sm text-gray-500 mt-2 mb-4">
            Amount: ${(amount)}
          </div>
        </DialogHeader>
        {clientSecret ? (
          ready ? (
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm 
                sessionId={sessionId}
                onSuccess={onSuccess}
                onCancel={onClose}
              />
            </Elements>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading payment form...</span>
            </div>
          )
        ) : (
          <div className="text-red-500 py-4 text-center">
            Error loading payment form. Please try again.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
