export type UnitPreference = "lb" | "kg";

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  goal: string;
  unitPreference: UnitPreference;
};
