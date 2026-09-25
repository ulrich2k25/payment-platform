import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  MoreHorizontal,
  RefreshCw,
  Search,
  WalletCards,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";

const stats = [
  {
    label: "Volume traité",
    value: "152 500 XAF",
    detail: "+12,8 %",
    trend: "up",
    icon: CircleDollarSign,
  },
  {
    label: "Paiements",
    value: "48",
    detail: "+8 aujourd’hui",
    trend: "up",
    icon: WalletCards,
  },
  {
    label: "Taux de succès",
    value: "96,7 %",
    detail: "+1,4 %",
    trend: "up",
    icon: CheckCircle2,
  },
  {
    label: "En attente",
    value: "3",
    detail: "À surveiller",
    trend: "neutral",
    icon: Clock3,
  },
];

const payments = [
  {
    reference: "UBIZA-PREMIUM-4821",
    merchant: "Ubiza",
    provider: "Fapshi",
    amount: "5 000 XAF",
    status: "COMPLETED",
    time: "Il y a 2 min",
  },
  {
    reference: "UBIZA-BOOST-4819",
    merchant: "Ubiza",
    provider: "Fapshi",
    amount: "1 000 XAF",
    status: "COMPLETED",
    time: "Il y a 8 min",
  },
  {
    reference: "UBIZA-PREMIUM-4817",
    merchant: "Ubiza",
    provider: "Fapshi",
    amount: "5 000 XAF",
    status: "PENDING",
    time: "Il y a 14 min",
  },
  {
    reference: "UBIZA-BOOST-4814",
    merchant: "Ubiza",
    provider: "Fapshi",
    amount: "1 000 XAF",
    status: "FAILED",
    time: "Il y a 27 min",
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    FAILED: "border-rose-200 bg-rose-50 text-rose-700",
  };

  const dotStyles: Record<string, string> = {
    COMPLETED: "bg-emerald-500",
    PENDING: "bg-amber-500",
    FAILED: "bg-rose-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${
        styles[status] ?? "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          dotStyles[status] ?? "bg-slate-400"
        }`}
      />

      {status}
    </span>
  );
}

export default function Home() {
  return (
    <DashboardShell>
      <div className="mx-auto max-w-[1500px]">
        <section className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full border border-[#dbc47d] bg-[#fff8e7] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a7523]">
                Sandbox
              </span>

              <span className="text-xs text-slate-400">
                Données de démonstration
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-[-0.035em] text-[#0a0e17] sm:text-3xl">
              Vue d’ensemble
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Supervisez les paiements, transactions et connexions providers
              depuis un seul espace.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-xl border border-[#ded9cd] bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-[#c8a24a]/50 hover:bg-[#fffdf8]"
            >
              <RefreshCw size={15} />
              Actualiser
            </button>

            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-xl bg-[#0a0e17] px-4 text-sm font-medium text-white shadow-[0_10px_24px_rgba(10,14,23,0.18)] transition hover:bg-[#151b28]"
            >
              Voir les paiements
              <ArrowRight size={15} className="text-[#e6c76d]" />
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="group rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c8a24a]/45 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eee8d9] bg-[#fffaf0] text-[#9a7523] transition group-hover:border-[#dbc47d] group-hover:bg-[#fff6dc]">
                    <Icon size={18} />
                  </div>

                  {stat.trend === "up" ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                      <ArrowUpRight size={12} />
                      {stat.detail}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                      {stat.detail}
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  <div className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </div>

                  <div className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
                    {stat.value}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.7fr)]">
          <div className="overflow-hidden rounded-2xl border border-[#e7e2d8] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)]">
            <div className="flex flex-col gap-4 border-b border-[#eeeae2] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-[#0a0e17]">
                  Paiements récents
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Dernières opérations enregistrées par la plateforme
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    placeholder="Rechercher"
                    className="h-9 w-44 rounded-xl border border-[#e5e0d6] bg-[#faf9f6] pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#c8a24a]/70 focus:bg-white focus:ring-4 focus:ring-[#c8a24a]/10"
                  />
                </div>

                <button
                  type="button"
                  className="h-9 rounded-xl border border-[#e5e0d6] bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-[#c8a24a]/40 hover:bg-[#fffdf8]"
                >
                  Tout voir
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-[#eeeae2] bg-[#faf9f6]">
                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Référence
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Marchand
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Provider
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Montant
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Statut
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Date
                    </th>

                    <th className="w-12" />
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.reference}
                      className="border-b border-[#f0ede6] last:border-0 hover:bg-[#fdfbf6]"
                    >
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs font-medium text-slate-700">
                          {payment.reference}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff6dc] text-[#a67c20]">
                            <Building2 size={14} />
                          </div>

                          <span className="text-sm font-medium text-slate-700">
                            {payment.merchant}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {payment.provider}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-[#111827]">
                        {payment.amount}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={payment.status} />
                      </td>

                      <td className="px-5 py-4 text-right text-xs text-slate-400">
                        {payment.time}
                      </td>

                      <td className="pr-4">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#fff6dc] hover:text-[#9a7523]"
                        >
                          <MoreHorizontal size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <article className="overflow-hidden rounded-2xl border border-[#c8a24a]/10 bg-[#0a0e17] p-6 text-white shadow-[0_16px_40px_rgba(10,14,23,0.18)]">
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-medium text-[#bca66f]">
                      Infrastructure
                    </div>

                    <h2 className="mt-1 text-lg font-semibold tracking-tight">
                      Système opérationnel
                    </h2>
                  </div>

                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Healthy
                  </span>
                </div>

                <div className="mt-7 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
                    <span className="text-xs text-slate-400">API Backend</span>

                    <span className="text-xs font-medium text-white">
                      Online
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
                    <span className="text-xs text-slate-400">
                      Fapshi Sandbox
                    </span>

                    <span className="text-xs font-medium text-white">
                      Connected
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Webhook</span>

                    <span className="text-xs font-medium text-[#e6c76d]">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[#0a0e17]">
                    Performance
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Activité des dernières 24 h
                  </p>
                </div>

                <span className="rounded-lg bg-[#fff8e7] px-2 py-1 text-[10px] font-medium text-[#9a7523]">
                  24H
                </span>
              </div>

              <div className="mt-6">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
                      96,7%
                    </div>

                    <div className="mt-1 text-xs text-slate-400">
                      Paiements réussis
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <ArrowUpRight size={14} />
                    1,4%
                  </div>
                </div>

                <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#f0ede6]">
                  <div className="h-full w-[96.7%] rounded-full bg-[#c8a24a]" />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#faf9f6] p-3">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      Succès
                    </div>

                    <div className="mt-1 text-sm font-semibold text-slate-800">
                      45
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#faf9f6] p-3">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                      Échecs
                    </div>

                    <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-800">
                      2
                      <ArrowDownRight size={13} className="text-rose-500" />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
