"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface TopNavbarProps {
  onMenuClick?: () => void;
}

export function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard";
    if (pathname === "/create") return "Create Agent";
    if (pathname === "/agents") return "Agents";
    if (pathname.startsWith("/chat/")) return "Chat";
    if (pathname.startsWith("/voice/")) return "Voice Chat";

    // Handle dynamic routes
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      return segments[segments.length - 1]
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    return "RAG Builder";
  };

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        {/* Mobile menu button */}
        {onMenuClick && (
          <Button
            variant="ghost"
            size="sm"
            className="mr-3 h-8 w-8 p-0 md:hidden hover:bg-accent"
            onClick={onMenuClick}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        )}

        {/* Page title */}
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">
            {getPageTitle()}
          </h1>
        </div>

        {/* Theme toggle */}
        <ThemeToggle />
      </div>
    </div>
  );
}
