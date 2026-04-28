'use client'
import Link from 'next/link';
import { useBakerySettings } from '@/lib/swr-hooks';

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavRow({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="w-full flex items-center justify-between px-4 py-3.5 rounded-[12px] border border-border bg-card text-foreground cursor-pointer hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(28,25,23,0.08)] transition-[transform,box-shadow] duration-150"
    >
      <span className="text-[17px] font-medium">{label}</span>
      <span className="text-muted-foreground text-lg">›</span>
    </Link>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: settings, isLoading: loading } = useBakerySettings();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 pt-5 pb-3">
        <h1 className="text-[22px] font-bold text-foreground leading-none">Settings</h1>
        {settings && (
          <p className="text-[13px] text-muted-foreground mt-0.5">{settings.name}</p>
        )}
      </header>

      {!loading && (
        <main className="px-4 pt-5 pb-28 flex flex-col gap-8">
          <section>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Setup
            </p>
            <NavRow label="Operating Days" href="/operating-days" />
          </section>
        </main>
      )}
    </div>
  );
}
