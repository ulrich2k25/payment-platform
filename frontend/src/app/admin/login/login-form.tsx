"use client";

import { useActionState } from "react";
import {
  AlertCircle,
  ArrowRight,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { loginAdmin, type LoginState } from "./actions";

const initialState: LoginState = {
  error: null,
};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAdmin,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
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
            autoComplete="email"
            required
            disabled={isPending}
            placeholder="admin@company.com"
            className="h-12 w-full rounded-xl border border-[#ded9ce] bg-white pl-11 pr-4 text-sm text-[#0a0e17] outline-none transition placeholder:text-slate-300 focus:border-[#c8a24a] focus:ring-4 focus:ring-[#c8a24a]/10 disabled:opacity-60"
          />
        </div>
      </div>

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
            autoComplete="current-password"
            required
            minLength={12}
            disabled={isPending}
            placeholder="••••••••••••"
            className="h-12 w-full rounded-xl border border-[#ded9ce] bg-white pl-11 pr-4 text-sm text-[#0a0e17] outline-none transition placeholder:text-slate-300 focus:border-[#c8a24a] focus:ring-4 focus:ring-[#c8a24a]/10 disabled:opacity-60"
          />
        </div>
      </div>

      {state.error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />

          <p className="text-xs leading-5 text-rose-700">{state.error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0a0e17] px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(10,14,23,0.16)] transition hover:bg-[#161c29] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <LoaderCircle size={17} className="animate-spin" />
            Connexion…
          </>
        ) : (
          <>
            Se connecter
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  );
}
