interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmTone?: 'default' | 'danger';
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmTone = 'default',
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="flex w-full max-w-lg flex-col rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-700"
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={`rounded-full px-5 py-3 text-sm font-medium text-white disabled:opacity-60 ${
              confirmTone === 'danger' ? 'bg-rose-600' : 'bg-slate-900'
            }`}
            disabled={isPending}
            onClick={onConfirm}
            type="button"
          >
            {isPending ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
