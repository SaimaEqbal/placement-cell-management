import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  FileText,
  Loader2,
  Minus,
} from "lucide-react";

import type { StatusTone } from "../types";

export function SectionTitle({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div className="section-icon">{icon}</div>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action && <div className="section-action">{action}</div>}
    </div>
  );
}

export function Badge({
  tone,
  children,
}: {
  tone: StatusTone;
  children: ReactNode;
}) {
  return (
    <span className={`badge ${tone}`}>
      <i />
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  note,
  icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: ReactNode;
  tone: StatusTone;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  );
}

export function PanelHead({
  title,
  action,
}: {
  title: string;
  action?: string;
}) {
  return (
    <div className="panel-head">
      <h2>{title}</h2>
      {action && (
        <button>
          {action} <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

export function DocumentItem({
  sem,
  name,
  meta,
  tone,
  status,
}: {
  sem: string;
  name: string;
  meta: string;
  tone: StatusTone;
  status: string;
}) {
  return (
    <div className="document-item">
      <div className="doc-icon">{sem}</div>
      <div>
        <b>{name}</b>
        <span>{meta}</span>
      </div>
      <Badge tone={tone}>{status}</Badge>
    </div>
  );
}

export function Activity({
  title,
  meta,
  tone,
    onClick,
  className,
}: {
  title: string;
  meta: string;
  tone: StatusTone;
   /** Optional - e.g. NotificationsPage passes this to mark an unread item as read on click. */
  onClick?: () => void;
  /** Optional extra class(es) appended to "activity", e.g. "is-unread" for visual distinction. */
  className?: string;
}) {
return (
    <div
      className={`activity${className ? ` ${className}` : ""}${onClick ? " activity-clickable" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <i className={tone}>
        {tone === "green" ? <Check size={14} /> : tone === "amber" ? <Minus size={14} /> : <FileText size={14} />}
      </i>
      <div>
        <b>{title}</b>
        <span>{meta}</span>
      </div>
    </div>
  );
}

export function ReviewSection({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section className="review-section">
      <div className="review-section-head">
        <h3>{title}</h3>
        {badge && <Badge tone="red">{badge}</Badge>}
      </div>
      {children}
    </section>
  );
}

export function InfoGrid({ items }: { items: string[][] }) {
  return (
    <div className="info-grid">
      {items.map(([k, v]) => (
        <div key={k}>
          <span>{k}</span>
          <b>{v}</b>
        </div>
      ))}
    </div>
  );
}

/**
 * Reusable loading / error / empty states.
 * Purpose: every TanStack Query-backed page in this app (dashboards, lists,
 * review screens) needs to render these three states consistently instead
 * of each page inventing its own spinner/message markup.
 */

/** Purpose: shown while a useQuery()/useMutation() is in flight. */
export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="state-block loading-state">
      <Loader2 className="spin" size={20} />
      <span>{label}</span>
    </div>
  );
}

/** Purpose: shown when a useQuery() fails; `onRetry` (typically refetch()) is optional since some errors - e.g. a 403 - aren't worth retrying. */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state-block error-state">
      <AlertTriangle size={20} />
      <span>{message}</span>
      {onRetry && (
        <button className="secondary" type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

/** Purpose: shown when a useQuery() succeeds but returns zero rows (no students/companies/notifications yet). */
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="state-block empty-state">
      {icon}
      <b>{title}</b>
      {description && <span>{description}</span>}
    </div>
  );
}
