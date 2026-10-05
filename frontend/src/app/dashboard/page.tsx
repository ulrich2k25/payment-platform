import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  KeyRound,
  ServerCog,
  Webhook,
} from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireMerchant } from "@/lib/merchant-auth";

export const dynamic = "force-dynamic";

const API_URL = process.env.PAYMENT_API_URL ?? "http://localhost:3004";
const MERCHANT_SESSION_COOKIE = "payment_platform_merchant_session";

type DashboardSummary = {
  period: {
    days: number;
    from: string;
    to: string;
  };

  payments: {
    count: number;
    completedCount: number;
    finalizedCount: number;
    successRate: number | null;
    volumeByCurrency: Array<{
      currency: string;
      amount: number;
    }>;
  };

  attention: {
    paymentsRequiringReconciliation: number;
    webhookIssues: number;
    total: number;
  };

  infrastructure: {
    activeProviderCount: number;
    hasActiveProvider: boolean;
    activeApiKeyCount: number;
    hasActiveApiKey: boolean;
    webhookConfigured: boolean;
  };

  recentPayments: Array<{
    id: string;
    amount: number;
    currency: string;
    method: string;
    provider: string;
    reference: string;
    status: string;
    createdAt: string;
  }>;
};

function formatAmount(amount: number, currency: string) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} ${currency}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function paymentStatusStyle(status: string) {
  switch (status) {
    case "COMPLETED":
      return {
        label: "COMPLETED",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };

    case "FAILED":
      return {
        label: "FAILED",
        className: "border-rose-200 bg-rose-50 text-rose-700",
      };

    case "REQUIRES_RECONCILIATION":
      return {
        label: "À RAPPROCHER",
        className: "border-orange-200 bg-orange-50 text-orange-700",
      };

    case "PROCESSING":
      return {
        label: "PROCESSING",
        className: "border-blue-200 bg-blue-50 text-blue-700",
      };

    case "CANCELLED":
      return {
        label: "CANCELLED",
        className: "border-slate-200 bg-slate-50 text-slate-600",
      };

    case "REFUNDED":
      return {
        label: "REFUNDED",
        className: "border-violet-200 bg-violet-50 text-violet-700",
      };

    default:
      return {
        label: "PENDING",
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
  }
}

async function getDashboardSummary(): Promise<DashboardSummary> {
  const cookieStore = await cookies();
  const token = cookieStore.get(MERCHANT_SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/login");
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}/merchant/dashboard/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    throw new Error("Impossible de joindre le service de paiement.");
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    throw new Error("Impossible de charger le tableau de bord.");
  }

  return response.json();
}

