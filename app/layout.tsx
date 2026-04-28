import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next"



const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: "The Daily Bake App",
  description: "Inventory and Daily Quotas for Bakeshops and Cafes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", dmSans.variable, playfair.variable)} suppressHydrationWarning>
      <body className="">
        <Providers>{children}</Providers>
				<Analytics />
      </body>
    </html>
  );
}
