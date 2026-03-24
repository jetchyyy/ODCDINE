import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { DataTable } from '../../components/ui/data-table';
import { EmptyState } from '../../components/ui/empty-state';
import { FormError } from '../../components/ui/form-error';
import { PageHeader } from '../../components/ui/page-header';
import { useCreateStaff, useStaff, useUpdateStaffRole } from '../../hooks/use-dashboard-queries';
import { STAFF_ROLES } from '../../lib/constants/app';
import { createStaffSchema, type CreateStaffValues } from '../../lib/schemas/staff';
import { getErrorMessage } from '../../lib/utils/error';
import type { StaffProfile } from '../../types/domain';

export function AdminStaffPage() {
  const { data = [] } = useStaff();
  const createStaffMutation = useCreateStaff();
  const updateRoleMutation = useUpdateStaffRole();
  const form = useForm<CreateStaffValues>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      role: 'cashier',
    },
  });

  async function onSubmit(values: CreateStaffValues) {
    await createStaffMutation.mutateAsync(values);
    form.reset({
      email: '',
      password: '',
      fullName: '',
      role: 'cashier',
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Staff Management"
        description="Create staff accounts, assign access roles, and keep role permissions aligned with admin, cashier, kitchen, and waiter responsibilities."
      />

      <form className="glass-panel grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <input {...form.register('fullName')} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Full name" />
          <FormError message={form.formState.errors.fullName?.message} />
        </div>
        <div>
          <input {...form.register('email')} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" type="email" />
          <FormError message={form.formState.errors.email?.message} />
        </div>
        <div>
          <input {...form.register('password')} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Temporary password" type="password" />
          <FormError message={form.formState.errors.password?.message} />
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <select {...form.register('role')} className="w-full rounded-2xl border border-slate-200 px-4 py-3">
              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white" type="submit">
            {createStaffMutation.isPending ? 'Creating...' : 'Add staff'}
          </button>
        </div>
        {createStaffMutation.error ? <p className="text-sm text-rose-600 xl:col-span-4">{getErrorMessage(createStaffMutation.error)}</p> : null}
      </form>

      <DataTable<StaffProfile>
        rows={data}
        getRowKey={(row) => row.id}
        emptyState={<EmptyState title="No staff profiles found" description="Create your first staff account to unlock protected admin access." />}
        columns={[
          {
            key: 'name',
            header: 'Staff',
            render: (staff) => (
              <div>
                <div className="font-semibold text-slate-900">{staff.fullName}</div>
                <div className="text-xs text-slate-500">{staff.email ?? 'No email'}</div>
              </div>
            ),
          },
          {
            key: 'role',
            header: 'Role',
            render: (staff) => (
              <select
                className="rounded-full border border-slate-200 px-3 py-2 text-sm"
                defaultValue={staff.role}
                onChange={(event) => {
                  void updateRoleMutation.mutateAsync({ staffId: staff.id, role: event.target.value as StaffProfile['role'] });
                }}
              >
                {STAFF_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            ),
          },
          { key: 'createdAt', header: 'Created', render: (staff) => (staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : 'N/A') },
        ]}
      />
    </div>
  );
}
