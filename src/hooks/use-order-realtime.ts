import { useEffect } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/constants/query-keys';
import { supabase } from '../lib/supabase/client';

interface UseOrderRealtimeOptions {
  orderId?: string;
}

export function useOrderRealtime(options?: UseOrderRealtimeOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const channels: RealtimeChannel[] = [];
    const client = supabase;

    const staffChannel = client
      .channel(`staff-orders-${options?.orderId ?? 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
        void queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
        if (options?.orderId) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.order(options.orderId) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.publicOrder(options.orderId) });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
        if (options?.orderId) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.order(options.orderId) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.publicOrder(options.orderId) });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_status_logs' }, () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.orders });
        void queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
        if (options?.orderId) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.order(options.orderId) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.publicOrder(options.orderId) });
        }
      })
      .subscribe();

    channels.push(staffChannel);

    if (options?.orderId) {
      const publicChannel = client
        .channel(`public-order:${options.orderId}`, {
          config: {
            broadcast: { self: false },
          },
        })
        .on('broadcast', { event: 'status-changed' }, () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.publicOrder(options.orderId!) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.order(options.orderId!) });
        })
        .on('broadcast', { event: 'order-updated' }, () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.publicOrder(options.orderId!) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.order(options.orderId!) });
        })
        .subscribe();

      channels.push(publicChannel);
    }

    return () => {
      for (const channel of channels) {
        void client.removeChannel(channel);
      }
    };
  }, [options?.orderId, queryClient]);
}
