import dotenv from 'dotenv';
import paypal from '@paypal/checkout-server-sdk';
dotenv.config();

// const environment = new paypal.core.LiveEnvironment(
//   process.env.PAYPAL_CLIENT_ID,
//   process.env.PAYPAL_SECRET
// );

const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET);

const client = new paypal.core.PayPalHttpClient(environment);

export default client;
