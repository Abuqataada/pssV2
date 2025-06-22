export interface PaystackConfig {
  publicKey: string;
  email: string;
  amount: number; // in kobo
  currency: string;
  reference: string;
  callback: (response: any) => void;
  onClose: () => void;
  metadata?: {
    userId: number;
    investmentCategory: string;
    [key: string]: any;
  };
}

export function initializePaystackPayment(config: PaystackConfig) {
  // Load Paystack script if not already loaded
  if (!window.PaystackPop) {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => {
      const handler = window.PaystackPop.setup(config);
      handler.openIframe();
    };
    document.head.appendChild(script);
  } else {
    const handler = window.PaystackPop.setup(config);
    handler.openIframe();
  }
}

export function generatePaymentReference(userId: number, category: string): string {
  return `PSS-${userId}-${category}-${Date.now()}`;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    PaystackPop: {
      setup: (config: PaystackConfig) => {
        openIframe: () => void;
      };
    };
  }
}
