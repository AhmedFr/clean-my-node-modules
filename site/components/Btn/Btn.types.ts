import type { ComponentPropsWithoutRef } from "react";

export interface BtnProps extends ComponentPropsWithoutRef<"a"> {
  variant: "primary" | "ghost";
  size?: "sm" | "md" | "lg";
}
