import React from "react";
import { Link, useLocation } from "wouter";
import {
  AlertCircle, Ticket, NotebookPen, CheckCircle2,
  LayoutDashboard, Users, LogOut, Menu, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth";
import { useQueryClient } from "@tanstack/react-query";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar({ className, onClose }: { className?: string; onClose?: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/incidents", label: "Incidents", icon: AlertCircle },
    { href: "/service-requests", label: "Service Requests", icon: Ticket },
    { href: "/work-notes", label: "Work Notes", icon: NotebookPen },
    { href: "/resolutions", label: "Resolution Notes", icon: CheckCircle2 },
    ...(user?.role === "manager"
      ? [{ href: "/team", label: "Team Overview", icon: Users }]
      : []),
  ];

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
  };

  return (
    <div className={`flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border ${className}`}>
      {/* Logo */}
      <div className="flex h-14 items-center px-4 gap-2.5 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-lg bg-[#81b5a1] flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight">OpsLog</span>
          <span className="text-[10px] text-sidebar-foreground/40 tracking-wide">ServiceNow Tracker</span>
        </div>
      </div>

      {/* Role chip */}
      {user?.role === "manager" && (
        <div className="mx-3 mt-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold uppercase tracking-widest border border-amber-500/20">
            <Users className="w-2.5 h-2.5" /> Manager
          </span>
        </div>
      )}

      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-0.5 px-2">
          {links.map((link) => {
            const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} className="block" onClick={onClose}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-9 text-sm !transition-none ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                  }`}
                >
                  <link.icon className="w-4 h-4 shrink-0" />
                  {link.label}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <div className="flex items-center gap-2.5 px-1 py-1.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-[#81b5a1]/20 border border-[#81b5a1]/30 flex items-center justify-center font-semibold text-xs text-[#81b5a1] shrink-0">
            {user ? getInitials(user.displayName) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-tight">{user?.displayName}</p>
            <p className="text-[11px] text-sidebar-foreground/40 truncate">{user?.username}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground/50 hover:text-red-400 hover:bg-red-500/10 h-8 text-xs"
          onClick={handleLogout}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sheetOpen, setSheetOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar className="hidden md:flex w-60 shrink-0" />
      <div className="flex flex-col flex-1 min-w-0">
        <header className="h-14 border-b bg-card flex items-center px-4 md:hidden justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <div className="w-6 h-6 rounded bg-[#81b5a1] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            OpsLog
          </div>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-mr-2">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-60 border-r-0">
              <Sidebar onClose={() => setSheetOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
