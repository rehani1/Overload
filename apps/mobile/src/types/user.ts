export type UnitPreference = "lb" | "kg";
export type Sex = "female" | "male";

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  goal: string;
  heightInches: number;
  sex: Sex;
  unitPreference: UnitPreference;
  weightPounds: number;
};
