
"use server";
import "server-only";

import { z } from 'zod';
import { headers } from 'next/headers';
import { createSubmission, getCategories, getCryptocurrencies, getPublicSubmissions, getAllSubmissions, updateSubmission as updateSubmissionData, deleteSubmission as deleteSubmissionData, getSubmissionById } from '@/lib/data';
import prisma from '@/lib/prisma';
import type { Submission, SubmissionStatus } from '@/lib/types';

// Database-based rate limiting
const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_SUBMISSIONS = 5;

const submissionSchema = z.object({
  walletAddress: z.string().min(26, { message: "Wallet address must be at least 26 characters." }).max(128, { message: "Wallet address too long."}),
  categoryId: z.string().min(1, { message: "Please select a category." }),
  cryptocurrencyId: z.string().min(1, { message: "Please select a cryptocurrency." }),
  websiteUrl: z.string().url({ message: "Please enter a valid URL (e.g., http://example.com)." }).max(255, { message: "URL cannot exceed 255 characters." }).optional().or(z.literal('')),
  reportedOwner: z.string().max(100, { message: "Owner name cannot exceed 100 characters." }).optional(),
  reason: z.string().max(500, { message: "Reason cannot exceed 500 characters." }).optional(),
});

export async function submitWalletReport(data: unknown) {
  // Extract honeypot and recaptchaToken from data
  const { recaptchaToken, honeypot, ...formData } = data as {
    recaptchaToken?: string;
    honeypot?: string;
    [key: string]: unknown;
  };

  const headersList = await headers();
  let ip = headersList.get('x-forwarded-for') || 'unknown';
  if (ip === '::1') {
    ip = 'N/A';
  }
  
  // Honeypot detection
  if (honeypot && honeypot !== '') {
    console.log("Bot detected via honeypot. Creating rejected submission.");
    
    const parsed = submissionSchema.safeParse(formData);
    if (!parsed.success) {
      // Even if data is invalid, we can log it but we must return success to the bot
      console.log("Bot submitted invalid data via honeypot.");
      return { success: true };
    }

    const dataToSubmit = {
      ...parsed.data,
      websiteUrl: parsed.data.websiteUrl || undefined,
      reportedOwner: parsed.data.reportedOwner || undefined,
      submitterIp: ip,
      status: 'rejected', // Force status
    };

    try {
      await createSubmission(dataToSubmit);
    } catch (error) {
      console.error("Error creating rejected submission for honeypot:", error);
    }
    
    // IMPORTANT: Return success to the bot to not reveal the trap
    return { success: true };
  }

  // Carica l'impostazione reCAPTCHA dal database
  let recaptchaEnabled = true;
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'recaptchaEnabled' } });
    if (setting) {
      try {
        recaptchaEnabled = JSON.parse(setting.value);
      } catch (e) {
        recaptchaEnabled = setting.value === 'true';
      }
    }
  } catch (error) {
    console.error('Error loading reCAPTCHA setting:', error);
  }

  // Verifica reCAPTCHA solo se abilitato
    if (recaptchaEnabled) {
      if (!recaptchaToken) {
        return { success: false, error: "reCAPTCHA verification failed." };
      }

      const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
      
      try {
        // Aggiungiamo un timeout di 5 secondi
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(verificationUrl, { 
          method: 'POST',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const verification = await response.json();
        if (!verification.success) {
          return { success: false, error: "reCAPTCHA verification failed." };
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return { success: false, error: "reCAPTCHA verification timed out. Please try again." };
        }
        return { success: false, error: "reCAPTCHA verification failed." };
      }
    }

  // Database-based rate limiting
  try {
    // Calculate the time window start (current time minus window minutes)
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
    
    // Count submissions from this IP in the current window
    const submissionCount = await prisma.submission.count({
      where: {
        submitterIp: ip,
        createdAt: {
          gte: windowStart
        }
      }
    });
    
    if (submissionCount >= RATE_LIMIT_MAX_SUBMISSIONS) {
      return {
        success: false,
        error: `Too many submissions. Please try again after ${RATE_LIMIT_WINDOW_MINUTES} minutes.`
      };
    }
  } catch (error) {
    console.error("Error checking rate limit:", error);
    // In case of error, allow submission to proceed to avoid blocking users
  }

  const parsed = submissionSchema.safeParse(formData);

  if (!parsed.success) {
    return { success: false, error: "Invalid data provided.", issues: parsed.error.issues };
  }

  try {
    const dataToSubmit = {
      ...parsed.data,
      websiteUrl: parsed.data.websiteUrl || undefined,
      reportedOwner: parsed.data.reportedOwner || undefined,
      submitterIp: ip, // Include the user's IP
    };

    // Check if reason contains blocklisted content
    let status: SubmissionStatus = 'pending';
    const reason = parsed.data.reason?.toLowerCase() || '';
    
    const blocklistSetting = await prisma.systemSetting.findUnique({ 
      where: { key: 'blocklist' } 
    });
    
    if (blocklistSetting) {
      try {
        const blocklist: Array<{ type: string; value: string }> = JSON.parse(blocklistSetting.value);
        
        for (const item of blocklist) {
          const itemValue = item.value.toLowerCase();
          
          if (item.type === 'keyword' && reason.includes(itemValue)) {
            status = 'rejected';
            break;
          }
          
          if (item.type === 'phrase' && reason.includes(itemValue)) {
            status = 'rejected';
            break;
          }
          
          // For domain, we skip because reason is text, not URL
        }
      } catch (e) {
        console.error('Error parsing blocklist', e);
      }
    }

    // Create submission without status (it will use default from DB)
    const newSubmission = await createSubmission(dataToSubmit);

    // Update status if rejected
    if (status === 'rejected') {
      await prisma.submission.update({
        where: { id: newSubmission.id },
        data: { status: 'rejected' }
      });
      newSubmission.status = 'rejected';
    }
    
    return { success: true, submission: newSubmission };
  } catch (error) {
    console.error("Error creating submission:", error);
    return { success: false, error: "Could not save the submission." };
  }
}

export async function fetchPublicSubmissions(params?: {
  limit?: number;
  categoryId?: string;
  cryptocurrencyId?: string;
  searchTerm?: string;
}) {
  return getPublicSubmissions(params);
}

export async function fetchAllSubmissionsForAdmin(params?: {
  limit?: number;
  offset?: number;
  categoryId?: string;
  cryptocurrencyId?: string;
  searchTerm?: string;
}) {
  return getAllSubmissions(params);
}

export async function fetchInitialHomepageData() {
  const [categories, cryptocurrencies, recentSubmissions] = await Promise.all([
    getCategories(),
    getCryptocurrencies(),
    getPublicSubmissions({ limit: 10 }), // Keep homepage to 10 recent
  ]);
  return { categories, cryptocurrencies, recentSubmissions };
}

export async function updateSubmission(submissionId: string, data: Partial<Omit<Submission, 'id' | 'createdAt'>>) {
  try {
     const dataToUpdate = {
      ...data,
      websiteUrl: data.websiteUrl || undefined,
      reportedOwner: data.reportedOwner || undefined,
    };
    const updated = await updateSubmissionData(submissionId, dataToUpdate);
    if (!updated) return { success: false, error: "Submission not found." };
    return { success: true, submission: updated };
  } catch (error) {
    console.error("Error updating submission:", error);
    return { success: false, error: "Could not update submission." };
  }
}

export async function deleteSubmission(submissionId: string) {
  try {
    const success = await deleteSubmissionData(submissionId);
    if (!success) return { success: false, error: "Submission not found or already deleted." };
    return { success: true };
  } catch (error) {
    console.error("Error deleting submission:", error);
    return { success: false, error: "Could not delete submission." };
  }
}

export async function fetchSubmissionById(id: string) {
  return getSubmissionById(id);
}

export async function searchAllSubmissions(query: string, categoryId?: string, cryptocurrencyId?: string) {
  // This function is used by the public search page, so it should search within approved submissions.
  // We use getPublicSubmissions which handles the 'approved' status and sorting.
  // A limit is also good for search results.
  return getPublicSubmissions({ 
    searchTerm: query, 
    categoryId, 
    cryptocurrencyId, 
    limit: 100 // Max results for a search, consistent with initial display limit
  });
}
