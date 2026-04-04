import { motion } from "framer-motion";
import { Lightbulb, Cpu, Presentation } from "lucide-react";

const steps = [
  { icon: Lightbulb, step: "01", title: "Describe Your Idea", description: "Enter your startup details — name, problem, solution, and target market." },
  { icon: Cpu, step: "02", title: "AI Does the Magic", description: "Our AI analyzes your input and crafts a professional pitch deck with compelling content." },
  { icon: Presentation, step: "03", title: "Download & Present", description: "Review, customize, and export your investor-ready pitch deck instantly." },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="section-padding relative bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent text-sm font-semibold uppercase tracking-wider">How It Works</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4">
            Three Steps to Your <span className="text-gradient">Perfect Pitch</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-px bg-gradient-to-r from-primary/40 via-secondary/40 to-accent/40" />

          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="text-center relative"
            >
              <div className="relative inline-flex mb-6">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center">
                  <s.icon className="h-8 w-8 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {s.step}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
              <p className="text-foreground/60 text-sm max-w-xs mx-auto">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
