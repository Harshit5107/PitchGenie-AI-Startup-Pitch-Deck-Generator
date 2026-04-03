import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, CreditCard } from "lucide-react";
import { ContinuousTabs } from "@/components/ui/continuous-tabs";
import { AddCashDisclosure } from "@/components/ui/add-cash-disclosure";
import { toast } from "sonner";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("account");

  const handleAddCash = async (amount: number) => {
    // Simulate API call
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast.success(`Successfully added $${amount} to your wallet!`);
        resolve();
      }, 1000);
    });
  };

  return (
    <div className="max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">Settings</h1>
        <ContinuousTabs 
          tabs={[
            { id: "account", label: "Account" },
            { id: "billing", label: "Billing & Credits" },
            { id: "api-keys", label: "API Keys" }
          ]} 
          defaultActiveId="account" 
          onChange={(id) => setActiveTab(id)} 
        />
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === "account" && (
          <motion.div 
            key="account"
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            {/* Profile */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <User className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">Profile</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                  <input type="text" defaultValue="John Doe" className="input-glow w-full" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email</label>
                  <input type="email" defaultValue="john@startup.com" className="input-glow w-full" />
                </div>
              </div>
              <button className="btn-gradient mt-6">Save Changes</button>
            </div>

            {/* Password */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <Lock className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">Password</h2>
              </div>
              <div className="space-y-4 max-w-sm">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Current Password</label>
                  <input type="password" placeholder="••••••••" className="input-glow w-full" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">New Password</label>
                  <input type="password" placeholder="••••••••" className="input-glow w-full" />
                </div>
              </div>
              <button className="btn-gradient mt-6">Update Password</button>
            </div>
          </motion.div>
        )}

        {activeTab === "billing" && (
          <motion.div 
            key="billing"
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            {/* Subscription */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">AI Generations Wallet</h2>
              </div>
              <p className="text-muted-foreground mb-8 text-sm">
                Add cash to your PitchGenie wallet to generate more custom AI Pitch Decks. 1 Generation = $5.
              </p>
              
              <div className="bg-background/50 rounded-2xl p-4 border border-border">
                <AddCashDisclosure 
                  initialBalance={15.00}
                  presets={[10, 25, 50, 100]}
                  cards={[
                    { id: "1", last4: "4242", brand: "VISA", isDefault: true },
                    { id: "2", last4: "8888", brand: "MASTERCARD" }
                  ]}
                  onConfirm={handleAddCash}
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "api-keys" && (
          <motion.div 
            key="api-keys"
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 10 }}
            className="glass-card p-6"
          >
            <h2 className="font-semibold text-lg mb-4">External API Keys</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Bring your own API key to bypass generation costs.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Google Gemini API Key</label>
                <input type="password" placeholder="AIzaSy..." className="input-glow w-full max-w-md" />
              </div>
              <button className="btn-gradient mt-2">Save Key</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
