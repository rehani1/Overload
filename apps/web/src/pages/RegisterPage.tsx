import { type FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

import { AuthShell } from "../components/AuthShell";
import { useAuth } from "../auth/useAuth";
import { getApiErrorMessage } from "../lib/apiClient";

type RegisterForm = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

const initialForm: RegisterForm = {
  email: "",
  firstName: "",
  lastName: "",
  password: "",
};

const backendProfileDefaults = {
  goal: "Not set",
  heightInches: 70,
  sex: "male" as const,
  unitPreference: "lb" as const,
  weightPounds: 180,
};

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState<RegisterForm>(initialForm);

  const registerMutation = useMutation({
    mutationFn: () =>
      register({
        email: form.email,
        firstName: form.firstName,
        goal: backendProfileDefaults.goal,
        heightInches: backendProfileDefaults.heightInches,
        lastName: form.lastName,
        password: form.password,
        sex: backendProfileDefaults.sex,
        unitPreference: backendProfileDefaults.unitPreference,
        weightPounds: backendProfileDefaults.weightPounds,
      }),
    onSuccess: () => {
      navigate("/", { replace: true });
    },
  });

  function updateField<TField extends keyof RegisterForm>(
    field: TField,
    value: RegisterForm[TField],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    registerMutation.mutate();
  }

  return (
    <AuthShell
      heading="Create account"
      subheading="Create an API account for the desktop training workspace."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="First name"
            value={form.firstName}
            onChange={(value) => updateField("firstName", value)}
            autoComplete="given-name"
          />
          <TextField
            label="Last name"
            value={form.lastName}
            onChange={(value) => updateField("lastName", value)}
            autoComplete="family-name"
          />
        </div>

        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={(value) => updateField("email", value)}
          autoComplete="email"
        />

        <TextField
          label="Password"
          type="password"
          value={form.password}
          onChange={(value) => updateField("password", value)}
          autoComplete="new-password"
          minLength={8}
        />

        {registerMutation.isError ? (
          <div className="rounded-lg border border-overload-danger/30 bg-overload-danger-muted px-4 py-3 text-sm font-medium text-overload-danger">
            {getApiErrorMessage(registerMutation.error, "Unable to create account.", {
              conflictMessage: "An account already exists for that email.",
            })}
          </div>
        ) : null}

        <button
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-overload-primary px-4 text-sm font-semibold text-overload-onPrimary transition hover:bg-overload-accent disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? "Creating account" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-overload-muted">
        Already have an account?{" "}
        <Link className="font-semibold text-overload-primary hover:underline" to="/login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

type TextFieldProps = {
  autoComplete?: string;
  label: string;
  maxLength?: number;
  minLength?: number;
  onChange: (value: string) => void;
  type?: "email" | "password" | "text";
  value: string;
};

function TextField({
  autoComplete,
  label,
  maxLength,
  minLength,
  onChange,
  type = "text",
  value,
}: TextFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-overload-ink">{label}</span>
      <input
        className="mt-2 h-12 w-full rounded-lg border border-overload-border-strong bg-overload-elevated px-3 text-base outline-none transition focus:border-overload-primary focus:ring-4 focus:ring-overload-accent-muted"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        maxLength={maxLength}
        minLength={minLength}
        required
      />
    </label>
  );
}
