"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  X,
  Sparkles,
  LayoutDashboard,
  Shield,
  Gift,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";

const NAV_LINKS = [
  { label: "Comment ça marche", target: "how" },
  { label: "Opportunités", target: "opportunities" },
  { label: "Tarifs", view: "pricing" as const },
  { label: "Ambassadeur", view: "ambassador" as const },
  { label: "FAQ", target: "faq" },
];

export function Navbar() {
  const user = useApp((s) => s.user);
  const setView = useApp((s) => s.setView);
  const logout = useApp((s) => s.logout);
  const setAuthMode = useApp((s) => s.setAuthMode);
  const setShareOpen = useApp((s) => s.setShareOpen);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe mount flag for next-themes
  useEffect(() => setMounted(true), []);

  const scrollTo = (id: string) => {
    setView("landing");
    setMobileOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass-strong border-b border-white/10">
        <nav className="container mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button
            onClick={() => setView("landing")}
            className="flex items-center gap-2.5 group"
            aria-label="Accueil ArbiTech"
          >
            <span className="relative grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-teal-400 text-white font-bold shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="font-display font-extrabold text-lg tracking-tight">
              <span className="text-aurora">ArbiTech</span>
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) =>
              link.view ? (
                <button
                  key={link.label}
                  onClick={() => setView(link.view!)}
                  className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
                >
                  {link.label}
                </button>
              ) : (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.target!)}
                  className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/5 rounded-lg transition-colors"
                >
                  {link.label}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="grid place-items-center w-9 h-9 rounded-lg hover:bg-white/5 transition-colors"
                aria-label="Changer de thème"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-white/5 transition-colors">
                    <Avatar className="w-8 h-8 border border-white/15">
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs font-semibold">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                      {user.name || "Mon compte"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="flex flex-col gap-1">
                    <span>{user.name || "Utilisateur"}</span>
                    <span className="text-xs text-muted-foreground font-normal truncate">{user.email}</span>
                    {user.plan && (
                      <Badge className="w-fit mt-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0">
                        <Zap className="w-3 h-3 mr-1" /> {user.plan.name}
                      </Badge>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setView("dashboard")}>
                    <LayoutDashboard className="w-4 h-4 mr-2" /> Tableau de bord
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView("ambassador")}>
                    <Gift className="w-4 h-4 mr-2" /> Gagner en parrainant
                  </DropdownMenuItem>
                  {user.role === "ADMIN" && (
                    <DropdownMenuItem onClick={() => setView("admin")}>
                      <Shield className="w-4 h-4 mr-2" /> Administration
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShareOpen(true)}>
                    <UserIcon className="w-4 h-4 mr-2" /> Partager ArbiTech
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAuthMode("login");
                    setView("auth");
                  }}
                >
                  Connexion
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0"
                  onClick={() => {
                    setAuthMode("register");
                    setView("auth");
                  }}
                >
                  Commencer gratuitement
                </Button>
              </div>
            )}

            <button
              className="lg:hidden grid place-items-center w-9 h-9 rounded-lg hover:bg-white/5"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {mobileOpen && (
          <div className="lg:hidden border-t border-white/10 glass-strong">
            <div className="container mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) =>
                link.view ? (
                  <button
                    key={link.label}
                    onClick={() => {
                      setView(link.view!);
                      setMobileOpen(false);
                    }}
                    className="text-left px-3 py-2.5 rounded-lg hover:bg-white/5 text-sm font-medium"
                  >
                    {link.label}
                  </button>
                ) : (
                  <button
                    key={link.label}
                    onClick={() => scrollTo(link.target!)}
                    className="text-left px-3 py-2.5 rounded-lg hover:bg-white/5 text-sm font-medium"
                  >
                    {link.label}
                  </button>
                )
              )}
              {!user && (
                <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-white/10">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAuthMode("login");
                      setView("auth");
                      setMobileOpen(false);
                    }}
                  >
                    Connexion
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0"
                    onClick={() => {
                      setAuthMode("register");
                      setView("auth");
                      setMobileOpen(false);
                    }}
                  >
                    Commencer gratuitement
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
