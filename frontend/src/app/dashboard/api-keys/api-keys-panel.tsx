"use client";

import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { createApiKey, type CreateApiKeyState } from "./actions";

const initialState: CreateApiKeyState = {};

function CreateButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#c8a24a] px-5 text-sm font-semibold text-[#0a0e17] transition hover:bg-[#d5b45f] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Création...
        </>
      ) : (
        <>
          <KeyRound size={16} />
          Créer une clé API
        </>
      )}
    </button>
  );
}

export function ApiKeyCreationPanel() {
  const [state, formAction] = useActionState(createApiKey, initialState);

  const [copied, setCopied] = useState(false);

  async function copyKey() {
    if (!state.createdKey) {
      return;
    }

    await navigator.clipboard.writeText(state.createdKey);

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <section className="rounded-[24px] border border-[#e3dfd5] bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.05)] sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff8e7] text-[#9a7523]">
            <KeyRound size={20} />
          </div>

          <h2 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-[#0a0e17]">
            Clés API
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Utilisez une clé API pour authentifier votre backend auprès de
            Payment Platform.
          </p>
        </div>

        <form action={formAction}>
          <CreateButton />
        </form>
      </div>

      {state.error ? (
        <div className="mt-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" />

          <p>{state.error}</p>
        </div>
      ) : null}

      {state.createdKey ? (
        <div className="mt-6 rounded-2xl border border-[#e6c76d] bg-[#fffaf0] p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#9a7523]" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#0a0e17]">
                Votre nouvelle clé est prête
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Copiez-la maintenant. Pour des raisons de sécurité, cette clé
                complète ne pourra plus être affichée après avoir quitté ou
                rechargé cette page.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-[#e5dfd0] bg-white px-4 py-3 font-mono text-xs text-slate-700">
              {state.createdKey}
            </code>

            <button
              type="button"
              onClick={copyKey}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#d8d2c5] bg-white px-4 text-sm font-semibold text-[#0a0e17] transition hover:bg-[#f7f6f2]"
            >
              {copied ? (
                <>
                  <Check size={16} />
                  Copiée
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copier
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
