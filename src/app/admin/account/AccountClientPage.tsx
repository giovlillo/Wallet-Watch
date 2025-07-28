"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { updateUsername, updatePassword, generate2faSecret, verifyAndEnable2fa, disable2fa, updateLoginSettings } from '@/lib/actions/adminActions';
import { ShieldCheck, QrCode, Lock } from 'lucide-react';
import Image from 'next/image';

// Define the type for the userDetails prop
interface UserDetails {
  username: string;
  twoFactorEnabled: boolean;
}

interface LoginSettings {
    maxAttempts: string;
    lockoutMinutes: string;
}

interface AccountClientPageProps {
  userDetails: UserDetails;
  loginSettings: LoginSettings;
}

// --- Sub-components for each form ---

// Update Username Form
const UpdateUsernameForm = ({ currentUsername }: { currentUsername: string }) => {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(z.object({ newUsername: z.string().min(3).max(20) })),
    defaultValues: { newUsername: currentUsername },
  });

  const onSubmit = async (values: { newUsername: string }) => {
    const formData = new FormData();
    formData.append('newUsername', values.newUsername);
    const result = await updateUsername(formData);
    if (result.success) {
      toast({ title: "Success", description: "Username updated successfully." });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Administrator Username</CardTitle>
        <CardDescription>Change your login username.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FormField control={form.control} name="newUsername" render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>Save Username</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

// Update Password Form
const UpdatePasswordForm = () => {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    })),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const onSubmit = async (values: { currentPassword: string, newPassword: string }) => {
    const formData = new FormData();
    formData.append('currentPassword', values.currentPassword);
    formData.append('newPassword', values.newPassword);
    const result = await updatePassword(formData);
    if (result.success) {
      toast({ title: "Success", description: "Password updated successfully." });
      form.reset();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Update your administrator password.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="currentPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl><Input type="password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="newPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl><Input type="password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>Save Password</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

// Manage 2FA Form
const Manage2faForm = ({ isEnabled }: { isEnabled: boolean }) => {
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [is2faEnabled, setIs2faEnabled] = useState(isEnabled);

  const handleEnable = async () => {
    const result = await generate2faSecret();
    if (result.qrCodeDataUrl) {
      setQrCode(result.qrCodeDataUrl);
    } else {
      toast({ title: "Error", description: "Could not generate 2FA secret.", variant: "destructive" });
    }
  };

  const handleDisable = async () => {
    const result = await disable2fa();
    if (result.success) {
      setIs2faEnabled(false);
      setQrCode(null);
      toast({ title: "Success", description: "2FA has been disabled." });
    } else {
      toast({ title: "Error", description: "Failed to disable 2FA.", variant: "destructive" });
    }
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = await verifyAndEnable2fa(formData);
    if (result.success) {
      setIs2faEnabled(true);
      setQrCode(null);
      toast({ title: "Success", description: "2FA has been enabled successfully." });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck /> Two-Factor Authentication (2FA)</CardTitle>
        <CardDescription>Add an extra layer of security using an authenticator app.</CardDescription>
      </CardHeader>
      <CardContent>
        {is2faEnabled ? (
          <div>
            <p className="text-green-600 font-semibold">2FA is currently enabled.</p>
            <Button onClick={handleDisable} variant="destructive" className="mt-4">Disable 2FA</Button>
          </div>
        ) : (
          <div>
            {!qrCode ? (
              <Button onClick={handleEnable}>Enable 2FA</Button>
            ) : (
              <div className="space-y-4">
                <p>1. Scan this QR code with your authenticator app (e.g., Google Authenticator).</p>
                <Image src={qrCode} alt="2FA QR Code" width={200} height={200} />
                <p>2. Enter the 6-digit code from your app to verify and complete setup.</p>
                <form onSubmit={handleVerify} className="flex items-center gap-2">
                  <Input name="token" placeholder="123456" maxLength={6} />
                  <Button type="submit">Verify & Enable</Button>
                </form>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};


// Login Settings Form
const LoginSettingsForm = ({ settings }: { settings: LoginSettings }) => {
    const { toast } = useToast();
    const form = useForm({
        resolver: zodResolver(z.object({
            maxAttempts: z.coerce.number().int().min(1).max(100),
            lockoutMinutes: z.coerce.number().int().min(1).max(1440),
        })),
        defaultValues: {
            maxAttempts: parseInt(settings.maxAttempts, 10),
            lockoutMinutes: parseInt(settings.lockoutMinutes, 10),
        },
    });

    const onSubmit = async (values: { maxAttempts: number, lockoutMinutes: number }) => {
        const formData = new FormData();
        formData.append('maxAttempts', String(values.maxAttempts));
        formData.append('lockoutMinutes', String(values.lockoutMinutes));
        const result = await updateLoginSettings(formData);
        if (result.success) {
            toast({ title: "Success", description: "Login security settings updated." });
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lock /> Login Security</CardTitle>
                <CardDescription>Configure brute-force protection settings.</CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="maxAttempts" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Max Failed Attempts</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="lockoutMinutes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Lockout Duration (minutes)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={form.formState.isSubmitting}>Save Settings</Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
};


// --- Main Component ---

export function AccountClientPage({ userDetails, loginSettings }: AccountClientPageProps) {
  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      <div className="space-y-6">
        <UpdateUsernameForm currentUsername={userDetails.username} />
        <UpdatePasswordForm />
      </div>
      <div className="space-y-6">
        <Manage2faForm isEnabled={userDetails.twoFactorEnabled} />
        <LoginSettingsForm settings={loginSettings} />
      </div>
    </div>
  );
}
