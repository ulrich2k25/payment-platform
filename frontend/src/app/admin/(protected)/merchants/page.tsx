import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Mail,
  ShieldCheck,
  Webhook,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";

type MerchantApiRecord = {
  id: string;
  name: string;
  email: string;
  webhookUrl: string | null;
  webhookSecret: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type Merchant = {
  id: string;
  name: string;
  email: string;
  webhookUrl: string | null;
  webhookSecretConfigured: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const API_URL = process.env.PAYMENT_API_URL;
const ADMIN_API_KEY = process.env.PLATFORM_ADMIN_API_KEY;

async function fetchMerchants(): Promise<Merchant[]> {
  if (!API_URL) {
    throw new Error("PAYMENT_API_URL is missing.");
  }

  if (!ADMIN_API_KEY) {
    throw new Error("PLATFORM_ADMIN_API_KEY is missing.");
  }

  const response = await fetch(`${API_URL}/merchants`, {
    method: "GET",
    headers: {
      "x-admin-key": ADMIN_API_KEY,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Merchant API returned HTTP ${response.status}.`);
  }

  const merchants = (await response.json()) as MerchantApiRecord[];

  return merchants.map((merchant) => ({
    id: merchant.id,
    name: merchant.name,
    email: merchant.email,
    webhookUrl: merchant.webhookUrl,
    webhookSecretConfigured: Boolean(merchant.webhookSecret),
    status: merchant.status,
    createdAt: merchant.createdAt,
    updatedAt: merchant.updatedAt,
  }));
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
    INACTIVE: "border-slate-200 bg-slate-50 text-slate-600",
    SUSPENDED: "border-rose-200 bg-rose-50 text-rose-700",
  };

  const dots: Record<string, string> = {
    ACTIVE: "bg-emerald-500",
    INACTIVE: "bg-slate-400",
    SUSPENDED: "bg-rose-500",
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

export default async function MerchantsPage() {
  let merchants: Merchant[] = [];
  let apiOnline = true;

  try {
    merchants = await fetchMerchants();
  } catch (error) {
    apiOnline = false;

    console.error("Unable to load merchants:", error);
  }

  const activeMerchants = merchants.filter(
    (merchant) => merchant.status === "ACTIVE",
  );

  const merchantsWithWebhook = merchants.filter((merchant) =>
    Boolean(merchant.webhookUrl),
  );

  const merchantsWithWebhookSecret = merchants.filter(
    (merchant) => merchant.webhookSecretConfigured,
  );

  const ubizaMerchant = merchants.find(
    (merchant) => merchant.name.toLowerCase() === "ubiza",
  );

  const summaryCards = [
    {
      label: "Marchands",
      value: merchants.length.toString(),
      detail: "Enregistrés",
      icon: Building2,
    },
    {
      label: "Actifs",
      value: activeMerchants.length.toString(),
      detail: "Comptes actifs",
      icon: CheckCircle2,
    },
    {
      label: "Webhooks",
      value: merchantsWithWebhook.length.toString(),
      detail: "URLs configurées",
      icon: Webhook,
    },
    {
      label: "Secrets webhook",
      value: merchantsWithWebhookSecret.length.toString(),
      detail: "Secrets configurés",
      icon: ShieldCheck,
    },
  ];

  return (
    <DashboardShell>
      <div className="mx-auto max-w-[1500px]">
        <section className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
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

              <span className="text-xs text-slate-400">Données réelles</span>
            </div>

            <h1 className="text-2xl font-semibold tracking-[-0.035em] text-[#0a0e17] sm:text-3xl">
              Marchands
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Supervisez les marchands enregistrés sur la plateforme, leur
              statut et leur configuration webhook.
            </p>
          </div>

          {ubizaMerchant && (
            <div className="rounded-xl border border-[#e3dfd5] bg-white px-4 py-3 shadow-sm">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Premier marchand réel
              </div>

              <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Building2 size={15} className="text-[#a67c20]" />
                {ubizaMerchant.name}
              </div>
            </div>
          )}
        </section>

        {!apiOnline && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
            <div className="text-sm font-semibold text-rose-700">
              Merchant API indisponible
            </div>

            <p className="mt-1 text-xs leading-5 text-rose-600">
              Impossible de charger les marchands. Vérifiez que le backend est
              démarré et que la configuration Admin locale est correcte.
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

                  <CheckCircle2 size={17} className="text-[#c8a24a]" />
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
          <div className="border-b border-[#eeeae2] px-5 py-5">
            <h2 className="text-base font-semibold tracking-tight text-[#0a0e17]">
              Marchands enregistrés
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {merchants.length} marchand
              {merchants.length !== 1 ? "s" : ""} présent
              {merchants.length !== 1 ? "s" : ""} sur la plateforme
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px]">
              <thead>
                <tr className="border-b border-[#eeeae2] bg-[#faf9f6]">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Marchand
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Statut
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Webhook
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Sécurité webhook
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Créé le
                  </th>
                </tr>
              </thead>

              <tbody>
                {merchants.length > 0 ? (
                  merchants.map((merchant) => (
                    <tr
                      key={merchant.id}
                      className="border-b border-[#f0ede6] last:border-0 transition hover:bg-[#fdfbf6]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff6dc] text-[#a67c20]">
                            <Building2 size={16} />
                          </div>

                          <div>
                            <div className="text-sm font-semibold text-slate-800">
                              {merchant.name}
                            </div>

                            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                              <Mail size={11} />
                              {merchant.email}
                            </div>

                            <div className="mt-1 max-w-[280px] truncate font-mono text-[10px] text-slate-300">
                              {merchant.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={merchant.status} />
                      </td>

                      <td className="px-5 py-4">
                        {merchant.webhookUrl ? (
                          <div className="max-w-[340px]">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                              <Webhook size={13} className="text-[#a67c20]" />
                              Configuré
                            </div>

                            <div className="mt-1 truncate font-mono text-[10px] text-slate-400">
                              {merchant.webhookUrl}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">
                            Non configuré
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {merchant.webhookSecretConfigured ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                            <ShieldCheck size={11} />
                            Secret configuré
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                            Aucun secret
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-xs text-slate-400">
                        {formatDate(merchant.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-16 text-center text-sm text-slate-400"
                    >
                      Aucun marchand disponible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

