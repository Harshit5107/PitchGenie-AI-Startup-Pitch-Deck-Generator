import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Share2, FileText, GripVertical } from "lucide-react";

const slides = [
  { id: 1, title: "Cover Slide", content: "NexaAI – AI for Everyone" },
  { id: 2, title: "Problem", content: "Current solutions are too complex and expensive for SMBs" },
  { id: 3, title: "Solution", content: "Simple, affordable AI platform for small businesses" },
  { id: 4, title: "Market Size", content: "$50B TAM by 2028" },
  { id: 5, title: "Business Model", content: "SaaS subscription with tiered pricing" },
  { id: 6, title: "Traction", content: "500+ beta users, $30K MRR" },
  { id: 7, title: "Team", content: "Ex-Google, Ex-Meta engineering leaders" },
  { id: 8, title: "Ask", content: "Raising $2M seed round" },
];

const DeckEditor = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <div className="h-[calc(100vh-7rem)]">
      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <h1 className="text-xl font-bold">NexaAI – Series A Pitch</h1>
        <div className="flex items-center gap-2">
          <button className="btn-outline-glow !py-2 !px-4 text-sm flex items-center gap-2">
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button className="btn-outline-glow !py-2 !px-4 text-sm flex items-center gap-2">
            <Download className="h-4 w-4" /> PDF
          </button>
          <button className="btn-gradient !py-2 !px-4 text-sm flex items-center gap-2">
            <Download className="h-4 w-4" /> PPT
          </button>
        </div>
      </motion.div>

      <div className="flex gap-4 h-[calc(100%-3rem)]">
        {/* Slide thumbnails */}
        <div className="w-48 flex-shrink-0 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveSlide(i)}
              className={`w-full text-left rounded-xl p-3 transition-all duration-200 flex items-center gap-2 ${
                i === activeSlide
                  ? "glass-card glow-border"
                  : "hover:bg-card/50 border border-transparent"
              }`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Slide {i + 1}</p>
                <p className="text-sm font-medium truncate">{s.title}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Main preview */}
        <div className="flex-1 glass-card p-8 flex items-center justify-center">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl aspect-[16/9] bg-card rounded-xl border border-border/50 p-10 flex flex-col justify-center"
          >
            <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-3">
              {slides[activeSlide].title}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{slides[activeSlide].content}</h2>
            <div className="space-y-2 mt-4">
              <div className="h-2 bg-muted/50 rounded-full w-4/5" />
              <div className="h-2 bg-muted/50 rounded-full w-3/5" />
              <div className="h-2 bg-muted/50 rounded-full w-2/5" />
            </div>
          </motion.div>
        </div>

        {/* Edit panel */}
        <div className="w-64 flex-shrink-0 glass-card p-5 space-y-5 overflow-y-auto">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Slide Title</label>
            <input type="text" defaultValue={slides[activeSlide].title} className="input-glow w-full text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Content</label>
            <textarea rows={6} defaultValue={slides[activeSlide].content} className="input-glow w-full text-sm resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Notes</label>
            <textarea rows={3} placeholder="Speaker notes..." className="input-glow w-full text-sm resize-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckEditor;
