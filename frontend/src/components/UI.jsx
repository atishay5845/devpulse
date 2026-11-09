import { Activity, ArrowUpRight, Plus, Search, X } from 'lucide-react';

export function PageHeading({ eyebrow, title, subtitle, action, actionLabel, onAction, actionIcon: ActionIcon = Plus }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action && <button className="btn btn-primary" onClick={onAction}><ActionIcon size={17}/>{actionLabel || action}</button>}</div>;
}

export function StatCard({ label, value, detail, icon: Icon = Activity, tone = 'blue', trend }) {
  return <article className="stat-card"><div className="stat-top"><span className={`stat-icon stat-${tone}`}><Icon size={19}/></span>{trend && <span className="stat-trend"><ArrowUpRight size={13}/>{trend}</span>}</div><div className="stat-value">{value ?? '—'}</div><div className="stat-label">{label}</div>{detail && <div className="stat-detail">{detail}</div>}</article>;
}

export function EmptyState({ icon: Icon = Activity, title, description, action, actionLabel, onAction }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={25}/></div><h3>{title}</h3><p>{description}</p>{action && <button className="btn btn-primary" onClick={onAction}><Plus size={16}/>{actionLabel || action}</button>}</div>;
}

export function LoadingState({ label = 'Loading your workspace…' }) {
  return <div className="loading-state"><span className="spinner"/><span>{label}</span></div>;
}

export function ErrorState({ message, onRetry }) {
  return <div className="error-state"><div><strong>We couldn't load this data</strong><p>{message || 'Check that the Django API is running and try again.'}</p></div>{onRetry && <button className="btn btn-secondary btn-sm" onClick={onRetry}>Try again</button>}</div>;
}

export function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return <label className="search-input"><Search size={16}/><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder}/>{value && <button type="button" onClick={() => onChange('')} aria-label="Clear search"><X size={14}/></button>}</label>;
}

export function Field({ label, hint, children }) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>;
}
