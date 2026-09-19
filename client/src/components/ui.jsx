export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-body">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return <section className={`rounded-xl border border-line bg-card p-5 shadow-sm ${className}`}>{children}</section>;
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-primary text-white hover:bg-blue-700',
    accent: 'bg-accent text-white hover:bg-teal-800',
    ghost: 'border border-line bg-white text-heading hover:bg-slate-50',
    danger: 'bg-danger text-white hover:bg-red-700',
  };
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-heading">{label}</span>
      {children}
    </label>
  );
}

export function Input(props) {
  return (
    <input
      className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-heading outline-none focus:ring-2 focus:ring-primary/30"
      {...props}
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select
      className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-heading outline-none focus:ring-2 focus:ring-primary/30"
      {...props}
    >
      {children}
    </select>
  );
}

export function TextArea(props) {
  return (
    <textarea
      className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-heading outline-none focus:ring-2 focus:ring-primary/30"
      {...props}
    />
  );
}

export function StatusBanner({ tone = 'info', children }) {
  const tones = {
    info: 'border-primary/20 bg-blue-50 text-heading',
    success: 'border-success/20 bg-green-50 text-heading',
    warning: 'border-warning/20 bg-amber-50 text-heading',
    error: 'border-danger/20 bg-red-50 text-danger',
  };
  return <div className={`rounded-lg border px-3 py-2 text-sm ${tones[tone]}`}>{children}</div>;
}

export function EmptyState({ title, body }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <h2 className="text-lg">{title}</h2>
      <p className="mt-2 text-sm">{body}</p>
    </div>
  );
}

export function Table({ columns, rows, rowKey = '_id' }) {
  if (!rows?.length) return <EmptyState title="No records" body="Nothing to display yet." />;
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-heading">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-semibold">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey] || JSON.stringify(row)} className="border-t border-line">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 align-top">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
