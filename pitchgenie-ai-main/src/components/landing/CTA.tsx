import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

const CTA = () => {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-foreground/5 rounded-full blur-[150px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-3xl mx-auto text-center"
      >
        <div className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-6 text-sm text-foreground">
          <Sparkles className="h-4 w-4" />
          Ready to get started?
        </div>

        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Build Your Winning Pitch Deck Today
        </h2>
        <p className="text-foreground/70 text-lg mb-10 max-w-xl mx-auto">
          Join thousands of founders who have already used PitchGenie to create stunning, investor-ready presentations in minutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup" className="btn-gradient flex items-center gap-2 text-base">
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/dashboard" className="btn-outline-glow text-base">
            Explore Dashboard
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          <div>
            <p className="text-3xl font-bold">10K+</p>
            <p className="text-foreground/60 text-sm mt-1">Decks Created</p>
          </div>
          <div>
            <p className="text-3xl font-bold">$50M+</p>
            <p className="text-foreground/60 text-sm mt-1">Funding Raised</p>
          </div>
          <div>
            <p className="text-3xl font-bold">98%</p>
            <p className="text-foreground/60 text-sm mt-1">Satisfaction</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default CTA;
