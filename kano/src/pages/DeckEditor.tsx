import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, RefreshCw, GripVertical, Play, Palette, ChevronDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

const THEME_COLORS: Record<string, { bg: string; accent: string; text: string; bullet: string }> = {
  'modern-gradient': { bg: '#1a1040', accent: '#a78bfa', text: '#ffffff', bullet: '#c4b5fd' },
  'clean-minimal':   { bg: '#f5f5f5', accent: '#111111', text: '#333333', bullet: '#555555' },
  'corporate-pro':   { bg: '#0a1628', accent: '#3b82f6', text: '#ffffff', bullet: '#93c5fd' },
  'bold-neon':       { bg: '#0a0a0a', accent: '#f43f5e', text: '#ffffff', bullet: '#fda4af' },
  'elegant-dark':    { bg: '#1a1a2e', accent: '#e2b04a', text: '#ffffff', bullet: '#fcd34d' },
  'startup-fire':    { bg: '#1a0a00', accent: '#fb923c', text: '#ffffff', bullet: '#fdba74' },
};
const DEFAULT_THEME = { bg: '#1a1a1a', accent: '#00bfff', text: '#ffffff', bullet: '#00bfff' };

const DeckEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isRegeneratingMissing, setIsRegeneratingMissing] = useState(false);
  const [projectData, setProjectData] = useState<any>(location.state?.project ?? null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [autoRegenerateAttempts, setAutoRegenerateAttempts] = useState(0);
  const [isPresentMode, setIsPresentMode] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isChangingTheme, setIsChangingTheme] = useState(false);

  const parseBullets = (value: any): string[] => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value !== "string") return [];

    const cleaned = value.trim();
    if (!cleaned) return [];

    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
      if (typeof parsed === "object" && parsed?.bullets) return parseBullets(parsed.bullets);
    } catch {
      // Not JSON, continue with text parsing.
    }

    const lines = cleaned
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);

    if (lines.length > 1) return lines;

    return cleaned
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .map((line) => line.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);
  };

  useEffect(() => {
    const incomingProject = location.state?.project;
    if (incomingProject) {
      setProjectData(incomingProject);
      setAutoRegenerateAttempts(0);
      return;
    }

    const fetchLatestProject = async () => {
      try {
        setIsLoadingProject(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/login");
          return;
        }

        const res = await fetch("http://localhost:3001/api/projects", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });

        if (!res.ok) throw new Error("Failed to load projects");
        const data = await res.json();
        const latestProject = data?.projects?.[0];

        if (!latestProject) {
          toast.error("No generated deck found. Please create one first.");
          navigate("/dashboard/create");
          return;
        }

        setProjectData(latestProject);
        setAutoRegenerateAttempts(0);
      } catch (err) {
        console.error(err);
        toast.error("Unable to load deck content.");
        navigate("/dashboard");
      } finally {
        setIsLoadingProject(false);
      }
    };

    fetchLatestProject();
  }, [location.state, navigate]);

  const slides = useMemo(() => {
    if (!projectData?.generated_content) return [];

    const slideEntries = Object.entries(projectData.generated_content || {})
      .filter(([key]) => key !== '_theme');
    return slideEntries.map(([key, value]: any, idx) => {
      const title =
        typeof value === "object" && value !== null
          ? (value.title || key)
          : key;

      const bullets =
        typeof value === "object" && value !== null
          ? parseBullets(value.bullets || value.content || "")
          : parseBullets(value);

      return {
        id: idx,
        title,
        bullets: bullets.length ? bullets : ["Content missing. Please click 'Fix Missing' to regenerate."],
      };
    });
  }, [projectData]);

  const safeSlides =
    slides.length > 0
      ? slides
      : [{ id: 0, title: "No Slides", bullets: ["No content generated."] }];
  
  const missingSlides = useMemo(() => {
    return safeSlides.filter((slide: any) => {
      const joined = (slide.bullets || []).join(" ").toLowerCase();
      return (
        !slide.bullets?.length ||
        joined.includes("content pending") ||
        joined.includes("content missing") ||
        joined.includes("content generation incomplete") ||
        joined.includes("no content generated")
      );
    });
  }, [safeSlides]);

  useEffect(() => {
    if (activeSlide > safeSlides.length - 1) setActiveSlide(0);
  }, [activeSlide, safeSlides.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPresentMode) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setActiveSlide(prev => (prev < safeSlides.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft') {
        setActiveSlide(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Escape') {
        setIsPresentMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentMode, safeSlides.length]);

  if (isLoadingProject && !projectData) {
    return (
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center text-muted-foreground">
        Loading deck content...
      </div>
    );
  }

  if (!projectData) return null;

  const handleExport = async (type: 'pptx' | 'pdf') => {
    try {
      setIsExporting(true);
      toast(`Generating ${type.toUpperCase()}...`);
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`http://localhost:3001/api/projects/${projectData.id}/export/${type}`, {
        headers: { "Authorization": `Bearer ${session?.access_token}` }
      });
      
      if (!res.ok) throw new Error("Failed to export");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PitchDeck-${projectData.idea.substring(0, 10)}.${type}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${type.toUpperCase()} downloaded!`);
    } catch (err) {
      console.error(err);
      toast.error(`Error generating ${type.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleChangeTheme = async (themeId: string) => {
    try {
      setIsChangingTheme(true);
      toast.loading("Applying theme...", { id: "theme-toast" });
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`http://localhost:3001/api/projects/${projectData.id}/theme`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({ theme: themeId })
      });
      
      if (!res.ok) throw new Error("Failed to apply theme");
      
      const data = await res.json();
      setProjectData(data.project);
      setIsThemeMenuOpen(false);
      toast.success("Theme applied successfully!", { id: "theme-toast" });
    } catch (err: any) {
      console.error(err);
      toast.error(`Error: ${err.message}`, { id: "theme-toast" });
    } finally {
      setIsChangingTheme(false);
    }
  };

  const handleRegenerateMissingSlides = async (options?: { silent?: boolean }) => {
    if (!projectData?.id || !missingSlides.length) return;

    try {
      setIsRegeneratingMissing(true);
      if (!options?.silent) {
        toast(`Regenerating ${missingSlides.length} missing slide(s)...`);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in.");
        navigate("/login");
        return;
      }

      const res = await fetch(`http://localhost:3001/api/projects/${projectData.id}/regenerate-missing`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (!res.ok) throw new Error("Failed to regenerate missing slides");

      const data = await res.json();
      if (data?.project) {
        setProjectData(data.project);
      }

      const regeneratedCount = data?.regeneratedSlides?.length ?? 0;
      if (regeneratedCount > 0) {
        if (!options?.silent) {
          toast.success(`Regenerated ${regeneratedCount} slide(s).`);
        }
      } else {
        if (!options?.silent) {
          toast.success("No missing slides found.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not regenerate missing slides.");
    } finally {
      setIsRegeneratingMissing(false);
    }
  };

  useEffect(() => {
    if (!projectData?.id) return;
    if (isLoadingProject || isRegeneratingMissing) return;
    if (!missingSlides.length) return;
    if (autoRegenerateAttempts >= 3) return;

    setAutoRegenerateAttempts((prev) => prev + 1);
    void handleRegenerateMissingSlides({ silent: true });
  }, [
    projectData?.id,
    isLoadingProject,
    isRegeneratingMissing,
    autoRegenerateAttempts,
    missingSlides.length,
  ]);

  return (
    <div 
      className={isPresentMode ? "fixed inset-0 z-[100] flex flex-col overflow-hidden" : "h-[calc(100vh-7rem)] flex flex-col"}
      style={isPresentMode ? { backgroundColor: (THEME_COLORS[projectData?.generated_content?._theme] || DEFAULT_THEME).bg } : {}}
    >      
      {isPresentMode && (
        <button 
          onClick={() => setIsPresentMode(false)}
          className="absolute top-4 right-4 z-50 text-white/50 hover:text-white transition-colors text-xs font-mono tracking-widest uppercase bg-black/20 hover:bg-black/40 px-3 py-1.5 rounded-md"
        >
          ESC to exit
        </button>
      )}

      {/* Toolbar */}
      {!isPresentMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4 flex-shrink-0"
        >
          <h1 className="text-xl font-bold truncate max-w-[200px] md:max-w-md">{projectData.idea}</h1>
          <div className="flex items-center gap-2">
            {missingSlides.length > 0 && (
              <button
                onClick={() => handleRegenerateMissingSlides()}
                disabled={isRegeneratingMissing}
                className="btn-outline-glow !py-2 !px-4 text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRegeneratingMissing ? "animate-spin" : ""}`} />
                Fix Missing ({missingSlides.length})
              </button>
            )}
            <button 
              onClick={() => setIsPresentMode(true)}
              disabled={isRegeneratingMissing}
              className="btn-outline-glow !py-2 !px-4 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-current" /> Present
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                disabled={isRegeneratingMissing || isChangingTheme}
                className="btn-outline-glow !py-2 !px-4 text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Palette className="h-4 w-4" /> Theme <ChevronDown className="h-3 w-3 opacity-50" />
              </button>
              
              <AnimatePresence>
                {isThemeMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 glass-card border border-border/50 shadow-2xl rounded-xl overflow-hidden z-50 flex flex-col py-1"
                  >
                    {Object.entries(THEME_COLORS).map(([id, colors]) => (
                      <button
                        key={id}
                        onClick={() => handleChangeTheme(id)}
                        disabled={isChangingTheme}
                        className={`text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center gap-3 ${
                          projectData?.generated_content?._theme === id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div 
                          className="w-4 h-4 rounded-full border border-white/10 shadow-sm flex-shrink-0" 
                          style={{ 
                            background: `linear-gradient(135deg, ${colors.bg}, ${colors.accent})` 
                          }} 
                        />
                        <span className="capitalize">{id.replace('-', ' ')}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button 
              onClick={() => handleExport('pdf')}
              disabled={isExporting || isRegeneratingMissing}
              className="btn-outline-glow !py-2 !px-4 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> PDF
            </button>
            <button 
              onClick={() => handleExport('pptx')}
              disabled={isExporting || isRegeneratingMissing}
              className="btn-gradient !py-2 !px-4 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> PPTX
            </button>
          </div>
        </motion.div>
      )}

      <div className={`flex gap-3 ${isPresentMode ? 'flex-1 w-full h-full' : 'flex-1 h-0'}`}>
        {/* Slide thumbnails */}
        {!isPresentMode && (
          <div className="w-36 flex-shrink-0 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {safeSlides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveSlide(i)}
                className={`w-full text-left rounded-lg p-2.5 transition-all duration-200 flex items-center gap-1.5 ${
                  i === activeSlide
                    ? "glass-card glow-border"
                    : "hover:bg-card/50 border border-transparent"
                }`}
              >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-[10px] text-muted-foreground">Slide {i + 1}</p>
                  <p className="text-xs font-medium truncate">{s.title}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Main Preview */}
        <div className={`flex items-center justify-center transition-all duration-300 ${isPresentMode ? 'flex-1 m-0 p-0' : 'flex-1 glass-card p-2 bg-black/40'}`}
          style={isPresentMode ? { backgroundColor: (THEME_COLORS[projectData?.generated_content?._theme] || DEFAULT_THEME).bg } : {}}
        >
          <motion.div
            layout
            key={`slide-${activeSlide}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className={`w-full aspect-[16/9] flex flex-col overflow-hidden relative mx-auto ${isPresentMode ? '' : 'rounded-xl border border-border/20 shadow-2xl'}`}
            style={{ 
              backgroundColor: (THEME_COLORS[projectData?.generated_content?._theme] || DEFAULT_THEME).bg, 
              maxWidth: isPresentMode ? '100vw' : '100%',
              maxHeight: '100%',
              containerType: 'inline-size',
              padding: isPresentMode ? '3cqw' : '4cqw'
            }}
          >
            <div className="absolute left-[2cqw] top-[2cqw] text-[1cqw] uppercase tracking-widest font-mono" style={{ color: (THEME_COLORS[projectData?.generated_content?._theme] || DEFAULT_THEME).bullet + '60' }}>
              Slide {activeSlide + 1}
            </div>
            
            <h2 
              className={`font-bold leading-tight uppercase ${isPresentMode ? 'text-[3.5cqw] mb-[2.5cqw]' : 'text-[3cqw] mb-[2cqw]'}`}
              style={{ color: (THEME_COLORS[projectData?.generated_content?._theme] || DEFAULT_THEME).accent }}
            >
              {safeSlides[activeSlide]?.title}
            </h2>
            
            <div className="flex-1 overflow-hidden">
              <ul className={`list-disc leading-snug ${isPresentMode ? 'text-[1.8cqw] space-y-[1.2cqw] pl-[3cqw]' : 'text-[1.5cqw] space-y-[0.9cqw] pl-[2.5cqw]'}`}
                style={{ color: (THEME_COLORS[projectData?.generated_content?._theme] || DEFAULT_THEME).text }}
              >
                {safeSlides[activeSlide]?.bullets.map((point: string, index: number) => (
                  <li key={`${safeSlides[activeSlide]?.id}-${index}`} className="pl-[0.5cqw]" style={{ ['--marker-color' as any]: (THEME_COLORS[projectData?.generated_content?._theme] || DEFAULT_THEME).accent }}>{point.replace(/^- /, '')}</li>
                ))}
              </ul>
            </div>
            
            <div className="absolute bottom-[2cqw] left-0 right-0 text-center">
              <span className={`uppercase tracking-widest font-mono ${isPresentMode ? 'text-[1.2cqw]' : 'text-[1cqw]'}`} style={{ color: (THEME_COLORS[projectData?.generated_content?._theme] || DEFAULT_THEME).bullet + '50' }}>PitchGenie</span>
            </div>
            
            {isPresentMode && (
              <>
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1/4 cursor-pointer pointer-events-auto" 
                  onClick={() => setActiveSlide(prev => (prev > 0 ? prev - 1 : prev))}
                />
                <div 
                  className="absolute right-0 top-0 bottom-0 w-1/4 cursor-pointer pointer-events-auto" 
                  onClick={() => setActiveSlide(prev => (prev < safeSlides.length - 1 ? prev + 1 : prev))}
                />
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DeckEditor;
