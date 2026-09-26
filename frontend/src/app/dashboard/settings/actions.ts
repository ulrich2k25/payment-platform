"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { MERCHANT_SESSION_COOKIE } from "@/lib/merchant-auth";

const API_URL = process.env.PAYMENT_API_URL;

export type MerchantSettingsActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function extractErrorMessage(payload: unknown): string | null {
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const message = (
      payload as {
        message?: unknown;
      }
    ).message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message
        .filter((item): item is string => typeof item === "string")
        .join(", ");
    }
  }

  return null;
}

export async function updateMerchantProfile(
  _previousState: MerchantSettingsActionState,
  formData: FormData,
): Promise<MerchantSettingsActionState> {
  if (!API_URL) {
    return {
      status: "error",
      message: "La configuration du service de paiement est indisponible.",
    };
  }

  const name = String(formData.get("name") ?? "").trim();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (name.length < 2) {
    return {
      status: "error",
      message: "Le nom de l’entreprise doit contenir au moins 2 caractères.",
    };
  }

  if (!email) {
    return {
      status: "error",
      message: "L’adresse e-mail de l’entreprise est requise.",
    };
  }

  const cookieStore = await cookies();

  const token = cookieStore.get(MERCHANT_SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/login");
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}/merchant/settings/profile`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
      }),
      cache: "no-store",
    });
  } catch {
    return {
      status: "error",
      message: "Impossible de joindre le service de paiement.",
    };
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    let message: string | null = null;

    try {
      const payload = (await response.json()) as unknown;

      message = extractErrorMessage(payload);
    } catch {
      message = null;
    }

    return {
      status: "error",
      message:
        response.status === 409
          ? "Cette adresse e-mail est déjà utilisée par un autre marchand."
          : (message ?? "Impossible d’enregistrer les modifications."),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  return {
    status: "success",
    message: "Les informations de l’entreprise ont été mises à jour.",
  };
}

export async function logoutMerchant() {
  const cookieStore = await cookies();

  const token = cookieStore.get(MERCHANT_SESSION_COOKIE)?.value;

  if (API_URL && token) {
    try {
      await fetch(`${API_URL}/merchant/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
    } catch {
      // La suppression locale de la session reste prioritaire.
    }
  }

  cookieStore.delete(MERCHANT_SESSION_COOKIE);

  redirect("/login");
}
