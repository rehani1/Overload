export const colors = {
  background: "#101214",
  surface: "#191C20",
  surfaceMuted: "#24282E",
  text: "#F4F6F8",
  textMuted: "#A5ADB8",
  border: "#343A42",
  primary: "#35C46A",
  danger: "#EF5A5A",
  success: "#4FD17C",
} as const;

export type ColorName = keyof typeof colors;
