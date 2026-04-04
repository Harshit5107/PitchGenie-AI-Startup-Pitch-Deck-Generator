import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useOutletContext } from "react-router-dom";
import { FileText, Trash2, Search, Clock, SlidersHorizontal, ArrowUpDown, ChevronDown } from "lucide-react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";

const MyDecks = () => {
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const navigate = useNavigate();
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();

  useEffect(() => {
    const fetchDecks = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      try {
        const res = await fetch("http://localhost:3001/api/projects", {
          headers: {
            "Authorization": `Bearer ${session.access_token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setDecks(data.projects || []);
        }
      } catch (err) {
        console.error("Failed to fetch decks", err);
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
      const res = await fetch(`http://localhost:3001/api/projects/${id}`, {
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

  // Filter decks based on search query
  const filteredDecks = decks.filter(d => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (d.idea || '').toLowerCase().includes(q) ||
      (d.selected_slides || []).some((s: string) => s.toLowerCase().includes(q)) ||
      (d.theme || '').toLowerCase().includes(q)
    );
  });

  // Sort decks
  const sortedDecks = [...filteredDecks].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "name-asc":
        return (a.idea || '').localeCompare(b.idea || '');
      case "name-desc":
        return (b.idea || '').localeCompare(a.idea || '');
      default:
        return 0;
    }
  });

  const sortLabels: Record<SortOption, string> = {
    "newest": "Newest First",
    "oldest": "Oldest First",
    "name-asc": "Name A-Z",
    "name-desc": "Name Z-A",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">My Decks</h1>
            <p className="text-muted-foreground">
              {loading ? "Loading..." : `${sortedDecks.length} deck${sortedDecks.length !== 1 ? 's' : ''} found`}
              {searchQuery.trim() && ` for "${searchQuery}"`}
            </p>
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortLabels[sortBy]}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
                >
                  {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setSortBy(key); setShowSortMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        sortBy === key
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      {sortLabels[key]}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="h-8 w-8 rounded-lg bg-muted" />
                <div className="h-5 w-16 rounded-full bg-muted" />
              </div>
              <div className="h-4 w-3/4 rounded bg-muted mb-2" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : decks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 text-center flex flex-col items-center justify-center"
        >
          <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
          <p className="font-semibold text-lg mb-1">No pitch decks yet</p>
          <p className="text-muted-foreground text-sm mb-5">Start by creating your first pitch deck!</p>
          <button
            onClick={() => navigate("/dashboard/create")}
            className="btn-gradient px-6 py-2.5 text-sm"
          >
            Create New Deck
          </button>
        </motion.div>
      ) : sortedDecks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 text-center flex flex-col items-center justify-center"
        >
          <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
          <p className="font-semibold text-lg mb-1">No results found</p>
          <p className="text-muted-foreground text-sm">
            No decks match "<span className="text-foreground font-medium">{searchQuery}</span>". Try a different search term.
          </p>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {sortedDecks.map((d, i) => (
              <motion.div
                key={d.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="glass-card-hover p-5 cursor-pointer group"
                onClick={() => navigate("/dashboard/editor", { state: { project: d } })}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-success/10 text-success">
                      {d.selected_slides?.length || 0} slides
                    </span>
                    <button
                      onClick={(e) => handleDeleteDeck(e, d.id)}
                      className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      title="Delete Deck"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold mb-1.5 line-clamp-2 leading-snug">
                  {d.idea?.substring(0, 50) || "Pitch Deck"}
                  {(d.idea?.length || 0) > 50 ? "..." : ""}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {d.theme && (
                  <div className="mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                      {d.theme}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default MyDecks;
