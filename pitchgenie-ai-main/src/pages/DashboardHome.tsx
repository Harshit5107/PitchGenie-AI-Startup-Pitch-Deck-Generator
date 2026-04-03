import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { PlusCircle, Clock, FileText, TrendingUp } from "lucide-react";

const stats = [
  { label: "Total Decks", value: "12", icon: FileText, color: "text-primary" },
  { label: "This Month", value: "4", icon: TrendingUp, color: "text-accent" },
  { label: "Hours Saved", value: "36", icon: Clock, color: "text-success" },
];

const recentDecks = [
  { title: "NexaAI Series A", date: "Mar 28, 2026", slides: 12 },
  { title: "GrowthStack Seed Round", date: "Mar 25, 2026", slides: 10 },
  { title: "DataFlow MVP Pitch", date: "Mar 20, 2026", slides: 8 },
  { title: "CloudSync Demo Day", date: "Mar 15, 2026", slides: 14 },
];

const DashboardHome = () => {
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Welcome back 👋</h1>
        <p className="text-muted-foreground">Ready to create your next winning pitch?</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="text-3xl font-bold">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Link
          to="/dashboard/create"
          className="btn-gradient inline-flex items-center gap-2"
        >
          <PlusCircle className="h-5 w-5" />
          Create New Pitch Deck
        </Link>
      </motion.div>

      {/* Recent */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="text-lg font-semibold mb-4">Recent Decks</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {recentDecks.map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="glass-card-hover p-5 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold mb-1">{d.title}</h3>
                  <p className="text-sm text-muted-foreground">{d.date} · {d.slides} slides</p>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardHome;
