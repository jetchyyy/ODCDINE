import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OrderStatusActions } from '../../components/orders/order-status-actions';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { EmptyState } from '../../components/ui/empty-state';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { PageHeader } from '../../components/ui/page-header';
import { StatusBadge } from '../../components/ui/status-badge';
import { useDeleteOrders, useUpsertOrderPayment, useOrder, useUpdateOrderStatus } from '../../hooks/use-dashboard-queries';
import { useAuth } from '../../features/auth/use-auth';
import { useOrderRealtime } from '../../hooks/use-order-realtime';
import { formatCurrency } from '../../lib/utils/currency';
import { getErrorMessage } from '../../lib/utils/error';

export function AdminOrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const statusMutation = useUpdateOrderStatus();
  const paymentMutation = useUpsertOrderPayment();
  const deleteOrdersMutation = useDeleteOrders();
  const { data: order, isLoading } = useOrder(id);
  useOrderRealtime({ orderId: id });
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash'>('cash');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const canManagePayment = profile?.role === 'admin' || profile?.role === 'cashier';
  const canDeleteOrders = profile?.role === 'admin';

  useEffect(() => {
    if (!order?.payment) {
      setPaymentMethod('cash');
      setPaymentStatus('pending');
      setReferenceNumber('');
      return;
    }

    setPaymentMethod(order.payment.paymentMethod === 'gcash' ? 'gcash' : 'cash');
    setPaymentStatus(order.payment.paymentStatus === 'paid' ? 'paid' : 'pending');
    setReferenceNumber(order.payment.referenceNumber ?? '');
  }, [order?.payment]);

  if (isLoading) {
    return <LoadingSpinner label="Loading order..." />;
  }

  if (!order) {
    return <EmptyState title="Order not found" description="This order could not be found." />;
  }

  const currentOrder = order;

  async function handleSavePayment() {
    setPaymentError(null);

    if (paymentMethod === 'gcash' && referenceNumber.trim().length === 0) {
      setPaymentError('Reference number is required for GCash payments.');
      return;
    }

    try {
      await paymentMutation.mutateAsync({
        orderId: currentOrder.id,
        paymentMethod,
        paymentStatus,
        amountPaid: paymentStatus === 'paid' ? currentOrder.total : 0,
        referenceNumber,
      });
    } catch (error) {
      setPaymentError(getErrorMessage(error, 'Unable to save payment.'));
    }
  }

  async function handleDeleteOrder() {
    setDeleteError(null);

    try {
      await deleteOrdersMutation.mutateAsync([currentOrder.id]);
      void navigate('/admin/orders');
    } catch (error) {
      setDeleteError(getErrorMessage(error, 'Unable to delete order.'));
      setDeleteDialogOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={currentOrder.queueNumber ? `Queue ${currentOrder.queueNumber}` : currentOrder.orderNumber}
        title={currentOrder.tableName}
        description="Review the full order breakdown, customer notes, audit trail, and staff status updates."
        actions={<StatusBadge status={currentOrder.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold text-slate-900">Items</h3>
          <div className="mt-6 grid gap-3">
            {currentOrder.items.map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-900">{item.quantity}x {item.itemName}</p>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.lineTotal)}</p>
                </div>
                {item.notes ? <p className="mt-2 text-sm text-slate-500">Note: {item.notes}</p> : null}
              </div>
            ))}
          </div>

          {currentOrder.notes ? (
            <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              <strong>Order note:</strong> {currentOrder.notes}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          {currentOrder.queueNumber ? (
            <div className="glass-panel p-5">
              <h3 className="text-lg font-semibold text-slate-900">Queue Number</h3>
              <p className="mt-3 text-4xl font-semibold text-amber-700">{currentOrder.queueNumber}</p>
              <p className="mt-2 text-sm text-slate-500">Use this number when calling the order for pickup or release.</p>
            </div>
          ) : null}

          <div className="glass-panel p-5">
            <h3 className="text-lg font-semibold text-slate-900">Totals</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(currentOrder.subtotal)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(currentOrder.taxAmount)}</span></div>
              <div className="flex justify-between"><span>Service</span><span>{formatCurrency(currentOrder.serviceChargeAmount)}</span></div>
              <div className="flex justify-between font-semibold text-slate-900"><span>Total</span><span>{formatCurrency(currentOrder.total)}</span></div>
            </div>
          </div>

          <div className="glass-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Payment</h3>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  currentOrder.payment?.paymentStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {currentOrder.payment?.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  disabled={!canManagePayment || paymentMutation.isPending}
                  onChange={(event) => setPaymentStatus(event.target.value as 'pending' | 'paid')}
                  value={paymentStatus}
                >
                  <option value="pending">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Payment method</label>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                  disabled={!canManagePayment || paymentMutation.isPending}
                  onChange={(event) => setPaymentMethod(event.target.value as 'cash' | 'gcash')}
                  value={paymentMethod}
                >
                  <option value="cash">Cash</option>
                  <option value="gcash">GCash</option>
                </select>
              </div>

              {paymentMethod === 'gcash' ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Reference number</label>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-700"
                    disabled={!canManagePayment || paymentMutation.isPending}
                    onChange={(event) => setReferenceNumber(event.target.value)}
                    placeholder="Enter GCash reference number"
                    value={referenceNumber}
                  />
                </div>
              ) : null}

              {canManagePayment ? (
                <button
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
                  disabled={paymentMutation.isPending}
                  onClick={() => {
                    void handleSavePayment();
                  }}
                  type="button"
                >
                  {paymentMutation.isPending ? 'Saving...' : 'Save payment'}
                </button>
              ) : (
                <p className="text-sm text-slate-500">Only admin and cashier accounts can update payment information.</p>
              )}

              {currentOrder.payment ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p><strong className="text-slate-900">Method:</strong> {currentOrder.payment.paymentMethod === 'gcash' ? 'GCash' : 'Cash'}</p>
                  <p className="mt-1"><strong className="text-slate-900">Amount:</strong> {formatCurrency(currentOrder.payment.amountPaid)}</p>
                  {currentOrder.payment.referenceNumber ? (
                    <p className="mt-1"><strong className="text-slate-900">Reference:</strong> {currentOrder.payment.referenceNumber}</p>
                  ) : null}
                </div>
              ) : null}

              {paymentError ? <p className="text-sm text-rose-600">{paymentError}</p> : null}
            </div>
          </div>

          <div className="glass-panel p-5">
            <h3 className="text-lg font-semibold text-slate-900">Update Status</h3>
            <div className="mt-4">
              <OrderStatusActions
                currentStatus={currentOrder.status}
                disabled={statusMutation.isPending}
                onChange={(status) => {
                  void statusMutation.mutateAsync({ orderId: currentOrder.id, status });
                }}
              />
            </div>
          </div>

          <div className="glass-panel p-5">
            <h3 className="text-lg font-semibold text-slate-900">Status Log</h3>
            <div className="mt-4 space-y-3">
              {currentOrder.statusLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-600">
                  <p className="font-medium text-slate-900">{log.status.replaceAll('_', ' ')}</p>
                  <p className="mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                  {log.changedByName ? <p className="mt-1 text-xs text-slate-500">By {log.changedByName}</p> : null}
                </div>
              ))}
            </div>
          </div>

          {canDeleteOrders ? (
            <div className="glass-panel p-5">
              <h3 className="text-lg font-semibold text-slate-900">Danger Zone</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Deleting this order will also remove its items, payment record, and status history.
              </p>
              <button
                className="mt-4 rounded-full bg-rose-600 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
                disabled={deleteOrdersMutation.isPending}
                onClick={() => setDeleteDialogOpen(true)}
                type="button"
              >
                {deleteOrdersMutation.isPending ? 'Deleting...' : 'Delete order'}
              </button>
              {deleteError ? <p className="mt-3 text-sm text-rose-600">{deleteError}</p> : null}
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        cancelLabel="Keep order"
        confirmLabel="Delete order"
        confirmTone="danger"
        description={`Delete ${currentOrder.orderNumber}? This cannot be undone.`}
        isOpen={deleteDialogOpen}
        isPending={deleteOrdersMutation.isPending}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          void handleDeleteOrder();
        }}
        title="Delete this order?"
      />
    </div>
  );
}
