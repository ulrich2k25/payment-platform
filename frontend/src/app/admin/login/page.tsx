import { LockKeyhole, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin-auth";

import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const admin = await getAdminSession();

  if (admin) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_560px]">
        <section className="hidden bg-[#0a0e17] p-12 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c8a24a]/30 bg-[#c8a24a]/10 text-[#e6c76d]">
                <ShieldCheck size={21} />
              </div>

              <div>
                <div className="text-base font-semibold tracking-tight text-white">
                  Payment Platform
                </div>

                <div className="text-xs text-slate-500">
                  Secure infrastructure
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-5 h-px w-16 bg-[#c8a24a]" />

            <h1 className="max-w-lg text-4xl font-semibold leading-[1.1] tracking-[-0.045em] text-white">
              Une infrastructure de paiement conçue pour rester sous contrôle.
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-400">
              Supervisez les paiements, providers, webhooks, marchands et
              mécanismes de réconciliation depuis un environnement
              administrateur sécurisé.
            </p>
          </div>

          <div className="text-xs text-slate-600">Platform Administration</div>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a0e17]">
                <ShieldCheck size={19} className="text-[#a67c20]" />
                Payment Platform
              </div>
            </div>

            <div className="rounded-[24px] border border-[#e3dfd5] bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.07)] sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff8e7] text-[#9a7523]">
                <LockKeyhole size={20} />
              </div>

              <div className="mt-6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a7523]">
                  Platform Admin
                </div>

                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[#0a0e17]">
                  Connexion sécurisée
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Utilisez votre compte administrateur pour accéder à la
                  plateforme.
                </p>
              </div>

              <LoginForm />
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck size={13} />
              Session sécurisée et révocable
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

