import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CircleCheckBig,
  KeyRound,
  Network,
  ShieldCheck,
  Star,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";

export const dynamic = "force-dynamic";

type ProviderAccount = {
  id: string;
  merchantId: string;
  provider: string;
  status: string;
  isDefault: boolean;
  priority: number;
  externalAccountId: string | null;
  configuration: unknown;
  credentialsConfigured: boolean;
  createdAt: string;
  updatedAt: string;
};

const API_URL = process.env.PAYMENT_API_URL;
const ADMIN_API_KEY = process.env.PLATFORM_ADMIN_API_KEY;

const UBIZA_MERCHANT_ID = "cmtys717e00006wl7smmt4z6q";

async function fetchProviderAccounts(): Promise<ProviderAccount[]> {
  if (!API_URL) {
    throw new Error("PAYMENT_API_URL is missing.");
  }

  if (!ADMIN_API_KEY) {
    throw new Error("PLATFORM_ADMIN_API_KEY is missing.");
  }

  const response = await fetch(
    `${API_URL}/merchant-provider-accounts/merchant/${UBIZA_MERCHANT_ID}`,
    {
      method: "GET",
      headers: {
        "x-admin-key": ADMIN_API_KEY,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Provider Accounts API returned HTTP ${response.status}.`);
  }

  return response.json();
}

function formatProvider(provider: string) {
  if (provider === "FAPSHI") {
    return "Fapshi";
  }

  if (provider === "MTN_MOMO") {
    return "MTN MoMo";
  }

  if (provider === "ORANGE_MONEY") {
    return "Orange Money";
  }

  if (provider === "STELLAR") {
    return "Stellar";
  }

  return provider
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
  };

  const dots: Record<string, string> = {
    ACTIVE: "bg-emerald-500",
    INACTIVE: "bg-slate-400",
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

export default async function ProvidersPage() {
  let providerAccounts: ProviderAccount[] = [];
  let apiOnline = true;

  try {
    providerAccounts = await fetchProviderAccounts();
  } catch (error) {
    apiOnline = false;

    console.error("Unable to load provider accounts:", error);
  }

  const activeAccounts = providerAccounts.filter(
    (account) => account.status === "ACTIVE",
  );

  const defaultAccounts = providerAccounts.filter(
    (account) => account.isDefault,
  );

  const configuredCredentials = providerAccounts.filter(
    (account) => account.credentialsConfigured,
  );

  const summaryCards = [
    {
      label: "Providers",
      value: providerAccounts.length.toString(),
      detail: "Configurés pour Ubiza",
      icon: Network,
    },
    {
      label: "Actifs",
      value: activeAccounts.length.toString(),
      detail: "Comptes actifs",
      icon: CircleCheckBig,
    },
    {
      label: "Credentials",
      value: configuredCredentials.length.toString(),
      detail: "Configurés et chiffrés",
      icon: KeyRound,
    },
    {
      label: "Provider par défaut",
      value: defaultAccounts.length.toString(),
      detail: "Routing prioritaire",
      icon: Star,
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

              <span className="text-xs text-slate-400">
                Infrastructure de paiement
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-[-0.035em] text-[#0a0e17] sm:text-3xl">
              Providers
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Supervisez les comptes providers reliés aux marchands, leur
              statut, leur priorité et la configuration sécurisée de leurs
              credentials.
            </p>
          </div>

          <div className="rounded-xl border border-[#e3dfd5] bg-white px-4 py-3 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Marchand sélectionné
            </div>

            <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Building2 size={15} className="text-[#a67c20]" />
              Ubiza
            </div>
          </div>
        </section>

        {!apiOnline && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
            <div className="text-sm font-semibold text-rose-700">
              Provider API indisponible
            </div>

            <p className="mt-1 text-xs leading-5 text-rose-600">
              Impossible de charger les comptes providers. Vérifiez que le
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
          <div className="flex flex-col gap-3 border-b border-[#eeeae2] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[#0a0e17]">
                Comptes providers
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {providerAccounts.length} provider
                {providerAccounts.length !== 1 ? "s" : ""} configuré
                {providerAccounts.length !== 1 ? "s" : ""} pour Ubiza
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[#e7e2d8] bg-[#faf9f6] px-3 py-2">
              <ShieldCheck size={14} className="text-[#a67c20]" />

              <span className="text-xs font-medium text-slate-600">
                Credentials chiffrés
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px]">
              <thead>
                <tr className="border-b border-[#eeeae2] bg-[#faf9f6]">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Provider
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Statut
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Routing
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Credentials
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Compte externe
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Configuration
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Mis à jour
                  </th>
                </tr>
              </thead>

              <tbody>
                {providerAccounts.length > 0 ? (
                  providerAccounts.map((account) => (
                    <tr
                      key={account.id}
                      className="border-b border-[#f0ede6] last:border-0 transition hover:bg-[#fdfbf6]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a0e17] text-[#e6c76d]">
                            <Network size={17} />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-800">
                                {formatProvider(account.provider)}
                              </span>

                              {account.isDefault && (
                                <span className="rounded-full border border-[#dbc47d] bg-[#fff8e7] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#9a7523]">
                                  Défaut
                                </span>
                              )}
                            </div>

                            <div className="mt-1 max-w-[230px] truncate font-mono text-[10px] text-slate-400">
                              {account.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={account.status} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-slate-700">
                          Priorité {account.priority}
                        </div>

                        <div className="mt-1 text-[10px] text-slate-400">
                          {account.isDefault
                            ? "Provider par défaut"
                            : "Provider secondaire"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {account.credentialsConfigured ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                            <KeyRound size={11} />
                            Configurés
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                            À configurer
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {account.externalAccountId ? (
                          <span className="font-mono text-xs text-slate-600">
                            {account.externalAccountId}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {account.configuration !== null ? (
                          <span className="text-xs font-medium text-slate-600">
                            Configurée
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">Aucune</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-xs text-slate-400">
                        {formatDate(account.updatedAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center text-sm text-slate-400"
                    >
                      Aucun provider configuré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff6dc] text-[#9a7523]">
                <ShieldCheck size={18} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-[#0a0e17]">
                  Sécurité des credentials
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Les credentials providers sont stockés chiffrés côté backend.
                  Cette interface indique uniquement s’ils sont configurés et ne
                  reçoit jamais leur valeur en clair.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-[#c8a24a]/10 bg-[#0a0e17] p-5 text-white shadow-[0_16px_40px_rgba(10,14,23,0.14)]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c8a24a]/10 text-[#e6c76d]">
                <Star size={18} />
              </div>

              <div>
                <div className="text-xs font-medium text-[#bca66f]">
                  Routing actuel
                </div>

                <h2 className="mt-1 text-sm font-semibold">
                  Provider par défaut
                </h2>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {defaultAccounts[0]
                    ? `${formatProvider(
                        defaultAccounts[0].provider,
                      )} est actuellement utilisé comme provider par défaut pour Ubiza.`
                    : "Aucun provider par défaut n’est actuellement configuré pour Ubiza."}
                </p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </DashboardShell>
  );
}

