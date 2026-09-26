import {
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Star,
  Workflow,
} from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { MERCHANT_SESSION_COOKIE, requireMerchant } from "@/lib/merchant-auth";

import {
  MerchantProviderAccount,
  ProviderAccountCard,
} from "./provider-account-card";

export const dynamic = "force-dynamic";

const API_URL = process.env.PAYMENT_API_URL ?? "http://localhost:3004";

async function getProviderAccounts(
  token: string,
): Promise<MerchantProviderAccount[]> {
  const response = await fetch(`${API_URL}/merchant/provider-accounts`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    throw new Error("Impossible de charger les providers du marchand.");
  }

  return response.json();
}

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

export default async function MerchantProvidersPage() {
  const session = await requireMerchant();

  const cookieStore = await cookies();

  const token = cookieStore.get(MERCHANT_SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/login");
  }

  const accounts = await getProviderAccounts(token);

  const activeCount = accounts.filter(
    (account) => account.status === "ACTIVE",
  ).length;

  const configuredCount = accounts.filter(
    (account) => account.credentialsConfigured,
  ).length;

  const defaultAccount = accounts.find((account) => account.isDefault);

  const canManage =
    session.user.role === "OWNER" || session.user.role === "ADMIN";

  return (
    <div className="space-y-7 pb-10">
      <div className="max-w-2xl">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a7523]">
          Infrastructure
        </div>

        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
          Providers
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Gérez les connexions de paiement utilisées pour traiter les
          transactions de votre entreprise.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <Workflow size={18} className="text-[#9a7523]" />

          <p className="mt-4 text-xs text-slate-400">Providers</p>

          <p className="mt-1 text-2xl font-semibold text-[#0a0e17]">
            {accounts.length}
          </p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <CheckCircle2 size={18} className="text-emerald-600" />

          <p className="mt-4 text-xs text-slate-400">Actifs</p>

          <p className="mt-1 text-2xl font-semibold text-emerald-700">
            {activeCount}
          </p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <KeyRound size={18} className="text-[#9a7523]" />

          <p className="mt-4 text-xs text-slate-400">Credentials configurés</p>

          <p className="mt-1 text-2xl font-semibold text-[#0a0e17]">
            {configuredCount}
          </p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <Star size={18} className="text-[#9a7523]" />

          <p className="mt-4 text-xs text-slate-400">Provider par défaut</p>

          <p className="mt-1 truncate text-lg font-semibold text-[#0a0e17]">
            {defaultAccount ? providerName(defaultAccount.provider) : "Aucun"}
          </p>
        </article>
      </section>

      {!canManage ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#e3dfd5] bg-white p-4">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#9a7523]" />

          <p className="text-xs leading-5 text-slate-500">
            Vous consultez cette page en lecture seule avec le rôle{" "}
            <strong>{session.user.role}</strong>.
          </p>
        </div>
      ) : null}

      {accounts.length === 0 ? (
        <section className="rounded-[24px] border border-[#e3dfd5] bg-white px-6 py-16 text-center shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff8e7] text-[#9a7523]">
            <Workflow size={20} />
          </div>

          <h2 className="mt-4 font-semibold text-[#0a0e17]">
            Aucun provider rattaché
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Aucun compte provider n&apos;est actuellement disponible pour votre
            entreprise. Le rattachement initial est effectué par la plateforme.
          </p>
        </section>
      ) : (
        <section className="space-y-5">
          {accounts.map((account) => (
            <ProviderAccountCard
              key={account.id}
              account={account}
              canManage={canManage}
            />
          ))}
        </section>
      )}
    </div>
  );
}
