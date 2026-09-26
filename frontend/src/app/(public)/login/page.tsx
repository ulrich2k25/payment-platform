import Link from "next/link";
import { LogIn } from "lucide-react";
import { redirect } from "next/navigation";

import { getMerchantSession } from "@/lib/merchant-auth";

import { MerchantLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function MerchantLoginPage() {
  const session = await getMerchantSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-[72vh] items-center justify-center bg-[#f7f6f2] px-6 py-16">
      <div className="w-full max-w-md rounded-[24px] border border-[#e3dfd5] bg-white p-8 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff8e7] text-[#9a7523]">
          <LogIn size={20} />
        </div>

        <div className="mt-6 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9a7523]">
          Merchant Account
        </div>

        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#0a0e17]">
          Connexion
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Accédez à votre espace marchand et à vos outils de paiement.
        </p>

        <MerchantLoginForm />

        <p className="mt-6 text-center text-xs text-slate-400">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-semibold text-[#9a7523]">
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}
