"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import bcrypt from 'bcrypt';
import { z } from "zod";
import { encrypt, decrypt } from "@/lib/session";

export async function getSession() {
  const cookieStore = cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

const loginSchema = z.object({
  username: z.string().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const { username, password } = parsed.data;

  // --- Rate Limiting and Brute-force Protection ---
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ['loginMaxAttempts', 'loginLockoutMinutes'] } },
  });
  const maxAttempts = parseInt(settings.find(s => s.key === 'loginMaxAttempts')?.value || '5', 10);
  const lockoutMinutes = parseInt(settings.find(s => s.key === 'loginLockoutMinutes')?.value || '15', 10);

  const user = await prisma.adminUser.findUnique({
    where: { username },
  });

  if (!user) {
    // Still return a generic error to prevent username enumeration
    return { success: false, error: "Invalid username or password." };
  }

  // Check if account is locked
  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    return { success: false, error: `Account is locked. Please try again later.` };
  }

  const passwordsMatch = await bcrypt.compare(password, user.password);

  if (!passwordsMatch) {
    const newAttemptCount = user.failedLoginAttempts + 1;
    let updateData: any = { failedLoginAttempts: newAttemptCount };

    if (newAttemptCount >= maxAttempts) {
      const lockoutTime = new Date();
      lockoutTime.setMinutes(lockoutTime.getMinutes() + lockoutMinutes);
      updateData.lockoutUntil = lockoutTime;
    }

    await prisma.adminUser.update({ where: { id: user.id }, data: updateData });

    return { success: false, error: "Invalid username or password." };
  }

  // Password is correct, reset attempts and lockout
  if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockoutUntil: null },
    });
  }

  // --- 2FA Check (to be added) ---

  const session = await encrypt({ userId: user.id, username: user.username });

  const cookieStore = cookies();
  cookieStore.set("session", session, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' });
  
  redirect("/admin/dashboard");
}

export async function logout() {
  const cookieStore = cookies();
  cookieStore.set("session", "", { expires: new Date(0) });
  redirect("/admin/login");
}

export async function requireAdminAuth() {
    const session = await getSession();
    if (!session?.userId) {
        redirect("/admin/login");
    }
    return session;
}
