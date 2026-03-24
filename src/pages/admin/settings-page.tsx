import { zodResolver } from '@hookform/resolvers/zod';
import { Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { FormError } from '../../components/ui/form-error';
import { PageHeader } from '../../components/ui/page-header';
import { useBusinessSettings, useUploadBusinessLogo, useUpsertBusinessSettings } from '../../hooks/use-dashboard-queries';
import { settingsSchema, type SettingsFormValues } from '../../lib/schemas/settings';
import { getErrorMessage } from '../../lib/utils/error';
import { defaultOpeningHours, weekdayLabels } from '../../lib/utils/opening-hours';
import { weekdays } from '../../types/domain';

const defaultValues: SettingsFormValues = {
  businessName: '',
  contactNumber: '',
  address: '',
  taxRate: 0.12,
  serviceChargeRate: 0.1,
  currency: 'PHP',
  logoUrl: null,
  openingHours: defaultOpeningHours,
};

export function AdminSettingsPage() {
  const { data } = useBusinessSettings();
  const saveMutation = useUpsertBusinessSettings();
  const uploadMutation = useUploadBusinessLogo();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });
  const logoUrl = useWatch({ control: form.control, name: 'logoUrl' });

  useEffect(() => {
    if (data) {
      form.reset({
        businessName: data.businessName,
        contactNumber: data.contactNumber,
        address: data.address,
        taxRate: data.taxRate,
        serviceChargeRate: data.serviceChargeRate,
        currency: data.currency,
        logoUrl: data.logoUrl ?? null,
        openingHours: data.openingHours,
      });
    }
  }, [data, form]);

  async function onSubmit(values: SettingsFormValues) {
    setSubmitError(null);

    try {
      await saveMutation.mutateAsync(values);
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Unable to save settings.'));
    }
  }

  async function handleLogoChange(file?: File | null) {
    if (!file) {
      return;
    }

    const publicUrl = await uploadMutation.mutateAsync(file);
    form.setValue('logoUrl', publicUrl, { shouldDirty: true, shouldValidate: true });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Business Settings"
        description="Configure branding, tax and service charge rates, contact information, currency, and opening hours for this single-location deployment."
      />

      <form className="glass-panel grid gap-4 p-5 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Business name</label>
          <input {...form.register('businessName')} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-amber-700" />
          <FormError message={form.formState.errors.businessName?.message} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Contact number</label>
          <input {...form.register('contactNumber')} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-amber-700" />
          <FormError message={form.formState.errors.contactNumber?.message} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Address</label>
          <input {...form.register('address')} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-amber-700" />
          <FormError message={form.formState.errors.address?.message} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Currency</label>
          <input {...form.register('currency')} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 uppercase outline-none focus:border-amber-700" />
          <FormError message={form.formState.errors.currency?.message} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Tax rate</label>
          <input {...form.register('taxRate', { valueAsNumber: true })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-amber-700" type="number" step="0.01" />
          <FormError message={form.formState.errors.taxRate?.message} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Service charge rate</label>
          <input {...form.register('serviceChargeRate', { valueAsNumber: true })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-amber-700" type="number" step="0.01" />
          <FormError message={form.formState.errors.serviceChargeRate?.message} />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Logo upload</label>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Upload className="h-4 w-4 text-slate-500" />
            <input accept="image/png,image/jpeg,image/webp" onChange={(event) => void handleLogoChange(event.target.files?.[0])} type="file" />
            {logoUrl ? <img src={logoUrl ?? undefined} alt="Business logo" className="h-14 w-14 rounded-2xl object-cover" /> : null}
          </div>
        </div>
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900">Opening Hours</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {weekdays.map((day) => (
              <div key={day}>
                <label className="mb-2 block text-sm font-medium text-slate-700">{weekdayLabels[day]}</label>
                <input
                  {...form.register(`openingHours.${day}`)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-amber-700"
                  placeholder="07:00-22:00"
                />
                <FormError message={form.formState.errors.openingHours?.[day]?.message} />
              </div>
            ))}
          </div>
        </div>
        {submitError ? <p className="text-sm text-rose-600 md:col-span-2">{submitError}</p> : null}
        <div className="md:col-span-2">
          <button className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white" type="submit">
            {saveMutation.isPending ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
