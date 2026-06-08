import { type FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AuthShell } from "../components/AuthShell";
import { getApiErrorMessage } from "../lib/apiClient";
import { useAuth } from "../auth/useAuth";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const from = (location.state as LocationState | null)?.from?.pathname ?? "/";

  const loginMutation = useMutation({
    mutationFn: () => login({ email, password }),
    onSuccess: () => {
      navigate(from, { replace: true });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginMutation.mutate();
  }

  return (
    <AuthShell
      heading="Sign in"
      subheading="Use your Overload API account to open the desktop training workspace."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-semibold text-overload-ink">Email</span>
          <input
            className="mt-2 h-12 w-full rounded-lg border border-overload-border-strong bg-overload-elevated px-3 text-base outline-none transition focus:border-overload-primary focus:ring-4 focus:ring-overload-accent-muted"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-overload-ink">Password</span>
          <input
            className="mt-2 h-12 w-full rounded-lg border border-overload-border-strong bg-overload-elevated px-3 text-base outline-none transition focus:border-overload-primary focus:ring-4 focus:ring-overload-accent-muted"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {loginMutation.isError ? (
          <div className="rounded-lg border border-overload-danger/30 bg-overload-danger-muted px-4 py-3 text-sm font-medium text-overload-danger">
            {getApiErrorMessage(loginMutation.error, "Unable to sign in.", {
              unauthorizedMessage: "Email or password is incorrect.",
            })}
          </div>
        ) : null}

        <button
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-overload-primary px-4 text-sm font-semibold text-overload-onPrimary transition hover:bg-overload-accent disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Signing in" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-overload-muted">
        Need an account?{" "}
        <Link className="font-semibold text-overload-primary hover:underline" to="/register">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
