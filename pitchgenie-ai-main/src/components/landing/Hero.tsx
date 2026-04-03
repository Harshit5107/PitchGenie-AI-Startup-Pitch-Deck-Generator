import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] animate-glow" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-8 text-sm text-foreground/80"
        >
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Powered by Advanced AI
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6"
        >
          Turn Your Startup Idea into an{" "}
          <span className="text-gradient">Investor-Ready Pitch Deck</span>{" "}
          in Seconds
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto mb-10"
        >
          AI-powered platform that transforms your ideas into powerful business
          presentations that captivate investors.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/dashboard/create" className="btn-gradient flex items-center gap-2 text-base">
            Generate Pitch Deck
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button className="btn-outline-glow flex items-center gap-2 text-base">
            <Play className="h-4 w-4" />
            View Demo
          </button>
        </motion.div>

        {/* Floating UI mockup hint */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-16 md:mt-24 glass-card p-1.5 glow-border max-w-4xl mx-auto"
        >
          <div className="bg-card rounded-xl p-6 md:p-10 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-3 w-3 rounded-full bg-destructive/60" />
              <div className="h-3 w-3 rounded-full bg-accent/60" />
              <div className="h-3 w-3 rounded-full bg-success/60" />
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-lg bg-muted/50 border border-border/30 flex items-center justify-center">
                  <div className="w-3/4 space-y-2">
                    <div className="h-2 bg-primary/20 rounded-full w-full" />
                    <div className="h-1.5 bg-muted-foreground/10 rounded-full w-4/5" />
                    <div className="h-1.5 bg-muted-foreground/10 rounded-full w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
