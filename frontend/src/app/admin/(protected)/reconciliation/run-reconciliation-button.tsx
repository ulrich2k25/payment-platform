"use client";

import { useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  RefreshCcw,
  TriangleAlert,
} from "lucide-react";

import { runReconciliation, type ReconciliationRunResult } from "./actions";

export function RunReconciliationButton() {
  const [isPending, startTransition] = useTransition();

  const [result, setResult] = useState<ReconciliationRunResult | null>(null);

  function handleRun() {
    setResult(null);

    startTransition(async () => {
      const response = await runReconciliation();

      setResult(response);
    });
  }

  return (
    <div className="w-full xl:w-auto">
      <button
        type="button"
        onClick={handleRun}
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0a0e17] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(10,14,23,0.12)] transition hover:bg-[#151b28] disabled:cursor-not-allowed disabled:opacity-60 xl:w-auto"
      >
        {isPending ? (
          <>
            <LoaderCircle size={16} className="animate-spin" />
            Réconciliation en cours…
          </>
        ) : (
          <>
            <RefreshCcw size={16} />
            Lancer la réconciliation
          </>
        )}
      </button>

      {result && (
        <div className="mt-3">
          {result.success ? (
            result.failed === 0 ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />

                  <div>
                    <div className="text-xs font-semibold text-emerald-800">
                      Réconciliation terminée
                    </div>

                    <div className="mt-1 text-xs leading-5 text-emerald-700">
                      {result.processed} traité
                      {result.processed !== 1 ? "s" : ""} · {result.succeeded}{" "}
                      réussi
                      {result.succeeded !== 1 ? "s" : ""} · 0 échec
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <TriangleAlert
                    size={16}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <div>
                    <div className="text-xs font-semibold text-amber-800">
                      Réconciliation terminée avec erreurs
                    </div>

                    <div className="mt-1 text-xs leading-5 text-amber-700">
                      {result.processed} traité
                      {result.processed !== 1 ? "s" : ""} · {result.succeeded}{" "}
                      réussi
                      {result.succeeded !== 1 ? "s" : ""} · {result.failed}{" "}
                      échec
                      {result.failed > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <div className="flex items-start gap-2">
                <AlertCircle
                  size={16}
                  className="mt-0.5 shrink-0 text-rose-600"
                />

                <div>
                  <div className="text-xs font-semibold text-rose-800">
                    Échec de la réconciliation
                  </div>

                  <div className="mt-1 text-xs leading-5 text-rose-700">
                    {result.error}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

