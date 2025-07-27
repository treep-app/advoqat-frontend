import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
// This is a public key and safe to include in client-side code
let stripePromise = null;

// Initialize Stripe with publishable key
export const getStripe = async () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Client-side state for modal checkout
export let checkoutState = {
  isModalOpen: false,
  clientSecret: '',
  sessionId: '',
  amount: 0,
  title: ''
};

// Function to set checkout state (for modal)
export const setCheckoutState = (state) => {
  checkoutState = { ...checkoutState, ...state };
  return checkoutState;
};

// Create a checkout session and handle Stripe payment (can redirect or use modal)
export const createCheckoutSession = async ({
  consultationId,
  lawyerName,
  datetime,
  method,
  fee,
  userId,
  customerId = null, // Make customerId optional with a default value
  useModal = true // Whether to use modal checkout or redirect
}) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        consultationId,
        lawyerName,
        datetime,
        method,
        fee: parseInt(fee, 10), // Ensure it's a valid integer for Stripe
        userId,
        customerId
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create checkout session');
    }

    // Handle based on checkout type preference
    if (useModal && data.clientSecret) {
      // For modal checkout, set state for the modal component
      setCheckoutState({
        isModalOpen: true,
        clientSecret: data.clientSecret,
        sessionId: data.sessionId,
        amount: fee,
        title: `Legal Consultation with ${lawyerName}`
      });
      return data;
    } else {
      // Fallback to redirect checkout
      window.location.href = data.url;
    }
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Verify a payment session (after returning from Stripe)
export const verifyPaymentSession = async (sessionId) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/verify/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to verify payment session');
    }

    return result;
  } catch (error) {
    console.error('Error verifying payment session:', error);
    throw error;
  }
};
