import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MenuItem } from '../types/domain';

export interface CartLine {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface CartState {
  tableCode?: string;
  orderNote: string;
  items: CartLine[];
  setTableCode: (tableCode: string) => void;
  addItem: (menuItem: MenuItem) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateNotes: (menuItemId: string, notes: string) => void;
  setOrderNote: (notes: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      tableCode: undefined,
      orderNote: '',
      items: [],
      setTableCode: (tableCode) =>
        set((state) => {
          if (state.tableCode && state.tableCode !== tableCode) {
            return {
              tableCode,
              items: [],
              orderNote: '',
            };
          }

          return { tableCode };
        }),
      addItem: (menuItem) =>
        set((state) => {
          const existing = state.items.find((item) => item.menuItem.id === menuItem.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.menuItem.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item,
              ),
            };
          }

          return {
            items: [...state.items, { menuItem, quantity: 1 }],
          };
        }),
      updateQuantity: (menuItemId, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) => (item.menuItem.id === menuItemId ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0),
        })),
      updateNotes: (menuItemId, notes) =>
        set((state) => ({
          items: state.items.map((item) => (item.menuItem.id === menuItemId ? { ...item, notes } : item)),
        })),
      setOrderNote: (orderNote) => set({ orderNote }),
      clearCart: () => set({ items: [], tableCode: undefined, orderNote: '' }),
    }),
    {
      name: 'odcdine-cart',
      partialize: (state) => ({
        tableCode: state.tableCode,
        orderNote: state.orderNote,
        items: state.items,
      }),
    },
  ),
);
