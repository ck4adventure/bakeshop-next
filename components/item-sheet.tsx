'use client';

import { useState, useId } from 'react';
import { mutate } from 'swr';
import ModalShell from './modal-shell';
import NumericField from './numeric-field';
import InfoTooltip from './info-tooltip';


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

export type SheetState =
  | { mode: 'add' }
  | { mode: 'edit'; item: Item };

export function ItemSheet({
  state,
  categories,
  operatingDays,
  initialSchedule,
  onClose,
  onSaved,
  onDeleted,
  onCategoryCreated,
}: {
  state: SheetState;
  categories: Category[];
  operatingDays: string[];
  initialSchedule: Record<string, number>;
  onClose: () => void;
  onSaved: (item: Item, savedSchedule: Record<string, number>) => void;
  onDeleted?: (id: number) => void;
  onCategoryCreated: (cat: Category) => void;
}) {
  const nameId = useId();
  const parId = useId();
  const defaultBatchQtyId = useId();
  const initialQtyId = useId();
  const categoryId = useId();
  const newCategoryId = useId();

  const initial = state.mode === 'edit' ? state.item : null;
  const [name, setName] = useState(initial?.name ?? '');
  const [parInput, setParInput] = useState(initial?.par != null ? String(initial.par) : '');
  const [defaultBatchQtyInput, setDefaultBatchQtyInput] = useState(initial?.defaultBatchQty != null ? String(initial.defaultBatchQty) : '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initial?.category?.id != null ? String(initial.category.id) : ''
  );
  const [newCategoryName, setNewCategoryName] = useState('');
  const [initialQtyInput, setInitialQtyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scheduleInputs, setScheduleInputs] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(initialSchedule).map(([day, qty]) => [day, String(qty)]))
  );

  const parsedPar = parInput.trim() === '' ? null : parseInt(parInput, 10);
  const parValid = parInput.trim() === '' || (!isNaN(parsedPar!) && parsedPar! >= 0);
  const parsedDefaultBatchQty = defaultBatchQtyInput.trim() === '' ? null : parseInt(defaultBatchQtyInput, 10);
  const defaultBatchQtyValid = defaultBatchQtyInput.trim() === '' || (!isNaN(parsedDefaultBatchQty!) && parsedDefaultBatchQty! >= 1);
  const parsedInitialQty = initialQtyInput.trim() === '' ? null : parseInt(initialQtyInput, 10);
  const initialQtyValid = initialQtyInput.trim() === '' || (!isNaN(parsedInitialQty!) && parsedInitialQty! >= 0);

  const isAddingNew = selectedCategoryId === '__new__';

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    if (!parValid) { setError('Par must be a whole number (0 or more)'); return; }
    if (!defaultBatchQtyValid) { setError('Default batch qty must be a whole number (1 or more)'); return; }
    if (state.mode === 'add' && !initialQtyValid) { setError('Initial qty must be a whole number (0 or more)'); return; }
    if (isAddingNew && !newCategoryName.trim()) { setError('Enter a name for the new category'); return; }

    for (const day of operatingDays) {
      const val = (scheduleInputs[day] ?? '').trim();
      if (val !== '') {
        const n = parseInt(val, 10);
        if (isNaN(n) || n < 0) {
          setError(`Bakeoff qty for ${day} must be a whole number (0 or more)`);
          return;
        }
      }
    }

    setSaving(true);
    setError(null);
    try {
      let resolvedCategoryId: number | null = null;
      if (isAddingNew) {
        const catRes = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategoryName.trim() }),
        });
        if (!catRes.ok) {
          const data = await catRes.json().catch(() => ({}));
          throw new Error((data as { message?: string }).message ?? 'Failed to create category');
        }
        const newCat: Category = await catRes.json();
        mutate('/api/categories');
        onCategoryCreated(newCat);
        resolvedCategoryId = newCat.id;
      } else if (selectedCategoryId !== '') {
        resolvedCategoryId = parseInt(selectedCategoryId, 10);
      }

      const body: Record<string, unknown> = {
        name: name.trim(),
        par: parsedPar,
        defaultBatchQty: parsedDefaultBatchQty,
        categoryId: resolvedCategoryId,
        ...(state.mode === 'add' && parsedInitialQty != null && parsedInitialQty > 0 && { initialQty: parsedInitialQty }),
      };

      let res: Response;
      if (state.mode === 'add') {
        res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/items/${state.item.slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? 'Save failed');
      }

      const saved: Item = await res.json();

      // Persist bakeoff schedule
      if (operatingDays.length > 0) {
        const itemId = saved.id;
        const scheduleOps: Promise<void>[] = [];
        const operatingDaysSet = new Set(operatingDays);

        for (const day of operatingDays) {
          const val = (scheduleInputs[day] ?? '').trim();
          const qty = val === '' ? null : parseInt(val, 10);
          if (qty !== null && !isNaN(qty)) {
            scheduleOps.push(
              fetch('/api/production-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId, weekday: day, quantity: qty }),
              }).then(() => {}),
            );
          } else if (qty === null && initialSchedule[day] !== undefined) {
            scheduleOps.push(
              fetch(`/api/production-schedule/${itemId}/${day}`, {
                method: 'DELETE',
              }).then(() => {}),
            );
          }
        }

        // Delete stale entries for days no longer in operating days
        for (const day of Object.keys(initialSchedule)) {
          if (!operatingDaysSet.has(day)) {
            scheduleOps.push(
              fetch(`/api/production-schedule/${itemId}/${day}`, {
                method: 'DELETE',
              }).then(() => {}),
            );
          }
        }

        await Promise.all(scheduleOps);
        mutate('/api/production-schedule');
      }

      // Build the schedule state as it now exists in the DB
      const savedSchedule: Record<string, number> = {};
      for (const day of operatingDays) {
        const val = (scheduleInputs[day] ?? '').trim();
        const qty = val === '' ? null : parseInt(val, 10);
        if (qty !== null && !isNaN(qty)) savedSchedule[day] = qty;
      }

      mutate('/api/items');
      onSaved(saved, savedSchedule);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (state.mode !== 'edit') return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/items/${state.item.slug}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      mutate('/api/items');
      mutate('/api/production-schedule');
      onDeleted?.(state.item.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setDeleting(false);
    }
  };

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-[630px]">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          {state.mode === 'add' ? 'New Item' : 'Edit Item'}
        </h2>

        {error && (
          <p className="text-sm mb-4 px-3 py-2 rounded-lg bg-destructive/10 text-destructive">{error}</p>
        )}

        {/* Name */}
        <div className="mb-4">
          <label htmlFor={nameId} className="block text-sm font-medium text-foreground mb-1.5">
            Name
          </label>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Sourdough Loaf"
            className="w-full h-12 rounded-xl border border-border bg-background px-4 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label htmlFor={categoryId} className="block text-sm font-medium text-foreground mb-1.5">
            Category <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <select
            id={categoryId}
            value={selectedCategoryId}
            onChange={e => setSelectedCategoryId(e.target.value)}
            className="w-full h-12 rounded-xl border border-border bg-background px-4 text-[15px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">No category</option>
            {categories.map(cat => (
              <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
            ))}
            <option value="__new__">+ Add new category</option>
          </select>
          {isAddingNew && (
            <input
              id={newCategoryId}
              type="text"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="New category name"
              className="mt-2 w-full h-12 rounded-xl border border-border bg-background px-4 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          )}
        </div>

        {/* Bakeoff qty by day */}
        {operatingDays.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-foreground mb-2">
              Bakeoff qty by day <span className="text-muted-foreground font-normal">(optional)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {operatingDays.map(day => (
                <div key={day} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{day.slice(0, 3)}</span>
                  <NumericField
                    value={scheduleInputs[day] ?? ''}
                    onChange={val => setScheduleInputs(prev => ({ ...prev, [day]: val }))}
                    min={0}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Par + Default batch qty + Starting stock (add mode) */}
        <div className="flex gap-6 mb-7">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={parId} className="text-sm font-medium text-foreground">
              Par level <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <NumericField id={parId} value={parInput} onChange={setParInput} min={0} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={defaultBatchQtyId} className="text-sm font-medium text-foreground">
              Default batch qty <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <NumericField id={defaultBatchQtyId} value={defaultBatchQtyInput} onChange={setDefaultBatchQtyInput} min={1} />
          </div>
          {state.mode === 'add' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1">
                <label htmlFor={initialQtyId} className="text-sm font-medium text-foreground">
                  Starting stock <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <InfoTooltip text="Units already on hand — sets initial inventory when the item is created." />
              </div>
              <NumericField id={initialQtyId} value={initialQtyInput} onChange={setInitialQtyInput} min={0} />
            </div>
          )}
        </div>

        {/* Save / Cancel */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-14 rounded-full border border-border bg-transparent text-foreground text-[15px] font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-2 h-14 rounded-full bg-primary text-primary-foreground text-[15px] font-semibold cursor-pointer disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* Delete (edit mode only) */}
        {state.mode === 'edit' && (
          <div className="mt-5 pt-5 border-t border-border">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full text-sm text-destructive cursor-pointer py-1"
              >
                Delete item
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-center text-muted-foreground">
                  Delete <span className="font-semibold text-foreground">{state.item.name}</span>? This can't be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 h-11 rounded-full border border-border text-sm text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 h-11 rounded-full bg-destructive text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
                  >
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
    </ModalShell>
  );
}
