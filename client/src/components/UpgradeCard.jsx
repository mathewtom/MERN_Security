import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripeConfigAPI, createPaymentIntentAPI } from '../services/api.js';

let stripePromise = null;

function getStripe() {
  if (!stripePromise) {
    stripePromise = getStripeConfigAPI().then(({ data }) =>
      data.publishableKey ? loadStripe(data.publishableKey) : null
    );
  }
  return stripePromise;
}

function CheckoutForm({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError('');

    try {
      const { data } = await createPaymentIntentAPI();

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        { payment_method: { card: elements.getElement(CardElement) } }
      );

      if (stripeError) {
        setError(stripeError.message);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={styles.cardElementWrapper}>
        <CardElement options={cardStyle} />
      </div>
      {error && <p style={styles.error}>{error}</p>}
      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          ...styles.payBtn,
          opacity: processing ? 0.6 : 1,
        }}
      >
        {processing ? 'Processing...' : 'Pay $9.99'}
      </button>
    </form>
  );
}

export default function UpgradeCard({ onSuccess }) {
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [stripeInstance, setStripeInstance] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    getStripe()
      .then((s) => {
        if (s) {
          setStripeInstance(s);
        } else {
          setUnavailable(true);
        }
        setStripeLoaded(true);
      })
      .catch(() => {
        setUnavailable(true);
        setStripeLoaded(true);
      });
  }, []);

  if (!stripeLoaded) {
    return <p style={styles.muted}>Loading payment form...</p>;
  }

  if (unavailable) {
    return <p style={styles.muted}>Payment not configured.</p>;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Upgrade to Premium — $9.99</h3>
      <p style={styles.subtitle}>Unlock premium features</p>
      <Elements stripe={stripeInstance}>
        <CheckoutForm onSuccess={onSuccess} />
      </Elements>
    </div>
  );
}

const cardStyle = {
  style: {
    base: {
      fontSize: '16px',
      color: '#e0e0e0',
      '::placeholder': { color: '#666' },
    },
    invalid: { color: '#e74c3c' },
  },
};

const styles = {
  container: {
    backgroundColor: '#16213e',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
    marginTop: '1.5rem',
  },
  title: {
    color: '#00d4ff',
    marginBottom: '0.25rem',
    fontSize: '1.1rem',
  },
  subtitle: {
    color: '#888',
    fontSize: '0.9rem',
    marginBottom: '1rem',
  },
  cardElementWrapper: {
    backgroundColor: '#0f3460',
    padding: '0.75rem',
    borderRadius: '4px',
    border: '1px solid #333',
    marginBottom: '1rem',
  },
  payBtn: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#00d4ff',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  error: {
    color: '#e74c3c',
    fontSize: '0.9rem',
    marginBottom: '0.75rem',
  },
  muted: {
    color: '#888',
    fontSize: '0.9rem',
    marginTop: '1rem',
  },
};
