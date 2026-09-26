"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { MERCHANT_SESSION_COOKIE } from "@/lib/merchant-auth";

export type MerchantSignupState = {
  error: string | null;
};

type SignupResponse = {
  sessionToken: string;
  expiresAt: string;
};

const API_URL = process.env.PAYMENT_API_URL;

export async function signupMerchant(
  _previousState: MerchantSignupState,
  formData: FormData,
): Promise<MerchantSignupState> {
  const companyName = String(formData.get("companyName") ?? "").trim();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!companyName || !email || !password || !confirmPassword) {
    return {
      error: "Tous les champs sont obligatoires.",
    };
  }

  if (password.length < 12) {
    return {
      error: "Le mot de passe doit contenir au moins 12 caractères.",
    };
  }

  if (password !== confirmPassword) {
    return {
      error: "Les mots de passe ne correspondent pas.",
    };
  }

  if (!API_URL) {
    return {
      error: "Le service d’inscription est indisponible.",
    };
  }

  try {
    const response = await fetch(`${API_URL}/merchant/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        companyName,
        email,
        password,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 409) {
        return {
          error: "Un compte existe déjà avec cette adresse e-mail.",
        };
      }

      if (response.status === 400) {
        return {
          error: "Vérifiez les informations saisies.",
        };
      }

      return {
        error: "Impossible de créer le compte pour le moment.",
      };
    }

    const result = (await response.json()) as SignupResponse;

    const cookieStore = await cookies();

    cookieStore.set(MERCHANT_SESSION_COOKIE, result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(result.expiresAt),
    });
  } catch {
    return {
      error: "Impossible de joindre le service d’inscription.",
    };
  }

  redirect("/dashboard");
}
