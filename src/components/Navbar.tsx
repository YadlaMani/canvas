"use client";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ConnectButton } from "./ConnectButton";
import { Card } from "./ui/card";
import { ThemeSwitcher } from "./theme-switcher";
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="relative mt-2 mx-2">
      <Card>
        <nav className="flex items-center justify-between px-6 py-4 shadow-md mt-2 mx-2rounded-2xl">
          <div className="text-xl font-bold">Canvas</div>

          <div className="hidden md:flex gap-6">
            <div className="bg-white rounded-2xl">
              <ConnectButton />
            </div>

            <ThemeSwitcher />
          </div>

          <div className="md:hidden">
            <Button size="icon" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </nav>
      </Card>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mx-2 mt-2 bg-white rounded-2xl shadow-md flex flex-col items-center gap-4 py-4 md:hidden z-50">
          <ConnectButton />
          <ThemeSwitcher />
        </div>
      )}
    </header>
  );
}
