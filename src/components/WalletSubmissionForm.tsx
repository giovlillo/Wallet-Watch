
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Category, Cryptocurrency, SelectOption } from '@/lib/types';
import { submitWalletReport } from '@/lib/actions/submissionActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  walletAddress: z.string().min(26, { message: "Wallet address must be at least 26 characters." }).max(128, { message: "Wallet address too long."}),
  categoryId: z.string().min(1, { message: "Please select a category." }),
  cryptocurrencyId: z.string().min(1, { message: "Please select a cryptocurrency." }),
  websiteUrl: z.string().url({ message: "Please enter a valid URL (e.g., http://example.com)." }).max(255, { message: "URL cannot exceed 255 characters." }).optional().or(z.literal('')),
  reportedOwner: z.string().max(100, { message: "Owner name cannot exceed 100 characters." }).optional(),
  reason: z.string().max(500, { message: "Reason cannot exceed 500 characters." }).optional(),
});

interface WalletSubmissionFormProps {
  categories: Category[];
  cryptocurrencies: Cryptocurrency[];
}

export default function WalletSubmissionForm({ categories, cryptocurrencies: cryptos }: WalletSubmissionFormProps) {
  const { toast } = useToast();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recaptchaEnabled, setRecaptchaEnabled] = useState(true);
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    const loadRecaptchaSetting = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (!response.ok) {
          throw new Error('Failed to load reCAPTCHA setting');
        }
        const settings = await response.json();
        
        // Handle the recaptchaEnabled setting
        if (settings.recaptchaEnabled) {
          if (settings.recaptchaEnabled === 'true' || settings.recaptchaEnabled === true) {
            setRecaptchaEnabled(true);
          } else if (settings.recaptchaEnabled === 'false' || settings.recaptchaEnabled === false) {
            setRecaptchaEnabled(false);
          } else {
            // Try to parse as JSON if it's a string representation of a boolean
            try {
              const parsed = JSON.parse(settings.recaptchaEnabled);
              setRecaptchaEnabled(!!parsed);
            } catch (e) {
              console.error('Error parsing recaptchaEnabled:', e);
              setRecaptchaEnabled(true); // default to true on error
            }
          }
        }
      } catch (error) {
        console.error('Error loading reCAPTCHA setting:', error);
      }
    };

    loadRecaptchaSetting();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      walletAddress: "",
      categoryId: "",
      cryptocurrencyId: "",
      reason: "",
      websiteUrl: "",
      reportedOwner: "",
    },
  });

  const categoryOptions: SelectOption[] = categories.map(c => ({ value: c.id, label: c.name }));
  const cryptoOptions: SelectOption[] = cryptos.map(c => ({ value: c.id, label: `${c.name} (${c.symbol})` }));

  const handleReCaptchaVerify = useCallback(async () => {
    if (!executeRecaptcha) {
      console.error("Execute recaptcha not yet available");
      toast({
        variant: "destructive",
        title: "Verification Error",
        description: "reCAPTCHA not ready. Please try again in a moment.",
      });
      return null;
    }
    const token = await executeRecaptcha('submitWalletReport');
    return token;
  }, [executeRecaptcha, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    let token = null;
    if (recaptchaEnabled) {
      token = await handleReCaptchaVerify();
      if (!token) {
        setIsSubmitting(false);
        return; // Stop submission if token generation fails
      }
    }

    try {
      const result = await submitWalletReport({
        ...values,
        recaptchaToken: token,
        honeypot: honeypot, // Pass honeypot value to the server action
      });
      if (result.success) {
        toast({
          title: "Report Submitted",
          description: "Your wallet report has been submitted for review. Thank you!",
        });
        form.reset();
      } else {
        let errorMessage = result.error || "An unknown error occurred.";
        if (result.issues) {
          const fieldErrors = result.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
          errorMessage = `${errorMessage} Details: ${fieldErrors}`;
        }
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: errorMessage,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-center">Report a Suspicious Wallet</CardTitle>
        <CardDescription className="text-center">
          Help keep the crypto community safe by reporting wallets involved in illicit activities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="walletAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter suspicious wallet address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category of Illicit Activity</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cryptocurrencyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cryptocurrency</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a cryptocurrency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cryptoOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Associated Website URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., http://scam-site.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reportedOwner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reported Owner (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. company name, person, or alias" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Reporting (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide details about the suspicious activity..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Honeypot Field for bot detection */}
            <input 
              type="text" 
              name="honeypot" 
              className="hidden" 
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)} 
              tabIndex={-1}
            />

            {/* reCAPTCHA v3 is invisible and doesn't require a UI component here */}

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
