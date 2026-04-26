"use client"
import Image from 'next/image';
import Link from 'next/link';
import { Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { signOut, useSession } from 'next-auth/react';

export default function Header () {
	const { resolvedTheme, setTheme } = useTheme();
	const { data: session } = useSession();

	function toggle() {
		setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
	}

	function handleLogout() {
		signOut({ callbackUrl: '/login' });
	}

	return (
      <header className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-40 flex items-center px-4 gap-3">
        <Link href="/" className="flex items-center gap-2 flex-1">
          <Image src="/cookies_clear.png" alt="Bakeshop logo" className="h-6 w-6" width={100} height={60}/>
          <span className="hidden sm:inline text-base font-semibold tracking-tight text-muted-foreground">The Daily Bake</span>
        </Link>

        {session?.user?.bakeryName && (
          <span className="absolute left-1/2 -translate-x-1/2 text-base italic text-sienna font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>{session.user.bakeryName}</span>
        )}

				
				{/* theme toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

				{/* logout button */}
        <button
          onClick={handleLogout}
          aria-label="Log out"
          className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <LogOut size={18} />
        </button>
      </header>
	)
 }
