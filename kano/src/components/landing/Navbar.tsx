import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, Sparkles } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/30 backdrop-blur-2xl bg-background/70"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-gradient">PitchGenie</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Features</a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">How It Works</a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">Pricing</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
            Login
          </Link>
          <Link to="/signup" className="btn-gradient text-sm !px-5 !py-2">
            Sign Up
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-foreground">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border/30 px-4 pb-4"
        >
          <div className="flex flex-col gap-3 pt-4">
            <a href="#features" className="text-muted-foreground hover:text-foreground py-2">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground py-2">How It Works</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground py-2">Pricing</a>
            <Link to="/login" className="text-muted-foreground hover:text-foreground py-2">Login</Link>
            <Link to="/signup" className="btn-gradient text-center text-sm">Sign Up</Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
