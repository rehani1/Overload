import { type FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

import { AuthShell } from "../components/AuthShell";
import { useAuth } from "../auth/useAuth";
import { getApiErrorMessage } from "../lib/apiClient";
import type { Sex, UnitPreference } from "../types/api";

type RegisterForm = {
  carbsGrams: string;
  email: string;
  fatGrams: string;
  firstName: string;
  goal: string;
  heightFeet: string;
  heightInches: string;
  lastName: string;
  password: string;
  proteinGrams: string;
  sex: Sex;
  unitPreference: UnitPreference;
  weightPounds: string;
};

const initialForm: RegisterForm = {
  carbsGrams: "250",
  email: "",
  fatGrams: "70",
  firstName: "",
  goal: "",
  heightFeet: "5",
  heightInches: "10",
  lastName: "",
  password: "",
  proteinGrams: "160",
  sex: "male",
  unitPreference: "lb",
  weightPounds: "",
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
        goal: form.goal,
        heightInches: Number(form.heightFeet) * 12 + Number(form.heightInches),
        lastName: form.lastName,
        nutritionTarget: {
          carbsGrams: Number(form.carbsGrams),
          fatGrams: Number(form.fatGrams),
          proteinGrams: Number(form.proteinGrams),
        },
        password: form.password,
        sex: form.sex,
        unitPreference: form.unitPreference,
        weightPounds: Number(form.weightPounds),
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
      subheading="Set up the profile fields required by the Overload API."
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

        <label className="block">
          <span className="text-sm font-semibold text-zinc-700">Current goal</span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-base outline-none transition focus:border-overload-green focus:ring-4 focus:ring-overload-mint"
            value={form.goal}
            onChange={(event) => updateField("goal", event.target.value)}
            maxLength={200}
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="text-sm font-semibold text-zinc-700">Height</span>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <NumberField
                label="Feet"
                value={form.heightFeet}
                onChange={(value) => updateField("heightFeet", value)}
                min={2}
                max={9}
              />
              <NumberField
                label="Inches"
                value={form.heightInches}
                onChange={(value) => updateField("heightInches", value)}
                min={0}
                max={11}
              />
            </div>
          </div>
          <TextField
            label="Body weight (lb)"
            type="number"
            value={form.weightPounds}
            onChange={(value) => updateField("weightPounds", value)}
            min={1}
            step="0.1"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-zinc-700">Sex</span>
            <select
              className="mt-2 h-12 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-overload-green focus:ring-4 focus:ring-overload-mint"
              value={form.sex}
              onChange={(event) => updateField("sex", event.target.value as Sex)}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-zinc-700">Preferred unit</span>
            <select
              className="mt-2 h-12 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-overload-green focus:ring-4 focus:ring-overload-mint"
              value={form.unitPreference}
              onChange={(event) =>
                updateField("unitPreference", event.target.value as UnitPreference)
              }
            >
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </label>
        </div>

        <div>
          <span className="text-sm font-semibold text-zinc-700">Macro targets</span>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <NumberField
              label="Protein"
              value={form.proteinGrams}
              onChange={(value) => updateField("proteinGrams", value)}
              min={0}
              step="0.1"
            />
            <NumberField
              label="Carbs"
              value={form.carbsGrams}
              onChange={(value) => updateField("carbsGrams", value)}
              min={0}
              step="0.1"
            />
            <NumberField
              label="Fat"
              value={form.fatGrams}
              onChange={(value) => updateField("fatGrams", value)}
              min={0}
              step="0.1"
            />
          </div>
        </div>

        {registerMutation.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {getApiErrorMessage(registerMutation.error, "Unable to create account.")}
          </div>
        ) : null}

        <button
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-overload-ink px-4 text-sm font-semibold text-white transition hover:bg-[#1b312b] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? "Creating account" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-600">
        Already have an account?{" "}
        <Link className="font-semibold text-overload-green hover:underline" to="/login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

type TextFieldProps = {
  autoComplete?: string;
  label: string;
  max?: number;
  maxLength?: number;
  min?: number;
  minLength?: number;
  onChange: (value: string) => void;
  step?: string;
  type?: "email" | "number" | "password" | "text";
  value: string;
};

function TextField({
  autoComplete,
  label,
  max,
  maxLength,
  min,
  minLength,
  onChange,
  step,
  type = "text",
  value,
}: TextFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-700">{label}</span>
      <input
        className="mt-2 h-12 w-full rounded-lg border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-overload-green focus:ring-4 focus:ring-overload-mint"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        maxLength={maxLength}
        max={max}
        min={min}
        minLength={minLength}
        step={step}
        required
      />
    </label>
  );
}

type NumberFieldProps = Omit<TextFieldProps, "autoComplete" | "type">;

function NumberField(props: NumberFieldProps) {
  return <TextField {...props} type="number" />;
}
