import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import NavLinks from "@/components/nav-links";
import BottomNav from "@/components/bottom-nav";

const TABS = [
	{ label: "Today", icon: "☀️", href: "/shopid/today" },
	{ label: "Schedule", icon: "📅", href: "/shopid/schedule" },
	{ label: "Inventory", icon: "📦", href: "/shopid/inventory" },
	{ label: "History", icon: "🥐", href: "/shopid/history" },
] as const;

const ADMIN_TABS = [
	{ label: "Manage Items", icon: "🗂️", href: "/shopid/manage-items" },
	{ label: "Settings", icon: "⚙️", href: "/shopid/settings" },
] as const;

export default async function Nav() {
	const session = await getServerSession(authOptions)
	const canManage = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER';
	const sidebarTabs = canManage ? [...TABS, ...ADMIN_TABS] : TABS;

	return (
		<>
			<aside className="hidden md:flex landscape:flex flex-col w-56 fixed top-14 left-0 bottom-0 bg-card border-r border-border z-30">
				<nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
					<NavLinks tabs={[...sidebarTabs]} />
				</nav>
				<div className="px-4 py-4 border-t border-border shrink-0">
					<p className="text-xs text-muted-foreground truncate">{session?.user?.name}</p>
				</div>
			</aside>

			<BottomNav tabs={[...TABS]} adminTabs={[...ADMIN_TABS]} canManage={canManage} />
		</>
	)
}
