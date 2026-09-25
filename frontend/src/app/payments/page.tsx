import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Hash,
  Smartphone,
  XCircle,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";

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

type PaymentsPageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

const API_URL = process.env.PAYMENT_API_URL;
const UBIZA_API_KEY = process.env.UBIZA_API_KEY;

async function fetchPayments(
  page: number,
  limit: number,
): Promise<PaymentsResponse> {
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

  return response.json();
}

async function fetchAllPayments(): Promise<Payment[]> {
  const firstPage = await fetchPayments(1, 100);

  if (firstPage.meta.totalPages <= 1) {
    return firstPage.data;
  }

  const remainingPages = await Promise.all(
    Array.from(
      { length: firstPage.meta.totalPages - 1 },
      (_, index) => index + 2,
    ).map((page) => fetchPayments(page, 100)),
  );

  return [...firstPage.data, ...remainingPages.flatMap((page) => page.data)];
}

function formatAmount(amount: number, currency: string) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(amount)} ${currency}`;
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function formatMethod(method: string) {
  if (method === "MOBILE_MONEY") {
    return "Mobile Money";
  }

  return method
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

  const dots: Record<string, string> = {
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
        className={`h-1.5 w-1.5 rounded-full ${dots[status] ?? "bg-slate-400"}`}
      />

      {status}
    </span>
  );
}

export default async function PaymentsPage({
  searchParams,
}: PaymentsPageProps) {
  const params = await searchParams;

  const requestedPage = Number.parseInt(params.page ?? "1", 10);

  const currentPage =
    Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;

  const limit = 10;

  let pageData: PaymentsResponse | null = null;
  let allPayments: Payment[] = [];
  let apiOnline = true;

  try {
    [pageData, allPayments] = await Promise.all([
      fetchPayments(currentPage, limit),
      fetchAllPayments(),
    ]);
  } catch (error) {
    apiOnline = false;

    console.error("Unable to load payments:", error);
  }

  const completedPayments = allPayments.filter(
    (payment) => payment.status === "COMPLETED",
  );

  const pendingPayments = allPayments.filter((payment) =>
    ["PENDING", "PROCESSING", "REQUIRES_RECONCILIATION"].includes(
      payment.status,
    ),
  );

  const failedPayments = allPayments.filter(
    (payment) => payment.status === "FAILED",
  );

  const completedVolume = completedPayments.reduce(
    (total, payment) => total + payment.amount,
    0,
  );

  const currency =
    completedPayments[0]?.currency ?? allPayments[0]?.currency ?? "XAF";

  const payments = pageData?.data ?? [];

  const meta = pageData?.meta ?? {
    page: currentPage,
    limit,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  const summaryCards = [
    {
      label: "Tous les paiements",
      value: meta.total.toString(),
      detail: "Enregistrés",
      icon: CreditCard,
      tone: "neutral",
    },
    {
      label: "Volume complété",
      value: formatAmount(completedVolume, currency),
      detail: `${completedPayments.length} paiements`,
      icon: CircleDollarSign,
      tone: "neutral",
    },
    {
      label: "En attente",
      value: pendingPayments.length.toString(),
      detail: "À surveiller",
      icon: Clock3,
      tone: "pending",
    },
    {
      label: "Échecs",
      value: failedPayments.length.toString(),
      detail: "Paiements échoués",
      icon: XCircle,
      tone: "failed",
    },
  ];

  return (
    <DashboardShell>
      <div className="mx-auto max-w-[1500px]">
        <section className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-[#9a7523]"
              >
                <ArrowLeft size={14} />
                Vue d’ensemble
              </Link>
            </div>

            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full border border-[#dbc47d] bg-[#fff8e7] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a7523]">
                Sandbox
              </span>

              <span className="text-xs text-slate-400">
                Données réelles · Ubiza
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-[-0.035em] text-[#0a0e17] sm:text-3xl">
              Paiements
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Consultez les paiements enregistrés par la plateforme, leur
              provider, leur statut et leurs références techniques.
            </p>
          </div>

          <div className="rounded-xl border border-[#e3dfd5] bg-white px-4 py-3 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Marchand
            </div>

            <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Building2 size={15} className="text-[#a67c20]" />
              Ubiza
            </div>
          </div>
        </section>

        {!apiOnline && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
            <div className="text-sm font-semibold text-rose-700">
              Payment API indisponible
            </div>

            <p className="mt-1 text-xs leading-5 text-rose-600">
              Impossible de charger les paiements. Vérifiez que le backend est
              démarré et que la configuration locale est correcte.
            </p>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.label}
                className="rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eee8d9] bg-[#fffaf0] text-[#9a7523]">
                    <Icon size={18} />
                  </div>

                  {card.tone === "pending" && (
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                      Pending
                    </span>
                  )}

                  {card.tone === "failed" && (
                    <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700">
                      Failed
                    </span>
                  )}

                  {card.tone === "neutral" && (
                    <CheckCircle2 size={17} className="text-[#c8a24a]" />
                  )}
                </div>

                <div className="mt-5">
                  <div className="text-sm font-medium text-slate-500">
                    {card.label}
                  </div>

                  <div className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
                    {card.value}
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    {card.detail}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#e7e2d8] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)]">
          <div className="flex flex-col gap-4 border-b border-[#eeeae2] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[#0a0e17]">
                Historique des paiements
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {meta.total} paiement
                {meta.total !== 1 ? "s" : ""} enregistré
                {meta.total !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="rounded-xl border border-[#e5e0d6] bg-[#faf9f6] px-3 py-2 text-xs font-medium text-slate-500">
              Page {meta.page} / {Math.max(meta.totalPages, 1)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px]">
              <thead>
                <tr className="border-b border-[#eeeae2] bg-[#faf9f6]">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Référence
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Méthode
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

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Provider ref.
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Créé le
                  </th>
                </tr>
              </thead>

              <tbody>
                {payments.length > 0 ? (
                  payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-[#f0ede6] last:border-0 transition hover:bg-[#fdfbf6]"
                    >
                      <td className="px-5 py-4">
                        <div className="max-w-[240px] truncate font-mono text-xs font-medium text-slate-700">
                          {payment.reference}
                        </div>

                        <div className="mt-1 max-w-[240px] truncate font-mono text-[10px] text-slate-400">
                          {payment.id}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f7f6f2] text-slate-500">
                            <Smartphone size={14} />
                          </div>

                          <span className="text-sm text-slate-600">
                            {formatMethod(payment.method)}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-600">
                        {formatProvider(payment.provider)}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-[#111827]">
                        {formatAmount(payment.amount, payment.currency)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={payment.status} />
                      </td>

                      <td className="px-5 py-4">
                        {payment.providerReference ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500">
                            <Hash size={12} className="text-slate-300" />

                            {payment.providerReference}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-xs text-slate-400">
                        {formatDate(payment.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center text-sm text-slate-400"
                    >
                      Aucun paiement disponible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#eeeae2] px-5 py-4">
            <div className="text-xs text-slate-400">
              {meta.total > 0
                ? `${(meta.page - 1) * meta.limit + 1}–${Math.min(
                    meta.page * meta.limit,
                    meta.total,
                  )} sur ${meta.total}`
                : "0 paiement"}
            </div>

            <div className="flex items-center gap-2">
              {meta.hasPreviousPage ? (
                <Link
                  href={`/payments?page=${meta.page - 1}`}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-[#e5e0d6] bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-[#c8a24a]/50 hover:bg-[#fffdf8]"
                >
                  <ArrowLeft size={14} />
                  Précédent
                </Link>
              ) : (
                <span className="flex h-9 cursor-not-allowed items-center gap-1.5 rounded-xl border border-[#ece9e2] bg-[#faf9f6] px-3 text-xs font-medium text-slate-300">
                  <ArrowLeft size={14} />
                  Précédent
                </span>
              )}

              {meta.hasNextPage ? (
                <Link
                  href={`/payments?page=${meta.page + 1}`}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-[#0a0e17] px-3 text-xs font-medium text-white transition hover:bg-[#151b28]"
                >
                  Suivant
                  <ArrowRight size={14} className="text-[#e6c76d]" />
                </Link>
              ) : (
                <span className="flex h-9 cursor-not-allowed items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-medium text-slate-300">
                  Suivant
                  <ArrowRight size={14} />
                </span>
              )}
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
