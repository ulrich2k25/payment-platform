"use client";

import { useActionState } from "react";
import {
  CheckCircle2,
  CircleOff,
  KeyRound,
  LockKeyhole,
  Power,
  Save,
  ShieldCheck,
  Star,
  Workflow,
} from "lucide-react";

import {
  ProviderActionState,
  updateProviderAccount,
  updateProviderCredentials,
} from "./actions";

export type MerchantProviderAccount = {
  id: string;
  merchantId: string;
  provider: string;
  status: string;
  isDefault: boolean;
  priority: number;
  externalAccountId: string | null;
  configuration: unknown;
  credentialsConfigured: boolean;
  createdAt: string;
  updatedAt: string;
};

type ProviderAccountCardProps = {
  account: MerchantProviderAccount;
  canManage: boolean;
};

const initialState: ProviderActionState = {
  status: "idle",
};

function providerName(provider: string) {
  switch (provider) {
    case "FAPSHI":
      return "Fapshi";

    case "MTN_MOMO":
      return "MTN Mobile Money";

    case "ORANGE_MONEY":
      return "Orange Money";

    case "STELLAR":
      return "Stellar";

    default:
      return provider;
  }
}

function ActionMessage({ state }: { state: ProviderActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  return (
    <div
      className={`rounded-xl border px-3 py-2 text-xs ${
        state.status === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {state.message}
    </div>
  );
}

export function ProviderAccountCard({
  account,
  canManage,
}: ProviderAccountCardProps) {
  const [accountState, accountAction] = useActionState(
    updateProviderAccount,
    initialState,
  );

  const [credentialsState, credentialsAction] = useActionState(
    updateProviderCredentials,
    initialState,
  );

  const isActive = account.status === "ACTIVE";
  const isFapshi = account.provider === "FAPSHI";

  return (
    <article className="overflow-hidden rounded-2xl border border-[#e7e2d8] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="border-b border-[#eeeae2] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#eee8da] bg-[#fffaf0] text-[#9a7523]">
              <Workflow size={18} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight text-[#0a0e17]">
                  {providerName(account.provider)}
                </h2>

                {account.isDefault ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#dbc47d] bg-[#fff8e7] px-2.5 py-1 text-[10px] font-semibold text-[#9a7523]">
                    <Star size={11} />
                    Par défaut
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-xs text-slate-400">{account.provider}</p>
            </div>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
              isActive
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-100 text-slate-500"
            }`}
          >
            {isActive ? <CheckCircle2 size={12} /> : <CircleOff size={12} />}
            {account.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-2">
        <section>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#eee8da] bg-[#fffaf0] text-[#9a7523]">
              <ShieldCheck size={15} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#0a0e17]">Routing</h3>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Configuration de routage du provider
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#eeeae2] bg-[#faf9f6] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Priorité
              </p>

              <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#0a0e17]">
                {account.priority}
              </p>
            </div>

            <div className="rounded-xl border border-[#eeeae2] bg-[#faf9f6] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Credentials
              </p>

              <p
                className={`mt-2 text-sm font-semibold ${
                  account.credentialsConfigured
                    ? "text-emerald-700"
                    : "text-amber-700"
                }`}
              >
                {account.credentialsConfigured
                  ? "Configurés"
                  : "Non configurés"}
              </p>
            </div>
          </div>

          {account.externalAccountId ? (
            <div className="mt-3 rounded-xl border border-[#eeeae2] bg-white px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Compte externe
              </p>

              <code className="mt-2 block break-all text-xs text-slate-600">
                {account.externalAccountId}
              </code>
            </div>
          ) : null}

          {canManage ? (
            <div className="mt-5 space-y-4">
              <ActionMessage state={accountState} />

              <form
                action={accountAction}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <input
                  type="hidden"
                  name="providerAccountId"
                  value={account.id}
                />

                <input type="hidden" name="operation" value="updatePriority" />

                <input
                  name="priority"
                  type="number"
                  min={1}
                  max={1000}
                  defaultValue={account.priority}
                  className="h-10 w-full rounded-xl border border-[#e5e0d6] bg-white px-3 text-sm text-[#0a0e17] outline-none transition placeholder:text-slate-300 focus:border-[#c8a24a] focus:ring-2 focus:ring-[#c8a24a]/10 sm:max-w-[140px]"
                />

                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#e5e0d6] bg-white px-4 text-xs font-medium text-[#0a0e17] transition hover:border-[#c8a24a]/45 hover:bg-[#fffdf8] hover:text-[#9a7523]"
                >
                  <Save size={14} />
                  Priorité
                </button>
              </form>

              <div className="flex flex-wrap gap-3">
                {!account.isDefault ? (
                  <form action={accountAction}>
                    <input
                      type="hidden"
                      name="providerAccountId"
                      value={account.id}
                    />

                    <input type="hidden" name="operation" value="setDefault" />

                    <button
                      type="submit"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dbc47d] bg-[#fff8e7] px-4 text-xs font-medium text-[#8a681d] transition hover:border-[#c8a24a] hover:bg-[#fff3ce]"
                    >
                      <Star size={14} />
                      Définir par défaut
                    </button>
                  </form>
                ) : null}

                <form action={accountAction}>
                  <input
                    type="hidden"
                    name="providerAccountId"
                    value={account.id}
                  />

                  <input type="hidden" name="operation" value="toggleStatus" />

                  <input
                    type="hidden"
                    name="targetStatus"
                    value={isActive ? "INACTIVE" : "ACTIVE"}
                  />

                  <button
                    type="submit"
                    className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-medium transition ${
                      isActive
                        ? "border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50"
                        : "border-emerald-200 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    <Power size={14} />
                    {isActive ? "Désactiver" : "Activer"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-[#eeeae2] bg-[#faf9f6] px-4 py-3 text-xs leading-5 text-slate-500">
              Votre rôle dispose d’un accès en lecture seule aux providers.
            </div>
          )}
        </section>

        <section className="border-t border-[#eeeae2] pt-6 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#eee8da] bg-[#fffaf0] text-[#9a7523]">
              <KeyRound size={15} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#0a0e17]">
                Credentials provider
              </h3>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Secrets d&apos;authentification du provider
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            Les secrets sont chiffrés côté serveur et ne sont jamais réaffichés
            après enregistrement.
          </p>

          {!isFapshi ? (
            <div className="mt-5 rounded-xl border border-[#eeeae2] bg-[#faf9f6] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#e7e2d8] bg-white text-slate-400">
                  <LockKeyhole size={15} />
                </div>

                <div>
                  <p className="text-sm font-medium text-[#0a0e17]">
                    Configuration gérée par la plateforme
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    L’interface de configuration de ce provider n’est pas encore
                    disponible dans le Merchant Dashboard.
                  </p>
                </div>
              </div>
            </div>
          ) : canManage ? (
            <form action={credentialsAction} className="mt-5 space-y-4">
              <input
                type="hidden"
                name="providerAccountId"
                value={account.id}
              />

              <ActionMessage state={credentialsState} />

              <div>
                <label
                  htmlFor={`apiuser-${account.id}`}
                  className="text-xs font-medium text-slate-600"
                >
                  API User
                </label>

                <input
                  id={`apiuser-${account.id}`}
                  name="apiuser"
                  type="text"
                  autoComplete="off"
                  required={!account.credentialsConfigured}
                  placeholder={
                    account.credentialsConfigured
                      ? "Laisser vide pour conserver la valeur actuelle"
                      : "API User Fapshi"
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-[#e5e0d6] bg-white px-3 text-sm text-[#0a0e17] outline-none transition placeholder:text-slate-300 focus:border-[#c8a24a] focus:ring-2 focus:ring-[#c8a24a]/10"
                />
              </div>

              <div>
                <label
                  htmlFor={`apikey-${account.id}`}
                  className="text-xs font-medium text-slate-600"
                >
                  API Key
                </label>

                <input
                  id={`apikey-${account.id}`}
                  name="apikey"
                  type="password"
                  autoComplete="new-password"
                  required={!account.credentialsConfigured}
                  placeholder={
                    account.credentialsConfigured
                      ? "Laisser vide pour conserver la valeur actuelle"
                      : "API Key Fapshi"
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-[#e5e0d6] bg-white px-3 text-sm text-[#0a0e17] outline-none transition placeholder:text-slate-300 focus:border-[#c8a24a] focus:ring-2 focus:ring-[#c8a24a]/10"
                />
              </div>

              <div>
                <label
                  htmlFor={`webhooksecret-${account.id}`}
                  className="text-xs font-medium text-slate-600"
                >
                  Webhook Secret
                </label>

                <input
                  id={`webhooksecret-${account.id}`}
                  name="webhooksecret"
                  type="password"
                  autoComplete="new-password"
                  required={!account.credentialsConfigured}
                  placeholder={
                    account.credentialsConfigured
                      ? "Laisser vide pour conserver la valeur actuelle"
                      : "Secret webhook Fapshi"
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-[#e5e0d6] bg-white px-3 text-sm text-[#0a0e17] outline-none transition placeholder:text-slate-300 focus:border-[#c8a24a] focus:ring-2 focus:ring-[#c8a24a]/10"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0a0e17] px-4 text-xs font-medium text-white shadow-[0_6px_18px_rgba(10,14,23,0.12)] transition hover:bg-[#151b28]"
              >
                <LockKeyhole size={14} className="text-[#e6c76d]" />
                Enregistrer les credentials
              </button>
            </form>
          ) : (
            <div className="mt-5 rounded-xl border border-[#eeeae2] bg-[#faf9f6] p-4 text-xs leading-5 text-slate-500">
              Seuls les propriétaires et administrateurs du marchand peuvent
              modifier les credentials.
            </div>
          )}
        </section>
      </div>
    </article>
  );
}
