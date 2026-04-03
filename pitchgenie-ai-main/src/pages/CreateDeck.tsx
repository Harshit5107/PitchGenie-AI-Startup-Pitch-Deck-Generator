import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const steps = [
  { title: "Startup Info", fields: [
    { label: "Startup Name", placeholder: "e.g., NexaAI", key: "name" },
    { label: "Tagline", placeholder: "e.g., AI for everyone", key: "tagline" },
  ]},
  { title: "Problem", fields: [
    { label: "What problem are you solving?", placeholder: "Describe the key problem your startup addresses...", key: "problem", textarea: true },
  ]},
  { title: "Solution", fields: [
    { label: "Your Solution", placeholder: "How does your product solve this problem?", key: "solution", textarea: true },
  ]},
  { title: "Target Market", fields: [
    { label: "Target Market", placeholder: "Who are your ideal customers?", key: "market", textarea: true },
  ]},
  { title: "Revenue Model", fields: [
    { label: "Revenue Model", placeholder: "How will you make money?", key: "revenue", textarea: true },
  ]},
  { title: "Additional Info", fields: [
    { label: "Team & Traction", placeholder: "Key team members, milestones, metrics...", key: "additional", textarea: true },
  ]},
];

const CreateDeck = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleGenerate = () => {
    navigate("/dashboard/generating");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Create Pitch Deck</h1>
        <p className="text-muted-foreground mb-8">Fill in your startup details and let AI do the rest.</p>
      </motion.div>

      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= currentStep ? "bg-gradient-to-r from-primary to-secondary" : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* Step */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-6 md:p-8 mb-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            Step {currentStep + 1}/{steps.length}
          </span>
          <h2 className="text-lg font-semibold">{steps[currentStep].title}</h2>
        </div>

        <div className="space-y-4">
          {steps[currentStep].fields.map((f: any) =>
            f.textarea ? (
              <div key={f.key}>
                <label className="text-sm font-medium mb-1.5 block">{f.label}</label>
                <textarea rows={5} placeholder={f.placeholder} className="input-glow w-full resize-none" />
              </div>
            ) : (
              <div key={f.key}>
                <label className="text-sm font-medium mb-1.5 block">{f.label}</label>
                <input type="text" placeholder={f.placeholder} className="input-glow w-full" />
              </div>
            )
          )}
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="btn-outline-glow flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {currentStep < steps.length - 1 ? (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            className="btn-gradient flex items-center gap-2"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={handleGenerate} className="btn-gradient flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Generate with AI
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateDeck;
