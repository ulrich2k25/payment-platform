import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  MoreHorizontal,
  RefreshCw,
  Search,
  WalletCards,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Payment = {
  id: string;
  merchantId: string;
  amount: number;
  currency: string;
  method: string;
  provider: string;
  reference: string;
  providerReference: string | null;
  idempotencyKey: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type PaymentsResponse = {
  data: Payment[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

type PaymentsPageResult = {
  payload: PaymentsResponse;
  responseDate: string | null;
};

type DashboardPaymentsResult = {
  payments: Payment[];
  referenceTimestamp: number;
};

const API_URL = process.env.PAYMENT_API_URL;
const UBIZA_API_KEY = process.env.UBIZA_API_KEY;

async function fetchPaymentsPage(
  page: number,
  limit: number,
): Promise<PaymentsPageResult> {
  if (!API_URL) {
    throw new Error("PAYMENT_API_URL is missing.");
  }

  if (!UBIZA_API_KEY) {
    throw new Error("UBIZA_API_KEY is missing.");
  }

  const response = await fetch(
    `${API_URL}/payments?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${UBIZA_API_KEY}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Payment API returned HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as PaymentsResponse;

  return {
    payload,
    responseDate: response.headers.get("date"),
  };
}

async function getAllPayments(): Promise<DashboardPaymentsResult> {
  const limit = 100;
  const firstPageResult = await fetchPaymentsPage(1, limit);
  const firstPage = firstPageResult.payload;

  const responseTimestamp = firstPageResult.responseDate
    ? Date.parse(firstPageResult.responseDate)
    : Number.NaN;

  const fallbackTimestamp = firstPage.data[0]
    ? Date.parse(firstPage.data[0].updatedAt ?? firstPage.data[0].createdAt)
    : 0;

  const referenceTimestamp = Number.isNaN(responseTimestamp)
    ? fallbackTimestamp
    : responseTimestamp;

  if (firstPage.meta.totalPages <= 1) {
    return {
      payments: firstPage.data,
      referenceTimestamp,
    };
  }

  const remainingPages = await Promise.all(
    Array.from(
      { length: firstPage.meta.totalPages - 1 },
      (_, index) => index + 2,
    ).map((page) => fetchPaymentsPage(page, limit)),
  );

  return {
    payments: [
      ...firstPage.data,
      ...remainingPages.flatMap((page) => page.payload.data),
    ],
    referenceTimestamp,
  };
}

function formatAmount(amount: number, currency: string) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(amount)} ${currency}`;
}

function formatPercentage(value: number) {
  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} %`;
}

function formatRelativeTime(dateString: string, referenceTimestamp: number) {
  const timestamp = new Date(dateString).getTime();
  const difference = Math.max(0, referenceTimestamp - timestamp);

  if (difference < 60_000) {
    return "À l’instant";
  }

  const minutes = Math.floor(difference / 60_000);

  if (minutes < 60) {
    return `Il y a ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `Il y a ${hours} h`;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

function formatProvider(provider: string) {
  if (provider === "FAPSHI") {
    return "Fapshi";
  }

  return provider
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    PROCESSING: "border-amber-200 bg-amber-50 text-amber-700",
    REQUIRES_RECONCILIATION: "border-amber-200 bg-amber-50 text-amber-700",
    FAILED: "border-rose-200 bg-rose-50 text-rose-700",
  };

  const dotStyles: Record<string, string> = {
    COMPLETED: "bg-emerald-500",
    PENDING: "bg-amber-500",
    PROCESSING: "bg-amber-500",
    REQUIRES_RECONCILIATION: "bg-amber-500",
    FAILED: "bg-rose-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${
        styles[status] ?? "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          dotStyles[status] ?? "bg-slate-400"
        }`}
      />

      {status}
    </span>
  );
}

export default async function Home() {
  let payments: Payment[] = [];
  let apiOnline = true;
  let referenceTimestamp = 0;

  try {
    const result = await getAllPayments();

    payments = result.payments;
    referenceTimestamp = result.referenceTimestamp;
  } catch (error) {
    apiOnline = false;

    console.error("Unable to load dashboard payments:", error);
  }

  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const completedPayments = payments.filter(
    (payment) => payment.status === "COMPLETED",
  );

  const pendingPayments = payments.filter((payment) =>
    ["PENDING", "PROCESSING", "REQUIRES_RECONCILIATION"].includes(
      payment.status,
    ),
  );

  const failedPayments = payments.filter(
    (payment) => payment.status === "FAILED",
  );

  const completedVolume = completedPayments.reduce(
    (total, payment) => total + payment.amount,
    0,
  );

  const resolvedPaymentsCount =
    completedPayments.length + failedPayments.length;

  const successRate =
    resolvedPaymentsCount > 0
      ? (completedPayments.length / resolvedPaymentsCount) * 100
      : 0;

  const last24HoursThreshold = referenceTimestamp - 24 * 60 * 60 * 1000;

  const paymentsLast24Hours = payments.filter(
    (payment) => new Date(payment.createdAt).getTime() >= last24HoursThreshold,
  );

  const successfulLast24Hours = paymentsLast24Hours.filter(
    (payment) => payment.status === "COMPLETED",
  ).length;

  const failedLast24Hours = paymentsLast24Hours.filter(
    (payment) => payment.status === "FAILED",
  ).length;

  const resolvedLast24Hours = successfulLast24Hours + failedLast24Hours;

  const successRateLast24Hours =
    resolvedLast24Hours > 0
      ? (successfulLast24Hours / resolvedLast24Hours) * 100
      : 0;

  const currency =
    completedPayments[0]?.currency ?? payments[0]?.currency ?? "XAF";

  const stats = [
    {
      label: "Volume traité",
      value: formatAmount(completedVolume, currency),
      detail: `${completedPayments.length} complétés`,
      trend: "up",
      icon: CircleDollarSign,
    },
    {
      label: "Paiements",
      value: payments.length.toString(),
      detail: `${paymentsLast24Hours.length} sur 24 h`,
      trend: "up",
      icon: WalletCards,
    },
    {
      label: "Taux de succès",
      value: formatPercentage(successRate),
      detail: `${resolvedPaymentsCount} finalisés`,
      trend: "up",
      icon: CheckCircle2,
    },
    {
      label: "En attente",
      value: pendingPayments.length.toString(),
      detail: pendingPayments.length > 0 ? "À surveiller" : "Aucun en attente",
      trend: "neutral",
      icon: Clock3,
    },
  ];

  const recentPayments = sortedPayments.slice(0, 5);

  return (
    <DashboardShell>
      <div className="mx-auto max-w-[1500px]">
        <section className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full border border-[#dbc47d] bg-[#fff8e7] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a7523]">
                Sandbox
              </span>

              <span className="text-xs text-slate-400">
                Données réelles · Ubiza
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-[-0.035em] text-[#0a0e17] sm:text-3xl">
              Vue d’ensemble
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Supervisez les paiements, transactions et connexions providers
              depuis un seul espace.
            </p>
          </div>

          <div className="flex gap-3">
            <form action="/" method="get">
              <button
                type="submit"
                className="flex h-10 items-center gap-2 rounded-xl border border-[#ded9cd] bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-[#c8a24a]/50 hover:bg-[#fffdf8]"
              >
                <RefreshCw size={15} />
                Actualiser
              </button>
            </form>

            <Link
              href="/payments"
              className="flex h-10 items-center gap-2 rounded-xl bg-[#0a0e17] px-4 text-sm font-medium text-white shadow-[0_10px_24px_rgba(10,14,23,0.18)] transition hover:bg-[#151b28]"
            >
              Voir les paiements
              <ArrowRight size={15} className="text-[#e6c76d]" />
            </Link>
          </div>
        </section>

        {!apiOnline && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
            <div className="text-sm font-semibold text-rose-700">
              Payment API indisponible
            </div>

            <p className="mt-1 text-xs leading-5 text-rose-600">
              Le dashboard n’a pas pu récupérer les paiements. Vérifiez que le
              backend est démarré et que la configuration locale est correcte.
            </p>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="group rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c8a24a]/45 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eee8d9] bg-[#fffaf0] text-[#9a7523] transition group-hover:border-[#dbc47d] group-hover:bg-[#fff6dc]">
                    <Icon size={18} />
                  </div>

                  {stat.trend === "up" ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                      <ArrowUpRight size={12} />
                      {stat.detail}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                      {stat.detail}
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  <div className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </div>

                  <div className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
                    {stat.value}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.7fr)]">
          <div className="overflow-hidden rounded-2xl border border-[#e7e2d8] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)]">
            <div className="flex flex-col gap-4 border-b border-[#eeeae2] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-[#0a0e17]">
                  Paiements récents
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Dernières opérations enregistrées par la plateforme
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    placeholder="Rechercher"
                    className="h-9 w-44 rounded-xl border border-[#e5e0d6] bg-[#faf9f6] pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#c8a24a]/70 focus:bg-white focus:ring-4 focus:ring-[#c8a24a]/10"
                  />
                </div>

                <button
                  type="button"
                  className="h-9 rounded-xl border border-[#e5e0d6] bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-[#c8a24a]/40 hover:bg-[#fffdf8]"
                >
                  Tout voir
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-[#eeeae2] bg-[#faf9f6]">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Référence
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Marchand
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Provider
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Montant
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Statut
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Date
                    </th>

                    <th className="w-12" />
                  </tr>
                </thead>

                <tbody>
                  {recentPayments.length > 0 ? (
                    recentPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-[#f0ede6] last:border-0 hover:bg-[#fdfbf6]"
                      >
                        <td className="px-5 py-4">
                          <div className="max-w-[220px] truncate font-mono text-xs font-medium text-slate-700">
                            {payment.reference}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff6dc] text-[#a67c20]">
                              <Building2 size={14} />
                            </div>

                            <span className="text-sm font-medium text-slate-700">
                              Ubiza
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {formatProvider(payment.provider)}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-[#111827]">
                          {formatAmount(payment.amount, payment.currency)}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={payment.status} />
                        </td>

                        <td className="px-5 py-4 text-right text-xs text-slate-400">
                          {formatRelativeTime(
                            payment.createdAt,
                            referenceTimestamp,
                          )}
                        </td>

                        <td className="pr-4">
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#fff6dc] hover:text-[#9a7523]"
                          >
                            <MoreHorizontal size={17} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-12 text-center text-sm text-slate-400"
                      >
                        Aucun paiement disponible.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <article className="overflow-hidden rounded-2xl border border-[#c8a24a]/10 bg-[#0a0e17] p-6 text-white shadow-[0_16px_40px_rgba(10,14,23,0.18)]">
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-medium text-[#bca66f]">
                      Infrastructure
                    </div>

                    <h2 className="mt-1 text-lg font-semibold tracking-tight">
                      {apiOnline
                        ? "Système opérationnel"
                        : "Connexion dégradée"}
                    </h2>
                  </div>

                  <span
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                      apiOnline
                        ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-300"
                        : "border-rose-400/15 bg-rose-400/10 text-rose-300"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        apiOnline ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                    />

                    {apiOnline ? "Healthy" : "Unavailable"}
                  </span>
                </div>

                <div className="mt-7 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
                    <span className="text-xs text-slate-400">API Backend</span>

                    <span
                      className={`text-xs font-medium ${
                        apiOnline ? "text-white" : "text-rose-300"
                      }`}
                    >
                      {apiOnline ? "Online" : "Offline"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
                    <span className="text-xs text-slate-400">
                      Fapshi Sandbox
                    </span>

                    <span className="text-xs font-medium text-white">
                      Configured
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Données paiements
                    </span>

                    <span className="text-xs font-medium text-[#e6c76d]">
                      {payments.length} chargés
                    </span>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[#0a0e17]">
                    Performance
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Activité des dernières 24 h
                  </p>
                </div>

                <span className="rounded-lg bg-[#fff8e7] px-2 py-1 text-[10px] font-medium text-[#9a7523]">
                  24H
                </span>
              </div>

              <div className="mt-6">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
                      {formatPercentage(successRateLast24Hours)}
                    </div>

                    <div className="mt-1 text-xs text-slate-400">
                      Paiements réussis
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-500">
                    {paymentsLast24Hours.length} opérations
                  </div>
                </div>

                <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#f0ede6]">
                  <div
                    className="h-full rounded-full bg-[#c8a24a] transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, successRateLast24Hours),
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#faf9f6] p-3">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      Succès
                    </div>

                    <div className="mt-1 text-sm font-semibold text-slate-800">
                      {successfulLast24Hours}
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#faf9f6] p-3">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      Échecs
                    </div>

                    <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-800">
                      {failedLast24Hours}

                      {failedLast24Hours > 0 && (
                        <ArrowDownRight size={13} className="text-rose-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
