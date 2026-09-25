import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  RefreshCcw,
  ShieldCheck,
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
      {
        length: firstPage.meta.totalPages - 1,
      },
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    PROCESSING: "border-amber-200 bg-amber-50 text-amber-700",
    REQUIRES_RECONCILIATION: "border-rose-200 bg-rose-50 text-rose-700",
    COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    FAILED: "border-rose-200 bg-rose-50 text-rose-700",
  };

  const dots: Record<string, string> = {
    PENDING: "bg-amber-500",
    PROCESSING: "bg-amber-500",
    REQUIRES_RECONCILIATION: "bg-rose-500",
    COMPLETED: "bg-emerald-500",
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

export default async function ReconciliationPage() {
  let payments: Payment[] = [];
  let apiOnline = true;

  try {
    payments = await fetchAllPayments();
  } catch (error) {
    apiOnline = false;

    console.error("Unable to load reconciliation data:", error);
  }

  const requiresReconciliation = payments.filter(
    (payment) => payment.status === "REQUIRES_RECONCILIATION",
  );

  const fapshiPending = payments.filter(
    (payment) =>
      payment.provider === "FAPSHI" &&
      ["PENDING", "PROCESSING"].includes(payment.status),
  );

  const reconciliationCandidates = payments
    .filter(
      (payment) =>
        payment.status === "REQUIRES_RECONCILIATION" ||
        (payment.provider === "FAPSHI" &&
          ["PENDING", "PROCESSING"].includes(payment.status)),
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  const missingProviderReference = reconciliationCandidates.filter(
    (payment) => !payment.providerReference,
  );

  const summaryCards = [
    {
      label: "À réconcilier",
      value: reconciliationCandidates.length.toString(),
      detail: "Paiements éligibles",
      icon: RefreshCcw,
      tone: "pending",
    },
    {
      label: "Recovery",
      value: requiresReconciliation.length.toString(),
      detail: "Requires reconciliation",
      icon: AlertTriangle,
      tone: "failed",
    },
    {
      label: "Fapshi en attente",
      value: fapshiPending.length.toString(),
      detail: "Pending / processing",
      icon: Clock3,
      tone: "pending",
    },
    {
      label: "Cron automatique",
      value: "5 min",
      detail: "Intervalle backend",
      icon: ShieldCheck,
      tone: "success",
    },
  ];

  return (
    <DashboardShell>
      <div className="mx-auto max-w-[1500px]">
        <section className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3">
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
                Platform Admin
              </span>

              <span className="text-xs text-slate-400">
                Recovery infrastructure
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-[-0.035em] text-[#0a0e17] sm:text-3xl">
              Réconciliation
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Surveillez les paiements dont le statut doit être vérifié auprès
              du provider et le mécanisme automatique de récupération.
            </p>
          </div>

          <div className="rounded-xl border border-[#e3dfd5] bg-white px-4 py-3 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Automatisation
            </div>

            <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <RefreshCcw size={15} className="text-[#a67c20]" />
              Toutes les 5 minutes
            </div>
          </div>
        </section>

        {!apiOnline && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
            <div className="text-sm font-semibold text-rose-700">
              Payment API indisponible
            </div>

            <p className="mt-1 text-xs leading-5 text-rose-600">
              Impossible de charger les paiements candidats à la réconciliation.
              Vérifiez que le backend est démarré.
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

                  {card.tone === "success" && (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                      Actif
                    </span>
                  )}

                  {card.tone === "pending" && (
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                      Surveillance
                    </span>
                  )}

                  {card.tone === "failed" && (
                    <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700">
                      Recovery
                    </span>
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

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.65fr)]">
          <div className="overflow-hidden rounded-2xl border border-[#e7e2d8] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)]">
            <div className="border-b border-[#eeeae2] px-5 py-5">
              <h2 className="text-base font-semibold tracking-tight text-[#0a0e17]">
                Paiements candidats
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {reconciliationCandidates.length} paiement
                {reconciliationCandidates.length !== 1 ? "s" : ""} actuellement
                éligible
                {reconciliationCandidates.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-[#eeeae2] bg-[#faf9f6]">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Paiement
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

                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Raison
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Mis à jour
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reconciliationCandidates.length > 0 ? (
                    reconciliationCandidates.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-[#f0ede6] last:border-0 transition hover:bg-[#fdfbf6]"
                      >
                        <td className="px-5 py-4">
                          <div className="max-w-[260px] truncate font-mono text-xs font-medium text-slate-700">
                            {payment.reference}
                          </div>

                          <div className="mt-1 max-w-[220px] truncate font-mono text-[10px] text-slate-400">
                            {payment.id}
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
                            <span className="font-mono text-xs text-slate-600">
                              {payment.providerReference}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-rose-500">
                              Manquante
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-xs text-slate-500">
                            {payment.status === "REQUIRES_RECONCILIATION"
                              ? "Recovery requis"
                              : "Vérification Fapshi"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right text-xs text-slate-400">
                          {formatDate(payment.updatedAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <CheckCircle2 size={20} />
                          </div>

                          <div className="mt-3 text-sm font-semibold text-slate-700">
                            Aucun paiement à réconcilier
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            Aucun paiement n’est actuellement éligible au
                            processus.
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <article className="rounded-2xl border border-[#c8a24a]/10 bg-[#0a0e17] p-5 text-white shadow-[0_16px_40px_rgba(10,14,23,0.14)]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c8a24a]/10 text-[#e6c76d]">
                  <RefreshCcw size={18} />
                </div>

                <div>
                  <div className="text-xs font-medium text-[#bca66f]">
                    Automatic recovery
                  </div>

                  <h2 className="mt-1 text-sm font-semibold">
                    Réconciliation automatique
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Le backend vérifie automatiquement les paiements éligibles
                    auprès du provider toutes les cinq minutes.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff6dc] text-[#9a7523]">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-[#0a0e17]">
                    Filet de sécurité
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    La réconciliation complète les webhooks providers. Si un
                    callback est perdu ou retardé, la plateforme peut demander
                    directement au provider le statut réel du paiement.
                  </p>
                </div>
              </div>
            </article>

            {missingProviderReference.length > 0 && (
              <article className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0 text-rose-600"
                  />

                  <div>
                    <h2 className="text-sm font-semibold text-rose-800">
                      Référence provider manquante
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-rose-600">
                      {missingProviderReference.length} paiement
                      {missingProviderReference.length !== 1 ? "s" : ""} ne
                      peuvent pas être interrogés auprès du provider tant qu’une
                      référence provider n’est pas disponible.
                    </p>
                  </div>
                </div>
              </article>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
