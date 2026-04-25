import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { DM_Sans } from "next/font/google";
import { cn } from "@/lib/utils";


const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' });

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
    <html lang="en" className={cn("font-sans", dmSans.variable)} suppressHydrationWarning>
      <body className="">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
