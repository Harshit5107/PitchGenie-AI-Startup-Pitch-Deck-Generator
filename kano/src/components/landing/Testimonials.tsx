import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  { name: "Sarah Chen", role: "Founder, NexaAI", text: "PitchGenie helped us raise $2M in seed funding. The AI-generated deck was so polished, investors thought we hired a top agency.", avatar: "SC" },
  { name: "Marcus Johnson", role: "CEO, GrowthStack", text: "I went from idea to investor meeting in 24 hours. The pitch deck was better than anything I could have created manually.", avatar: "MJ" },
  { name: "Priya Sharma", role: "Co-founder, DataFlow", text: "The financial projections feature alone is worth the subscription. It saved us weeks of spreadsheet work.", avatar: "PS" },
];

const Testimonials = () => {
  return (
    <section className="section-padding">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Testimonials</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-3">
            Loved by <span className="text-gradient">Founders</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card-hover p-6"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-foreground/90 text-sm leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold text-primary-foreground">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-foreground/60 text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
