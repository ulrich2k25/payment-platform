"use client";

import { Building2, CheckCircle2, Loader2, Mail, Save } from "lucide-react";
import { useActionState } from "react";

import {
  updateMerchantProfile,
  type MerchantSettingsActionState,
} from "./actions";

type MerchantProfileFormProps = {
  initialName: string;
  initialEmail: string;
};

const initialState: MerchantSettingsActionState = {
  status: "idle",
};

export function MerchantProfileForm({
  initialName,
  initialEmail,
}: MerchantProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateMerchantProfile,
    initialState,
  );

  return (
    <form action={formAction}>
      <div className="space-y-5">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-[#0a0e17]">
            Nom de l&apos;entreprise
          </label>

          <div className="relative mt-2">
            <Building2
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={120}
              defaultValue={initialName}
              className="h-12 w-full rounded-xl border border-[#ded8cc] bg-white pl-11 pr-4 text-sm text-[#0a0e17] outline-none transition focus:border-[#c8a24a] focus:ring-4 focus:ring-[#c8a24a]/10"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium text-[#0a0e17]">
            E-mail de l&apos;entreprise
          </label>

          <div className="relative mt-2">
            <Mail
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={320}
              defaultValue={initialEmail}
              className="h-12 w-full rounded-xl border border-[#ded8cc] bg-white pl-11 pr-4 text-sm text-[#0a0e17] outline-none transition focus:border-[#c8a24a] focus:ring-4 focus:ring-[#c8a24a]/10"
            />
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            Cette adresse appartient à l&apos;entreprise. Elle ne modifie pas
            votre adresse utilisée pour vous connecter.
          </p>
        </div>

        {state.status !== "idle" && state.message ? (
          <div
            className={
              state.status === "success"
                ? "flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            }
          >
            {state.status === "success" ? (
              <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
            ) : null}

            <span>{state.message}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0a0e17] px-5 text-sm font-semibold text-white transition hover:bg-[#161c29] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}

          {isPending ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}
