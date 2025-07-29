import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with comprehensive error handling
let stripePromise: Promise<any> | null = null;
let stripeError: string | null = null;

// Function to safely load Stripe with proper error handling
const safeLoadStripe = async (key: string) => {
  try {
    const stripe = await loadStripe(key);
    if (!stripe) {
      throw new Error('Stripe.js loaded but Stripe object not available');
    }
    return stripe;
  } catch (error) {
    // Log the specific error for debugging
    console.error('Stripe loading failed:', error);
    
    // Set user-friendly error message
    stripeError = 'Payment system temporarily unavailable';
    
    // Return null instead of throwing to prevent app crashes
    return null;
  }
};

if (import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  // Create a promise that handles errors gracefully
  stripePromise = safeLoadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
} else {
  stripeError = 'Stripe public key not configured';
  console.warn('VITE_STRIPE_PUBLIC_KEY not found - Stripe payments disabled');
}

export { stripePromise, stripeError };
export const isStripeAvailable = () => stripePromise !== null && stripeError === null;