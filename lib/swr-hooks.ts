import useSWR from 'swr';

export function useBakerySettings() {
  return useSWR<BakerySettings & { id?: number; name?: string; slug?: string }>('/api/bakery/settings');
}

export function useItems() {
  return useSWR<Item[]>('/api/items');
}

export function useCategories() {
  return useSWR<Category[]>('/api/categories');
}

export function useProductionSchedule() {
  return useSWR<ScheduleEntry[]>('/api/production-schedule');
}

export function useInventory() {
  return useSWR<InventoryItem[]>('/api/inventory');
}

export function useTodayBakes() {
  return useSWR<{ id: number; itemId: number; quantity: number }[]>('/api/inventory/bakes/today');
}

export function useInventoryHistory() {
  return useSWR<unknown[]>('/api/inventory/history');
}

type ScheduleOverride = { itemId: number; quantity: number; specialOrderQty?: number };
export function useScheduleOverrides(date: string | null) {
  return useSWR<ScheduleOverride[]>(date ? `/api/production-schedule/overrides?date=${date}` : null);
}
