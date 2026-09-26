"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.PAYMENT_API_URL ?? "http://localhost:3004";

const MERCHANT_SESSION_COOKIE = "payment_platform_merchant_session";

export type CreateApiKeyState = {
  error?: string;
  createdKey?: string;
  createdKeyId?: string;
};

async function getMerchantToken() {
  const cookieStore = await cookies();

  return cookieStore.get(MERCHANT_SESSION_COOKIE)?.value;
}

export async function createApiKey(
  previousState: CreateApiKeyState,
): Promise<CreateApiKeyState> {
  void previousState;

  const token = await getMerchantToken();

  if (!token) {
    redirect("/login");
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}/merchant/api-keys`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    return {
      error: "Impossible de joindre le service de paiement.",
    };
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    return {
      error: "La création de la clé API a échoué.",
    };
  }

  const apiKey = (await response.json()) as {
    id: string;
    key: string;
  };

  revalidatePath("/dashboard/api-keys");

  return {
    createdKey: apiKey.key,
    createdKeyId: apiKey.id,
  };
}

export async function revokeApiKey(formData: FormData) {
  const token = await getMerchantToken();

  if (!token) {
    redirect("/login");
  }

  const apiKeyId = String(formData.get("apiKeyId") ?? "").trim();

  if (!apiKeyId) {
    return;
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/merchant/api-keys/${encodeURIComponent(apiKeyId)}/revoke`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );
  } catch {
    throw new Error("Impossible de joindre le service de paiement.");
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok && response.status !== 409) {
    throw new Error("La révocation de la clé API a échoué.");
  }

  revalidatePath("/dashboard/api-keys");
}
