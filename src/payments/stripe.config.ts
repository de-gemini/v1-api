export interface StripeConfig {
  apiKey: string;
  webhookSecret?: string;
  apiVersion?: string;
}

export const STRIPE_CONFIG = 'STRIPE_CONFIG'; 
