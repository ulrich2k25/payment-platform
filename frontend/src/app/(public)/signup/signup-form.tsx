"use client";

import { useActionState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { signupMerchant, type MerchantSignupState } from "./actions";

const initialState: MerchantSignupState = {
  error: null,
};

export function MerchantSignupForm() {
  const [state, formAction, isPending] = useActionState(
    signupMerchant,
    initialState,
  );

  return (
    <form action={formAction} className="mt-7 space-y-5">
      <div>
        <label
          htmlFor="companyName"
          className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500"
        >
          Entreprise
        </label>

        <div className="relative">
          <Building2
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            id="companyName"
            name="companyName"
            required
            minLength={2}
            maxLength={100}
            disabled={isPending}
            className="h-12 w-full rounded-xl border border-[#ded9ce] pl-11 pr-4 text-sm outline-none transition focus:border-[#c8a24a] focus:ring-4 focus:ring-[#c8a24a]/10"
            placeholder="Nom de votre entreprise"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500"
        >
          Adresse e-mail
        </label>

        <div className="relative">
          <Mail
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={isPending}
            className="h-12 w-full rounded-xl border border-[#ded9ce] pl-11 pr-4 text-sm outline-none transition focus:border-[#c8a24a] focus:ring-4 focus:ring-[#c8a24a]/10"
            placeholder="vous@entreprise.com"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500"
          >
            Mot de passe
          </label>

          <div className="relative">
            <LockKeyhole
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              disabled={isPending}
              className="h-12 w-full rounded-xl border border-[#ded9ce] pl-11 pr-4 text-sm outline-none transition focus:border-[#c8a24a] focus:ring-4 focus:ring-[#c8a24a]/10"
              placeholder="12 caractères min."
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500"
          >
            Confirmation
          </label>

          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            disabled={isPending}
            className="h-12 w-full rounded-xl border border-[#ded9ce] px-4 text-sm outline-none transition focus:border-[#c8a24a] focus:ring-4 focus:ring-[#c8a24a]/10"
            placeholder="Confirmer"
          />
        </div>
      </div>

      {state.error && (
        <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />

          <p className="text-xs leading-5 text-rose-700">{state.error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0a0e17] text-sm font-semibold text-white transition hover:bg-[#171d2a] disabled:opacity-60"
      >
        {isPending ? (
          <>
            <LoaderCircle size={17} className="animate-spin" />
            Création du compte…
          </>
        ) : (
          <>
            Créer mon compte
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  );
}
