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


      </div>
    </section>
  );
};

export default Hero;
