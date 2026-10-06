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

type ApiKeyCreationPanelProps = {
  canManage?: boolean;
};

function CreateButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#c8a24a] px-5 text-sm font-semibold text-[#0a0e17] shadow-[0_6px_18px_rgba(200,162,74,0.18)] transition duration-200 hover:bg-[#d5b45f] hover:shadow-[0_8px_24px_rgba(200,162,74,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
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

export function ApiKeyCreationPanel({
  canManage = true,
}: ApiKeyCreationPanelProps) {
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
    <section className="rounded-2xl border border-[#e7e2d8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)] sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eee8da] bg-[#fffaf0] text-[#9a7523]">
            <KeyRound size={18} />
          </div>

          <h2 className="mt-4 text-base font-semibold tracking-tight text-[#0a0e17]">
            Clés API
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Utilisez une clé API pour authentifier votre backend auprès de
            Payment Platform.
          </p>

          {!canManage ? (
            <div className="mt-3 inline-flex rounded-xl border border-[#eeeae2] bg-[#faf9f6] px-3 py-2 text-xs leading-5 text-slate-500">
              Accès en lecture seule. Votre rôle ne permet pas de créer ou
              révoquer des clés API.
            </div>
          ) : null}
        </div>

        {canManage ? (
          <form action={formAction}>
            <CreateButton />
          </form>
        ) : null}
      </div>

      {state.error ? (
        <div className="mt-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" />

          <p>{state.error}</p>
        </div>
      ) : null}

      {state.createdKey ? (
        <div className="mt-5 rounded-2xl border border-[#dbc47d] bg-[#fffaf0] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e8d79f] bg-white text-[#9a7523]">
              <ShieldCheck size={17} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#0a0e17]">
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
            <code className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-[#e7e2d8] bg-white px-4 py-3 font-mono text-xs text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
              {state.createdKey}
            </code>

            <button
              type="button"
              onClick={copyKey}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#e5e0d6] bg-white px-4 text-sm font-medium text-[#0a0e17] transition hover:border-[#c8a24a]/45 hover:bg-[#fffdf8] hover:text-[#9a7523]"
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