import type { Metadata } from "next";

import { headers } from "next/headers"; // added
import "./globals.css";
import ContextProvider from "@/context";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Canvas",
  description: "Place your pixel on the monad chain",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersData = await headers();
  const cookies = headersData.get("cookie");

  return (
    <html lang="en">
      <body>
        <ContextProvider cookies={cookies}>
          <Navbar />
          {children}
        </ContextProvider>
      </body>
    </html>
  );
}
