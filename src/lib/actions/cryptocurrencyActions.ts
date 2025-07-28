"use server";

import { z } from 'zod';
import {
  getCryptocurrencies as getAllCryptos,
  getCryptocurrencyById as getCryptoDetails,
  createCryptocurrency as createNewCrypto,
  updateCryptocurrency as updateExistingCrypto,
  deleteCryptocurrency as deleteExistingCrypto
} from '@/lib/data';
import type { Cryptocurrency } from '@/lib/types';

const cryptoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
  symbol: z.string().min(1, "Symbol is required").max(10, "Symbol too long"),
  icon: z.string().min(1, "Icon is required"), // Assuming icon is a lucide icon name
});

export async function getCryptocurrencies() {
  return getAllCryptos();
}

export async function getCryptocurrencyById(id: string) {
  return getCryptoDetails(id);
}

export async function createCryptocurrency(formData: unknown) {
  const parsed = cryptoSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: "Invalid data", issues: parsed.error.issues };
  }
  try {
    const newCrypto = await createNewCrypto(parsed.data);
    return { success: true, cryptocurrency: newCrypto };
  } catch (e) {
    return { success: false, error: "Failed to create cryptocurrency" };
  }
}

export async function updateCryptocurrency(id: string, formData: unknown) {
  const parsed = cryptoSchema.partial().safeParse(formData); // Partial for updates
  if (!parsed.success) {
    return { success: false, error: "Invalid data", issues: parsed.error.issues };
  }
  try {
    const updatedCrypto = await updateExistingCrypto(id, parsed.data);
    if (!updatedCrypto) return { success: false, error: "Cryptocurrency not found" };
    return { success: true, cryptocurrency: updatedCrypto };
  } catch (e) {
    return { success: false, error: "Failed to update cryptocurrency" };
  }
}

export async function deleteCryptocurrency(id: string) {
  try {
    const success = await deleteExistingCrypto(id);
    if (!success) return { success: false, error: "Cryptocurrency not found or deletion failed" };
    return { success: true };
  } catch (e) {
    return { success: false, error: "Failed to delete cryptocurrency" };
  }
}
