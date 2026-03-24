import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { DataTable } from '../../components/ui/data-table';
import { EmptyState } from '../../components/ui/empty-state';
import { FormError } from '../../components/ui/form-error';
import { PageHeader } from '../../components/ui/page-header';
import { useCategories, useCreateCategory, useToggleCategoryActive, useUpdateCategory } from '../../hooks/use-dashboard-queries';
import { categorySchema, type CategoryFormValues } from '../../lib/schemas/category';
import { getErrorMessage } from '../../lib/utils/error';
import type { Category } from '../../types/domain';

const defaultValues: CategoryFormValues = {
  name: '',
  description: '',
  sortOrder: 0,
  isActive: true,
};

export function AdminCategoryPage() {
  const { data = [] } = useCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const toggleMutation = useToggleCategoryActive();
  const [editing, setEditing] = useState<Category | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema) as never,
    defaultValues,
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        name: editing.name,
        description: editing.description,
        sortOrder: editing.sortOrder,
        isActive: editing.isActive,
      });
      return;
    }

    form.reset({
      ...defaultValues,
      sortOrder: data.length,
    });
  }, [data.length, editing, form]);

  async function onSubmit(values: CategoryFormValues) {
    setSubmitError(null);

    try {
      if (editing) {
        await updateCategoryMutation.mutateAsync({ categoryId: editing.id, values });
        setEditing(null);
      } else {
        await createCategoryMutation.mutateAsync(values);
      }
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Unable to save category.'));
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Category Management"
        description="Create, reorder, update, and deactivate the categories that structure both the admin CMS and the customer menu."
      />

      <form className="glass-panel grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <input {...form.register('name')} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Category name" />
          <FormError message={form.formState.errors.name?.message} />
        </div>
        <div>
          <input {...form.register('description')} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Description" />
          <FormError message={form.formState.errors.description?.message} />
        </div>
        <div>
          <input
            {...form.register('sortOrder', { valueAsNumber: true })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Sort order"
            type="number"
          />
          <FormError message={form.formState.errors.sortOrder?.message} />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" {...form.register('isActive')} />
            Active
          </label>
          <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white" type="submit">
            {editing ? 'Update category' : 'Add category'}
          </button>
          {editing ? (
            <button className="rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-700" onClick={() => setEditing(null)} type="button">
              Cancel
            </button>
          ) : null}
        </div>
        {submitError ? <p className="text-sm text-rose-600 md:col-span-2 xl:col-span-4">{submitError}</p> : null}
      </form>

      <DataTable<Category>
        rows={data}
        getRowKey={(row) => row.id}
        emptyState={<EmptyState title="No categories yet" description="Create a category to organize your menu." />}
        columns={[
          { key: 'name', header: 'Category', render: (category) => <span className="font-semibold text-slate-900">{category.name}</span> },
          { key: 'description', header: 'Description', render: (category) => category.description },
          { key: 'sortOrder', header: 'Sort', render: (category) => category.sortOrder.toString() },
          {
            key: 'status',
            header: 'Status',
            render: (category) => (
              <button
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                onClick={() => {
                  void toggleMutation.mutateAsync({
                    categoryId: category.id,
                    isActive: !category.isActive,
                  });
                }}
                type="button"
              >
                {category.isActive ? 'Active' : 'Inactive'}
              </button>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (category) => (
              <button className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900" onClick={() => setEditing(category)} type="button">
                <span className="inline-flex items-center gap-1"><Pencil className="h-3 w-3" />Edit</span>
              </button>
            ),
          },
        ]}
      />
    </div>
  );
}
