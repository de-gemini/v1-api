/**
 * ⚠️  CRITICAL STRIPE CONFIG - DO NOT EDIT WITHOUT EXPLICIT PERMISSION ⚠️
 * 
 * This file contains Stripe configuration that affects:
 * - Payment processing
 * - Webhook security
 * - API versioning
 * 
 * WARNING:
 * - Changes could break payment functionality
 * - Webhook secret changes require Stripe dashboard updates
 * - API version changes may break existing integrations
 * 
 * BEFORE MAKING ANY CHANGES:
 * 1. Inform the user/owner about proposed changes
 * 2. Get explicit approval
 * 3. Test payment flows thoroughly
 * 4. Update Stripe dashboard if needed
 * 
 * This is payment infrastructure - handle with extreme care!
 */

export interface StripeConfig {
  apiKey: string;
  webhookSecret?: string;
  apiVersion?: string;
}

export const STRIPE_CONFIG = 'STRIPE_CONFIG'; 
