import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

const messages = [
  "Analyzing your startup idea...",
  "Crafting compelling narratives...",
  "Generating investor-ready slides...",
  "Adding financial projections...",
  "Polishing your pitch deck...",
];

const GeneratingPage = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        if (prev >= messages.length - 1) {
          clearInterval(interval);
          setTimeout(() => navigate("/dashboard/editor"), 1000);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] animate-glow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[100px] animate-glow" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="inline-flex mb-8"
        >
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_40px_hsl(263,83%,58%,0.3)]">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
        </motion.div>

        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-medium mb-4"
        >
          {messages[messageIndex]}
        </motion.p>

        <div className="w-64 mx-auto h-1 bg-border rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${((messageIndex + 1) / messages.length) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default GeneratingPage;
