'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'

type Tab = {
	label: string;
	icon: string;
	href: string;
}

export default function NavLinks({ tabs }: { tabs: Tab[] }) {
	const pathname = usePathname()

	return (
		<>
			{tabs.map(tab => (
				<Link
					key={tab.label}
					href={tab.href}
					className={clsx(
						'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
						{
							'bg-sienna/10 text-sienna': pathname === tab.href,
							'text-muted-foreground hover:bg-muted hover:text-foreground': pathname !== tab.href,
						},
					)}
				>
					<span className="text-base leading-none">{tab.icon}</span>
					<span>{tab.label}</span>
				</Link>
			))}
		</>
	)
}
