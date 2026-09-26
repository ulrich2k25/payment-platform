"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { MERCHANT_SESSION_COOKIE } from "@/lib/merchant-auth";

const API_URL = process.env.PAYMENT_API_URL ?? "http://localhost:3004";

export type ProviderActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

async function getMerchantToken() {
  const cookieStore = await cookies();

  return cookieStore.get(MERCHANT_SESSION_COOKIE)?.value;
}

async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const payload = (await response.json()) as {
      message?: string | string[];
    };

    if (Array.isArray(payload.message)) {
      return payload.message.join(", ");
    }

    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }
  } catch {
    // Ignore malformed error bodies.
  }

  return fallback;
}

export async function updateProviderAccount(
  _previousState: ProviderActionState,
  formData: FormData,
): Promise<ProviderActionState> {
  const token = await getMerchantToken();

  if (!token) {
    redirect("/login");
  }

  const providerAccountId = String(
    formData.get("providerAccountId") ?? "",
  ).trim();

  const operation = String(formData.get("operation") ?? "").trim();

  if (!providerAccountId) {
    return {
      status: "error",
      message: "Compte provider invalide.",
    };
  }

  let body: Record<string, unknown>;
  let successMessage: string;

  if (operation === "toggleStatus") {
    const targetStatus = String(formData.get("targetStatus") ?? "");

    if (targetStatus !== "ACTIVE" && targetStatus !== "INACTIVE") {
      return {
        status: "error",
        message: "Statut provider invalide.",
      };
    }

    body = {
      status: targetStatus,
    };

    successMessage =
      targetStatus === "ACTIVE"
        ? "Le provider a été activé."
        : "Le provider a été désactivé.";
  } else if (operation === "setDefault") {
    body = {
      status: "ACTIVE",
      isDefault: true,
    };

    successMessage = "Ce provider est maintenant utilisé par défaut.";
  } else if (operation === "updatePriority") {
    const priority = Number(formData.get("priority"));

    if (!Number.isInteger(priority) || priority < 1 || priority > 1000) {
      return {
        status: "error",
        message: "La priorité doit être un nombre entier entre 1 et 1000.",
      };
    }

    body = {
      priority,
    };

    successMessage = "La priorité a été mise à jour.";
  } else {
    return {
      status: "error",
      message: "Action provider inconnue.",
    };
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/merchant/provider-accounts/${providerAccountId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );
  } catch {
    return {
      status: "error",
      message: "Impossible de joindre le service de paiement.",
    };
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (response.status === 403) {
    return {
      status: "error",
      message: "Votre rôle ne permet pas de modifier les providers.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: await readErrorMessage(
        response,
        "Impossible de modifier le provider.",
      ),
    };
  }

  revalidatePath("/dashboard/providers");

  return {
    status: "success",
    message: successMessage,
  };
}

export async function updateProviderCredentials(
  _previousState: ProviderActionState,
  formData: FormData,
): Promise<ProviderActionState> {
  const token = await getMerchantToken();

  if (!token) {
    redirect("/login");
  }

  const providerAccountId = String(
    formData.get("providerAccountId") ?? "",
  ).trim();

  if (!providerAccountId) {
    return {
      status: "error",
      message: "Compte provider invalide.",
    };
  }

  const apiuser = String(formData.get("apiuser") ?? "").trim();

  const apikey = String(formData.get("apikey") ?? "").trim();

  const webhooksecret = String(formData.get("webhooksecret") ?? "").trim();

  const credentials: Record<string, string> = {};

  if (apiuser) {
    credentials.apiuser = apiuser;
  }

  if (apikey) {
    credentials.apikey = apikey;
  }

  if (webhooksecret) {
    credentials.webhooksecret = webhooksecret;
  }

  if (Object.keys(credentials).length === 0) {
    return {
      status: "error",
      message: "Saisissez au moins un credential à modifier.",
    };
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/merchant/provider-accounts/${providerAccountId}/credentials`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credentials,
        }),
        cache: "no-store",
      },
    );
  } catch {
    return {
      status: "error",
      message: "Impossible de joindre le service de paiement.",
    };
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (response.status === 403) {
    return {
      status: "error",
      message: "Votre rôle ne permet pas de modifier les credentials.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: await readErrorMessage(
        response,
        "Impossible d’enregistrer les credentials.",
      ),
    };
  }

  revalidatePath("/dashboard/providers");

  return {
    status: "success",
    message: "Les credentials du provider ont été mis à jour.",
  };
}
