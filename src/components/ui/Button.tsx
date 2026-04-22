import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "navy" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Zeigt einen Spinner + deaktiviert den Button. */
  loading?: boolean;
  /** Icon vor dem Label (z. B. <Plus size={16} />). */
  leadingIcon?: ReactNode;
  /** Icon nach dem Label. */
  trailingIcon?: ReactNode;
  /** Volle Breite im Parent ausnutzen. */
  block?: boolean;
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  navy: "btn-navy",
  outline: "btn-outline",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

/**
 * Typisierter React-Wrapper um die vorhandenen `.btn`-CSS-Klassen.
 * Bestehende `<button className="btn btn-primary">…</button>`-Aufrufe
 * bleiben weiterhin gültig; dieses Component ist nur syntaktischer Zucker
 * mit Typ-Sicherheit und eingebautem Loading-State.
 */
export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    leadingIcon,
    trailingIcon,
    block = false,
    className = "",
    disabled,
    children,
    ...rest
  },
  ref
) {
  const classes = [
    "btn",
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    block ? "btn-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Loader2 size={16} className="login__spinner" aria-hidden />
      ) : (
        leadingIcon
      )}
      {children && <span>{children}</span>}
      {!loading && trailingIcon}
    </button>
  );
});
