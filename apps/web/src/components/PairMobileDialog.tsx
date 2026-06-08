import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { RefreshCcw, Smartphone, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { createPairingCode } from "../api/auth";
import { getApiErrorMessage, getApiStatus } from "../lib/apiClient";
import { clearStoredAuth } from "../lib/authStorage";
import { queryClient } from "../lib/queryClient";

type PairMobileDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function PairMobileDialog({ isOpen, onClose }: PairMobileDialogProps) {
  const hasRequestedCode = useRef(false);
  const navigate = useNavigate();
  const pairingMutation = useMutation({
    mutationFn: createPairingCode,
  });
  const { data, isPending, mutate, reset } = pairingMutation;
  const isUnauthorized = getApiStatus(pairingMutation.error) === 401;

  function handleSignInAgain() {
    clearStoredAuth();
    queryClient.clear();
    onClose();
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    if (!isOpen) {
      hasRequestedCode.current = false;
      reset();
      return;
    }

    if (!hasRequestedCode.current && !data && !isPending) {
      hasRequestedCode.current = true;
      mutate();
    }
  }, [data, isOpen, isPending, mutate, reset]);

  if (!isOpen) {
    return null;
  }

  const expiresAt = data?.expiresAt ? new Date(data.expiresAt) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overload-primary/45 px-5 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pair-mobile-title"
    >
      <div className="w-full max-w-md rounded-lg border border-overload-border bg-overload-surface p-5 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-overload-primary text-overload-onPrimary">
              <Smartphone className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id="pair-mobile-title" className="text-lg font-semibold text-overload-ink">
                Sync mobile
              </h2>
              <p className="mt-1 text-sm text-overload-muted">
                Enter this code on the mobile app.
              </p>
            </div>
          </div>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-overload-border text-overload-muted transition hover:bg-overload-surface-muted"
            type="button"
            aria-label="Close"
            title="Close"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 rounded-lg bg-overload-surface-muted px-4 py-6 text-center">
          {isPending ? (
            <p className="text-sm font-semibold text-overload-muted">Generating code</p>
          ) : data ? (
            <>
              <p className="font-mono text-4xl font-semibold tracking-[0.2em] text-overload-primary">
                {data.code}
              </p>
              <p className="mt-3 text-sm text-overload-muted">
                Expires{" "}
                {expiresAt?.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-overload-danger">
                {getApiErrorMessage(
                  pairingMutation.error,
                  "Could not create a pairing code.",
                  {
                    unauthorizedMessage:
                      "Your web session expired. Sign in again, then generate a new pairing code.",
                  },
                )}
              </p>
              {isUnauthorized ? (
                <button
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-overload-primary px-4 text-sm font-semibold text-overload-onPrimary transition hover:bg-overload-accent"
                  type="button"
                  onClick={handleSignInAgain}
                >
                  Sign in again
                </button>
              ) : null}
            </div>
          )}
        </div>

        <button
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-overload-border-strong bg-overload-elevated px-4 text-sm font-semibold text-overload-ink transition hover:border-overload-primary disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          disabled={isPending}
          onClick={() => mutate()}
        >
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Regenerate
        </button>
      </div>
    </div>
  );
}
