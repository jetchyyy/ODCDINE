import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/constants/query-keys';
import { supabase } from '../lib/supabase/client';
import { fetchOrderById } from '../services/supabase/queries';
import type { Order, StaffRole } from '../types/domain';

const speechStorageKey = 'odcdine-speech-enabled';

function loadSpeechPreference() {
  if (typeof window === 'undefined') {
    return true;
  }

  const stored = window.localStorage.getItem(speechStorageKey);
  return stored !== 'false';
}

function saveSpeechPreference(enabled: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(speechStorageKey, String(enabled));
}

function speakNewOrder(order: Order) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(
    `New order received. ${order.tableName}. ${order.items.length} items. Total ${order.total.toFixed(2)} pesos.`,
  );
  utterance.lang = 'en-US';
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function useNewOrderAlerts(role?: StaffRole | null) {
  const queryClient = useQueryClient();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [speechEnabled, setSpeechEnabled] = useState(loadSpeechPreference);
  const seenOrderIdsRef = useRef(new Set<string>());

  useEffect(() => {
    saveSpeechPreference(speechEnabled);
  }, [speechEnabled]);

  useEffect(() => {
    if (!supabase || !role) {
      return;
    }

    const client = supabase;
    let mounted = true;

    const channel: RealtimeChannel = client
      .channel(`new-order-alerts-${role}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          const newRow = payload.new as { id?: string; source?: string; status?: string } | null;
          const orderId = newRow?.id;

          if (!orderId || newRow?.source !== 'qr' || newRow?.status !== 'pending' || seenOrderIdsRef.current.has(orderId)) {
            return;
          }

          seenOrderIdsRef.current.add(orderId);

          await queryClient.invalidateQueries({ queryKey: queryKeys.orders });
          await queryClient.invalidateQueries({ queryKey: queryKeys.analytics });

          const order = await queryClient.fetchQuery({
            queryKey: queryKeys.order(orderId),
            queryFn: () => fetchOrderById(orderId),
          });

          if (!mounted || !order) {
            return;
          }

          setActiveOrder(order);

          if (speechEnabled) {
            speakNewOrder(order);
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      void client.removeChannel(channel);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [queryClient, role, speechEnabled]);

  return {
    activeOrder,
    speechEnabled,
    dismissAlert() {
      setActiveOrder(null);
    },
    toggleSpeech() {
      setSpeechEnabled((current) => !current);
    },
  };
}
