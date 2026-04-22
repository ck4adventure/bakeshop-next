'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'
import clsx from 'clsx'

type Tab = {
	label: string
	icon: string
	href: string
}

export default function BottomNav({
	tabs,
	adminTabs,
	canManage,
}: {
	tabs: Tab[]
	adminTabs: Tab[]
	canManage: boolean
}) {
	const pathname = usePathname()
	const [moreOpen, setMoreOpen] = useState(false)
	const moreIsActive = adminTabs.some(t => pathname === t.href)

	return (
		<nav className="flex md:hidden landscape:hidden fixed bottom-0 left-0 w-full h-16 bg-card border-t border-border z-40">
			{tabs.map(tab => (
				<Link
					key={tab.href}
					href={tab.href}
					className={clsx(
						'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
						pathname === tab.href ? 'text-sienna' : 'text-muted-foreground',
					)}
				>
					<span className="text-xl leading-none">{tab.icon}</span>
					<span className="text-[11px]">{tab.label}</span>
				</Link>
			))}

			{canManage && (
				<div className="flex-1 relative flex flex-col items-center justify-center">
					{moreOpen && (
						<>
							<div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
							<div className="absolute bottom-full right-0 mb-1 bg-card border border-border rounded-lg shadow-lg w-44 py-1 z-50">
								{adminTabs.map(tab => (
									<Link
										key={tab.href}
										href={tab.href}
										onClick={() => setMoreOpen(false)}
										className={clsx(
											'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors',
											pathname === tab.href
												? 'text-sienna'
												: 'text-muted-foreground hover:text-foreground',
										)}
									>
										<span className="text-base">{tab.icon}</span>
										<span>{tab.label}</span>
									</Link>
								))}
							</div>
						</>
					)}
					<button
						onClick={() => setMoreOpen(o => !o)}
						className={clsx(
							'flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors',
							moreIsActive || moreOpen ? 'text-sienna' : 'text-muted-foreground',
						)}
					>
						<MoreHorizontal size={20} />
						<span className="text-[11px]">More</span>
					</button>
				</div>
			)}
		</nav>
	)
}
