// components/admin/PageHeader.js
'use client';

export function PageHeader({ title, description, subtitle, action, actions }) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        {(description || subtitle) && <p>{description || subtitle}</p>}
      </div>
      {(action || actions) && <div className="page-actions">{action || actions}</div>}
    </header>
  );
}

export function StatusBadge({ status, customColors = {} }) {
  const colors = {
    active: 'bg-green-100 text-green-700',
    approved: 'bg-green-100 text-green-700',
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-yellow-100 text-yellow-700',
    trial: 'bg-blue-100 text-blue-700',
    inactive: 'bg-gray-100 text-gray-600',
    not_started: 'bg-gray-100 text-gray-600',
    expired: 'bg-orange-100 text-orange-700',
    cancelled: 'bg-red-100 text-red-700',
    rejected: 'bg-red-100 text-red-700',
    suspended: 'bg-red-100 text-red-700',
    failed: 'bg-red-100 text-red-700',
    true: 'bg-green-100 text-green-700',
    false: 'bg-gray-100 text-gray-500',
    ...customColors,
  };
  const key = String(status).toLowerCase().replace(/ /g, '_');
  const cls = colors[key] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {String(status).replace(/_/g, ' ')}
    </span>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
      />
    </div>
  );
}

export function StatCard({ label, value, icon, color = 'blue', sub }) {
  return (
    <article className={`stat-card stat-${color}`}>
      <div className="stat-card-top"><span>{label}</span>{icon && <span className="stat-icon">{icon}</span>}</div>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </article>
  );
}

export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', className = '' }) {
  const variants = {
    primary:   'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    danger:    'bg-red-500 hover:bg-red-600 text-white',
    success:   'bg-green-500 hover:bg-green-600 text-white',
    ghost:     'hover:bg-gray-100 text-gray-600',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export default PageHeader;