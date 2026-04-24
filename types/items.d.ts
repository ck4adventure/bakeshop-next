type Category = {
  id: number;
  name: string;
};

type Item = {
  id: number;
  name: string;
  slug: string;
  par: number | null;
  defaultBatchQty: number | null;
  category: Category | null;
};

type InventoryItem = {
  itemId: number;
  quantity: number;
  item: Item;
};

type ScheduleEntry = {
  itemId: number;
  weekday: string;
  quantity: number;
};

type BakerySettings = {
  operatingDays: string[];
};