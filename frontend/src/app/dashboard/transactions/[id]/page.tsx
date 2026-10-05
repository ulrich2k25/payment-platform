import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CircleCheckBig,
  CircleX,
  Clock3,
  Hash,
  RefreshCw,
  ServerCog,
  TriangleAlert,
  WalletCards,
  Workflow,
} from "lucide-react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { requireMerchant } from "@/lib/merchant-auth";

export const dynamic = "force-dynamic";

const API_URL = process.env.PAYMENT_API_URL ?? "http://localhost:3004";

const MERCHANT_SESSION_COOKIE = "payment_platform_merchant_session";

type Payment = {
  id: string;
  merchantId: string;
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

type Transaction = {
  id: string;
  paymentId: string;
  provider: string;
  providerAccountId?: string | null;
  providerReference?: string | null;
  status: string;
  amount: number;
  currency: string;
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClasses(status: string) {
  switch (status) {
    case "COMPLETED":
      return {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        panel: "border-emerald-200 bg-emerald-50/60",
        icon: CircleCheckBig,
        label: "Complétée",
        description:
          "La transaction a été traitée avec succès par le provider.",
      };

    case "FAILED":
      return {
        badge: "border-red-200 bg-red-50 text-red-700",
        panel: "border-red-200 bg-red-50/60",
        icon: CircleX,
        label: "Échec",
        description:
          "La transaction n'a pas pu être finalisée par le provider.",
      };

    case "REQUIRES_RECONCILIATION":
      return {
        badge: "border-orange-200 bg-orange-50 text-orange-700",
        panel: "border-orange-200 bg-orange-50/60",
        icon: TriangleAlert,
        label: "Réconciliation requise",
        description:
          "L'état de cette transaction doit être rapproché avec le provider.",
      };

    case "PROCESSING":
      return {
        badge: "border-blue-200 bg-blue-50 text-blue-700",
        panel: "border-blue-200 bg-blue-50/60",
        icon: RefreshCw,
        label: "En traitement",
        description: "La transaction est actuellement en cours de traitement.",
      };

    default:
      return {
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        panel: "border-amber-200 bg-amber-50/60",
        icon: Clock3,
        label: status === "PENDING" ? "En attente" : status,
        description:
          "La transaction est en attente d'une mise à jour de son état.",
      };
  }
}

async function getTransaction(transactionId: string): Promise<Transaction> {
  const cookieStore = await cookies();

  const token = cookieStore.get(MERCHANT_SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/login");
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/merchant/transactions/${encodeURIComponent(transactionId)}`,
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
    throw new Error("Impossible de charger la transaction.");
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

export default async function TransactionDetailPage({ params }: PageProps) {
  await requireMerchant();

  const { id } = await params;

  const transaction = await getTransaction(id);

  const status = statusClasses(transaction.status);
  const StatusIcon = status.icon;

  return (
    <div className="space-y-7">
      <div>
        <Link
          href="/dashboard/transactions"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-[#0a0e17]"
        >
          <ArrowLeft size={14} />
          Retour aux transactions
        </Link>

        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a7523]">
              Transaction
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
              {transaction.payment.reference}
            </h1>

            <code className="mt-2 block break-all text-xs text-slate-400">
              {transaction.id}
            </code>
          </div>

          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.badge}`}
          >
            <StatusIcon size={14} />
            {status.label}
          </span>
        </div>
      </div>

      <section className={`rounded-[22px] border p-5 ${status.panel}`}>
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${status.badge}`}
          >
            <StatusIcon size={17} />
          </div>

          <div>
            <p className="text-sm font-semibold text-[#0a0e17]">
              État de la transaction
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              {status.description}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f6f2] text-[#9a7523]">
            <WalletCards size={17} />
          </div>

          <p className="mt-4 text-xs text-slate-400">Montant</p>

          <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#0a0e17]">
            {formatAmount(transaction.amount, transaction.currency)}
          </p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f6f2] text-[#9a7523]">
            <ServerCog size={17} />
          </div>

          <p className="mt-4 text-xs text-slate-400">Provider</p>

          <p className="mt-1 text-lg font-semibold text-[#0a0e17]">
            {transaction.provider}
          </p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f6f2] text-[#9a7523]">
            <Workflow size={17} />
          </div>

          <p className="mt-4 text-xs text-slate-400">Paiement</p>

          <p className="mt-1 truncate text-lg font-semibold text-[#0a0e17]">
            {transaction.payment.reference}
          </p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f6f2] text-[#9a7523]">
            <Hash size={17} />
          </div>

          <p className="mt-4 text-xs text-slate-400">Devise</p>

          <p className="mt-1 text-lg font-semibold text-[#0a0e17]">
            {transaction.currency}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="overflow-hidden rounded-[24px] border border-[#e3dfd5] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3 border-b border-[#ece8df] px-6 py-5">
            <Workflow size={17} className="text-[#9a7523]" />

            <div>
              <h2 className="font-semibold text-[#0a0e17]">
                Informations techniques
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Références de traitement
              </p>
            </div>
          </div>

          <div className="px-6">
            <DetailRow label="ID transaction" value={transaction.id} mono />

            <DetailRow label="Provider" value={transaction.provider} />

            <DetailRow
              label="Référence provider"
              value={transaction.providerReference ?? "—"}
              mono
            />

            <DetailRow
              label="Provider account ID"
              value={transaction.providerAccountId ?? "—"}
              mono
            />

            <DetailRow label="Statut" value={status.label} />
          </div>
        </article>

        <article className="overflow-hidden rounded-[24px] border border-[#e3dfd5] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3 border-b border-[#ece8df] px-6 py-5">
            <CalendarDays size={17} className="text-[#9a7523]" />

            <div>
              <h2 className="font-semibold text-[#0a0e17]">
                Cycle de traitement
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Chronologie de la transaction
              </p>
            </div>
          </div>

          <div className="px-6">
            <DetailRow
              label="Créée le"
              value={formatDate(transaction.createdAt)}
            />

            <DetailRow
              label="Dernière mise à jour"
              value={formatDate(transaction.updatedAt)}
            />

            <DetailRow
              label="Montant"
              value={formatAmount(transaction.amount, transaction.currency)}
            />

            <DetailRow
              label="Réconciliation"
              value={
                transaction.status === "REQUIRES_RECONCILIATION"
                  ? "Requise"
                  : "Aucune action requise"
              }
            />
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-[#e3dfd5] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between border-b border-[#ece8df] px-6 py-5">
          <div>
            <h2 className="font-semibold text-[#0a0e17]">Paiement associé</h2>

            <p className="mt-1 text-xs text-slate-500">
              Paiement à l&apos;origine de cette transaction
            </p>
          </div>

          <WalletCards size={18} className="text-[#9a7523]" />
        </div>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-lg font-semibold text-[#0a0e17]">
              {transaction.payment.reference}
            </p>

            <code className="mt-2 block break-all text-xs text-slate-400">
              {transaction.payment.id}
            </code>

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
              <span>
                {formatAmount(
                  transaction.payment.amount,
                  transaction.payment.currency,
                )}
              </span>

              <span>•</span>

              <span>{transaction.payment.provider}</span>

              <span>•</span>

              <span>{transaction.payment.method}</span>

              <span>•</span>

              <span>{transaction.payment.status}</span>
            </div>
          </div>

          <Link
            href={`/dashboard/payments/${transaction.payment.id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#ddd7cb] px-4 text-xs font-semibold text-slate-600 transition hover:border-[#c9b06d] hover:bg-[#f7f6f2] hover:text-[#9a7523]"
          >
            Voir le paiement
          </Link>
        </div>
      </section>
    </div>
  );
}
