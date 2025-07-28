
import type { LucideIcon } from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  icon: string; // Lucide icon name
}

export interface Cryptocurrency {
  id: string;
  name: string;
  symbol: string;
  icon: string; // Lucide icon name
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface Submission {
  id: string;
  walletAddress: string;
  categoryId: string;
  cryptocurrencyId: string;
  reason?: string | null;
  websiteUrl?: string | null;
  reportedOwner?: string | null;
  status: string; // Cambiato da SubmissionStatus a string
  createdAt: Date;
  updatedAt: Date;
  adminNotes?: string | null;
  submitterIp?: string | null;
}

// For react-select or similar components
export interface SelectOption {
  value: string;
  label: string;
}
