"use client";

import Link from "next/link";
import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
} from "react";
import { BillStatus, BILL_STATUS_LABELS } from "../lib/types";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "success" | "danger" | "ghost";

export function Button({
  variant = "secondary",
  size,
  block,
  icon,
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "lg";
  block?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      className={`btn btn-${variant} ${size === "lg" ? "btn-lg" : ""} ${
        block ? "btn-block" : ""
      } ${className}`}
      {...rest}
    >
      {icon ? <span className="ico">{icon}</span> : null}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "secondary",
  size,
  block,
  icon,
  children,
  className = "",
}: {
  href: string;
  variant?: Variant;
  size?: "lg";
  block?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`btn btn-${variant} ${size === "lg" ? "btn-lg" : ""} ${
        block ? "btn-block" : ""
      } ${className}`}
    >
      {icon ? <span className="ico">{icon}</span> : null}
      {children}
    </Link>
  );
}

export function Card({
  children,
  className = "",
  pad = true,
  style,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`card ${pad ? "card-pad" : ""} ${className}`} style={style}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="titles">
        <h1>{title}</h1>
        {subtitle ? <p className="subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="actions">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({
  icon = "receipt",
  title,
  message,
  action,
}: {
  icon?: IconName;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="emo" aria-hidden>
        <Icon name={icon} size={30} />
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  // Auto-associate the label with the input for screen readers + getByLabel,
  // unless the child already has an id or an explicit htmlFor is given.
  const autoId = useId();
  let control = children;
  let forId = htmlFor;
  if (!htmlFor && isValidElement(children)) {
    const childProps = children.props as { id?: string };
    const id = childProps.id ?? autoId;
    forId = id;
    if (!childProps.id) {
      control = cloneElement(children as React.ReactElement<{ id?: string }>, { id });
    }
  }
  return (
    <div className="field">
      <label htmlFor={forId}>{label}</label>
      {control}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />;
}

export function SearchInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`search-field ${className}`}>
      <Icon name="search" size={20} />
      <input className="input" type="search" {...props} />
    </div>
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="select" {...props} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="textarea" {...props} />;
}

const STATUS_TONE: Record<BillStatus, string> = {
  draft: "neutral",
  unpaid: "danger",
  partial: "warning",
  paid: "success",
  cancelled: "neutral",
};

export function PaymentStatusBadge({ status }: { status: BillStatus }) {
  return <span className={`badge badge-${STATUS_TONE[status]}`}>{BILL_STATUS_LABELS[status]}</span>;
}

export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Yes, continue",
  cancelLabel = "Cancel",
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel}>
      <h2>{title}</h2>
      <p>{message}</p>
      <div className="form-actions">
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </Modal>
  );
}
