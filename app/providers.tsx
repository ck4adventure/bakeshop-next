"use client"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from 'next-themes'
import { SWRConfig } from 'swr'
import { fetcher } from '@/lib/fetcher'

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider attribute={"data-mode"} defaultTheme="system" enableSystem>
			<SessionProvider>
				<SWRConfig value={{ fetcher }}>
					{children}
				</SWRConfig>
			</SessionProvider>
		</ThemeProvider>
	)
}