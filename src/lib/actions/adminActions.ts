"use server";

import prisma from "@/lib/prisma";
import { getSession, requireAdminAuth } from "@/lib/actions/authActions";
import { z } from "zod";
import bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

// Schema for updating username
const updateUsernameSchema = z.object({
  newUsername: z.string().min(3, "Username must be at least 3 characters long.").max(20, "Username cannot be longer than 20 characters."),
});

// Schema for updating password
const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters long."),
});

export async function getAdminAccountDetails() {
  const session = await requireAdminAuth();
  const user = await prisma.adminUser.findUnique({
    where: { id: session.userId },
    select: {
      username: true,
      twoFactorEnabled: true,
    },
  });
  if (!user) throw new Error("Admin user not found.");
  return user;
}

export async function updateUsername(formData: FormData) {
  const session = await requireAdminAuth();
  const parsed = updateUsernameSchema.safeParse({ newUsername: formData.get('newUsername') });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors.map(e => e.message).join(', ') };
  }

  const { newUsername } = parsed.data;

  try {
    await prisma.adminUser.update({
      where: { id: session.userId },
      data: { username: newUsername },
    });
    return { success: true };
  } catch (error) {
    if ((error as any).code === 'P2002') { // Unique constraint violation
      return { success: false, error: "Username is already taken." };
    }
    return { success: false, error: "Failed to update username." };
  }
}

export async function updatePassword(formData: FormData) {
  const session = await requireAdminAuth();
  const parsed = updatePasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors.map(e => e.message).join(', ') };
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.adminUser.findUnique({ where: { id: session.userId } });
  if (!user) return { success: false, error: "User not found." };

  const passwordsMatch = await bcrypt.compare(currentPassword, user.password);
  if (!passwordsMatch) {
    return { success: false, error: "Incorrect current password." };
  }

  const newHashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.adminUser.update({
    where: { id: session.userId },
    data: { password: newHashedPassword },
  });

  return { success: true };
}

// --- 2FA Actions ---

export async function generate2faSecret() {
  const session = await requireAdminAuth();
  const user = await prisma.adminUser.findUnique({ where: { id: session.userId } });
  if (!user) throw new Error("User not found.");

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(user.username, 'WalletWatch', secret);

  await prisma.adminUser.update({
    where: { id: session.userId },
    data: { twoFactorSecret: secret },
  });

  const qrCodeDataUrl = await toDataURL(otpauth);

  return { secret, qrCodeDataUrl };
}

export async function verifyAndEnable2fa(formData: FormData) {
    const session = await requireAdminAuth();
    const token = formData.get('token') as string;

    if (!token) return { success: false, error: "Token is required." };

    const user = await prisma.adminUser.findUnique({ where: { id: session.userId } });
    if (!user || !user.twoFactorSecret) {
        return { success: false, error: "2FA secret not found. Please generate a new one." };
    }

    const isValid = authenticator.check(token, user.twoFactorSecret);

    if (!isValid) {
        return { success: false, error: "Invalid token. Please try again." };
    }

    await prisma.adminUser.update({
        where: { id: session.userId },
        data: { twoFactorEnabled: true },
    });

    return { success: true };
}

export async function disable2fa() {
    const session = await requireAdminAuth();
    await prisma.adminUser.update({
        where: { id: session.userId },
        data: { 
            twoFactorEnabled: false,
            twoFactorSecret: null 
        },
    });
    return { success: true };
}

// --- Login Settings Actions ---

export async function getLoginSettings() {
    const settings = await prisma.systemSetting.findMany({
        where: { key: { in: ['loginMaxAttempts', 'loginLockoutMinutes'] } },
    });
    const maxAttempts = settings.find(s => s.key === 'loginMaxAttempts')?.value || '5';
    const lockoutMinutes = settings.find(s => s.key === 'loginLockoutMinutes')?.value || '15';
    return { maxAttempts, lockoutMinutes };
}

const updateLoginSettingsSchema = z.object({
    maxAttempts: z.coerce.number().int().min(1, "Must be at least 1").max(100, "Cannot exceed 100"),
    lockoutMinutes: z.coerce.number().int().min(1, "Must be at least 1").max(1440, "Cannot exceed 1440 (24 hours)"),
});

export async function updateLoginSettings(formData: FormData) {
    await requireAdminAuth();
    const parsed = updateLoginSettingsSchema.safeParse(Object.fromEntries(formData));

    if (!parsed.success) {
        return { success: false, error: parsed.error.errors.map(e => e.message).join(', ') };
    }

    const { maxAttempts, lockoutMinutes } = parsed.data;

    await prisma.$transaction([
        prisma.systemSetting.update({
            where: { key: 'loginMaxAttempts' },
            data: { value: maxAttempts.toString() },
        }),
        prisma.systemSetting.update({
            where: { key: 'loginLockoutMinutes' },
            data: { value: lockoutMinutes.toString() },
        }),
    ]);

    return { success: true };
}
