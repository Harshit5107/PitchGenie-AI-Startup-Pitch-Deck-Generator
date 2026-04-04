import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Eye, EyeOff, Mail, RotateCcw, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

const BACKEND_URL = "http://localhost:3001";

// OTP Input Component — 6 separate boxes
const OtpInput = ({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled: boolean;
}) => {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return;
    const digits = value.split("");
    digits[index] = char.slice(-1);
    const newVal = digits.join("").slice(0, 6);
    onChange(newVal);
    if (char && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const nextIdx = Math.min(pasted.length, 5);
    inputs.current[nextIdx]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center my-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200 outline-none
            bg-background/50
            border-border
            focus:border-primary focus:shadow-[0_0_0_3px_rgba(167,139,250,0.2)]
            disabled:opacity-50 disabled:cursor-not-allowed
            text-foreground caret-primary"
        />
      ))}
    </div>
  );
};

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const sendOtpViaBackend = async (emailAddr: string, name: string) => {
    const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailAddr, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.details || data.error || "Failed to send OTP");
    return data;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      // 1. Create user in Supabase (will succeed even without SMTP working if Confirm Email is OFF or SMTP is simple relay)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (error && !error.message.includes("already registered")) {
        toast.error(error.message);
        return;
      }

      // 2. Call our CUSTOM Backend to send the numeric OTP via Resend SDK (more reliable)
      await sendOtpViaBackend(email, fullName);
      
      setShowOtp(true);
      setResendCooldown(30);
      toast.success("Verification code sent! 📧 Check your Inbox/Spam.");
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await sendOtpViaBackend(email, fullName);
      setResendCooldown(30);
      setOtpCode("");
      toast.success("New verification code sent! 📧");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    try {
      // 1. Verify via Backend OTP store
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Invalid OTP");
        return;
      }

      // 2. Login to Supabase to establish session
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        toast.success("OTP Verified! Please Sign In.");
        navigate("/login");
        return;
      }

      toast.success("Email verified successfully! 🎉");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-primary/8 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md glass-card p-8 md:p-10"
      >
        <Link to="/" className="flex items-center justify-center gap-2 text-xl font-bold mb-8">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-gradient">PitchGenie</span>
        </Link>

        <AnimatePresence mode="wait">
          {showOtp ? (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center mb-1">Check your email</h2>
              <p className="text-muted-foreground text-center text-sm mb-2">
                We sent a 6-digit verification code to
              </p>
              <p className="text-primary text-center text-sm font-semibold mb-6">{email}</p>

              <form onSubmit={handleVerifyOtp}>
                <OtpInput value={otpCode} onChange={setOtpCode} disabled={loading} />

                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="btn-gradient w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    "Verifying..."
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Verify & Complete Signup
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Didn't receive the code?</p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="flex items-center gap-1.5 mx-auto text-sm font-medium transition-colors
                    disabled:text-muted-foreground disabled:cursor-not-allowed
                    enabled:text-primary enabled:hover:underline"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setShowOtp(false); setOtpCode(""); }}
                className="w-full mt-4 text-sm text-muted-foreground hover:text-primary transition-colors text-center"
              >
                ← Go back
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-center mb-2">Create your account</h2>
              <p className="text-muted-foreground text-center text-sm mb-8">Start generating pitch decks today</p>

              <form className="space-y-4" onSubmit={handleSignup}>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-glow w-full"
                    disabled={loading}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email</label>
                  <input
                    type="email"
                    placeholder="you@startup.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-glow w-full"
                    disabled={loading}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-glow w-full pr-10"
                      disabled={loading}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-gradient w-full">
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button className="btn-outline-glow w-full flex items-center justify-center gap-2 text-sm">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Signup;
