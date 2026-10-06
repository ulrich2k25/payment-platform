import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
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
    <div className="mx-auto max-w-[1500px] space-y-6">
      <section>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full border border-[#dbc47d] bg-[#fff8e7] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a7523]">
            Infrastructure
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-[#0a0e17] sm:text-3xl">
          Transactions
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Consultez les opérations techniques associées aux paiements de votre
          compte marchand.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="group rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c8a24a]/45 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-medium text-slate-500">Total</p>

          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
            {result.meta.total}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Toutes les transactions enregistrées
          </p>
        </article>

        <article className="group rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c8a24a]/45 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Complétées sur cette page
            </p>

            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CircleCheckBig size={15} />
            </div>
          </div>

          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
            {completedCount}
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
              <CircleX size={15} />
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
              Historique des transactions
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {result.meta.total} transaction
              {result.meta.total > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#eee8da] bg-[#fffaf0] text-[#9a7523]">
            <Workflow size={17} />
          </div>
        </div>

        {result.data.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#eee8da] bg-[#fffaf0] text-[#9a7523]">
              <Workflow size={20} />
            </div>

            <p className="mt-4 text-sm font-semibold text-[#0a0e17]">
              Aucune transaction
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Les transactions associées à vos paiements apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px]">
              <thead>
                <tr className="border-b border-[#eeeae2] bg-[#faf9f6] text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-6 py-3">Paiement</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Référence provider</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Détail</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede6]">
                {result.data.map((transaction) => {
                  const status = statusClasses(transaction.status);

                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={transaction.id}
                      className="group transition duration-200 hover:bg-[#fdfbf6]"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/transactions/${transaction.id}`}
                          className="block"
                        >
                          <div className="font-medium text-[#0a0e17] transition group-hover:text-[#9a7523]">
                            {transaction.payment.reference}
                          </div>

                          <code className="mt-1 block max-w-[190px] truncate text-[10px] text-slate-400">
                            {transaction.id}
                          </code>
                        </Link>
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

                      <td className="px-4 py-4 text-xs text-slate-500">
                        {formatDate(transaction.createdAt)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/transactions/${transaction.id}`}
                          aria-label={`Voir la transaction ${transaction.id}`}
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

        {result.meta.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-[#eeeae2] px-5 py-4 sm:px-6">
            <p className="text-xs text-slate-400">
              Page {result.meta.page} sur {result.meta.totalPages}
            </p>

            <div className="flex gap-2">
              {result.meta.hasPreviousPage ? (
                <Link
                  href={`/dashboard/transactions?page=${result.meta.page - 1}`}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#e5e0d6] bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-[#c8a24a]/40 hover:bg-[#fffdf8] hover:text-[#9a7523]"
                >
                  <ArrowLeft size={14} />
                  Précédent
                </Link>
              ) : null}

              {result.meta.hasNextPage ? (
                <Link
                  href={`/dashboard/transactions?page=${result.meta.page + 1}`}
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
