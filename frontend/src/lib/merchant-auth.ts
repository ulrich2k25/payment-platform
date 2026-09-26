import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const MERCHANT_SESSION_COOKIE = "payment_platform_merchant_session";

export type MerchantSessionData = {
  user: {
    id: string;
    merchantId: string;
    email: string;
    role: string;
    status: string;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  merchant: {
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
};

const API_URL = process.env.PAYMENT_API_URL;

export async function getMerchantSession(): Promise<MerchantSessionData | null> {
  if (!API_URL) {
    return null;
  }

  const cookieStore = await cookies();

  const token = cookieStore.get(MERCHANT_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/merchant/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as MerchantSessionData;
  } catch {
    return null;
  }
}

export async function requireMerchant(): Promise<MerchantSessionData> {
  const session = await getMerchantSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
