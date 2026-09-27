import React, { useState } from 'react';
import { Search, Layers, RefreshCw, ChevronDown, Check, LogOut } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  onOpenSearchBeforeCreate: () => void;
  onOpenResetDemo: () => void;
  onSelectMaterial: (id: number) => void;
  onSelectDemoCase: (caseId: string) => void;
  activeSector: string;
  onLogout?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const DEMO_USERS: User[] = [
  { id: 2, username: 'cpcl_officer', email: 'material@cpcl.demo', role: 'CPSE Material Officer', full_name: 'K. Venkatesh', cpse_code: 'CPCL' },
  { id: 3, username: 'expert', email: 'expert@demo.com', role: 'Technical Expert', full_name: 'Dr. Ananya Roy' },
  { id: 4, username: 'procurement', email: 'procurement@demo.com', role: 'Procurement Officer', full_name: 'Suresh Nair' },
  { id: 5, username: 'management', email: 'management@demo.com', role: 'Management', full_name: 'P. Ramachandran' },
  { id: 1, username: 'admin', email: 'admin@demo.com', role: 'Admin', full_name: 'Rajesh Sharma' },
];

export const Navbar: React.FC<Props> = ({
  currentUser,
  onSwitchUser,
  onOpenSearchBeforeCreate,
  onOpenResetDemo,
  onSelectMaterial,
  onSelectDemoCase,
  activeSector,
  onLogout,
  theme,
  onToggleTheme
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length >= 2) {
      try {
        const res = await api.globalSearch(q);
        setSearchResults(res.results);
      } catch {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  return (
    <header className="bg-white dark:bg-[#121215] border-b border-zinc-200 dark:border-zinc-800/80 sticky top-0 z-40 transition-colors duration-200 shadow-2xs">
      {/* Official Government Minimal Strip */}
      <div className="bg-zinc-50/90 dark:bg-[#0c0c0e]/90 backdrop-blur-xs px-6 py-1 text-[11px] flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center space-x-2.5">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Government of India</span>
          <span>&bull;</span>
          <span>Ministry of Petroleum &amp; Natural Gas</span>
          <span className="hidden md:inline">&bull;</span>
          <span className="hidden md:inline font-mono text-[10px]">SIH 2026 PS 26099 (CPCL)</span>
        </div>
        
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            SAP ERP Connected
          </span>
        </div>
      </div>

      {/* Main Clean Minimal Navbar */}
      <div className="px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center font-bold text-base shadow-xs">
            M
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">MatiSync</span>
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/60">
                CPSE Portal
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 hidden sm:block">AI-powered material standardization</p>
          </div>
        </div>

        {/* Global Search Bar - Clean & Minimal */}
        <div className="flex-1 max-w-md relative hidden sm:block">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search material code, description, or CNMC..."
              className="w-full bg-zinc-50 dark:bg-[#1a1a1f] text-zinc-900 dark:text-zinc-100 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700/80 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 transition-all font-mono"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#16161a] rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 max-h-72 overflow-y-auto">
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 flex justify-between">
                <span>Matching Records</span>
                <span>{searchResults.length} found</span>
              </div>
              {searchResults.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (r.type === 'MATERIAL') onSelectMaterial(r.id);
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-[#1f1f25] flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
                >
                  <div>
                    <div className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">{r.title}</div>
                    <div className="text-[11px] text-zinc-600 dark:text-zinc-300 line-clamp-1">{r.subtitle}</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0 font-mono">
                    {r.badge}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 shrink-0 text-xs">
          {/* Search Before Create */}
          <button
            onClick={onOpenSearchBeforeCreate}
            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg font-medium flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">Search Before Create</span>
            <span className="md:hidden">Check</span>
          </button>

          {/* Presentation Cases Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="px-2.5 py-1.5 bg-white dark:bg-[#1a1a1e] hover:bg-zinc-50 dark:hover:bg-[#222227] text-zinc-700 dark:text-zinc-200 rounded-lg font-medium flex items-center space-x-1 border border-zinc-200 dark:border-zinc-800 transition-colors"
            >
              <span>Demo Cases</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {showDemoMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-[#16161a] text-zinc-900 dark:text-zinc-100 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase border-b border-zinc-100 dark:border-zinc-800">
                  SIH Presentation Cases
                </div>
                <button
                  onClick={() => {
                    onSelectDemoCase('case_1');
                    setShowDemoMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-[#1f1f25] border-b border-zinc-100 dark:border-zinc-800"
                >
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">Case 1: Near Duplicate &amp; Tolerance</div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">2" vs 50.8mm tolerance alignment</p>
                </button>
                <button
                  onClick={() => {
                    onSelectDemoCase('case_2');
                    setShowDemoMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-[#1f1f25] border-b border-zinc-100 dark:border-zinc-800"
                >
                  <div className="font-semibold text-amber-600 dark:text-amber-400">Case 2: SCH40 vs SCH80 Safety Conflict</div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Wall thickness conflict interlock</p>
                </button>
                <button
                  onClick={() => {
                    onOpenSearchBeforeCreate();
                    setShowDemoMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-[#1f1f25]"
                >
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">Case 3: Search-Before-Create Gateway</div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Pre-creation duplicate interception</p>
                </button>
              </div>
            )}
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={onOpenResetDemo}
            title="Reset Synthetic Demo Data"
            className="p-2 bg-white dark:bg-[#1a1a1e] hover:bg-zinc-50 dark:hover:bg-[#222227] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Theme Toggle Button */}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          {/* User Profile / Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 px-2.5 py-1.5 bg-zinc-50 dark:bg-[#1a1a1e] hover:bg-zinc-100 dark:hover:bg-[#222227] rounded-lg border border-zinc-200 dark:border-zinc-800 transition-colors text-zinc-700 dark:text-zinc-200"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px]">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-medium text-[11px] text-zinc-900 dark:text-zinc-100 leading-tight truncate max-w-[100px]">
                  {currentUser.full_name.split(' ')[0]}
                </div>
                <div className="text-[9px] text-zinc-500 dark:text-zinc-400 leading-none truncate max-w-[100px]">
                  {currentUser.role}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-[#16161a] text-zinc-900 dark:text-zinc-100 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase border-b border-zinc-100 dark:border-zinc-800">
                  Switch Active Role (RBAC)
                </div>
                {DEMO_USERS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSwitchUser(u);
                      setShowUserMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-[#1f1f25] flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 ${
                      currentUser.id === u.id ? 'bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium' : ''
                    }`}
                  >
                    <div>
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">{u.full_name}</div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{u.role}</div>
                    </div>
                    {currentUser.id === u.id && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  </button>
                ))}

                {onLogout && (
                  <div className="p-1 border-t border-zinc-100 dark:border-zinc-800 mt-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full px-2.5 py-1.5 text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg flex items-center justify-between font-medium text-xs transition-colors"
                    >
                      <span>Sign Out</span>
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
