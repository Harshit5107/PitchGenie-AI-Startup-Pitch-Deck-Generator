import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, PlusCircle, FolderOpen, LayoutTemplate,
  Settings, Sparkles, Search, Bell, ChevronLeft, LogOut, User, X,
  FileText, CheckCircle2, Info, Clock, Trash2, ChevronRight
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { ModeToggle } from "../ModeToggle";
import { BACKEND_URL } from "@/lib/api";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: PlusCircle, label: "Create Deck", path: "/dashboard/create" },
  { icon: FolderOpen, label: "My Decks", path: "/dashboard/decks" },
  { icon: LayoutTemplate, label: "Templates", path: "/dashboard/templates" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: "deck" | "success" | "info";
}

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userInitials, setUserInitials] = useState("U");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Load user info and generate notifications
  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const email = session.user.email || "";
        const meta = session.user.user_metadata;
        const name = meta?.full_name || meta?.name || email.split("@")[0];
        setUserEmail(email);
        setUserName(name);
        setUserInitials(
          name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
        );

        // Fetch decks to build notifications
        try {
          const res = await fetch(`${BACKEND_URL}/api/projects`, {
            headers: { "Authorization": `Bearer ${session.access_token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const projects = data.projects || [];
            const notifs: Notification[] = [];

            // Recent deck notifications
            projects.slice(0, 3).forEach((p: any, i: number) => {
              const date = new Date(p.created_at);
              const now = new Date();
              const diffMs = now.getTime() - date.getTime();
              const diffMins = Math.floor(diffMs / 60000);
              const diffHrs = Math.floor(diffMins / 60);
              const diffDays = Math.floor(diffHrs / 24);
              let timeStr = "just now";
              if (diffDays > 0) timeStr = `${diffDays}d ago`;
              else if (diffHrs > 0) timeStr = `${diffHrs}h ago`;
              else if (diffMins > 0) timeStr = `${diffMins}m ago`;

              notifs.push({
                id: `deck-${p.id}`,
                title: "Deck Generated",
                message: `"${(p.idea || "Pitch Deck").substring(0, 35)}${(p.idea?.length || 0) > 35 ? '...' : ''}" is ready`,
                time: timeStr,
                read: i > 0,
                icon: "deck",
              });
            });

            // Welcome notification
            notifs.push({
              id: "welcome",
              title: "Welcome to PitchGenie!",
              message: "Create stunning AI pitch decks in seconds.",
              time: "Today",
              read: true,
              icon: "info",
            });

            setNotifications(notifs);
          }
        } catch { /* ignore */ }
      }
    };
    loadUser();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const clearNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch {
      toast.error("Failed to log out");
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "deck": return <FileText className="h-4 w-4 text-primary" />;
      case "success": return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "info": return <Info className="h-4 w-4 text-blue-400" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

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
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-card/50 w-full transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? "ml-[72px]" : "ml-[260px]"}`}>
        {/* Top bar */}
        <header className="h-16 border-b border-border/30 flex items-center justify-between px-6 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search decks..." 
              className="input-glow w-full !pl-10 !py-2 text-sm !pr-8" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* ── Notification Bell ── */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
                className="relative p-2 rounded-xl text-foreground/80 hover:text-foreground hover:bg-white/10 transition-all"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-lg shadow-red-500/40">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-2 w-[360px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id)}
                            className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors group ${
                              !n.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                            }`}
                          >
                            <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${!n.read ? 'bg-primary/15' : 'bg-muted'}`}>
                              {getNotifIcon(n.icon)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-medium truncate ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {n.title}
                                </p>
                                {!n.read && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{n.message}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3 text-muted-foreground/60" />
                                <span className="text-[11px] text-muted-foreground/60">{n.time}</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => clearNotification(e, n.id)}
                              className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all flex-shrink-0 mt-0.5"
                              title="Dismiss"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="border-t border-border/50 px-4 py-2.5">
                        <button
                          onClick={() => { setNotifications([]); setShowNotifications(false); }}
                          className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors w-full text-center"
                        >
                          Clear all notifications
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ModeToggle />

            {/* ── Profile Avatar ── */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
                className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-400 via-primary to-cyan-400 flex items-center justify-center cursor-pointer hover:shadow-lg hover:shadow-primary/30 transition-all ring-2 ring-white/20 hover:ring-white/40"
                title={userName || "Profile"}
              >
                <span className="text-xs font-bold text-white drop-shadow-sm">{userInitials}</span>
              </button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    {/* User Info */}
                    <div className="px-4 py-4 border-b border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary-foreground">{userInitials}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{userName || "User"}</p>
                          <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1.5">
                      <button
                        onClick={() => { navigate("/dashboard"); setShowProfile(false); }}
                        className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                        <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-40" />
                      </button>
                      <button
                        onClick={() => { navigate("/dashboard/decks"); setShowProfile(false); }}
                        className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <FolderOpen className="h-4 w-4" />
                        <span>My Decks</span>
                        <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-40" />
                      </button>
                      <button
                        onClick={() => { navigate("/dashboard/settings"); setShowProfile(false); }}
                        className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                        <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-40" />
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-border/50 py-1.5">
                      <button
                        onClick={() => { setShowProfile(false); handleLogout(); }}
                        className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-sm text-destructive/80 hover:text-destructive hover:bg-destructive/5 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Log out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="p-6 md:p-8">
          <Outlet context={{ searchQuery }} />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
