"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";

import { replayWebhookDelivery, WebhookActionState } from "../actions";

type WebhookReplayButtonProps = {
  deliveryId: string;
};

const initialState: WebhookActionState = {
  status: "idle",
};

export function WebhookReplayButton({ deliveryId }: WebhookReplayButtonProps) {
  const [state, action, isPending] = useActionState(
    replayWebhookDelivery,
    initialState,
  );

  return (
    <div className="space-y-3">
      {state.status !== "idle" && state.message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-xs leading-5 ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <form action={action}>
        <input type="hidden" name="deliveryId" value={deliveryId} />

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0a0e17] px-4 text-xs font-semibold text-white transition hover:bg-[#151b28] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={14}
            className={isPending ? "animate-spin" : undefined}
          />

          {isPending ? "Relance en cours..." : "Relancer le webhook"}
        </button>
      </form>
    </div>
  );
}
