import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
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

const themes = [
  {
    id: "modern-gradient",
    name: "Modern Gradient",
    bg: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    accent: "#a78bfa",
    titleBar: "#a78bfa",
    bulletColor: "rgba(167,139,250,0.4)",
    textColor: "rgba(255,255,255,0.5)",
  },
  {
    id: "clean-minimal",
    name: "Clean Minimal",
    bg: "linear-gradient(180deg, #fafafa 0%, #e8e8e8 100%)",
    accent: "#111111",
    titleBar: "#111111",
    bulletColor: "rgba(0,0,0,0.15)",
    textColor: "rgba(0,0,0,0.25)",
  },
  {
    id: "corporate-pro",
    name: "Corporate Pro",
    bg: "linear-gradient(135deg, #0a1628 0%, #162a50 100%)",
    accent: "#3b82f6",
    titleBar: "#3b82f6",
    bulletColor: "rgba(59,130,246,0.3)",
    textColor: "rgba(255,255,255,0.4)",
  },
  {
    id: "bold-neon",
    name: "Bold Neon",
    bg: "linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 100%)",
    accent: "#f43f5e",
    titleBar: "#f43f5e",
    bulletColor: "rgba(244,63,94,0.35)",
    textColor: "rgba(255,255,255,0.4)",
  },
  {
    id: "elegant-dark",
    name: "Elegant Dark",
    bg: "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    accent: "#e2b04a",
    titleBar: "#e2b04a",
    bulletColor: "rgba(226,176,74,0.3)",
    textColor: "rgba(255,255,255,0.4)",
  },
  {
    id: "startup-fire",
    name: "Startup Fire",
    bg: "linear-gradient(135deg, #1a0000 0%, #2d1b00 100%)",
    accent: "#fb923c",
    titleBar: "#fb923c",
    bulletColor: "rgba(251,146,60,0.35)",
    textColor: "rgba(255,255,255,0.4)",
  },
];

const TOTAL_STEPS = steps.length + 1; // 6 form steps + 1 theme step

const CreateDeck = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedTheme, setSelectedTheme] = useState("modern-gradient");
  const navigate = useNavigate();

  const isThemeStep = currentStep === steps.length;

  const handleGenerate = () => {
    const idea = Object.entries(formData)
      .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
      .join(". ");
      
    navigate("/dashboard/generating", { 
      state: { 
        idea,
        theme: selectedTheme,
        selectedSlides: [
          "Problem",
          "Solution", 
          "Unique Value Proposition",
          "Target Market",
          "Business Model & Revenue",
          "Go-To-Market Strategy",
          "Competitive Landscape",
          "Product Roadmap",
          "Team & Traction",
          "Financial Projections & Ask"
        ]
      } 
    });
  };

  const handleInputChange = (key: string, val: string) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Create Pitch Deck</h1>
        <p className="text-muted-foreground mb-8">Fill in your startup details and let AI do the rest.</p>
      </motion.div>

      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= currentStep ? "bg-gradient-to-r from-primary to-secondary" : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-6 md:p-8 mb-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            Step {currentStep + 1}/{TOTAL_STEPS}
          </span>
          <h2 className="text-lg font-semibold">
            {isThemeStep ? "Choose a Theme" : steps[currentStep].title}
          </h2>
        </div>

        {isThemeStep ? (
          /* Theme selection grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTheme(t.id)}
                className={`rounded-xl overflow-hidden transition-all duration-200 text-left border-2 ${
                  selectedTheme === t.id
                    ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                    : "border-transparent hover:border-border"
                }`}
              >
                {/* Mini preview */}
                <div
                  className="aspect-[16/10] p-3 flex flex-col justify-between relative overflow-hidden"
                  style={{ background: t.bg }}
                >
                  <div
                    className="absolute top-0 right-0 w-12 h-12 opacity-20 rounded-bl-full"
                    style={{ background: t.accent }}
                  />
                  <div className="space-y-1.5 relative z-10">
                    <div className="h-2 rounded-full w-3/5" style={{ background: t.titleBar }} />
                    <div className="h-1 rounded-full w-4/5" style={{ background: t.bulletColor }} />
                    <div className="h-1 rounded-full w-3/5" style={{ background: t.bulletColor }} />
                    <div className="h-1 rounded-full w-2/3" style={{ background: t.bulletColor }} />
                  </div>
                  <div className="flex items-end justify-between relative z-10">
                    <div className="h-0.5 rounded-full w-1/4" style={{ background: t.textColor }} />
                  </div>

                  {/* Selected checkmark */}
                  {selectedTheme === t.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center z-20">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className="p-2.5 bg-card flex items-center justify-between">
                  <span className="text-xs font-medium truncate">{t.name}</span>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: t.accent }}
                  />
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Regular form fields */
          <div className="space-y-4">
            {steps[currentStep].fields.map((f: any) =>
              f.textarea ? (
                <div key={f.key}>
                  <label className="text-sm font-medium mb-1.5 block">{f.label}</label>
                  <textarea 
                    rows={5} 
                    placeholder={f.placeholder} 
                    value={formData[f.key] || ""}
                    onChange={(e) => handleInputChange(f.key, e.target.value)}
                    className="input-glow w-full resize-none" 
                  />
                </div>
              ) : (
                <div key={f.key}>
                  <label className="text-sm font-medium mb-1.5 block">{f.label}</label>
                  <input 
                    type="text" 
                    placeholder={f.placeholder} 
                    value={formData[f.key] || ""}
                    onChange={(e) => handleInputChange(f.key, e.target.value)}
                    className="input-glow w-full" 
                  />
                </div>
              )
            )}
          </div>
        )}
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
        {currentStep < TOTAL_STEPS - 1 ? (
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