function InfrastructureStatus({
  icon: Icon,
  label,
  active,
  detail,
}: {
  icon: typeof ServerCog;
  label: string;
  active: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.07] pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] text-[#e6c76d]">
          <Icon size={16} />
        </div>

        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-300">{label}</div>
          <div className="mt-0.5 text-[11px] text-slate-500">{detail}</div>
        </div>
      </div>

      <span
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
          active
            ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-300"
            : "border-amber-400/15 bg-amber-400/10 text-amber-300"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            active ? "bg-emerald-400" : "bg-amber-400"
          }`}
        />

        {active ? "Actif" : "Attention"}
      </span>
    </div>
  );
}

export default async function MerchantDashboardPage() {
  const session = await requireMerchant();
  const summary = await getDashboardSummary();

  const volumeLabel =
    summary.payments.volumeByCurrency.length > 0
      ? summary.payments.volumeByCurrency
          .map(({ amount, currency }) => formatAmount(amount, currency))
          .join(" · ")
      : "Aucun volume";

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <section>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full border border-[#dbc47d] bg-[#fff8e7] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a7523]">
            Vue d&apos;ensemble
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-[#0a0e17] sm:text-3xl">
          Bonjour, {session.merchant.name}
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Suivez l&apos;activité récente de vos paiements et les éléments qui
          nécessitent votre attention.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="group rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c8a24a]/45 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="text-sm font-medium text-slate-500">
            Paiements · 30 jours
          </div>

          <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
            {summary.payments.count}
          </div>

          <p
            className="mt-2 truncate text-xs text-slate-400"
            title={volumeLabel}
          >
            {volumeLabel}
          </p>
        </article>

        <article className="group rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c8a24a]/45 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="text-sm font-medium text-slate-500">
            Taux de réussite
          </div>

          <div className="mt-2 flex items-center gap-3">
            <div className="text-2xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
              {summary.payments.successRate === null
                ? "—"
                : `${summary.payments.successRate}%`}
            </div>

            {summary.payments.successRate !== null ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={16} />
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-xs text-slate-400">
            {summary.payments.finalizedCount > 0
              ? `${summary.payments.completedCount} réussis sur ${summary.payments.finalizedCount} finalisés`
              : "Aucun paiement finalisé sur la période"}
          </p>
        </article>

        <article
          className={`group rounded-2xl border p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] ${
            summary.attention.total > 0
              ? "border-amber-200 bg-amber-50/40"
              : "border-[#e7e2d8] bg-white hover:border-[#c8a24a]/45"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-slate-500">
              À surveiller
            </div>

            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                summary.attention.total > 0
                  ? "bg-amber-100 text-amber-700"
                  : "bg-[#fffaf0] text-[#9a7523]"
              }`}
            >
              <CircleAlert size={16} />
            </div>
          </div>

          <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
            {summary.attention.total}
          </div>

          <p className="mt-2 text-xs text-slate-400">
            {summary.attention.paymentsRequiringReconciliation} rapprochement
            {summary.attention.paymentsRequiringReconciliation > 1
              ? "s"
              : ""} · {summary.attention.webhookIssues} webhook
            {summary.attention.webhookIssues > 1 ? "s" : ""}
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e7e2d8] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)]">
        <div className="flex items-center justify-between border-b border-[#eeeae2] px-5 py-5">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[#0a0e17]">
              Paiements récents
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Les cinq derniers paiements enregistrés
            </p>
          </div>

          <Link
            href="/dashboard/payments"
            className="rounded-xl border border-[#e5e0d6] bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-[#c8a24a]/40 hover:bg-[#fffdf8]"
          >
            Voir tous
          </Link>
        </div>

        {summary.recentPayments.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-[#0a0e17]">Aucun paiement</p>

            <p className="mt-2 text-xs text-slate-400">
              Les prochains paiements apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0ede6]">
            {summary.recentPayments.map((payment) => {
              const appearance = paymentStatusStyle(payment.status);

              return (
                <Link
                  key={payment.id}
                  href={`/dashboard/payments/${payment.id}`}
                  className="group grid gap-4 px-5 py-4 transition hover:bg-[#fdfbf6] sm:grid-cols-[1.4fr_1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[#0a0e17] transition group-hover:text-[#9a7523]">
                      {payment.reference}
                    </div>

                    <div className="mt-1 text-[11px] text-slate-400">
                      {payment.provider} · {payment.method}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-[#0a0e17]">
                      {formatAmount(payment.amount, payment.currency)}
                    </div>

                    <div className="mt-1 text-[11px] text-slate-400">
                      {formatDate(payment.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:justify-end">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${appearance.className}`}
                    >
                      {appearance.label}
                    </span>

                    <ArrowUpRight
                      size={15}
                      className="text-slate-300 transition group-hover:text-[#9a7523]"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#c8a24a]/10 bg-[#0a0e17] p-6 text-white shadow-[0_16px_40px_rgba(10,14,23,0.18)]">
        <div className="mb-6">
          <div className="text-xs font-medium text-[#bca66f]">
            Infrastructure
          </div>

          <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
            État des services
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            État des composants nécessaires au traitement des paiements.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          <InfrastructureStatus
            icon={ServerCog}
            label="Provider"
            active={summary.infrastructure.hasActiveProvider}
            detail={
              summary.infrastructure.hasActiveProvider
                ? `${summary.infrastructure.activeProviderCount} actif${
                    summary.infrastructure.activeProviderCount > 1 ? "s" : ""
                  }`
                : "Aucun provider actif"
            }
          />

          <InfrastructureStatus
            icon={KeyRound}
            label="Clé API"
            active={summary.infrastructure.hasActiveApiKey}
            detail={
              summary.infrastructure.hasActiveApiKey
                ? `${summary.infrastructure.activeApiKeyCount} active${
                    summary.infrastructure.activeApiKeyCount > 1 ? "s" : ""
                  }`
                : "Aucune clé active"
            }
          />

          <InfrastructureStatus
            icon={Webhook}
            label="Webhook"
            active={summary.infrastructure.webhookConfigured}
            detail={
              summary.infrastructure.webhookConfigured
                ? "Configuré"
                : "Non configuré"
            }
          />
        </div>
      </section>
    </div>
  );
}
