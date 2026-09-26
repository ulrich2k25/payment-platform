import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CircleCheckBig,
  CircleX,
  Clock3,
  CreditCard,
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

type Transaction = {
  id: string;
  paymentId: string;
  provider: string;
  providerReference?: string | null;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

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
  transactions: Transaction[];
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
        label: "Complété",
        description: "Le paiement a été traité avec succès par le provider.",
      };

    case "FAILED":
      return {
        badge: "border-red-200 bg-red-50 text-red-700",
        panel: "border-red-200 bg-red-50/60",
        icon: CircleX,
        label: "Échec",
        description: "Le traitement du paiement n'a pas pu être finalisé.",
      };

    case "REQUIRES_RECONCILIATION":
      return {
        badge: "border-orange-200 bg-orange-50 text-orange-700",
        panel: "border-orange-200 bg-orange-50/60",
        icon: TriangleAlert,
        label: "Réconciliation requise",
        description:
          "L'état local doit être rapproché avec l'état confirmé par le provider.",
      };

    case "PROCESSING":
      return {
        badge: "border-blue-200 bg-blue-50 text-blue-700",
        panel: "border-blue-200 bg-blue-50/60",
        icon: RefreshCw,
        label: "En traitement",
        description: "Le paiement est actuellement en cours de traitement.",
      };

    default:
      return {
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        panel: "border-amber-200 bg-amber-50/60",
        icon: Clock3,
        label: status === "PENDING" ? "En attente" : status,
        description:
          "Le paiement est en attente d'une mise à jour de son état.",
      };
  }
}

async function getPayment(paymentId: string): Promise<Payment> {
  const cookieStore = await cookies();

  const token = cookieStore.get(MERCHANT_SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/login");
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/merchant/payments/${encodeURIComponent(paymentId)}`,
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
    throw new Error("Impossible de charger le paiement.");
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

export default async function PaymentDetailPage({ params }: PageProps) {
  await requireMerchant();

  const { id } = await params;

  const payment = await getPayment(id);

  const status = statusClasses(payment.status);
  const StatusIcon = status.icon;

  return (
    <div className="space-y-7">
      <div>
        <Link
          href="/dashboard/payments"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-[#0a0e17]"
        >
          <ArrowLeft size={14} />
          Retour aux paiements
        </Link>

        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a7523]">
              Paiement
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
              {payment.reference}
            </h1>

            <code className="mt-2 block break-all text-xs text-slate-400">
              {payment.id}
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
              État du paiement
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
            {formatAmount(payment.amount, payment.currency)}
          </p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f6f2] text-[#9a7523]">
            <ServerCog size={17} />
          </div>

          <p className="mt-4 text-xs text-slate-400">Provider</p>

          <p className="mt-1 text-lg font-semibold text-[#0a0e17]">
            {payment.provider}
          </p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f6f2] text-[#9a7523]">
            <CreditCard size={17} />
          </div>

          <p className="mt-4 text-xs text-slate-400">Méthode</p>

          <p className="mt-1 text-lg font-semibold text-[#0a0e17]">
            {payment.method}
          </p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f6f2] text-[#9a7523]">
            <Workflow size={17} />
          </div>

          <p className="mt-4 text-xs text-slate-400">Transactions</p>

          <p className="mt-1 text-lg font-semibold text-[#0a0e17]">
            {payment.transactions.length}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.35fr]">
        <article className="overflow-hidden rounded-[24px] border border-[#e3dfd5] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3 border-b border-[#ece8df] px-6 py-5">
            <Hash size={17} className="text-[#9a7523]" />

            <div>
              <h2 className="font-semibold text-[#0a0e17]">
                Informations du paiement
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Références et données principales
              </p>
            </div>
          </div>

          <div className="px-6">
            <DetailRow label="Référence merchant" value={payment.reference} />

            <DetailRow label="ID du paiement" value={payment.id} mono />

            <DetailRow
              label="Référence provider"
              value={payment.providerReference ?? "—"}
              mono
            />

            <DetailRow label="Provider" value={payment.provider} />

            <DetailRow label="Méthode" value={payment.method} />

            <DetailRow label="Devise" value={payment.currency} />
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
                État actuel et chronologie
              </p>
            </div>
          </div>

          <div className="px-6">
            <DetailRow label="Statut" value={status.label} />

            <DetailRow label="Créé le" value={formatDate(payment.createdAt)} />

            <DetailRow
              label="Dernière mise à jour"
              value={formatDate(payment.updatedAt)}
            />

            <DetailRow
              label="Réconciliation"
              value={
                payment.status === "REQUIRES_RECONCILIATION"
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
            <h2 className="font-semibold text-[#0a0e17]">
              Transactions associées
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Historique technique de ce paiement
            </p>
          </div>

          <Workflow size={18} className="text-[#9a7523]" />
        </div>

        {payment.transactions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7f6f2] text-slate-400">
              <Workflow size={20} />
            </div>

            <p className="mt-4 font-medium text-[#0a0e17]">
              Aucune transaction
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Aucune opération technique n&apos;est encore associée à ce
              paiement.{" "}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead>
                <tr className="border-b border-[#ece8df] bg-[#faf9f6] text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-6 py-3">Transaction</th>

                  <th className="px-4 py-3">Montant</th>

                  <th className="px-4 py-3">Provider</th>

                  <th className="px-4 py-3">Référence provider</th>

                  <th className="px-4 py-3">Statut</th>

                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#ece8df]">
                {payment.transactions.map((transaction) => {
                  const transactionStatus = statusClasses(transaction.status);

                  const TransactionStatusIcon = transactionStatus.icon;

                  return (
                    <tr
                      key={transaction.id}
                      className="transition hover:bg-[#faf9f6]"
                    >
                      <td className="px-6 py-4">
                        <code className="block max-w-[190px] break-all text-xs text-slate-600">
                          {transaction.id}
                        </code>
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold text-[#0a0e17]">
                        {formatAmount(transaction.amount, transaction.currency)}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {transaction.provider}
                      </td>

                      <td className="px-4 py-4">
                        <code className="block max-w-[220px] break-all text-xs text-slate-500">
                          {transaction.providerReference ?? "—"}
                        </code>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${transactionStatus.badge}`}
                        >
                          <TransactionStatusIcon size={12} />

                          {transactionStatus.label}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatDate(transaction.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
