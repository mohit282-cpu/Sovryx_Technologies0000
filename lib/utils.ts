import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { NepalAddress, PublicHoliday } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a numeric currency amount into Nepalese Rupee (Rs.) or specified currency
 */
export function formatCurrency(amount: number | undefined | null, symbol: string = 'Rs.'): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${symbol} 0`;
  }
  // Format with standard thousands separator
  const formattedNumber = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(amount);

  return `${symbol} ${formattedNumber}`;
}

/**
 * Formats date into DD/MM/YYYY format standard for Nepal
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Formats Nepal Address string representation
 */
export function formatNepalAddress(address?: NepalAddress | string): string {
  if (!address) return 'N/A';
  if (typeof address === 'string') return address;

  const parts = [
    address.tole ? `${address.tole}` : '',
    address.wardNo ? `Ward No. ${address.wardNo}` : '',
    address.municipality || '',
    address.district || '',
    address.province || '',
    address.country || 'Nepal'
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : 'N/A';
}

/**
 * Nepal Default Public Holidays Configuration
 */
export const DEFAULT_NEPAL_HOLIDAYS: PublicHoliday[] = [
  { id: 'hol-1', name: 'Nepalese New Year (Baisakh 1)', date: '2026-04-14', dateBS: '2083-01-01', type: 'National', isRecurring: true },
  { id: 'hol-2', name: 'Labor Day (May Day)', date: '2026-05-01', type: 'National', isRecurring: true },
  { id: 'hol-3', name: 'Buddha Jayanti', date: '2026-05-23', type: 'Festival', isRecurring: true },
  { id: 'hol-4', name: 'Republic Day', date: '2026-05-28', dateBS: '2083-02-14', type: 'National', isRecurring: true },
  { id: 'hol-5', name: 'Constitution Day (Asoj 3)', date: '2026-09-19', dateBS: '2083-06-03', type: 'National', isRecurring: true },
  { id: 'hol-6', name: 'Ghatasthapana (Dashain Begins)', date: '2026-10-11', type: 'Festival', isRecurring: true },
  { id: 'hol-7', name: 'Maha Nawami (Dashain)', date: '2026-10-19', type: 'Festival', isRecurring: true },
  { id: 'hol-8', name: 'Vijaya Dashami (Dashain Main Day)', date: '2026-10-20', type: 'Festival', isRecurring: true },
  { id: 'hol-9', name: 'Laxmi Puja (Tihar)', date: '2026-11-08', type: 'Festival', isRecurring: true },
  { id: 'hol-10', name: 'Mha Puja / Gobardhan Puja (Tihar)', date: '2026-11-09', type: 'Festival', isRecurring: true },
  { id: 'hol-11', name: 'Bhai Tika (Tihar Main Day)', date: '2026-11-10', type: 'Festival', isRecurring: true },
  { id: 'hol-12', name: 'Chhath Parva', date: '2026-11-15', type: 'Festival', isRecurring: true },
  { id: 'hol-13', name: 'Udhauli Parva / Yomari Punhi', date: '2026-12-24', type: 'Regional', isRecurring: true },
  { id: 'hol-14', name: 'Prithvi Jayanti / National Unity Day', date: '2026-01-11', type: 'National', isRecurring: true },
  { id: 'hol-15', name: 'Maghe Sankranti', date: '2026-01-15', type: 'Festival', isRecurring: true },
  { id: 'hol-16', name: 'Martyrs Day', date: '2026-01-30', type: 'National', isRecurring: true },
  { id: 'hol-17', name: 'Democracy Day (Falgun 7)', date: '2026-02-19', type: 'National', isRecurring: true },
  { id: 'hol-18', name: 'Mahashivaratri', date: '2026-02-26', type: 'Festival', isRecurring: true },
  { id: 'hol-19', name: 'International Women Day', date: '2026-03-08', type: 'National', isRecurring: true },
  { id: 'hol-20', name: 'Holi Parva (Fagu Purnima)', date: '2026-03-14', type: 'Festival', isRecurring: true }
];

