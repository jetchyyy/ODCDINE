import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { DataTable } from '../../components/ui/data-table';
import { EmptyState } from '../../components/ui/empty-state';
import { FormError } from '../../components/ui/form-error';
import { PageHeader } from '../../components/ui/page-header';
import {
  useCategories,
  useCreateMenuItem,
  useMenuItems,
  useToggleMenuItemAvailability,
  useUpdateMenuItem,
  useUploadMenuItemImage,
} from '../../hooks/use-dashboard-queries';
import { menuItemSchema, type MenuItemFormValues } from '../../lib/schemas/menu-item';
import { formatCurrency } from '../../lib/utils/currency';
import { getErrorMessage } from '../../lib/utils/error';
import type { MenuItem } from '../../types/domain';

const defaultValues: MenuItemFormValues = {
  categoryId: '',
  name: '',
  description: '',
  price: 0,
  imageUrl: null,
  preparationTimeMinutes: 5,
  isAvailable: true,
  isFeatured: false,
};

export function AdminItemsPage() {
  const { data: items = [] } = useMenuItems();
  const { data: categories = [] } = useCategories();
  const createMenuItemMutation = useCreateMenuItem();
  const updateMenuItemMutation = useUpdateMenuItem();
  const toggleMutation = useToggleMenuItemAvailability();
  const uploadMutation = useUploadMenuItemImage();
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema) as never,
    defaultValues,
  });
  const imageUrl = useWatch({ control: form.control, name: 'imageUrl' });

  useEffect(() => {
    if (editing) {
      form.reset({
        categoryId: editing.categoryId,
        name: editing.name,
        description: editing.description,
        price: editing.price,
        imageUrl: editing.imageUrl ?? null,
        preparationTimeMinutes: editing.preparationTimeMinutes,
        isAvailable: editing.isAvailable,
        isFeatured: editing.isFeatured,
      });
      return;
    }

    form.reset({
      ...defaultValues,
      categoryId: categories[0]?.id ?? '',
    });
  }, [categories, editing, form]);

  const visibleItems = useMemo(
    () => (categoryFilter === 'all' ? items : items.filter((item) => item.categoryId === categoryFilter)),
    [categoryFilter, items],
  );

  async function handleImageChange(file?: File | null) {
    if (!file) {
      return;
    }

    const publicUrl = await uploadMutation.mutateAsync(file);
    form.setValue('imageUrl', publicUrl, { shouldDirty: true, shouldValidate: true });
  }

  async function onSubmit(values: MenuItemFormValues) {
    setSubmitError(null);

    try {
      if (editing) {
        await updateMenuItemMutation.mutateAsync({ menuItemId: editing.id, values });
        setEditing(null);
      } else {
        await createMenuItemMutation.mutateAsync(values);
      }
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Unable to save menu item.'));
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Menu Item Management"
        description="Manage categories, pricing, descriptions, featured items, availability, and image uploads for the public ordering menu."
      />

      <form className="glass-panel grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <select {...form.register('categoryId')} className="w-full rounded-2xl border border-slate-200 px-4 py-3">
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <FormError message={form.formState.errors.categoryId?.message} />
        </div>
        <div>
          <input {...form.register('name')} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Item name" />
          <FormError message={form.formState.errors.name?.message} />
        </div>
        <div>
          <input {...form.register('description')} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Description" />
          <FormError message={form.formState.errors.description?.message} />
        </div>
        <div>
          <input {...form.register('price', { valueAsNumber: true })} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Price" type="number" step="0.01" />
          <FormError message={form.formState.errors.price?.message} />
        </div>
        <div>
          <input
            {...form.register('preparationTimeMinutes', { valueAsNumber: true })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Prep minutes"
            type="number"
          />
          <FormError message={form.formState.errors.preparationTimeMinutes?.message} />
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" {...form.register('isAvailable')} />
            Available
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" {...form.register('isFeatured')} />
            Featured
          </label>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
          <Upload className="h-4 w-4 text-slate-500" />
          <input
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              void handleImageChange(event.target.files?.[0]);
            }}
            type="file"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white" type="submit">
            {editing ? 'Update item' : 'Add item'}
          </button>
          {editing ? (
            <button className="rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-700" onClick={() => setEditing(null)} type="button">
              Cancel
            </button>
          ) : null}
        </div>
        {imageUrl ? (
          <div className="xl:col-span-4">
            <img src={imageUrl ?? undefined} alt="Preview" className="h-32 w-32 rounded-2xl object-cover" />
          </div>
        ) : null}
        {submitError ? <p className="text-sm text-rose-600 xl:col-span-4">{submitError}</p> : null}
      </form>

      <div className="flex flex-wrap gap-2">
        <button className={`rounded-full px-4 py-2 text-sm ${categoryFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`} onClick={() => setCategoryFilter('all')} type="button">
          All categories
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`rounded-full px-4 py-2 text-sm ${categoryFilter === category.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
            onClick={() => setCategoryFilter(category.id)}
            type="button"
          >
            {category.name}
          </button>
        ))}
      </div>

      <DataTable<MenuItem>
        rows={visibleItems}
        getRowKey={(row) => row.id}
        emptyState={<EmptyState title="No menu items yet" description="Create your first menu item to populate the ordering page." />}
        columns={[
          {
            key: 'item',
            header: 'Item',
            render: (item) => (
              <div className="flex items-center gap-3">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-2xl object-cover" /> : null}
                <div>
                  <div className="font-semibold text-slate-900">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.categoryName}</div>
                </div>
              </div>
            ),
          },
          { key: 'description', header: 'Description', render: (item) => item.description },
          { key: 'price', header: 'Price', render: (item) => formatCurrency(item.price) },
          { key: 'featured', header: 'Featured', render: (item) => (item.isFeatured ? 'Yes' : 'No') },
          {
            key: 'availability',
            header: 'Availability',
            render: (item) => (
              <button
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                onClick={() => {
                  void toggleMutation.mutateAsync({ menuItemId: item.id, isAvailable: !item.isAvailable });
                }}
                type="button"
              >
                {item.isAvailable ? 'Available' : 'Unavailable'}
              </button>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            render: (item) => (
              <button className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900" onClick={() => setEditing(item)} type="button">
                <span className="inline-flex items-center gap-1"><Pencil className="h-3 w-3" />Edit</span>
              </button>
            ),
          },
        ]}
      />
    </div>
  );
}
