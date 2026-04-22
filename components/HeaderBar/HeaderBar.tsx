"use client";

// Headerbar for all '/:business/' pages

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const HeaderBar = () => {
	const router = useRouter();

	return (
		<header
			data-testid="headerbar"
			className="w-full h-16 bg-purple-200 flex justify-between items-center p-4 border-b-2 border-slate-300"
		>
			<div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => router.push("/")}>
				<img src="/coookies.png" alt="Bakedown logo" className="h-8 w-8" />
				<span className="text-xl font-bold text-blue-900">Bakedown</span>
			</div>

			<div className="flex-1 flex justify-end">
				<button
					type="button"
					onClick={() => signOut({ callbackUrl: "/login" })}
					className="text-blue-800 hover:text-blue-600 font-medium px-4 py-2 rounded transition"
					aria-label="Log out"
				>
					Log out
				</button>
			</div>
		</header>
	);
};

export default HeaderBar;
