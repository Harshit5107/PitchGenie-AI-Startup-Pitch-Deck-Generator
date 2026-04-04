import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out PitchGenie",
    features: ["1 pitch deck per month", "3 basic templates", "PDF export", "Community support"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "For serious founders building their future",
    features: ["Unlimited pitch decks", "All premium templates", "PDF & PPT export", "AI financial projections", "Priority support", "Custom branding"],
    cta: "Upgrade Now",
    highlighted: true,
  },
  {
    name: "Premium",
    price: "$79",
    period: "per month",
    description: "Enterprise-grade features for teams",
    features: ["Everything in Pro", "AI pitch script generator", "Investor analytics", "Team collaboration", "API access", "Dedicated account manager"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="section-padding relative bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-accent text-sm font-semibold uppercase tracking-wider">Pricing</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4">
            Simple, <span className="text-gradient">Transparent</span> Pricing
          </h2>
          <p className="text-foreground/70 text-lg">Start free. Upgrade when you're ready.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`relative rounded-2xl p-8 flex flex-col ${
                p.highlighted
                  ? "glass-card glow-border scale-[1.02] md:scale-105"
                  : "glass-card-hover"
              }`}
            >
              {p.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-xl font-bold mb-1">{p.name}</h3>
              <p className="text-foreground/60 text-sm mb-4">{p.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">{p.price}</span>
                <span className="text-foreground/60 text-sm ml-1">/{p.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success flex-shrink-0" />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className={p.highlighted ? "btn-gradient text-center" : "btn-outline-glow text-center"}
              >
                {p.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
