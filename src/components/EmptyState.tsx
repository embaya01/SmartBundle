interface EmptyStateProps {
  title: string;
  message?: string;
  action?: React.ReactNode;
}

const EmptyState = ({ title, message, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-soft">
    <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
    {message ? <p className="mt-2 max-w-md text-sm text-slate-500">{message}</p> : null}
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

export default EmptyState;
