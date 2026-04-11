import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Star,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Leaf,
  Globe,
  ToggleLeft,
  Sliders,
} from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Recipes', href: '/recipes', icon: UtensilsCrossed },
    { name: 'Featured', href: '/featured', icon: Star },
    { name: 'Country of the Day', href: '/featured-country', icon: Globe },
    { name: 'Ingredients', href: '/ingredients', icon: Leaf },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Feature Flags', href: '/feature-flags', icon: ToggleLeft },
    { name: 'App Settings', href: '/app-settings', icon: Sliders },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-card border-r border-border shrink-0 flex flex-col sticky top-0 md:h-screen z-10 shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0 gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-serif text-sm font-bold italic">F&C</span>
          </div>
          <span className="font-serif font-bold text-lg tracking-tight text-foreground truncate">Fork & Compass</span>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href} className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}>
                  <item.icon className={cn(
                    "w-5 h-5 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  <span className="flex-1 truncate">{item.name}</span>
                  {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border shrink-0">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 group" asChild>
            <Link href="/login" onClick={() => localStorage.removeItem("admin_token")}>
              <LogOut className="mr-2 h-4 w-4 group-hover:text-destructive transition-colors" />
              Sign Out
            </Link>
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}