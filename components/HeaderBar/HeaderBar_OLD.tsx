"use client";

// Headerbar for all '/:business/' pages

import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

const HeaderBar = () => {
	return (
		<header
			data-testid="headerbar"
			className="w-full h-16 bg-purple-200 flex justify-between items-center p-4 border-b-2 border-slate-300"
		>
			<Link href="/" className="flex items-center gap-2 flex-1">
				<Image src="/cookies.png" alt="Bakedown logo" width={32} height={32} />
				<span className="text-xl font-bold text-blue-900">Bakedown</span>
			</Link>

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
