"use client";

import {
  Check,
  Copy,
  KeyRound,
  RefreshCw,
  Save,
  ShieldCheck,
  Webhook,
} from "lucide-react";
import { useActionState, useState } from "react";

import {
  rotateWebhookSecret,
  updateWebhookConfiguration,
  type WebhookActionState,
} from "./actions";

type WebhookConfigPanelProps = {
  webhookUrl: string | null;
  webhookSecretConfigured: boolean;
  canManage?: boolean;
};

const initialState: WebhookActionState = {
  status: "idle",
};

export function WebhookConfigPanel({
  webhookUrl,
  webhookSecretConfigured,
  canManage = true,
}: WebhookConfigPanelProps) {
  const [configurationState, configurationAction, configurationPending] =
    useActionState(updateWebhookConfiguration, initialState);

  const [rotationState, rotationAction, rotationPending] = useActionState(
    rotateWebhookSecret,
    initialState,
  );

  const [copiedSecret, setCopiedSecret] = useState(false);

  const visibleSecret =
    rotationState.webhookSecret ?? configurationState.webhookSecret;

  async function copySecret() {
    if (!visibleSecret) {
      return;
    }

    await navigator.clipboard.writeText(visibleSecret);

    setCopiedSecret(true);

    window.setTimeout(() => {
      setCopiedSecret(false);
    }, 1800);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <section className="rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eee8da] bg-[#fffaf0] text-[#9a7523]">
              <Webhook size={18} />
            </div>

            <h2 className="mt-4 text-base font-semibold tracking-tight text-[#0a0e17]">
              Endpoint webhook
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Notre plateforme enverra les événements de paiement à cette
              adresse.
            </p>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
              webhookUrl
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-100 text-slate-500"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                webhookUrl ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />

            {webhookUrl ? "CONFIGURÉ" : "NON CONFIGURÉ"}
          </span>
        </div>

        <form action={configurationAction} className="mt-5">
          <label
            htmlFor="webhookUrl"
            className="text-xs font-medium text-slate-600"
          >
            URL de destination
          </label>

          <input
            id="webhookUrl"
            name="webhookUrl"
            type="url"
            required
            maxLength={500}
            defaultValue={webhookUrl ?? ""}
            disabled={!canManage}
            placeholder="https://example.com/webhooks/payment"
            className="mt-2 h-11 w-full rounded-xl border border-[#e5e0d6] bg-white px-4 text-sm text-[#0a0e17] outline-none transition placeholder:text-slate-300 focus:border-[#c8a24a] focus:ring-2 focus:ring-[#c8a24a]/10 disabled:cursor-not-allowed disabled:bg-[#faf9f6] disabled:text-slate-500"
          />

          <div className="mt-3 rounded-xl border border-[#eeeae2] bg-[#faf9f6] px-4 py-3 text-xs leading-5 text-slate-500">
            Utilisez une URL publique accessible depuis Internet. Les adresses
            localhost et réseaux privés sont refusées.
          </div>

          {!canManage ? (
            <div className="mt-4 rounded-xl border border-[#eeeae2] bg-[#faf9f6] px-4 py-3 text-xs leading-5 text-slate-500">
              Accès en lecture seule. Seuls les propriétaires et administrateurs
              peuvent modifier la configuration webhook.
            </div>
          ) : null}

          {configurationState.message ? (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-xs ${
                configurationState.status === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {configurationState.message}
            </div>
          ) : null}

          {canManage ? (
            <button
              type="submit"
              disabled={configurationPending}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#0a0e17] px-4 text-xs font-medium text-white shadow-[0_6px_18px_rgba(10,14,23,0.12)] transition hover:bg-[#151b28] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {configurationPending ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}

              {configurationPending ? "Enregistrement..." : "Enregistrer"}
            </button>
          ) : null}
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#c8a24a]/10 bg-[#0a0e17] p-5 text-white shadow-[0_16px_40px_rgba(10,14,23,0.18)] sm:p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] text-[#e6c76d]">
          <KeyRound size={18} />
        </div>

        <h2 className="mt-4 text-base font-semibold tracking-tight text-white">
          Signing secret
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Ce secret permet à votre serveur de vérifier que les événements
          proviennent réellement de notre plateforme.
        </p>

        <div className="mt-5 flex items-center gap-2 text-xs">
          <ShieldCheck
            size={15}
            className={
              webhookSecretConfigured ? "text-emerald-400" : "text-slate-500"
            }
          />

          <span
            className={
              webhookSecretConfigured ? "text-emerald-300" : "text-slate-400"
            }
          >
            {webhookSecretConfigured
              ? "Secret configuré"
              : "Aucun secret configuré"}
          </span>
        </div>

        {visibleSecret ? (
          <div className="mt-5 rounded-2xl border border-[#e6c76d]/20 bg-[#e6c76d]/10 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e6c76d]">
              Copiez ce secret maintenant
            </p>

            <code className="mt-3 block break-all text-xs leading-5 text-[#fff8e7]">
              {visibleSecret}
            </code>

            <button
              type="button"
              onClick={copySecret}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-white transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              {copiedSecret ? <Check size={13} /> : <Copy size={13} />}
              {copiedSecret ? "Copié" : "Copier le secret"}
            </button>

            <p className="mt-3 text-[11px] leading-5 text-slate-500">
              Après actualisation de la page, le secret complet ne sera plus
              affiché.
            </p>
          </div>
        ) : null}

        {rotationState.message && !rotationState.webhookSecret ? (
          <div
            className={`mt-5 rounded-xl border px-4 py-3 text-xs ${
              rotationState.status === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {rotationState.message}
          </div>
        ) : null}

        {canManage ? (
          <>
            <form action={rotationAction} className="mt-5">
              <button
                type="submit"
                disabled={rotationPending}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-medium text-white transition hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={rotationPending ? "animate-spin" : ""}
                />

                {webhookSecretConfigured
                  ? "Régénérer le secret"
                  : "Générer un secret"}
              </button>
            </form>

            {webhookSecretConfigured ? (
              <p className="mt-3 text-[11px] leading-5 text-slate-500">
                Régénérer le secret invalide immédiatement l’ancien.
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-5 text-[11px] leading-5 text-slate-500">
            Seuls les propriétaires et administrateurs peuvent générer ou
            régénérer le secret.
          </p>
        )}
      </section>
    </div>
  );
}
