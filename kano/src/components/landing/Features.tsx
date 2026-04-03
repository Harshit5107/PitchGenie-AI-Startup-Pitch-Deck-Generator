import { motion } from "framer-motion";
import { Zap, Brain, Palette, Download, Shield, BarChart3 } from "lucide-react";

const features = [
  { icon: Brain, title: "AI-Powered Generation", description: "Advanced AI analyzes your startup idea and generates comprehensive pitch decks in seconds." },
  { icon: Palette, title: "Premium Templates", description: "Choose from a curated collection of investor-approved templates designed by professionals." },
  { icon: Zap, title: "Instant Results", description: "No more spending weeks on presentations. Get your pitch deck ready in under 60 seconds." },
  { icon: Download, title: "Export Anywhere", description: "Download as PDF, PowerPoint, or share a live link with potential investors." },
  { icon: Shield, title: "Secure & Private", description: "Your startup ideas are encrypted and never shared. Complete privacy guaranteed." },
  { icon: BarChart3, title: "Financial Projections", description: "AI-generated financial models and projections that investors actually want to see." },
];

const Features = () => {
  return (
    <section id="features" className="section-padding relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Features</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4">
            Everything You Need to <span className="text-gradient">Win Investors</span>
          </h2>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
            Powerful tools designed to help you create, refine, and deliver pitch decks that stand out.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card-hover p-6 md:p-8 group"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-foreground/70 text-sm leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
