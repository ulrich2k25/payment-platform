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
    <article className="overflow-hidden rounded-[24px] border border-[#e3dfd5] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
      <div className="border-b border-[#ece8df] p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff8e7] text-[#9a7523]">
              <Workflow size={20} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-[#0a0e17]">
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
                : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            {isActive ? <CheckCircle2 size={12} /> : <CircleOff size={12} />}

            {account.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 p-6 xl:grid-cols-2">
        <section>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#9a7523]" />

            <h3 className="text-sm font-semibold text-[#0a0e17]">Routing</h3>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[#f7f6f2] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Priorité
              </p>

              <p className="mt-2 text-lg font-semibold text-[#0a0e17]">
                {account.priority}
              </p>
            </div>

            <div className="rounded-xl bg-[#f7f6f2] p-4">
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
            <div className="mt-3 rounded-xl border border-[#ece8df] px-4 py-3">
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
                  className="h-10 w-full rounded-xl border border-[#ded8cc] bg-white px-3 text-sm text-[#0a0e17] outline-none transition focus:border-[#c8a24a] sm:max-w-[140px]"
                />

                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#ded8cc] bg-white px-4 text-xs font-semibold text-[#0a0e17] transition hover:border-[#c8a24a]/60 hover:bg-[#fffdf8]"
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
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dbc47d] bg-[#fff8e7] px-4 text-xs font-semibold text-[#8a681d] transition hover:bg-[#fff3ce]"
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
                    className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold transition ${
                      isActive
                        ? "border-red-200 bg-white text-red-700 hover:bg-red-50"
                        : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    <Power size={14} />

                    {isActive ? "Désactiver" : "Activer"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-[#ece8df] bg-[#faf9f6] px-4 py-3 text-xs leading-5 text-slate-500">
              Votre rôle dispose d’un accès en lecture seule aux providers.
            </div>
          )}
        </section>

        <section className="border-t border-[#ece8df] pt-6 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-[#9a7523]" />

            <h3 className="text-sm font-semibold text-[#0a0e17]">
              Credentials provider
            </h3>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Les secrets sont chiffrés côté serveur et ne sont jamais réaffichés
            après enregistrement.
          </p>

          {!isFapshi ? (
            <div className="mt-5 rounded-xl border border-[#ece8df] bg-[#faf9f6] p-4">
              <div className="flex items-start gap-3">
                <LockKeyhole size={16} className="mt-0.5 text-slate-400" />

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
                  className="mt-2 h-11 w-full rounded-xl border border-[#ded8cc] bg-white px-3 text-sm text-[#0a0e17] outline-none transition placeholder:text-slate-300 focus:border-[#c8a24a]"
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
                  className="mt-2 h-11 w-full rounded-xl border border-[#ded8cc] bg-white px-3 text-sm text-[#0a0e17] outline-none transition placeholder:text-slate-300 focus:border-[#c8a24a]"
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
                  className="mt-2 h-11 w-full rounded-xl border border-[#ded8cc] bg-white px-3 text-sm text-[#0a0e17] outline-none transition placeholder:text-slate-300 focus:border-[#c8a24a]"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0a0e17] px-4 text-xs font-semibold text-white transition hover:bg-[#151b28]"
              >
                <LockKeyhole size={14} className="text-[#e6c76d]" />
                Enregistrer les credentials
              </button>
            </form>
          ) : (
            <div className="mt-5 rounded-xl border border-[#ece8df] bg-[#faf9f6] p-4 text-xs leading-5 text-slate-500">
              Seuls les propriétaires et administrateurs du marchand peuvent
              modifier les credentials.
            </div>
          )}
        </section>
      </div>
    </article>
  );
}
