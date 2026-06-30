import Link from 'next/link'

const TOPICS = [
  { label: 'Today', href: '/help/today', description: 'Log bake batches and track daily targets' },
  { label: 'Inventory', href: '/help/inventory', description: 'View and adjust current freezer stock' },
  { label: 'Schedule', href: '/help/schedule', description: 'Set weekly production quantities per item' },
  { label: 'History', href: '/help/history', description: 'Browse the full inventory transaction log' },
  { label: 'Manage Items', href: '/help/manage-items', description: 'Create and edit bakery items (admin/manager)' },
  { label: 'Operating Days', href: '/help/operating-days', description: 'Configure which days your bakery is open (admin/manager)' },
  { label: 'Settings', href: '/help/settings', description: 'Update your bakery name and slug (admin/manager)' },
]

export default function HelpIndexPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Help</h1>
      <p className="text-[15px] text-muted-foreground mb-6">
        How-to guides for every section of the app. Select a topic to get started.
      </p>

      <div className="flex flex-col gap-2">
        {TOPICS.map(topic => (
          <Link
            key={topic.href}
            href={topic.href}
            className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors group"
          >
            <div>
              <p className="text-[15px] font-medium text-foreground group-hover:text-primary transition-colors">
                {topic.label}
              </p>
              <p className="text-[13px] text-muted-foreground mt-0.5">{topic.description}</p>
            </div>
            <span className="text-muted-foreground group-hover:text-primary transition-colors ml-4 shrink-0">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
