import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, Bot, User, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { BACKEND_URL } from "@/lib/api";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatBotProps {
  projectData: any;
  onProjectUpdate: (updatedProject: any) => void;
}

const ChatBot = ({ projectData, onProjectUpdate }: ChatBotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! 👋 I'm your PitchGenie AI assistant. Tell me what changes you'd like to make to your pitch deck — for example:\n\n• \"Change the color to red\" or \"neon theme lagao\"\n• \"Make the Problem slide more technical\"\n• \"Add market size data to Target Market\"\n• \"Rewrite all slides in a more professional tone\"",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !projectData?.id) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in.");
        setIsLoading(false);
        return;
      }

      const res = await fetch(
        `${BACKEND_URL}/api/projects/${projectData.id}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ message: trimmed }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || "Failed to process your request");
      }

      const data = await res.json();

      // Only update project data if the backend actually made changes
      if (data?.success && data?.project) {
        onProjectUpdate(data.project);
        toast.success("Deck updated!");
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          data?.reply ||
          (data?.success
            ? "✅ Done! I've updated your pitch deck."
            : "⚠️ Something went wrong. Please try again."),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `❌ Sorry, something went wrong: ${err.message}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      toast.error("Failed to process chat request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Circular Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            id="chatbot-toggle"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="chatbot-trigger"
            aria-label="Open AI Assistant"
          >
            <div className="chatbot-trigger-inner">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            {/* Pulse rings */}
            <span className="chatbot-pulse-ring chatbot-pulse-ring-1" />
            <span className="chatbot-pulse-ring chatbot-pulse-ring-2" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="chatbot-panel"
          >
            {/* Header */}
            <div className="chatbot-header">
              <div className="flex items-center gap-3">
                <div className="chatbot-header-avatar">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    PitchGenie AI
                  </h3>
                  <p className="text-[10px] text-white/60 font-medium tracking-wide uppercase">
                    Deck Assistant
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="chatbot-close-btn"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="chatbot-messages">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`chatbot-msg ${
                    msg.role === "user" ? "chatbot-msg-user" : "chatbot-msg-bot"
                  }`}
                >
                  <div
                    className={`chatbot-msg-avatar ${
                      msg.role === "user"
                        ? "chatbot-msg-avatar-user"
                        : "chatbot-msg-avatar-bot"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Bot className="w-3 h-3" />
                    )}
                  </div>
                  <div
                    className={`chatbot-msg-bubble ${
                      msg.role === "user"
                        ? "chatbot-msg-bubble-user"
                        : "chatbot-msg-bubble-bot"
                    }`}
                  >
                    <p className="text-[13px] leading-relaxed whitespace-pre-line">
                      {msg.content}
                    </p>
                    <span className="chatbot-msg-time">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="chatbot-msg chatbot-msg-bot"
                >
                  <div className="chatbot-msg-avatar chatbot-msg-avatar-bot">
                    <Bot className="w-3 h-3" />
                  </div>
                  <div className="chatbot-msg-bubble chatbot-msg-bubble-bot">
                    <div className="chatbot-typing">
                      <span className="chatbot-typing-dot" />
                      <span className="chatbot-typing-dot" style={{ animationDelay: "0.15s" }} />
                      <span className="chatbot-typing-dot" style={{ animationDelay: "0.3s" }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chatbot-input-area">
              <div className="chatbot-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tell me what to change..."
                  className="chatbot-input"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="chatbot-send-btn"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="chatbot-input-hint">
                AI-powered • Changes apply instantly to your deck
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
