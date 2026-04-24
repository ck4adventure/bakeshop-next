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