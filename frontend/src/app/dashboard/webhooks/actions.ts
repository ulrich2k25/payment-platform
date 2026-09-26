"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const API_URL = process.env.PAYMENT_API_URL ?? "http://localhost:3004";

const MERCHANT_SESSION_COOKIE = "payment_platform_merchant_session";

export type WebhookActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  webhookSecret?: string;
};

async function getMerchantToken() {
  const cookieStore = await cookies();

  return cookieStore.get(MERCHANT_SESSION_COOKIE)?.value;
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as {
      message?: string | string[];
    };

    if (Array.isArray(body.message)) {
      return body.message.join(", ");
    }

    if (typeof body.message === "string" && body.message.trim()) {
      return body.message;
    }
  } catch {
    // Ignore malformed error bodies.
  }

  return fallback;
}

export async function updateWebhookConfiguration(
  previousState: WebhookActionState,
  formData: FormData,
): Promise<WebhookActionState> {
  void previousState;

  const token = await getMerchantToken();

  if (!token) {
    redirect("/login");
  }

  const webhookUrl = String(formData.get("webhookUrl") ?? "").trim();

  if (!webhookUrl) {
    return {
      status: "error",
      message: "Veuillez saisir une URL de webhook.",
    };
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}/merchant/webhooks/config`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhookUrl,
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
    return {
      status: "error",
      message: await readErrorMessage(
        response,
        "Impossible d’enregistrer le webhook.",
      ),
    };
  }

  const result = (await response.json()) as {
    webhookUrl: string;
    webhookSecretConfigured: boolean;
    webhookSecret?: string;
  };

  revalidatePath("/dashboard/webhooks");

  return {
    status: "success",
    message: "Configuration webhook enregistrée.",
    webhookSecret: result.webhookSecret,
  };
}

export async function rotateWebhookSecret(
  previousState: WebhookActionState,
): Promise<WebhookActionState> {
  void previousState;

  const token = await getMerchantToken();

  if (!token) {
    redirect("/login");
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}/merchant/webhooks/secret/rotate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
    return {
      status: "error",
      message: await readErrorMessage(
        response,
        "Impossible de régénérer le secret.",
      ),
    };
  }

  const result = (await response.json()) as {
    webhookSecret: string;
  };

  revalidatePath("/dashboard/webhooks");

  return {
    status: "success",
    message: "Nouveau secret webhook généré. Copiez-le maintenant.",
    webhookSecret: result.webhookSecret,
  };
}
