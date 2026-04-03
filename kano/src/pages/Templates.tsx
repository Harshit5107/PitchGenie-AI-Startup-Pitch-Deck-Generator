import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Search } from "lucide-react";

const categories = ["All", "Modern", "Minimal", "Corporate", "Bold Startup", "Creative", "Luxury", "Nature"];

const templates = [
  // ── Modern ──
  {
    name: "Modern Gradient",
    category: "Modern",
    slides: 12,
    bg: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    accent: "#a78bfa",
    titleBar: "#a78bfa",
    bulletColor: "rgba(167,139,250,0.4)",
    textColor: "rgba(255,255,255,0.5)",
  },
  {
    name: "Elegant Dark",
    category: "Modern",
    slides: 12,
    bg: "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    accent: "#e2b04a",
    titleBar: "#e2b04a",
    bulletColor: "rgba(226,176,74,0.3)",
    textColor: "rgba(255,255,255,0.4)",
  },
  {
    name: "Aurora Borealis",
    category: "Modern",
    slides: 12,
    bg: "linear-gradient(135deg, #0c0c1d 0%, #1b1145 30%, #0d2137 60%, #0a2e1f 100%)",
    accent: "#34d399",
    titleBar: "#34d399",
    bulletColor: "rgba(52,211,153,0.3)",
    textColor: "rgba(255,255,255,0.4)",
  },
  {
    name: "Cyber Pulse",
    category: "Modern",
    slides: 10,
    bg: "linear-gradient(135deg, #0a0014 0%, #190033 50%, #0d001a 100%)",
    accent: "#c084fc",
    titleBar: "#c084fc",
    bulletColor: "rgba(192,132,252,0.3)",
    textColor: "rgba(255,255,255,0.4)",
  },

  // ── Minimal ──
  {
    name: "Clean Minimal",
    category: "Minimal",
    slides: 10,
    bg: "linear-gradient(180deg, #fafafa 0%, #e8e8e8 100%)",
    accent: "#111111",
    titleBar: "#111111",
    bulletColor: "rgba(0,0,0,0.15)",
    textColor: "rgba(0,0,0,0.25)",
  },
  {
    name: "Simple White",
    category: "Minimal",
    slides: 8,
    bg: "linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)",
    accent: "#0ea5e9",
    titleBar: "#0ea5e9",
    bulletColor: "rgba(14,165,233,0.2)",
    textColor: "rgba(0,0,0,0.2)",
  },
  {
    name: "Soft Cream",
    category: "Minimal",
    slides: 10,
    bg: "linear-gradient(180deg, #fef9f3 0%, #f5ebe0 100%)",
    accent: "#b45309",
    titleBar: "#b45309",
    bulletColor: "rgba(180,83,9,0.18)",
    textColor: "rgba(0,0,0,0.2)",
  },
  {
    name: "Paper Cut",
    category: "Minimal",
    slides: 9,
    bg: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
    accent: "#6366f1",
    titleBar: "#6366f1",
    bulletColor: "rgba(99,102,241,0.18)",
    textColor: "rgba(0,0,0,0.22)",
  },

  // ── Corporate ──
  {
    name: "Corporate Pro",
    category: "Corporate",
    slides: 14,
    bg: "linear-gradient(135deg, #0a1628 0%, #162a50 100%)",
    accent: "#3b82f6",
    titleBar: "#3b82f6",
    bulletColor: "rgba(59,130,246,0.3)",
    textColor: "rgba(255,255,255,0.4)",
  },
  {
    name: "Enterprise Blue",
    category: "Corporate",
    slides: 16,
    bg: "linear-gradient(135deg, #0c1220 0%, #1e3a5f 100%)",
    accent: "#38bdf8",
    titleBar: "#38bdf8",
    bulletColor: "rgba(56,189,248,0.25)",
    textColor: "rgba(255,255,255,0.35)",
  },
  {
    name: "Board Room",
    category: "Corporate",
    slides: 14,
    bg: "linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%)",
    accent: "#94a3b8",
    titleBar: "#94a3b8",
    bulletColor: "rgba(148,163,184,0.25)",
    textColor: "rgba(255,255,255,0.35)",
  },

  // ── Bold Startup ──
  {
    name: "Bold Neon",
    category: "Bold Startup",
    slides: 10,
    bg: "linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 100%)",
    accent: "#f43f5e",
    titleBar: "#f43f5e",
    bulletColor: "rgba(244,63,94,0.35)",
    textColor: "rgba(255,255,255,0.4)",
  },
  {
    name: "Startup Fire",
    category: "Bold Startup",
    slides: 11,
    bg: "linear-gradient(135deg, #1a0000 0%, #2d1b00 100%)",
    accent: "#fb923c",
    titleBar: "#fb923c",
    bulletColor: "rgba(251,146,60,0.35)",
    textColor: "rgba(255,255,255,0.4)",
  },
  {
    name: "Electric Lime",
    category: "Bold Startup",
    slides: 10,
    bg: "linear-gradient(135deg, #0a0a0a 0%, #1a1a0a 100%)",
    accent: "#a3e635",
    titleBar: "#a3e635",
    bulletColor: "rgba(163,230,53,0.3)",
    textColor: "rgba(255,255,255,0.4)",
  },

  // ── Creative ──
  {
    name: "Sunset Vibes",
    category: "Creative",
    slides: 12,
    bg: "linear-gradient(135deg, #1a0a1e 0%, #2d1230 40%, #3d1520 70%, #2e1a08 100%)",
    accent: "#f472b6",
    titleBar: "#f472b6",
    bulletColor: "rgba(244,114,182,0.3)",
    textColor: "rgba(255,255,255,0.4)",
  },
  {
    name: "Retro Wave",
    category: "Creative",
    slides: 10,
    bg: "linear-gradient(180deg, #1a0533 0%, #2d0a4e 50%, #1a0a3d 100%)",
    accent: "#fb7185",
    titleBar: "#fb7185",
    bulletColor: "rgba(251,113,133,0.3)",
    textColor: "rgba(255,255,255,0.4)",
  },
  {
    name: "Candy Pop",
    category: "Creative",
    slides: 11,
    bg: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f5d0fe 100%)",
    accent: "#d946ef",
    titleBar: "#d946ef",
    bulletColor: "rgba(217,70,239,0.2)",
    textColor: "rgba(0,0,0,0.25)",
  },

  // ── Luxury ──
  {
    name: "Black & Gold",
    category: "Luxury",
    slides: 12,
    bg: "linear-gradient(160deg, #0a0a0a 0%, #1a1a0e 50%, #0d0d08 100%)",
    accent: "#fbbf24",
    titleBar: "#fbbf24",
    bulletColor: "rgba(251,191,36,0.25)",
    textColor: "rgba(255,255,255,0.35)",
  },
  {
    name: "Platinum",
    category: "Luxury",
    slides: 14,
    bg: "linear-gradient(135deg, #0f0f0f 0%, #262626 50%, #171717 100%)",
    accent: "#e5e5e5",
    titleBar: "#e5e5e5",
    bulletColor: "rgba(229,229,229,0.2)",
    textColor: "rgba(255,255,255,0.3)",
  },
  {
    name: "Rose Quartz",
    category: "Luxury",
    slides: 12,
    bg: "linear-gradient(135deg, #1a0a12 0%, #2d1420 50%, #1a0e14 100%)",
    accent: "#fda4af",
    titleBar: "#fda4af",
    bulletColor: "rgba(253,164,175,0.25)",
    textColor: "rgba(255,255,255,0.35)",
  },

  // ── Nature ──
  {
    name: "Forest Canopy",
    category: "Nature",
    slides: 12,
    bg: "linear-gradient(160deg, #0a1a0a 0%, #0f2e12 50%, #0a200e 100%)",
    accent: "#4ade80",
    titleBar: "#4ade80",
    bulletColor: "rgba(74,222,128,0.25)",
    textColor: "rgba(255,255,255,0.35)",
  },
  {
    name: "Ocean Depth",
    category: "Nature",
    slides: 10,
    bg: "linear-gradient(180deg, #021526 0%, #03346E 50%, #0a2540 100%)",
    accent: "#22d3ee",
    titleBar: "#22d3ee",
    bulletColor: "rgba(34,211,238,0.25)",
    textColor: "rgba(255,255,255,0.35)",
  },
  {
    name: "Desert Dusk",
    category: "Nature",
    slides: 11,
    bg: "linear-gradient(135deg, #1a1008 0%, #2d1e0a 50%, #3d2510 100%)",
    accent: "#f59e0b",
    titleBar: "#f59e0b",
    bulletColor: "rgba(245,158,11,0.25)",
    textColor: "rgba(255,255,255,0.35)",
  },
];

