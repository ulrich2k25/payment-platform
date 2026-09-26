import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  RotateCcw,
  Webhook,
  XCircle,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";

type Merchant = {
  id: string;
  name: string;
  email: string;
  status: string;
};

type Payment = {
  id: string;
  amount: number;
  currency: string;
  reference: string;
  provider: string;
  status: string;
};

type WebhookDelivery = {
  id: string;
  event: string;
  webhookUrl: string;
  status: string;
  attemptCount: number;
  replayCount: number;
  nextAttemptAt: string | null;
  processingStartedAt: string | null;
  lastAttemptAt: string | null;
  lastReplayedAt: string | null;
  deliveredAt: string | null;
  responseCode: number | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  merchant: Merchant;
  payment: Payment;
};

type WebhooksResponse = {
  data: WebhookDelivery[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type WebhooksPageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

const API_URL = process.env.PAYMENT_API_URL;
const ADMIN_API_KEY = process.env.PLATFORM_ADMIN_API_KEY;

async function fetchWebhooks(
  page: number,
  limit: number,
): Promise<WebhooksResponse> {
  if (!API_URL) {
    throw new Error("PAYMENT_API_URL is missing.");
  }

  if (!ADMIN_API_KEY) {
    throw new Error("PLATFORM_ADMIN_API_KEY is missing.");
  }

  const response = await fetch(
    `${API_URL}/admin/webhooks?page=${page}&limit=${limit}`,
    {
      method: "GET",
      headers: {
        "x-admin-key": ADMIN_API_KEY,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Webhook API returned HTTP ${response.status}.`);
  }

  return response.json();
}

async function fetchAllWebhooks(): Promise<WebhookDelivery[]> {
  const firstPage = await fetchWebhooks(1, 100);

  if (firstPage.pagination.totalPages <= 1) {
    return firstPage.data;
  }

  const remainingPages = await Promise.all(
    Array.from(
      {
        length: firstPage.pagination.totalPages - 1,
      },
      (_, index) => index + 2,
    ).map((page) => fetchWebhooks(page, 100)),
  );

  return [...firstPage.data, ...remainingPages.flatMap((page) => page.data)];
}

function formatDate(dateString: string | null) {
  if (!dateString) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatAmount(amount: number, currency: string) {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(amount)} ${currency}`;
}

function formatProvider(provider: string) {
  if (provider === "FAPSHI") {
    return "Fapshi";
  }

  if (provider === "SANDBOX") {
    return "Sandbox";
  }

  return provider
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    PROCESSING: "border-amber-200 bg-amber-50 text-amber-700",
    FAILED: "border-rose-200 bg-rose-50 text-rose-700",
    EXHAUSTED: "border-rose-200 bg-rose-50 text-rose-700",
  };

  const dots: Record<string, string> = {
    DELIVERED: "bg-emerald-500",
    PENDING: "bg-amber-500",
    PROCESSING: "bg-amber-500",
    FAILED: "bg-rose-500",
    EXHAUSTED: "bg-rose-500",
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

export default async function WebhooksPage({
  searchParams,
}: WebhooksPageProps) {
  const params = await searchParams;

  const requestedPage = Number.parseInt(params.page ?? "1", 10);

  const currentPage =
    Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;

  const limit = 10;

  let pageData: WebhooksResponse | null = null;
  let allWebhooks: WebhookDelivery[] = [];
  let apiOnline = true;

  try {
    [pageData, allWebhooks] = await Promise.all([
      fetchWebhooks(currentPage, limit),
      fetchAllWebhooks(),
    ]);
  } catch (error) {
    apiOnline = false;

    console.error("Unable to load webhooks:", error);
  }

  const deliveredWebhooks = allWebhooks.filter(
    (webhook) => webhook.status === "DELIVERED",
  );

  const pendingWebhooks = allWebhooks.filter((webhook) =>
    ["PENDING", "PROCESSING", "FAILED"].includes(webhook.status),
  );

  const exhaustedWebhooks = allWebhooks.filter(
    (webhook) => webhook.status === "EXHAUSTED",
  );

  const replayedWebhooks = allWebhooks.filter(
    (webhook) => webhook.replayCount > 0,
  );

  const webhooks = pageData?.data ?? [];

  const pagination = pageData?.pagination ?? {
    page: currentPage,
    limit,
    total: 0,
    totalPages: 1,
  };

  const hasPreviousPage = pagination.page > 1;

  const hasNextPage = pagination.page < pagination.totalPages;

  const summaryCards = [
    {
      label: "Webhooks",
      value: pagination.total.toString(),
      detail: "Deliveries enregistrées",
      icon: Webhook,
      tone: "neutral",
    },
    {
      label: "Livrés",
      value: deliveredWebhooks.length.toString(),
      detail: "Livraisons réussies",
      icon: CheckCircle2,
      tone: "success",
    },
    {
      label: "En cours",
      value: pendingWebhooks.length.toString(),
      detail: "Pending / retry",
      icon: Clock3,
      tone: "pending",
    },
    {
      label: "Épuisés",
      value: exhaustedWebhooks.length.toString(),
      detail: "Replay possible",
      icon: XCircle,
      tone: "failed",
    },
  ];

  return (
    <DashboardShell>
      <div className="mx-auto max-w-[1500px]">
        <section className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3">
              <Link
                href="/admin"
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
                Delivery infrastructure
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-[-0.035em] text-[#0a0e17] sm:text-3xl">
              Webhooks
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Supervisez les événements envoyés aux marchands, les tentatives de
              livraison et les erreurs de communication.
            </p>
          </div>

          <div className="rounded-xl border border-[#e3dfd5] bg-white px-4 py-3 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Replays manuels
            </div>

            <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <RotateCcw size={15} className="text-[#a67c20]" />
              {replayedWebhooks.length} effectué
              {replayedWebhooks.length !== 1 ? "s" : ""}
            </div>
          </div>
        </section>

        {!apiOnline && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
            <div className="text-sm font-semibold text-rose-700">
              Webhook API indisponible
            </div>

            <p className="mt-1 text-xs leading-5 text-rose-600">
              Impossible de charger les deliveries webhook. Vérifiez que le
              backend est démarré et que la configuration Admin locale est
              correcte.
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
                      Healthy
                    </span>
                  )}

                  {card.tone === "pending" && (
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                      Pending
                    </span>
                  )}

                  {card.tone === "failed" && (
                    <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700">
                      Attention
                    </span>
                  )}

                  {card.tone === "neutral" && (
                    <Webhook size={17} className="text-[#c8a24a]" />
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

        {exhaustedWebhooks.length > 0 && (
          <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle size={17} />
              </div>

              <div>
                <div className="text-sm font-semibold text-amber-900">
                  Deliveries nécessitant une intervention
                </div>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  {exhaustedWebhooks.length} webhook
                  {exhaustedWebhooks.length !== 1 ? "s" : ""} ont atteint le
                  nombre maximal de tentatives. Les deliveries EXHAUSTED
                  pourront être rejouées manuellement après correction de leur
                  destination.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#e7e2d8] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)]">
          <div className="flex flex-col gap-4 border-b border-[#eeeae2] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[#0a0e17]">
                Historique des deliveries
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {pagination.total} webhook
                {pagination.total !== 1 ? "s" : ""} enregistré
                {pagination.total !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="rounded-xl border border-[#e5e0d6] bg-[#faf9f6] px-3 py-2 text-xs font-medium text-slate-500">
              Page {pagination.page} / {Math.max(pagination.totalPages, 1)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1420px]">
              <thead>
                <tr className="border-b border-[#eeeae2] bg-[#faf9f6]">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Événement
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Marchand
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Paiement
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Statut
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Tentatives
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Réponse
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Dernière erreur
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Créé le
                  </th>
                </tr>
              </thead>

              <tbody>
                {webhooks.length > 0 ? (
                  webhooks.map((webhook) => (
                    <tr
                      key={webhook.id}
                      className="border-b border-[#f0ede6] last:border-0 transition hover:bg-[#fdfbf6]"
                    >
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-slate-800">
                          {webhook.event}
                        </div>

                        <div className="mt-1 max-w-[260px] truncate font-mono text-[10px] text-slate-400">
                          {webhook.id}
                        </div>

                        <div
                          className="mt-1 flex max-w-[260px] items-center gap-1 truncate text-[10px] text-slate-400"
                          title={webhook.webhookUrl}
                        >
                          <ExternalLink size={10} />
                          {webhook.webhookUrl}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-slate-700">
                          {webhook.merchant.name}
                        </div>

                        <div className="mt-1 text-[10px] text-slate-400">
                          {webhook.merchant.email}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-[270px] truncate font-mono text-xs font-medium text-slate-700">
                          {webhook.payment.reference}
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                          <span>
                            {formatProvider(webhook.payment.provider)}
                          </span>

                          <span>·</span>

                          <span>
                            {formatAmount(
                              webhook.payment.amount,
                              webhook.payment.currency,
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={webhook.status} />

                        {webhook.replayCount > 0 && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-[#9a7523]">
                            <RotateCcw size={10} />
                            Replay {webhook.replayCount}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-slate-700">
                          {webhook.attemptCount} / 5
                        </div>

                        <div className="mt-1 text-[10px] text-slate-400">
                          {webhook.lastAttemptAt
                            ? formatDate(webhook.lastAttemptAt)
                            : "Aucune tentative"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {webhook.responseCode ? (
                          <span
                            className={`inline-flex rounded-lg px-2 py-1 font-mono text-xs font-semibold ${
                              webhook.responseCode >= 200 &&
                              webhook.responseCode < 300
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            HTTP {webhook.responseCode}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {webhook.lastError ? (
                          <div
                            className="max-w-[310px] truncate text-xs text-rose-600"
                            title={webhook.lastError}
                          >
                            {webhook.lastError}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">Aucune</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-xs text-slate-400">
                        {formatDate(webhook.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center text-sm text-slate-400"
                    >
                      Aucun webhook disponible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#eeeae2] px-5 py-4">
            <div className="text-xs text-slate-400">
              {pagination.total > 0
                ? `${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )} sur ${pagination.total}`
                : "0 webhook"}
            </div>

            <div className="flex items-center gap-2">
              {hasPreviousPage ? (
                <Link
                  href={`/webhooks?page=${pagination.page - 1}`}
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

              {hasNextPage ? (
                <Link
                  href={`/webhooks?page=${pagination.page + 1}`}
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

