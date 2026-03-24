import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { QRCodePreview } from '../../components/tables/qr-code-preview';
import { TableCard } from '../../components/tables/table-card';
import { EmptyState } from '../../components/ui/empty-state';
import { FormError } from '../../components/ui/form-error';
import { PageHeader } from '../../components/ui/page-header';
import { useCreateTable, useTables, useToggleTableActive, useUpdateTable } from '../../hooks/use-dashboard-queries';
import { tableSchema, type TableFormValues } from '../../lib/schemas/table';
import { getErrorMessage } from '../../lib/utils/error';
import type { RestaurantTable } from '../../types/domain';

const defaultValues: TableFormValues = {
  tableNumber: 1,
  tableName: '',
  capacity: 2,
  isActive: true,
};

function getPublicSiteUrl() {
  const configuredUrl = import.meta.env.VITE_PUBLIC_SITE_URL?.trim();
  return configuredUrl && configuredUrl.length > 0 ? configuredUrl.replace(/\/+$/, '') : window.location.origin;
}

function downloadQrForTable(table: RestaurantTable, qrUrl: string) {
  const canvas = document.createElement('canvas');
  const size = 640;
  canvas.width = size;
  canvas.height = size + 120;
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const qrSvg = document.querySelector('#table-qr-preview');
  if (qrSvg instanceof SVGElement) {
    const serialized = new XMLSerializer().serializeToString(qrSvg);
    const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      context.drawImage(image, 40, 40, 560, 560);
      context.fillStyle = '#111827';
      context.font = 'bold 32px sans-serif';
      context.fillText(table.tableName, 40, 645);
      context.font = '20px sans-serif';
      context.fillText(qrUrl, 40, 685);
      URL.revokeObjectURL(url);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${table.tableName.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
      link.click();
    };
    image.src = url;
  }
}

export function AdminTablesPage() {
  const publicSiteUrl = getPublicSiteUrl();
  const { data = [] } = useTables();
  const createTableMutation = useCreateTable();
  const updateTableMutation = useUpdateTable();
  const toggleMutation = useToggleTableActive();
  const [editing, setEditing] = useState<RestaurantTable | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema) as never,
    defaultValues,
  });

  const selectedTable = useMemo(
    () => data.find((table) => table.id === selectedTableId) ?? data[0] ?? null,
    [data, selectedTableId],
  );

  useEffect(() => {
    if (editing) {
      form.reset({
        tableNumber: editing.tableNumber,
        tableName: editing.tableName,
        capacity: editing.capacity,
        isActive: editing.isActive,
      });
      return;
    }

    form.reset({
      ...defaultValues,
      tableNumber: data.length + 1,
    });
  }, [data.length, editing, form]);

  async function onSubmit(values: TableFormValues) {
    setSubmitError(null);

    try {
      if (editing) {
        await updateTableMutation.mutateAsync({ tableId: editing.id, values });
        setEditing(null);
      } else {
        await createTableMutation.mutateAsync(values);
      }
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Unable to save table.'));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Table Management"
        description="Add dining tables, edit capacity and labels, deactivate unused tables, and generate printable QR codes for each active table."
      />

      <form className="glass-panel grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <input {...form.register('tableNumber', { valueAsNumber: true })} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Table #" type="number" />
          <FormError message={form.formState.errors.tableNumber?.message} />
        </div>
        <div>
          <input {...form.register('tableName')} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Table name" />
          <FormError message={form.formState.errors.tableName?.message} />
        </div>
        <div>
          <input {...form.register('capacity', { valueAsNumber: true })} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Capacity" type="number" />
          <FormError message={form.formState.errors.capacity?.message} />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" {...form.register('isActive')} />
            Active
          </label>
          <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white" type="submit">
            {editing ? 'Update table' : 'Add table'}
          </button>
          {editing ? (
            <button className="rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-700" onClick={() => setEditing(null)} type="button">
              Cancel
            </button>
          ) : null}
        </div>
        {submitError ? <p className="text-sm text-rose-600 xl:col-span-4">{submitError}</p> : null}
      </form>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="grid gap-4 md:grid-cols-2">
          {data.length > 0 ? (
            data.map((table) => {
              const qrUrl = `${publicSiteUrl}/menu/${table.tableCode}`;
              return (
                <div key={table.id} onMouseEnter={() => setSelectedTableId(table.id)}>
                  <TableCard
                    table={table}
                    qrUrl={qrUrl}
                    onEdit={(value) => setEditing(value)}
                    onToggleActive={(value) => {
                      void toggleMutation.mutateAsync({ tableId: value.id, isActive: !value.isActive });
                    }}
                    onDownload={(value) => downloadQrForTable(value, `${publicSiteUrl}/menu/${value.tableCode}`)}
                  />
                </div>
              );
            })
          ) : (
            <EmptyState title="No tables configured" description="Add your first table to start QR ordering." />
          )}
        </div>
        <div className="space-y-4">
          {selectedTable ? (
            <>
              <QRCodePreview value={`${publicSiteUrl}/menu/${selectedTable.tableCode}`} title={`${selectedTable.tableName} QR`} />
              <button className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white" onClick={() => window.print()} type="button">
                Print QR sheet
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
