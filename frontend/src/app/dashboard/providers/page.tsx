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
    <div className="mx-auto max-w-[1500px] space-y-6 pb-10">
      <section>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full border border-[#dbc47d] bg-[#fff8e7] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a7523]">
            Infrastructure
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-[#0a0e17] sm:text-3xl">
          Providers
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Gérez les connexions de paiement utilisées pour traiter les
          transactions de votre entreprise.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="group rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c8a24a]/45 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#eee8da] bg-[#fffaf0] text-[#9a7523]">
            <Workflow size={15} />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-500">Providers</p>

          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
            {accounts.length}
          </p>
        </article>

        <article className="group rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c8a24a]/45 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={15} />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-500">Actifs</p>

          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
            {activeCount}
          </p>
        </article>

        <article className="group rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c8a24a]/45 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#eee8da] bg-[#fffaf0] text-[#9a7523]">
            <KeyRound size={15} />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-500">
            Credentials configurés
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
            {configuredCount}
          </p>
        </article>

        <article className="group rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c8a24a]/45 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#eee8da] bg-[#fffaf0] text-[#9a7523]">
            <Star size={15} />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-500">
            Provider par défaut
          </p>

          <p className="mt-2 truncate text-lg font-semibold tracking-[-0.02em] text-[#0a0e17]">
            {defaultAccount ? providerName(defaultAccount.provider) : "Aucun"}
          </p>
        </article>
      </section>

      {!canManage ? (
        <section className="flex gap-3 rounded-2xl border border-[#e7e2d8] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#eee8da] bg-[#fffaf0] text-[#9a7523]">
            <ShieldCheck size={16} />
          </div>

          <div>
            <p className="text-xs font-semibold text-[#0a0e17]">
              Accès en lecture seule
            </p>

            <p className="mt-1 text-xs leading-6 text-slate-500">
              Vous consultez cette page en lecture seule avec le rôle{" "}
              <strong>{session.user.role}</strong>.
            </p>
          </div>
        </section>
      ) : null}

      {accounts.length === 0 ? (
        <section className="rounded-2xl border border-[#e7e2d8] bg-white px-6 py-16 text-center shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#eee8da] bg-[#fffaf0] text-[#9a7523]">
            <Workflow size={20} />
          </div>

          <h2 className="mt-4 text-sm font-semibold text-[#0a0e17]">
            Aucun provider rattaché
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Aucun compte provider n&apos;est actuellement disponible pour votre
            entreprise. Le rattachement initial est effectué par la plateforme.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
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
