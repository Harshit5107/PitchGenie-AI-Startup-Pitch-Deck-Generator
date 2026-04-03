import { motion } from "framer-motion";
import { FileText } from "lucide-react";

const decks = [
  { title: "NexaAI Series A", date: "Mar 28, 2026", slides: 12, status: "Complete" },
  { title: "GrowthStack Seed", date: "Mar 25, 2026", slides: 10, status: "Complete" },
  { title: "DataFlow MVP", date: "Mar 20, 2026", slides: 8, status: "Draft" },
  { title: "CloudSync Demo", date: "Mar 15, 2026", slides: 14, status: "Complete" },
  { title: "FinTrack Pre-Seed", date: "Mar 10, 2026", slides: 9, status: "Draft" },
  { title: "EcoVenture Pitch", date: "Mar 5, 2026", slides: 11, status: "Complete" },
];

const MyDecks = () => {
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">My Decks</h1>
        <p className="text-muted-foreground mb-8">All your pitch decks in one place.</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((d, i) => (
          <motion.div
            key={d.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card-hover p-5 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <FileText className="h-8 w-8 text-primary/60" />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                d.status === "Complete" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"
              }`}>
                {d.status}
              </span>
            </div>
            <h3 className="font-semibold mb-1">{d.title}</h3>
            <p className="text-sm text-muted-foreground">{d.date} · {d.slides} slides</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MyDecks;
