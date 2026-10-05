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
        className: "border-red-200 bg-red-50 text-red-700",
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
    <div className="flex items-center gap-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          active
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-50 text-amber-700"
        }`}
      >
        <Icon size={16} />
      </div>

      <div className="min-w-0">
        <div className="text-xs font-semibold text-[#0a0e17]">{label}</div>
        <div
          className={`mt-0.5 text-[11px] ${
            active ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          {detail}
        </div>
      </div>
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
    <div className="space-y-8">
      <div className="max-w-2xl">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a7523]">
          Vue d&apos;ensemble
        </div>

        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
          Bonjour, {session.merchant.name}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Suivez l&apos;activité récente de vos paiements et les éléments qui
          nécessitent votre attention.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[22px] border border-[#e3dfd5] bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.04)]">
          <div className="text-xs font-medium text-slate-400">
            Paiements · 30 jours
          </div>

          <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
            {summary.payments.count}
          </div>

          <p
            className="mt-2 truncate text-xs text-slate-500"
            title={volumeLabel}
          >
            {volumeLabel}
          </p>
        </article>

        <article className="rounded-[22px] border border-[#e3dfd5] bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.04)]">
          <div className="text-xs font-medium text-slate-400">
            Taux de réussite
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="text-3xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
              {summary.payments.successRate === null
                ? "—"
                : `${summary.payments.successRate}%`}
            </div>

            {summary.payments.successRate !== null ? (
              <CheckCircle2 size={18} className="text-emerald-600" />
            ) : null}
          </div>

          <p className="mt-2 text-xs text-slate-500">
            {summary.payments.finalizedCount > 0
              ? `${summary.payments.completedCount} réussis sur ${summary.payments.finalizedCount} finalisés`
              : "Aucun paiement finalisé sur la période"}
          </p>
        </article>

        <article
          className={`rounded-[22px] border p-6 shadow-[0_18px_55px_rgba(15,23,42,0.04)] ${
            summary.attention.total > 0
              ? "border-orange-200 bg-orange-50/40"
              : "border-[#e3dfd5] bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-slate-400">
              À surveiller
            </div>

            <CircleAlert
              size={17}
              className={
                summary.attention.total > 0
                  ? "text-orange-600"
                  : "text-slate-300"
              }
            />
          </div>

          <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
            {summary.attention.total}
          </div>

          <p className="mt-2 text-xs text-slate-500">
            {summary.attention.paymentsRequiringReconciliation} rapprochement
            {summary.attention.paymentsRequiringReconciliation > 1
              ? "s"
              : ""} · {summary.attention.webhookIssues} webhook
            {summary.attention.webhookIssues > 1 ? "s" : ""}
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-[#e3dfd5] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between border-b border-[#ece8df] px-6 py-5">
          <div>
            <h2 className="font-semibold text-[#0a0e17]">Paiements récents</h2>

            <p className="mt-1 text-xs text-slate-500">
              Les cinq derniers paiements enregistrés
            </p>
          </div>

          <Link
            href="/dashboard/payments"
            className="text-xs font-semibold text-[#9a7523] transition hover:text-[#755718]"
          >
            Voir tous
          </Link>
        </div>

        {summary.recentPayments.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-[#0a0e17]">Aucun paiement</p>
            <p className="mt-2 text-xs text-slate-500">
              Les prochains paiements apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#ece8df]">
            {summary.recentPayments.map((payment) => {
              const appearance = paymentStatusStyle(payment.status);

              return (
                <Link
                  key={payment.id}
                  href={`/dashboard/payments/${payment.id}`}
                  className="group grid gap-4 px-6 py-4 transition hover:bg-[#faf9f6] sm:grid-cols-[1.4fr_1fr_auto] sm:items-center"
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

      <section className="rounded-[22px] border border-[#e3dfd5] bg-white px-6 py-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#0a0e17]">
              Infrastructure
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              État des composants nécessaires au traitement des paiements.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3 lg:min-w-[620px]">
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
        </div>
      </section>
    </div>
  );
}
