"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface DashboardSidebarProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DashboardSidebar({
  isOpen,
  onOpenChange,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Create Agent", href: "/create", icon: Plus },
    { name: "Agents List", href: "/agents", icon: Bot },
    {
      name: "Voice Agent",
      href: "/voice",
      icon: Bot,
    },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="rounded-lg bg-primary p-2">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">RAG Builder</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                pathname === item.href
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => onOpenChange?.(false)}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  pathname === item.href
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-accent-foreground"
                )}
              />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">AI Assistant</p>
            <p className="text-xs text-muted-foreground">Ready to help</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden border-r border-border bg-card md:block md:w-64">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-64 p-0 bg-card">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
