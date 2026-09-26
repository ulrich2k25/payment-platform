import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-[#e8e3da] bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.5fr_1fr_1fr] lg:px-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0a0e17] text-[#e6c76d]">
              <ShieldCheck size={18} />
            </div>

            <span className="text-sm font-semibold text-[#0a0e17]">
              Payment Platform
            </span>
          </div>

          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
            Une infrastructure de paiement conçue pour connecter marchands,
            providers et moyens de paiement depuis une API unique.
          </p>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Produit
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <Link
              href="/services"
              className="block text-slate-500 hover:text-[#0a0e17]"
            >
              Services
            </Link>

            <Link
              href="/pricing"
              className="block text-slate-500 hover:text-[#0a0e17]"
            >
              Tarifs
            </Link>

            <Link
              href="/docs"
              className="block text-slate-500 hover:text-[#0a0e17]"
            >
              Documentation
            </Link>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Plateforme
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <Link
              href="/security"
              className="block text-slate-500 hover:text-[#0a0e17]"
            >
              Sécurité
            </Link>

            <Link
              href="/login"
              className="block text-slate-500 hover:text-[#0a0e17]"
            >
              Connexion
            </Link>

            <Link
              href="/signup"
              className="block text-slate-500 hover:text-[#0a0e17]"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-[#eeeae2]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 text-[11px] text-slate-400 lg:px-10">
          <span>© 2026 Payment Platform</span>

          <span>Infrastructure financière sécurisée</span>
        </div>
      </div>
    </footer>
  );
}
