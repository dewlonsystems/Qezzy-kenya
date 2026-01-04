export interface User {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: {
    street: string;
    house_number: string;
    zip_code: string;
    town: string;
  };
  skills: string[];
  referral_code: string;
  is_onboarded: boolean;
  is_active: boolean;
  is_closed: boolean;
}

export interface OnboardingStatus {
  profile_completed: boolean;
  payment_completed: boolean;
  onboarding_complete: boolean;
}

export interface ActivationStatus {
  is_active: boolean;
  payment_status: string;
  created_at?: string;
  completed_at?: string;
}

export interface WalletOverview {
  main_wallet_balance: number;
  referral_wallet_balance: number;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'submitted' | 'completed' | 'cancelled' | 'declined';
  created_at: string;
  updated_at: string;
  reward?: number;
  category?: string;
  deadline_hours?: number;
}

export interface WithdrawalRequest {
  id: number;
  wallet_type: 'main' | 'referral';
  amount: number;
  method: 'mobile' | 'bank';
  mobile_phone: string;
  bank_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface SupportTicket {
  ticket_id: number;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  messages: {
    id: number;
    sender: string;
    message: string;
    created_at: string;
  }[];
}

export type PaymentDetails = {
  payout_method: 'mobile' | 'bank';
  payout_phone: string;
  payout_bank_name: string;
  payout_bank_branch: string;
  payout_account_number: string;
};

export type Transaction = {
  id: number;
  transaction_type: string;
  amount: number;
  created_at: string; // ISO string
  description: string;
};

export type SupportMessage = {
  id: number;
  sender: 'user' | 'admin';
  message: string;
  created_at: string;
};