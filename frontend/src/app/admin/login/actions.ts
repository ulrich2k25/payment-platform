"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

export type LoginState = {
  error: string | null;
};

type LoginResponse = {
  sessionToken: string;
  expiresAt: string;
  admin: {
    id: string;
    email: string;
    status: string;
  };
};

const API_URL = process.env.PAYMENT_API_URL;

export async function loginAdmin(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      error: "Renseignez votre adresse e-mail et votre mot de passe.",
    };
  }

  if (!API_URL) {
    return {
      error: "Le service d’authentification est indisponible.",
    };
  }

  try {
    const response = await fetch(`${API_URL}/admin/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 400) {
        return {
          error: "Adresse e-mail ou mot de passe incorrect.",
        };
      }

      return {
        error: "Impossible de vous connecter pour le moment.",
      };
    }

    const result = (await response.json()) as LoginResponse;

    const cookieStore = await cookies();

    cookieStore.set(ADMIN_SESSION_COOKIE, result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(result.expiresAt),
    });
  } catch {
    return {
      error: "Impossible de joindre le service d’authentification.",
    };
  }

  redirect("/admin");
}

