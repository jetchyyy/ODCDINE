interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
}

export function ConfirmDialog({ title, description, confirmLabel }: ConfirmDialogProps) {
  return (
    <div className="glass-panel rounded-3xl border border-dashed border-slate-300 p-5">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <button className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">{confirmLabel}</button>
    </div>
  );
}
