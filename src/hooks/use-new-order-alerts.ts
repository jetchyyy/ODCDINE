import { useEffect, useRef, useState } from 'react';
import { useOrders } from './use-dashboard-queries';
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
  const { data: orders = [] } = useOrders();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [speechEnabled, setSpeechEnabled] = useState(loadSpeechPreference);
  const knownOrderIdsRef = useRef(new Set<string>());
  const initializedRef = useRef(false);

  useEffect(() => {
    saveSpeechPreference(speechEnabled);
  }, [speechEnabled]);

  useEffect(() => {
    if (!role) {
      return;
    }

    if (!initializedRef.current) {
      for (const order of orders) {
        knownOrderIdsRef.current.add(order.id);
      }
      initializedRef.current = true;
      return;
    }

    const newlySeenOrders = orders.filter((order) => !knownOrderIdsRef.current.has(order.id));

    for (const order of orders) {
      knownOrderIdsRef.current.add(order.id);
    }

    const newestPendingQrOrder = newlySeenOrders
      .filter((order) => order.source === 'qr' && order.status === 'pending')
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0];

    if (!newestPendingQrOrder) {
      return;
    }

    setActiveOrder(newestPendingQrOrder);

    if (speechEnabled) {
      speakNewOrder(newestPendingQrOrder);
    }
  }, [orders, role, speechEnabled]);

  useEffect(
    () => () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    },
    [],
  );

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
