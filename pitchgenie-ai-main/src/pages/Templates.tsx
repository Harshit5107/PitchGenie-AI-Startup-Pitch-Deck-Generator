import { motion } from "framer-motion";

const categories = ["All", "Modern", "Minimal", "Corporate", "Bold Startup"];

const templates = [
  { name: "Modern Gradient", category: "Modern", slides: 12 },
  { name: "Clean Minimal", category: "Minimal", slides: 10 },
  { name: "Corporate Pro", category: "Corporate", slides: 14 },
  { name: "Bold Neon", category: "Bold Startup", slides: 10 },
  { name: "Elegant Dark", category: "Modern", slides: 12 },
  { name: "Simple White", category: "Minimal", slides: 8 },
  { name: "Enterprise Blue", category: "Corporate", slides: 16 },
  { name: "Startup Fire", category: "Bold Startup", slides: 11 },
];

const Templates = () => {
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Templates</h1>
        <p className="text-muted-foreground mb-6">Choose a template to get started.</p>
      </motion.div>

      <div className="flex gap-2 mb-8 flex-wrap">
        {categories.map((c) => (
          <button key={c} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            c === "All" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
          }`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="glass-card-hover cursor-pointer group overflow-hidden"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <div className="w-3/4 space-y-2">
                <div className="h-3 bg-primary/20 rounded-full w-full" />
                <div className="h-2 bg-muted-foreground/10 rounded-full w-4/5" />
                <div className="h-2 bg-muted-foreground/10 rounded-full w-3/5" />
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-sm">{t.name}</h3>
              <p className="text-xs text-muted-foreground">{t.category} · {t.slides} slides</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Templates;
