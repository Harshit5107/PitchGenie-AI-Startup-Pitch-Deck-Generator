import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { PlusCircle, Clock, FileText, TrendingUp, Sparkles, LogIn, FileEdit, Trash2, Search } from "lucide-react";
import { ActivitiesCard } from "@/components/ui/activities-card";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { BACKEND_URL } from "@/lib/api";

const DashboardHome = () => {
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();

  const filteredDecks = decks.filter(d => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (d.idea || '').toLowerCase().includes(q) ||
      (d.selected_slides || []).some((s: string) => s.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    const fetchDecks = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      try {
        const res = await fetch(`${BACKEND_URL}/api/projects`, {
          headers: {
            "Authorization": `Bearer ${session.access_token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setDecks(data.projects || []);
        }
      } catch (err) {
        console.error("Failed to fetch custom decks", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDecks();
  }, [navigate]);

  const handleDeleteDeck = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this deck?")) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${BACKEND_URL}/api/projects/${id}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${session?.access_token}` }
      });
      
      if (!res.ok) throw new Error("Failed to delete deck");
      
      setDecks(prev => prev.filter(d => d.id !== id));
      toast.success("Deck deleted successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete deck");
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Welcome back 👋</h1>
          <p className="text-muted-foreground">Ready to create your next winning pitch?</p>
        </div>
        <Link
          to="/dashboard/create"
          className="btn-gradient hidden sm:inline-flex items-center gap-2"
        >
          <PlusCircle className="h-5 w-5" />
          Create New Pitch Deck
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total Decks</span>
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold">{filteredDecks.length}</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">This Month</span>
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <p className="text-3xl font-bold">{decks.length}</p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Decks */}
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold mb-4">Recent Decks</h2>
          {loading ? (
             <div className="text-muted-foreground text-sm">Loading your decks...</div>
          ) : decks.length === 0 ? (
            <div className="glass-card p-8 text-center flex flex-col items-center justify-center">
               <FileText className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
               <p className="font-semibold text-lg mb-1">No pitch decks yet</p>
               <p className="text-muted-foreground text-sm mb-4">You haven't generated any pitch decks. Click 'Create New Pitch Deck' to get started!</p>
            </div>
          ) : filteredDecks.length === 0 ? (
            <div className="glass-card p-8 text-center flex flex-col items-center justify-center">
               <Search className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
               <p className="font-semibold text-lg mb-1">No decks found</p>
               <p className="text-muted-foreground text-sm mb-4">No decks match "{searchQuery}". Try a different search term.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredDecks.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="glass-card-hover p-5 cursor-pointer"
                  onClick={() => navigate("/dashboard/editor", { state: { project: d } })}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold mb-1 truncate pr-2 max-w-[200px]">{d.idea?.substring(0, 30) || "Pitch Deck"}...</h3>
                      <p className="text-sm text-muted-foreground">{new Date(d.created_at).toLocaleDateString()} · {d.selected_slides?.length || 0} slides</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => handleDeleteDeck(e, d.id)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        title="Delete Deck"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Activity Card */}
        <motion.div 
          className="lg:col-span-1"
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold mb-4">Activity Log</h2>
          <ActivitiesCard
            title="Recent Activity"
            subtitle="Your recent platform actions"
            headerIcon={<Clock className="h-6 w-6 text-primary dark:text-primary" />}
            activities={
              decks.length > 0 ? [
                {
                  title: "Generated New Deck",
                  desc: decks[0]?.idea?.substring(0, 20) + "..." || "New Project",
                  time: "Just now",
                  icon: <Sparkles className="h-5 w-5 text-primary" />,
                },
                {
                  title: "Logged In",
                  desc: "Accessed securely via Supabase",
                  time: "Today",
                  icon: <LogIn className="h-5 w-5 text-gray-500" />,
                }
              ] : [
                {
                  title: "Logged In",
                  desc: "Account initialized",
                  time: "Just now",
                  icon: <LogIn className="h-5 w-5 text-gray-500" />,
                }
              ]
            }
          />
        </motion.div>
      </div>
      
      {/* Mobile CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="sm:hidden"
      >
        <Link
          to="/dashboard/create"
          className="btn-gradient flex w-full justify-center items-center gap-2"
        >
          <PlusCircle className="h-5 w-5" />
          Create New Pitch Deck
        </Link>
      </motion.div>
    </div>
  );
};

export default DashboardHome;
