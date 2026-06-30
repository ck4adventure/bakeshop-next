'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const HELP_TOPICS = [
  { label: 'Overview', href: '/help' },
  { label: 'Today', href: '/help/today' },
  { label: 'Inventory', href: '/help/inventory' },
  { label: 'Schedule', href: '/help/schedule' },
  { label: 'History', href: '/help/history' },
  { label: 'Manage Items', href: '/help/manage-items' },
  { label: 'Operating Days', href: '/help/operating-days' },
  { label: 'Settings', href: '/help/settings' },
]

export default function HelpNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5">
      {HELP_TOPICS.map(topic => (
        <Link
          key={topic.href}
          href={topic.href}
          aria-current={pathname === topic.href ? 'page' : undefined}
          className={clsx(
            'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            pathname === topic.href
              ? 'bg-sienna/10 text-sienna'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {topic.label}
        </Link>
      ))}
    </nav>
  )
}
