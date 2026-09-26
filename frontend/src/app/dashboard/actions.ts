"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { MERCHANT_SESSION_COOKIE } from "@/lib/merchant-auth";

const API_URL = process.env.PAYMENT_API_URL;

export async function logoutMerchant() {
  const cookieStore = await cookies();

  const token = cookieStore.get(MERCHANT_SESSION_COOKIE)?.value;

  if (token && API_URL) {
    try {
      await fetch(`${API_URL}/merchant/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
    } catch {
      // The local cookie is removed even if
      // backend logout is temporarily unavailable.
    }
  }

  cookieStore.delete(MERCHANT_SESSION_COOKIE);

  redirect("/login");
}
