import HelpNav from '@/components/help-nav'

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Topic sidebar — desktop/landscape only */}
      <aside className="hidden md:block landscape:block w-48 shrink-0 border-r border-border py-4 px-2">
        <p className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Topics
        </p>
        <HelpNav />
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 px-5 py-6 max-w-2xl">
        {children}
      </div>
    </div>
  )
}
