import { Ban, Clock3, KeyRound } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireMerchant } from "@/lib/merchant-auth";

import { revokeApiKey } from "./actions";
import { ApiKeyCreationPanel } from "./api-keys-panel";

export const dynamic = "force-dynamic";

const API_URL = process.env.PAYMENT_API_URL ?? "http://localhost:3004";

const MERCHANT_SESSION_COOKIE = "payment_platform_merchant_session";

type ApiKey = {
  id: string;
  merchantId: string;
  status: "ACTIVE" | "REVOKED";
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Jamais";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function shortenedId(id: string) {
  if (id.length <= 16) {
    return id;
  }

  return `${id.slice(0, 8)}…${id.slice(-6)}`;
}

async function getApiKeys(): Promise<ApiKey[]> {
  const cookieStore = await cookies();

  const token = cookieStore.get(MERCHANT_SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/login");
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}/merchant/api-keys`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    throw new Error("Impossible de joindre le service de paiement.");
  }

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    throw new Error("Impossible de charger les clés API.");
  }

  return response.json();
}

export default async function ApiKeysPage() {
  await requireMerchant();

  const apiKeys = await getApiKeys();

  const activeCount = apiKeys.filter(
    (apiKey) => apiKey.status === "ACTIVE",
  ).length;

  return (
    <div className="space-y-7">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a7523]">
          Développeurs
        </div>

        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
          Clés API
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Gérez les identifiants utilisés par votre backend pour communiquer
          avec l’API Payment Platform.
        </p>
      </div>

      <ApiKeyCreationPanel />

      <section className="overflow-hidden rounded-[24px] border border-[#e3dfd5] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 border-b border-[#ece8df] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-[#0a0e17]">Clés existantes</h2>

            <p className="mt-1 text-xs text-slate-500">
              {activeCount} clé
              {activeCount > 1 ? "s" : ""} active
              {activeCount > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <KeyRound size={14} />
            {apiKeys.length} au total
          </div>
        </div>

        {apiKeys.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7f6f2] text-slate-400">
              <KeyRound size={20} />
            </div>

            <p className="mt-4 font-medium text-[#0a0e17]">Aucune clé API</p>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Créez votre première clé pour connecter votre backend à Payment
              Platform.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#ece8df]">
            {apiKeys.map((apiKey) => {
              const active = apiKey.status === "ACTIVE";

              return (
                <div
                  key={apiKey.id}
                  className="grid gap-5 px-6 py-5 lg:grid-cols-[1.25fr_0.7fr_1fr_auto] lg:items-center"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f7f6f2] text-slate-500">
                        <KeyRound size={16} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0a0e17]">
                          Clé API
                        </p>

                        <code className="mt-1 block text-xs text-slate-400">
                          {shortenedId(apiKey.id)}
                        </code>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span
                      className={
                        active
                          ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
                          : "inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500"
                      }
                    >
                      {apiKey.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock3 size={14} />
                      Dernière utilisation
                    </div>

                    <p className="mt-1 font-medium text-slate-700">
                      {formatDate(apiKey.lastUsedAt)}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Créée le {formatDate(apiKey.createdAt)}
                    </p>
                  </div>

                  <div className="lg:text-right">
                    {active ? (
                      <form action={revokeApiKey}>
                        <input
                          type="hidden"
                          name="apiKeyId"
                          value={apiKey.id}
                        />

                        <button
                          type="submit"
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <Ban size={14} />
                          Révoquer
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-slate-400">Révoquée</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="rounded-2xl border border-[#e3dfd5] bg-[#f7f6f2] px-5 py-4">
        <p className="text-xs leading-6 text-slate-500">
          Ne placez jamais une clé secrète dans du code frontend ou dans un
          dépôt Git. Utilisez-la uniquement depuis votre backend ou un
          environnement serveur sécurisé.
        </p>
      </div>
    </div>
  );
}
