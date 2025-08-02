import type { Metadata } from "next";

import { headers } from "next/headers";
import "./globals.css";
import ContextProvider from "@/context";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
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
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <ContextProvider cookies={cookies}>
            <Navbar />
            <Toaster richColors position="top-right" />
            {children}
          </ContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
