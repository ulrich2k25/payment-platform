import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CircleCheckBig,
  CircleX,
  Clock3,
  RefreshCw,
  TriangleAlert,
  WalletCards,
} from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

async function getPayments(page: number): Promise<PaymentsResponse> {
  const cookieStore = await cookies();

  const token = cookieStore.get(MERCHANT_SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/login");
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/merchant/payments?page=${page}&limit=20`,
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
    throw new Error("Impossible de charger les paiements.");
  }

  return response.json();
}

export default async function PaymentsPage({ searchParams }: PageProps) {
  await requireMerchant();

  const params = await searchParams;

  const requestedPage = Number(params.page ?? "1");

  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const result = await getPayments(page);

  const completedCount = result.data.filter(
    (payment) => payment.status === "COMPLETED",
  ).length;

  const pendingCount = result.data.filter(
    (payment) =>
      payment.status === "PENDING" || payment.status === "PROCESSING",
  ).length;

  const failedCount = result.data.filter(
    (payment) => payment.status === "FAILED",
  ).length;

  return (
    <div className="space-y-7">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a7523]">
          Activité
        </div>

        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
          Paiements
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Consultez les paiements traités exclusivement pour votre compte
          marchand.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <p className="text-xs text-slate-400">Total</p>

          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0a0e17]">
            {result.meta.total}
          </p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <p className="text-xs text-slate-400">Complétés sur cette page</p>

          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-emerald-700">
            {completedCount}
          </p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <p className="text-xs text-slate-400">En attente sur cette page</p>

          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-amber-700">
            {pendingCount}
          </p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd5] bg-white p-5">
          <p className="text-xs text-slate-400">Échecs sur cette page</p>

          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-red-700">
            {failedCount}
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-[#e3dfd5] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between border-b border-[#ece8df] px-6 py-5">
          <div>
            <h2 className="font-semibold text-[#0a0e17]">Historique</h2>

            <p className="mt-1 text-xs text-slate-500">
              {result.meta.total} paiement
              {result.meta.total > 1 ? "s" : ""}
            </p>
          </div>

          <WalletCards size={18} className="text-[#9a7523]" />
        </div>

        {result.data.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7f6f2] text-slate-400">
              <WalletCards size={20} />
            </div>

            <p className="mt-4 font-medium text-[#0a0e17]">Aucun paiement</p>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Les paiements créés avec vos clés API apparaîtront automatiquement
              ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[#ece8df] bg-[#faf9f6] text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-6 py-3">Référence</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Méthode</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#ece8df]">
                {result.data.map((payment) => {
                  const status = statusClasses(payment.status);

                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={payment.id}
                      className="transition hover:bg-[#faf9f6]"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#0a0e17]">
                          {payment.reference}
                        </div>

                        <code className="mt-1 block max-w-[190px] truncate text-[10px] text-slate-400">
                          {payment.id}
                        </code>
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold text-[#0a0e17]">
                        {formatAmount(payment.amount, payment.currency)}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {payment.provider}
                      </td>

                      <td className="px-4 py-4 text-xs text-slate-500">
                        {payment.method}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.badge}`}
                        >
                          <StatusIcon size={12} />

                          {payment.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatDate(payment.createdAt)}
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
                  href={`/dashboard/payments?page=${result.meta.page - 1}`}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#ddd7cb] px-3 text-xs font-semibold text-slate-600 transition hover:bg-[#f7f6f2]"
                >
                  <ArrowLeft size={14} />
                  Précédent
                </Link>
              ) : null}

              {result.meta.hasNextPage ? (
                <Link
                  href={`/dashboard/payments?page=${result.meta.page + 1}`}
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
