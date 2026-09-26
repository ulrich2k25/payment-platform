import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CircleCheckBig,
  CircleX,
  Clock3,
  RefreshCw,
  TriangleAlert,
  Workflow,
} from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireMerchant } from "@/lib/merchant-auth";

export const dynamic = "force-dynamic";

const API_URL = process.env.PAYMENT_API_URL ?? "http://localhost:3004";

const MERCHANT_SESSION_COOKIE = "payment_platform_merchant_session";

type Transaction = {
  id: string;
  paymentId: string;
  provider: string;
  providerAccountId?: string | null;
  providerReference?: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  payment: {
    id: string;
    reference: string;
    merchantId: string;
    status: string;
  };
};

type TransactionsResponse = {
  data: Transaction[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

type PageProps = {
  searchParams: Promise<{
    page?: string;
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

function shorten(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  if (value.length <= 22) {
    return value;
  }

  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

function statusClasses(status: string) {
  switch (status) {
    case "COMPLETED":
      return {
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: CircleCheckBig,
      };

    case "FAILED":
      return {
        badge: "border-red-200 bg-red-50 text-red-700",
        icon: CircleX,
      };

    case "REQUIRES_RECONCILIATION":
      return {
        badge: "border-orange-200 bg-orange-50 text-orange-700",
        icon: TriangleAlert,
      };

    case "PROCESSING":
      return {
        badge: "border-blue-200 bg-blue-50 text-blue-700",
        icon: RefreshCw,
      };

    default:
      return {
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        icon: Clock3,
      };
  }
}

async function getTransactions(page: number): Promise<TransactionsResponse> {
  const cookieStore = await cookies();

  const token = cookieStore.get(MERCHANT_SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/login");
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/merchant/transactions?page=${page}&limit=20`,
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

  if (!response.ok) {
    throw new Error("Impossible de charger les transactions.");
  }

  return response.json();
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  await requireMerchant();

  const params = await searchParams;

  const requestedPage = Number(params.page ?? "1");

  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const result = await getTransactions(page);

  const completedCount = result.data.filter(
    (transaction) => transaction.status === "COMPLETED",
  ).length;

  const pendingCount = result.data.filter(
    (transaction) =>
      transaction.status === "PENDING" || transaction.status === "PROCESSING",
  ).length;

  const failedCount = result.data.filter(
    (transaction) => transaction.status === "FAILED",
  ).length;

  return (
    <div className="space-y-7">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a7523]">
          Infrastructure
        </div>

        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
          Transactions
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Consultez les opérations techniques associées aux paiements de votre
          compte marchand.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <p className="text-xs text-slate-400">Total</p>

          <p className="mt-2 text-2xl font-semibold text-[#0a0e17]">
            {result.meta.total}
          </p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <p className="text-xs text-slate-400">Complétées sur cette page</p>

          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {completedCount}
          </p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <p className="text-xs text-slate-400">En attente sur cette page</p>

          <p className="mt-2 text-2xl font-semibold text-amber-700">
            {pendingCount}
          </p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <p className="text-xs text-slate-400">Échecs sur cette page</p>

          <p className="mt-2 text-2xl font-semibold text-red-700">
            {failedCount}
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-[#e3dfd5] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between border-b border-[#ece8df] px-6 py-5">
          <div>
            <h2 className="font-semibold text-[#0a0e17]">
              Historique des transactions
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {result.meta.total} transaction
              {result.meta.total > 1 ? "s" : ""}
            </p>
          </div>

          <Workflow size={18} className="text-[#9a7523]" />
        </div>

        {result.data.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7f6f2] text-slate-400">
              <Workflow size={20} />
            </div>

            <p className="mt-4 font-medium text-[#0a0e17]">
              Aucune transaction
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Les transactions associées à vos paiements apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="border-b border-[#ece8df] bg-[#faf9f6] text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-6 py-3">Paiement</th>

                  <th className="px-4 py-3">Montant</th>

                  <th className="px-4 py-3">Provider</th>

                  <th className="px-4 py-3">Référence provider</th>

                  <th className="px-4 py-3">Statut</th>

                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#ece8df]">
                {result.data.map((transaction) => {
                  const status = statusClasses(transaction.status);

                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={transaction.id}
                      className="transition hover:bg-[#faf9f6]"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#0a0e17]">
                          {transaction.payment.reference}
                        </div>

                        <code className="mt-1 block text-[10px] text-slate-400">
                          {shorten(transaction.paymentId)}
                        </code>
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold text-[#0a0e17]">
                        {formatAmount(transaction.amount, transaction.currency)}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {transaction.provider}
                      </td>

                      <td className="px-4 py-4">
                        <code className="text-xs text-slate-500">
                          {shorten(transaction.providerReference)}
                        </code>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.badge}`}
                        >
                          <StatusIcon size={12} />

                          {transaction.status}
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

        {result.meta.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-[#ece8df] px-6 py-4">
            <p className="text-xs text-slate-400">
              Page {result.meta.page} sur {result.meta.totalPages}
            </p>

            <div className="flex gap-2">
              {result.meta.hasPreviousPage ? (
                <Link
                  href={`/dashboard/transactions?page=${result.meta.page - 1}`}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#ddd7cb] px-3 text-xs font-semibold text-slate-600 transition hover:bg-[#f7f6f2]"
                >
                  <ArrowLeft size={14} />
                  Précédent
                </Link>
              ) : null}

              {result.meta.hasNextPage ? (
                <Link
                  href={`/dashboard/transactions?page=${result.meta.page + 1}`}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#ddd7cb] px-3 text-xs font-semibold text-slate-600 transition hover:bg-[#f7f6f2]"
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
