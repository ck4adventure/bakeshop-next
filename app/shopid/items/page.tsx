'use client';

import { useState, useEffect, useId } from 'react';
// import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Calendar } from 'lucide-react';
import { ItemSheet } from '@/components/item-sheet';
import { SheetState } from '@/components/item-sheet';
export default function ItemsPage() {
  // const router = useRouter();

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [scheduledItemIds, setScheduledItemIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, catsRes, schedRes] = await Promise.all([
          fetch(`/api/items`, { credentials: 'include' }),
          fetch(`/api/categories`, { credentials: 'include' }),
          fetch(`/api/production-schedule`, { credentials: 'include' }),
        ]);
        if (!itemsRes.ok) throw new Error('Failed to load items');
        const [itemsData, catsData, schedData] = await Promise.all([
          itemsRes.json(),
          catsRes.ok ? catsRes.json() : [],
          schedRes.ok ? schedRes.json() : [],
        ]);
        setItems(itemsData);
        setCategories(catsData);
        const ids = new Set<number>(
          (schedData as { itemId: number; quantity: number }[])
            .filter(e => e.quantity > 0)
            .map(e => e.itemId)
        );
        setScheduledItemIds(ids);
	
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

	

  const handleSaved = (saved: Item) => {
    const isNew = !items.some(i => i.id === saved.id);
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === saved.id);
      return idx >= 0
        ? prev.map(i => i.id === saved.id ? saved : i)
        : [...prev, saved];
    });
    // Re-fetch schedule so the calendar icon reflects any changes made in the sheet
    fetch(`/api/production-schedule`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((schedData: { itemId: number; quantity: number }[]) => {
        setScheduledItemIds(new Set(schedData.filter(e => e.quantity > 0).map(e => e.itemId)));
      })
      .catch(() => {});
    showToast(isNew ? `${saved.name} added` : `${saved.name} updated`);
    setSheet(null);
  };

  const handleDeleted = (id: number) => {
    const item = items.find(i => i.id === id);
    setItems(prev => prev.filter(i => i.id !== id));
    showToast(`${item?.name ?? 'Item'} deleted`);
    setSheet(null);
  };

  const handleCategoryCreated = (cat: Category) => {
    setCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
  };

  // Derive the categories that actually have items (for chip visibility)
  const categoriesWithItems = categories.filter(cat => items.some(i => i.category?.id === cat.id));
  const hasUncategorized = items.some(i => i.category === null);

	console.log("items: ", items)

  // Build grouped list based on active filter
  const filteredItems = activeFilter !== null
    ? items.filter(i => i.category?.id === activeFilter)
    : items;

  // Group by category: categorized groups sorted by category name, then uncategorized at end
  const groupedItems: { label: string; items: Item[] }[] = [];
  const seen = new Set<number>();

  for (const cat of categories) {
    const group = filteredItems.filter(i => i.category?.id === cat.id);
    if (group.length > 0) {
      groupedItems.push({ label: cat.name, items: group });
      seen.add(cat.id);
    }
  }

  if (activeFilter === null) {
    const uncategorized = filteredItems.filter(i => i.category === null);
    if (uncategorized.length > 0) {
      groupedItems.push({ label: 'Uncategorized', items: uncategorized });
    }
  }

  const showChips = !loading && !fetchError && (categoriesWithItems.length > 0 || hasUncategorized);
	console.log("scheduled ids: ", scheduledItemIds)
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 pt-5 pb-3 flex items-center gap-3">
        {/* <button
          onClick={() => router.push("/")}
          aria-label="Go back"
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button> */}
        <div>
          <h1 className="text-[22px] font-bold text-foreground leading-none">Items</h1>
          {!loading && !fetchError && (
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </header>

      {/* Filter chips */}
      {showChips && (
        <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveFilter(null)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
              activeFilter === null
                ? 'bg-sienna text-white border-sienna font-semibold antialiased'
                : 'bg-transparent text-foreground border-border hover:bg-muted font-medium'
            }`}
          >
            All
          </button>
          {categoriesWithItems.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
                activeFilter === cat.id
                  ? 'bg-sienna text-white border-sienna font-semibold antialiased'
                  : 'bg-transparent text-foreground border-border hover:bg-muted font-medium'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <main className="px-4 pt-3 pb-28 flex flex-col gap-2">
        {loading && (
          <p className="text-center text-muted-foreground pt-12" role="status">Loading…</p>
        )}
        {fetchError && (
          <p className="text-center text-destructive pt-12">{fetchError}</p>
        )}
        {!loading && !fetchError && items.length === 0 && (
          <div className="text-center pt-16 flex flex-col items-center gap-3">
            <p className="text-muted-foreground">No items yet.</p>
            <button
              onClick={() => setSheet({ mode: 'add' })}
              className="text-sm font-medium text-primary cursor-pointer"
            >
              Add your first item →
            </button>
          </div>
        )}
        {!loading && !fetchError && items.length > 0 && groupedItems.map(group => (
          <div key={group.label}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1.5 mt-2 first:mt-0">
              {group.label}
            </h3>
            <div className="flex flex-col gap-2">
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSheet({ mode: 'edit', item })}
                  className="w-full bg-card border border-border rounded-card px-4 py-3.5 flex justify-between items-center text-left cursor-pointer hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(28,25,23,0.08)] transition-[transform,box-shadow] duration-150"
                >
                  <span className="text-[17px] font-medium text-foreground">{item.name}</span>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Calendar
                      size={15}
                      className={scheduledItemIds.has(item.id) ? 'text-primary' : 'text-muted-foreground/30'}
                    />
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{item.par != null ? `par ${item.par}` : 'no par'}</div>
                      {item.defaultBatchQty != null && (
                        <div className="text-xs text-muted-foreground/70">batch {item.defaultBatchQty}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* FAB */}
      <button
        onClick={() => setSheet({ mode: 'add' })}
        aria-label="Add item"
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_4px_16px_rgba(194,105,42,0.35)] cursor-pointer z-20"
      >
        <Plus size={28} />
      </button>

      {/* Sheet */}
      {sheet && (
        <ItemSheet
          state={sheet}
          categories={categories}
          onClose={() => setSheet(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onCategoryCreated={handleCategoryCreated}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium z-40 shadow-lg whitespace-nowrap"
        >
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
