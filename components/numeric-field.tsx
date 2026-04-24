// ─── Numeric field with +/− buttons ──────────────────────────────────────────

export default function NumericField({
  id,
  value,
  onChange,
  min = 0,
}: {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  min?: number;
}) {
  const num = value.trim() === '' ? null : parseInt(value, 10);
  const atMin = num !== null && num <= min;

  const increment = () => {
    const next = num !== null ? num + 1 : min;
    onChange(String(next));
  };

  const decrement = () => {
    if (num === null || num <= min) return;
    onChange(String(num - 1));
  };

  return (
    <div className="flex items-center">
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="—"
        className="w-[4ch] h-10 rounded-l-lg border border-border bg-background px-1 text-[15px] text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <div className="flex flex-col h-10 rounded-r-lg overflow-hidden border-t border-r border-b border-border -ml-px">
        <button
          type="button"
          onClick={increment}
          className="flex-1 px-1.5 bg-background text-foreground text-xs flex items-center justify-center cursor-pointer hover:bg-muted transition-colors border-b border-border"
        >▲</button>
        <button
          type="button"
          onClick={decrement}
          disabled={num === null || atMin}
          className="flex-1 px-1.5 bg-background text-foreground text-xs flex items-center justify-center cursor-pointer hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-default"
        >▼</button>
      </div>
    </div>
  );
}
