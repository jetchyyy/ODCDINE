import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="glass-panel flex min-h-52 flex-col items-center justify-center p-8 text-center">
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
