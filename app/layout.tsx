import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Bakeshop App",
  description: "Inventory and Daily Quotas for Bakeshops and Cafes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
    >
      <body className="">{children}</body>
    </html>
  );
}
