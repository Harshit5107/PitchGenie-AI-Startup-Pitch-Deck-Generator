import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, PlusCircle, FolderOpen, LayoutTemplate,
  Settings, Sparkles, Search, Bell, ChevronLeft, LogOut, User
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: PlusCircle, label: "Create Deck", path: "/dashboard/create" },
  { icon: FolderOpen, label: "My Decks", path: "/dashboard/decks" },
  { icon: LayoutTemplate, label: "Templates", path: "/dashboard/templates" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-0 bottom-0 z-40 bg-muted/50 border-r border-border/30 flex flex-col"
      >
        <div className="flex items-center gap-2 px-4 h-16 border-b border-border/30">
          <Sparkles className="h-6 w-6 text-primary flex-shrink-0" />
          {!collapsed && <span className="text-gradient font-bold text-lg">PitchGenie</span>}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-border/30">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-card/50 w-full transition-colors"
          >
            <ChevronLeft className={`h-5 w-5 flex-shrink-0 transition-transform ${collapsed ? "rotate-180" : ""}`} />
            {!collapsed && <span>Collapse</span>}
          </button>
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-card/50 w-full transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Log out</span>}
          </Link>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? "ml-[72px]" : "ml-[260px]"}`}>
        {/* Top bar */}
        <header className="h-16 border-b border-border/30 flex items-center justify-between px-6 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Search decks..." className="input-glow w-full !pl-10 !py-2 text-sm" />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        </header>

        <main className="p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
