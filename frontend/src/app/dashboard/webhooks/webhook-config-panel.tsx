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
};

const initialState: WebhookActionState = {
  status: "idle",
};

export function WebhookConfigPanel({
  webhookUrl,
  webhookSecretConfigured,
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
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <section className="rounded-[24px] border border-[#e3dfd5] bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff8e7] text-[#9a7523]">
              <Webhook size={18} />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-[#0a0e17]">
              Endpoint webhook
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Notre plateforme enverra les événements de paiement à cette
              adresse.
            </p>
          </div>

          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
              webhookUrl
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            {webhookUrl ? "CONFIGURÉ" : "NON CONFIGURÉ"}
          </span>
        </div>

        <form action={configurationAction} className="mt-6">
          <label
            htmlFor="webhookUrl"
            className="text-xs font-semibold text-slate-600"
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
            placeholder="https://example.com/webhooks/payment"
            className="mt-2 h-12 w-full rounded-xl border border-[#ddd7cb] bg-white px-4 text-sm text-[#0a0e17] outline-none transition placeholder:text-slate-300 focus:border-[#c8a24a] focus:ring-4 focus:ring-[#c8a24a]/10"
          />

          <div className="mt-3 rounded-xl border border-[#ece8df] bg-[#faf9f6] px-4 py-3 text-xs leading-5 text-slate-500">
            Utilisez une URL publique accessible depuis Internet. Les adresses
            localhost et réseaux privés sont refusées.
          </div>

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

          <button
            type="submit"
            disabled={configurationPending}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#0a0e17] px-4 text-xs font-semibold text-white transition hover:bg-[#151c2b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {configurationPending ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}

            {configurationPending ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </section>

      <section className="rounded-[24px] border border-[#e3dfd5] bg-[#0a0e17] p-6 text-white shadow-[0_18px_55px_rgba(15,23,42,0.12)]">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-[#e6c76d]">
          <KeyRound size={18} />
        </div>

        <h2 className="mt-5 text-lg font-semibold">Signing secret</h2>

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
          <div className="mt-5 rounded-2xl border border-[#e6c76d]/25 bg-[#e6c76d]/10 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e6c76d]">
              Copiez ce secret maintenant
            </p>

            <code className="mt-3 block break-all text-xs leading-5 text-[#fff8e7]">
              {visibleSecret}
            </code>

            <button
              type="button"
              onClick={copySecret}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              {copiedSecret ? <Check size={13} /> : <Copy size={13} />}

              {copiedSecret ? "Copié" : "Copier le secret"}
            </button>

            <p className="mt-3 text-[11px] leading-5 text-slate-400">
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

        <form action={rotationAction} className="mt-5">
          <button
            type="submit"
            disabled={rotationPending}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
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
      </section>
    </div>
  );
}
