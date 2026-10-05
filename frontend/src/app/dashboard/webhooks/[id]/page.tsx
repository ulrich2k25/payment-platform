import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Code2,
  Hash,
  RefreshCw,
  Send,
  ServerCog,
  WalletCards,
  Webhook,
  XCircle,
} from "lucide-react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { requireMerchant } from "@/lib/merchant-auth";

export const dynamic = "force-dynamic";

const API_URL = process.env.PAYMENT_API_URL ?? "http://localhost:3004";
const MERCHANT_SESSION_COOKIE = "payment_platform_merchant_session";

type Payment = {
  id: string;
  amount: number;
  currency: string;
  method: string;
  provider: string;
  reference: string;
  providerReference?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type WebhookDelivery = {
  id: string;
  paymentId: string;
  event: string;
  webhookUrl: string;
  payload: unknown;
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

  payment: Payment;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatAmount(amount: number, currency: string) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} ${currency}`;
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
        label: "Livré",
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        panel: "border-emerald-200 bg-emerald-50/60",
        icon: CheckCircle2,
        description: "Le webhook a été transmis avec succès à votre endpoint.",
      };

    case "FAILED":
      return {
        label: "Échec",
        badge: "border-red-200 bg-red-50 text-red-700",
        panel: "border-red-200 bg-red-50/60",
        icon: XCircle,
        description:
          "La dernière tentative de livraison a échoué. Une nouvelle tentative peut être programmée automatiquement.",
      };

    case "EXHAUSTED":
      return {
        label: "Tentatives épuisées",
        badge: "border-orange-200 bg-orange-50 text-orange-700",
        panel: "border-orange-200 bg-orange-50/60",
        icon: CircleAlert,
        description:
          "Le nombre maximal de tentatives automatiques a été atteint.",
      };

    case "PROCESSING":
      return {
        label: "En traitement",
        badge: "border-blue-200 bg-blue-50 text-blue-700",
        panel: "border-blue-200 bg-blue-50/60",
        icon: RefreshCw,
        description:
          "La livraison de ce webhook est actuellement en cours de traitement.",
      };

    default:
      return {
        label: status === "PENDING" ? "En attente" : status,
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        panel: "border-amber-200 bg-amber-50/60",
        icon: Clock3,
        description: "Le webhook attend sa prochaine tentative de livraison.",
      };
  }
}

async function getWebhookDelivery(
  deliveryId: string,
): Promise<WebhookDelivery> {
  const cookieStore = await cookies();
  const token = cookieStore.get(MERCHANT_SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/login");
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/merchant/webhooks/${encodeURIComponent(deliveryId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );
  } catch {
    throw new Error("Impossible de joindre le service de paiement.");
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error("Impossible de charger la livraison webhook.");
  }

  return response.json();
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-[#ece8df] py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <span className="text-xs font-medium text-slate-400">{label}</span>

      {mono ? (
        <code className="max-w-full break-all text-left text-xs text-slate-700 sm:max-w-[65%] sm:text-right">
          {value}
        </code>
      ) : (
        <span className="text-sm font-medium text-[#0a0e17] sm:text-right">
          {value}
        </span>
      )}
    </div>
  );
}

export default async function WebhookDetailPage({ params }: PageProps) {
  await requireMerchant();

  const { id } = await params;
  const delivery = await getWebhookDelivery(id);

  const appearance = statusStyle(delivery.status);
  const StatusIcon = appearance.icon;

  const payloadText = JSON.stringify(delivery.payload, null, 2) ?? "null";

  return (
    <div className="space-y-7">
      <div>
        <Link
          href="/dashboard/webhooks"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-[#0a0e17]"
        >
          <ArrowLeft size={14} />
          Retour aux webhooks
        </Link>

        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a7523]">
              Livraison webhook
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
              {delivery.event}
            </h1>

            <code className="mt-2 block break-all text-xs text-slate-400">
              {delivery.id}
            </code>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${appearance.badge}`}
          >
            <StatusIcon size={14} />
            {appearance.label}
          </span>
        </div>
      </div>

      <section className={`rounded-[22px] border p-5 ${appearance.panel}`}>
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${appearance.badge}`}
          >
            <StatusIcon size={17} />
          </div>

          <div>
            <p className="text-sm font-semibold text-[#0a0e17]">
              État de la livraison
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              {appearance.description}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f6f2] text-[#9a7523]">
            <Send size={17} />
          </div>

          <p className="mt-4 text-xs text-slate-400">Événement</p>

          <p className="mt-1 truncate text-lg font-semibold text-[#0a0e17]">
            {delivery.event}
          </p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f6f2] text-[#9a7523]">
            <RefreshCw size={17} />
          </div>

          <p className="mt-4 text-xs text-slate-400">Tentatives</p>

          <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#0a0e17]">
            {delivery.attemptCount} / 5
          </p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f6f2] text-[#9a7523]">
            <ServerCog size={17} />
          </div>

          <p className="mt-4 text-xs text-slate-400">Réponse HTTP</p>

          <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#0a0e17]">
            {delivery.responseCode ?? "—"}
          </p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f6f2] text-[#9a7523]">
            <Webhook size={17} />
          </div>

          <p className="mt-4 text-xs text-slate-400">Replays</p>

          <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#0a0e17]">
            {delivery.replayCount}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="overflow-hidden rounded-[24px] border border-[#e3dfd5] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3 border-b border-[#ece8df] px-6 py-5">
            <Webhook size={17} className="text-[#9a7523]" />

            <div>
              <h2 className="font-semibold text-[#0a0e17]">
                Informations de livraison
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Endpoint et résultat de la requête
              </p>
            </div>
          </div>

          <div className="px-6">
            <DetailRow label="ID webhook" value={delivery.id} mono />

            <DetailRow label="Endpoint" value={delivery.webhookUrl} mono />

            <DetailRow label="Statut" value={appearance.label} />

            <DetailRow
              label="Code HTTP"
              value={
                delivery.responseCode !== null
                  ? String(delivery.responseCode)
                  : "—"
              }
            />

            <DetailRow
              label="Tentatives"
              value={`${delivery.attemptCount} / 5`}
            />

            <DetailRow label="Replays" value={String(delivery.replayCount)} />
          </div>
        </article>

        <article className="overflow-hidden rounded-[24px] border border-[#e3dfd5] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3 border-b border-[#ece8df] px-6 py-5">
            <CalendarDays size={17} className="text-[#9a7523]" />

            <div>
              <h2 className="font-semibold text-[#0a0e17]">Chronologie</h2>

              <p className="mt-1 text-xs text-slate-500">
                Cycle complet de la livraison
              </p>
            </div>
          </div>

          <div className="px-6">
            <DetailRow label="Créé le" value={formatDate(delivery.createdAt)} />

            <DetailRow
              label="Dernière tentative"
              value={formatDate(delivery.lastAttemptAt)}
            />

            <DetailRow
              label="Prochaine tentative"
              value={formatDate(delivery.nextAttemptAt)}
            />

            <DetailRow
              label="Début du traitement"
              value={formatDate(delivery.processingStartedAt)}
            />

            <DetailRow
              label="Dernier replay"
              value={formatDate(delivery.lastReplayedAt)}
            />

            <DetailRow
              label="Livré le"
              value={formatDate(delivery.deliveredAt)}
            />

            <DetailRow
              label="Dernière mise à jour"
              value={formatDate(delivery.updatedAt)}
            />
          </div>
        </article>
      </section>

      {delivery.lastError ? (
        <section className="overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3 border-b border-red-100 bg-red-50/60 px-6 py-5">
            <CircleAlert size={17} className="text-red-600" />

            <div>
              <h2 className="font-semibold text-[#0a0e17]">Dernière erreur</h2>

              <p className="mt-1 text-xs text-slate-500">
                Diagnostic retourné lors de la dernière tentative
              </p>
            </div>
          </div>

          <div className="px-6 py-5">
            <pre className="whitespace-pre-wrap break-words rounded-2xl bg-[#faf9f6] p-4 text-xs leading-6 text-red-700">
              {delivery.lastError}
            </pre>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[24px] border border-[#e3dfd5] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between border-b border-[#ece8df] px-6 py-5">
          <div className="flex items-center gap-3">
            <Code2 size={17} className="text-[#9a7523]" />

            <div>
              <h2 className="font-semibold text-[#0a0e17]">Payload</h2>

              <p className="mt-1 text-xs text-slate-500">
                Corps JSON envoyé à votre endpoint
              </p>
            </div>
          </div>

          <Hash size={17} className="text-slate-300" />
        </div>

        <div className="p-6">
          <pre className="max-h-[480px] overflow-auto rounded-2xl bg-[#0a0e17] p-5 text-xs leading-6 text-slate-200">
            {payloadText}
          </pre>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-[#e3dfd5] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between border-b border-[#ece8df] px-6 py-5">
          <div>
            <h2 className="font-semibold text-[#0a0e17]">Paiement associé</h2>

            <p className="mt-1 text-xs text-slate-500">
              Paiement à l&apos;origine de cet événement
            </p>
          </div>

          <WalletCards size={18} className="text-[#9a7523]" />
        </div>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-lg font-semibold text-[#0a0e17]">
              {delivery.payment.reference}
            </p>

            <code className="mt-2 block break-all text-xs text-slate-400">
              {delivery.payment.id}
            </code>

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
              <span>
                {formatAmount(
                  delivery.payment.amount,
                  delivery.payment.currency,
                )}
              </span>

              <span>•</span>
              <span>{delivery.payment.provider}</span>

              <span>•</span>
              <span>{delivery.payment.method}</span>

              <span>•</span>
              <span>{delivery.payment.status}</span>
            </div>
          </div>

          <Link
            href={`/dashboard/payments/${delivery.payment.id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#ddd7cb] px-4 text-xs font-semibold text-slate-600 transition hover:border-[#c9b06d] hover:bg-[#f7f6f2] hover:text-[#9a7523]"
          >
            Voir le paiement
          </Link>
        </div>
      </section>
    </div>
  );
}
