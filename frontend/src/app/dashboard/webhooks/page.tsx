import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  RefreshCw,
  Send,
  Webhook,
  XCircle,
} from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireMerchant } from "@/lib/merchant-auth";

import { WebhookConfigPanel } from "./webhook-config-panel";

export const dynamic = "force-dynamic";

const API_URL = process.env.PAYMENT_API_URL ?? "http://localhost:3004";
const MERCHANT_SESSION_COOKIE = "payment_platform_merchant_session";

type WebhookConfiguration = {
  webhookUrl: string | null;
  webhookSecretConfigured: boolean;
};

type WebhookDelivery = {
  id: string;
  paymentId: string;
  event: string;
  status: string;
  attemptCount: number;
  replayCount: number;
  nextAttemptAt: string | null;
  lastAttemptAt: string | null;
  lastReplayedAt: string | null;
  deliveredAt: string | null;
  responseCode: number | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  payment: {
    id: string;
    amount: number;
    currency: string;
    reference: string;
    provider: string;
    status: string;
  };
};

type WebhookDeliveriesResponse = {
  data: WebhookDelivery[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type PageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

async function getSessionToken() {
  const cookieStore = await cookies();

  const token = cookieStore.get(MERCHANT_SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/login");
  }

  return token;
}

async function getWebhookConfiguration(
  token: string,
): Promise<WebhookConfiguration> {
  const response = await fetch(`${API_URL}/merchant/webhooks/config`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    throw new Error("Impossible de charger la configuration webhook.");
  }

  return response.json();
}

async function getWebhookDeliveries(
  token: string,
  page: number,
): Promise<WebhookDeliveriesResponse> {
  const response = await fetch(
    `${API_URL}/merchant/webhooks?page=${page}&limit=20`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    throw new Error("Impossible de charger les livraisons webhook.");
  }

  return response.json();
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusStyle(status: string) {
  switch (status) {
    case "DELIVERED":
      return {
        label: "DELIVERED",
        classes: "border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: CheckCircle2,
      };

    case "FAILED":
      return {
        label: "FAILED",
        classes: "border-red-200 bg-red-50 text-red-700",
        icon: XCircle,
      };

    case "EXHAUSTED":
      return {
        label: "EXHAUSTED",
        classes: "border-orange-200 bg-orange-50 text-orange-700",
        icon: CircleAlert,
      };

    case "PROCESSING":
      return {
        label: "PROCESSING",
        classes: "border-blue-200 bg-blue-50 text-blue-700",
        icon: RefreshCw,
      };

    default:
      return {
        label: "PENDING",
        classes: "border-amber-200 bg-amber-50 text-amber-700",
        icon: Clock3,
      };
  }
}

export default async function WebhooksPage({ searchParams }: PageProps) {
  const session = await requireMerchant();

  const canManage =
    session.user.role === "OWNER" || session.user.role === "ADMIN";

  const params = await searchParams;

  const requestedPage = Number(params.page ?? "1");

  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const token = await getSessionToken();

  const [configuration, deliveries] = await Promise.all([
    getWebhookConfiguration(token),
    getWebhookDeliveries(token, page),
  ]);

  const deliveredCount = deliveries.data.filter(
    (delivery) => delivery.status === "DELIVERED",
  ).length;

  const failedCount = deliveries.data.filter(
    (delivery) =>
      delivery.status === "FAILED" || delivery.status === "EXHAUSTED",
  ).length;

  const pendingCount = deliveries.data.filter(
    (delivery) =>
      delivery.status === "PENDING" || delivery.status === "PROCESSING",
  ).length;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <section>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full border border-[#dbc47d] bg-[#fff8e7] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a7523]">
            Développeurs
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-[#0a0e17] sm:text-3xl">
          Webhooks
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Configurez votre endpoint et suivez les événements envoyés
          automatiquement à votre infrastructure.
        </p>
      </section>

      <WebhookConfigPanel
        webhookUrl={configuration.webhookUrl}
        webhookSecretConfigured={configuration.webhookSecretConfigured}
        canManage={canManage}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="group rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c8a24a]/45 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-medium text-slate-500">Total</p>

          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
            {deliveries.pagination.total}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Livraisons webhook enregistrées
          </p>
        </article>

        <article className="group rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c8a24a]/45 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Livrés sur cette page
            </p>

            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={15} />
            </div>
          </div>

          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
            {deliveredCount}
          </p>
        </article>

        <article className="group rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c8a24a]/45 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              En attente sur cette page
            </p>

            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Clock3 size={15} />
            </div>
          </div>

          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
            {pendingCount}
          </p>
        </article>

        <article className="group rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c8a24a]/45 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Échecs sur cette page
            </p>

            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <XCircle size={15} />
            </div>
          </div>

          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
            {failedCount}
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e7e2d8] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)]">
        <div className="flex items-center justify-between border-b border-[#eeeae2] px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[#0a0e17]">
              Livraisons webhook
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Historique des événements envoyés à votre endpoint
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#eee8da] bg-[#fffaf0] text-[#9a7523]">
            <Send size={17} />
          </div>
        </div>

        {deliveries.data.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#eee8da] bg-[#fffaf0] text-[#9a7523]">
              <Webhook size={20} />
            </div>

            <p className="mt-4 text-sm font-semibold text-[#0a0e17]">
              Aucune livraison webhook
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Lorsqu&apos;un paiement générera un événement, sa livraison
              apparaîtra ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px]">
              <thead>
                <tr className="border-b border-[#eeeae2] bg-[#faf9f6] text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-6 py-3">Événement</th>
                  <th className="px-4 py-3">Paiement</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Tentatives</th>
                  <th className="px-4 py-3">HTTP</th>
                  <th className="px-4 py-3">Dernière erreur</th>
                  <th className="px-4 py-3">Créé</th>
                  <th className="px-6 py-3 text-right">Détail</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede6]">
                {deliveries.data.map((delivery) => {
                  const appearance = statusStyle(delivery.status);
                  const StatusIcon = appearance.icon;

                  return (
                    <tr
                      key={delivery.id}
                      className="group transition duration-200 hover:bg-[#fdfbf6]"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/webhooks/${delivery.id}`}
                          className="block"
                        >
                          <div className="font-medium text-[#0a0e17] transition group-hover:text-[#9a7523]">
                            {delivery.event}
                          </div>

                          <code className="mt-1 block max-w-[190px] truncate text-[10px] text-slate-400">
                            {delivery.id}
                          </code>
                        </Link>
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-[#0a0e17]">
                          {delivery.payment.reference}
                        </div>

                        <div className="mt-1 text-[11px] text-slate-400">
                          {delivery.payment.provider}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${appearance.classes}`}
                        >
                          <StatusIcon size={12} />
                          {appearance.label}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {delivery.attemptCount} / 5
                      </td>

                      <td className="px-4 py-4">
                        {delivery.responseCode ? (
                          <code className="rounded-lg border border-[#eeeae2] bg-[#faf9f6] px-2 py-1 text-xs text-slate-600">
                            {delivery.responseCode}
                          </code>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="max-w-[280px] px-4 py-4">
                        {delivery.lastError ? (
                          <p
                            title={delivery.lastError}
                            className="truncate text-xs text-red-600"
                          >
                            {delivery.lastError}
                          </p>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-xs text-slate-500">
                        {formatDate(delivery.createdAt)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/webhooks/${delivery.id}`}
                          aria-label={`Voir la livraison webhook ${delivery.id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5e0d6] bg-white text-slate-400 transition hover:border-[#c8a24a]/50 hover:bg-[#fffaf0] hover:text-[#9a7523]"
                        >
                          <ArrowUpRight size={15} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {deliveries.pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-[#eeeae2] px-5 py-4 sm:px-6">
            <p className="text-xs text-slate-400">
              Page {deliveries.pagination.page} sur{" "}
              {deliveries.pagination.totalPages}
            </p>

            <div className="flex gap-2">
              {deliveries.pagination.page > 1 ? (
                <Link
                  href={`/dashboard/webhooks?page=${
                    deliveries.pagination.page - 1
                  }`}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#e5e0d6] bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-[#c8a24a]/40 hover:bg-[#fffdf8] hover:text-[#9a7523]"
                >
                  <ArrowLeft size={14} />
                  Précédent
                </Link>
              ) : null}

              {deliveries.pagination.page < deliveries.pagination.totalPages ? (
                <Link
                  href={`/dashboard/webhooks?page=${
                    deliveries.pagination.page + 1
                  }`}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#e5e0d6] bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-[#c8a24a]/40 hover:bg-[#fffdf8] hover:text-[#9a7523]"
                >
                  Suivant
                  <ArrowRight size={14} />
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