const Templates = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();

  const filtered = templates.filter((t) => {
    const matchesCategory = activeCategory === "All" || t.category === activeCategory;
    if (!searchQuery.trim()) return matchesCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template: typeof templates[0]) => {
    navigate("/dashboard/create", { state: { theme: template.name } });
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Templates</h1>
        <p className="text-muted-foreground mb-6">
          {searchQuery.trim()
            ? `${filtered.length} template${filtered.length !== 1 ? 's' : ''} found for "${searchQuery}"`
            : "Choose a template to get started."}
        </p>
      </motion.div>

      <div className="flex gap-2 mb-8 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              c === activeCategory
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 text-center flex flex-col items-center justify-center"
        >
          <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
          <p className="font-semibold text-lg mb-1">No templates found</p>
          <p className="text-muted-foreground text-sm">
            No templates match "<span className="text-foreground font-medium">{searchQuery}</span>". Try a different search term.
          </p>
        </motion.div>
      ) : (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filtered.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card-hover cursor-pointer group overflow-hidden rounded-xl"
            onClick={() => handleUseTemplate(t)}
          >
            {/* Mini Slide Preview */}
            <div
              className="aspect-[16/10] p-5 flex flex-col justify-between relative overflow-hidden"
              style={{ background: t.bg }}
            >
              {/* Decorative corner accent */}
              <div
                className="absolute top-0 right-0 w-20 h-20 opacity-20 rounded-bl-full"
                style={{ background: t.accent }}
              />

              {/* Mini slide content */}
              <div className="space-y-2.5 relative z-10">
                <div
                  className="h-3 rounded-full w-3/5"
                  style={{ background: t.titleBar }}
                />
                <div
                  className="h-1.5 rounded-full w-4/5"
                  style={{ background: t.bulletColor }}
                />
                <div
                  className="h-1.5 rounded-full w-3/5"
                  style={{ background: t.bulletColor }}
                />
                <div
                  className="h-1.5 rounded-full w-2/3"
                  style={{ background: t.bulletColor }}
                />
              </div>

              {/* Bottom bar */}
              <div className="flex items-end justify-between relative z-10">
                <div
                  className="h-1 rounded-full w-1/4"
                  style={{ background: t.textColor }}
                />
                <div
                  className="h-1 rounded-full w-12"
                  style={{ background: t.textColor }}
                />
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                <span className="text-white font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  Use Template
                </span>
              </div>
            </div>

            {/* Card footer */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">{t.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {t.category} · {t.slides} slides
                </p>
              </div>
              <div
                className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-background"
                style={{ background: t.accent, boxShadow: `0 0 8px ${t.accent}40` }}
              />
            </div>
          </motion.div>
        ))}
      </div>
      )}
    </div>
  );
};

export default Templates;
