import React, { useState } from 'react';
import { KeyRound, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { ThemeToggle } from '../components/ThemeToggle';

interface Props {
  onLoginSuccess: (user: User, redirectTab?: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

interface DemoAccount {
  email: string;
  role: string;
  name: string;
  entity: string;
  badge: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'admin@demo.com',
    role: 'System Admin',
    name: 'Rajesh Sharma',
    entity: 'Platform Governance & Audit',
    badge: 'Admin'
  },
  {
    email: 'material@cpcl.demo',
    role: 'CPSE Material Officer',
    name: 'K. Venkatesh',
    entity: 'Chennai Petroleum (CPCL)',
    badge: 'CPCL'
  },
  {
    email: 'expert@demo.com',
    role: 'Technical Expert',
    name: 'Dr. Ananya Roy',
    entity: 'Chief Metallurgist / Standardization',
    badge: 'Approver'
  },
  {
    email: 'procurement@demo.com',
    role: 'Procurement Officer',
    name: 'Suresh Nair',
    entity: 'Strategic Sourcing (IOCL)',
    badge: 'Sourcing'
  },
  {
    email: 'management@demo.com',
    role: 'Ministry Executive',
    name: 'P. Ramachandran',
    entity: 'Ministry of Petroleum & Natural Gas',
    badge: 'Executive'
  }
];

export const LoginView: React.FC<Props> = ({ onLoginSuccess, theme, onToggleTheme }) => {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLogin = async (loginEmail: string, loginPassword: string = 'demo123') => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(loginEmail, loginPassword);
      onLoginSuccess(res.user, 'dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0c0c0e] flex flex-col justify-between text-zinc-800 dark:text-zinc-100 font-sans transition-colors duration-200">
      {/* Top Header Strip */}
      <header className="bg-white/80 dark:bg-[#121215]/80 backdrop-blur-md px-6 py-2.5 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3 text-zinc-600 dark:text-zinc-300">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
            Government of India
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <span className="text-zinc-600 dark:text-zinc-400 hidden sm:inline">Ministry of Petroleum &amp; Natural Gas</span>
          <span className="text-zinc-300 dark:text-zinc-700 hidden md:inline">|</span>
          <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px] hidden md:inline">SIH 2026 PS 26099</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mr-2 hidden sm:inline">Theme</span>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </header>

      {/* Main Clean Centered Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="w-full max-w-4xl bg-white dark:bg-[#141417] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden transition-colors">
          
          <div className="grid grid-cols-1 md:grid-cols-12">
            {/* Left Column: Direct Login */}
            <div className="md:col-span-6 p-8 lg:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800/80">
              <div>
                {/* Logo & Product Name */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    M
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">MatiSync</h1>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">AI-powered material standardization for CPSEs</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 mb-6">
                  Reconciling and harmonizing legacy material codes across Indian public sector enterprises.
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 rounded-lg text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Account Email
                    </label>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="admin@demo.com"
                      className="w-full text-xs px-3 py-2.5 bg-zinc-50 dark:bg-[#1a1a1f] border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                      <span className="text-[11px] text-zinc-400 font-mono">Demo: demo123</span>
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full text-xs px-3 py-2.5 bg-zinc-50 dark:bg-[#1a1a1f] border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                  </button>
                </form>
              </div>

              <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Secured with FIPS 180-4 SHA-256 Hash Chained Audit Trail</span>
              </div>
            </div>

            {/* Right Column: 1-Click Persona Access */}
            <div className="md:col-span-6 p-8 lg:p-10 bg-zinc-50/50 dark:bg-[#111114]/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Quick Demo Access
                    </h2>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium mt-0.5">
                      Select a persona to test role-specific views
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    1-Click Login
                  </span>
                </div>

                <div className="space-y-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => {
                        setEmail(acc.email);
                        setPassword('demo123');
                        performLogin(acc.email, 'demo123');
                      }}
                      className="w-full p-3 bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-xl transition-all duration-150 text-left flex items-center justify-between group hover:shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-xs font-bold shrink-0 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/60 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {acc.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {acc.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded">
                              {acc.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {acc.role} &bull; <span className="text-zinc-400 dark:text-zinc-500">{acc.entity}</span>
                          </div>
                        </div>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-200/80 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                <span>Problem Statement 26099</span>
                <span className="font-mono text-zinc-400">All logins land on Dashboard</span>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="px-6 py-3 text-center text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-[#121215]/50 backdrop-blur-xs">
        MatiSync &bull; AI-Powered Material Standardization &amp; Harmonization Platform &bull; Chennai Petroleum Corporation Limited
      </footer>
    </div>
  );
};
