"use server";

import { revalidatePath } from "next/cache";

type ReconciliationResultItem = {
  paymentId: string;
  success: boolean;
  status?: string;
  error?: string;
};

export type ReconciliationRunResult =
  | {
      success: true;
      processed: number;
      succeeded: number;
      failed: number;
      results: ReconciliationResultItem[];
    }
  | {
      success: false;
      error: string;
    };

export async function runReconciliation(): Promise<ReconciliationRunResult> {
  const apiUrl = process.env.PAYMENT_API_URL;
  const adminApiKey = process.env.PLATFORM_ADMIN_API_KEY;

  if (!apiUrl) {
    return {
      success: false,
      error: "PAYMENT_API_URL is missing.",
    };
  }

  if (!adminApiKey) {
    return {
      success: false,
      error: "PLATFORM_ADMIN_API_KEY is missing.",
    };
  }

  try {
    const response = await fetch(`${apiUrl}/reconciliation/admin/run`, {
      method: "POST",
      headers: {
        "x-admin-key": adminApiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Reconciliation API returned HTTP ${response.status}.`,
      };
    }

    const result = (await response.json()) as {
      processed: number;
      succeeded: number;
      failed: number;
      results: ReconciliationResultItem[];
    };

    revalidatePath("/reconciliation");

    return {
      success: true,
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
      results: result.results,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to run reconciliation.",
    };
  }
}
