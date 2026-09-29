import React, { useState } from 'react';
import {
  Home,
  LayoutDashboard,
  Database,
  Upload,
  Layers,
  ShieldCheck,
  Cpu,
  FileText,
  Sliders,
  Lock,
  GitMerge,
  Network,
  ShoppingCart,
  Menu,
  ChevronRight,
  Building2,
  CheckSquare,
  HelpCircle
} from 'lucide-react';

import { User } from './types';
import { Navbar } from './components/Navbar';
import { MaterialDetailModal } from './components/MaterialDetailModal';
import { SearchBeforeCreateModal } from './components/SearchBeforeCreateModal';
import { ResetDemoModal } from './components/ResetDemoModal';

// Views
import { LoginView } from './views/LoginView';
import { HomeView } from './views/HomeView';
import { DashboardView } from './views/DashboardView';
import { MaterialsView } from './views/MaterialsView';
import { UploadView } from './views/UploadView';
import { MatchingView } from './views/MatchingView';
import { ApprovalCenterView } from './views/ApprovalCenterView';
import { DataQualityView } from './views/DataQualityView';
import { NormalizationView } from './views/NormalizationView';
import { CnmcCatalogView } from './views/CnmcCatalogView';
import { RationalizationView } from './views/RationalizationView';
import { ProcurementView } from './views/ProcurementView';
import { KnowledgeGraphView } from './views/KnowledgeGraphView';
import { CpseManagementView } from './views/CpseManagementView';
import { ProblemSolutionView } from './views/ProblemSolutionView';
import { AuditTrailView } from './views/AuditTrailView';
import { SettingsView } from './views/SettingsView';
import { DocsView } from './views/DocsView';

const DEFAULT_USER: User = {
  id: 1,
  username: 'admin',
  email: 'admin@demo.com',
  role: 'Admin',
  full_name: 'Rajesh Sharma (System Admin)'
};

export const App: React.FC = () => {
  // Auth State - Default to logged-out so Login Page is shown first
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);

  // Theme State ('light' | 'dark')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('matisync-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('matisync-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Navigation & View State - Default to dashboard after login
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [matchingInitialFilter, setMatchingInitialFilter] = useState<string>('');
  
  // App Config & Role State
  const [activeSector, setActiveSector] = useState<string>('oil_and_gas');
  const [pilotMode, setPilotMode] = useState<boolean>(true);
  
  // Global Modals State
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [showSearchBeforeCreate, setShowSearchBeforeCreate] = useState<boolean>(false);
  const [showResetDemo, setShowResetDemo] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Handle Demo Case Selection from Navbar or HomeView
  const handleSelectDemoCase = (caseId: string) => {
    if (caseId === 'case_1') {
      setMatchingInitialFilter('Near Duplicate');
      setActiveTab('matching');
    } else if (caseId === 'case_2') {
      setMatchingInitialFilter('Technical Review Required');
      setActiveTab('matching');
    } else if (caseId === 'case_3') {
      setShowSearchBeforeCreate(true);
    }
  };

  const navGroups = [
    {
      group: 'Overview',
      items: [
        { id: 'home', label: 'Portal Home', icon: Home },
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      group: 'Material Master',
      items: [
        { id: 'materials', label: 'Master Directory', icon: Database },
        { id: 'upload', label: 'Batch Catalog Upload', icon: Upload },
        { id: 'quality', label: 'Data Quality Suite', icon: ShieldCheck },
        { id: 'cpses', label: 'CPSE Directory', icon: Building2 }
      ]
    },
    {
      group: 'AI Harmonization',
      items: [
        { id: 'matching', label: 'AI Matching & Overrides', icon: Cpu },
        { id: 'approval_center', label: 'Approval Center', icon: CheckSquare },
        { id: 'normalization', label: 'Normalization & Tolerance', icon: Layers },
        { id: 'cnmc', label: 'Proposed CNMC Catalog', icon: FileText },
        { id: 'rationalization', label: 'Legacy Rationalization', icon: GitMerge }
      ]
    },
    {
      group: 'Enterprise Value',
      items: [
        { id: 'procurement', label: 'Demand Aggregation', icon: ShoppingCart },
        { id: 'graph', label: 'Knowledge Graph', icon: Network }
      ]
    },
    {
      group: 'Governance',
      items: [
        { id: 'problem_solution', label: 'Problem-Solution Matrix', icon: HelpCircle },
        { id: 'audit', label: 'Tamper-Evident Audit', icon: Lock },
        { id: 'settings', label: 'Platform Governance', icon: Sliders }
      ]
    }
  ];

  // If user is logged out, display dedicated Login Page
  if (!isLoggedIn) {
    return (
      <LoginView
        theme={theme}
        onToggleTheme={toggleTheme}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
          setActiveTab('dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0c0c0e] flex flex-col font-sans text-zinc-800 dark:text-zinc-100 transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onSwitchUser={setCurrentUser}
        onOpenSearchBeforeCreate={() => setShowSearchBeforeCreate(true)}
        onOpenResetDemo={() => setShowResetDemo(true)}
        onSelectMaterial={(id) => setSelectedMaterialId(id)}
        onSelectDemoCase={handleSelectDemoCase}
        activeSector={activeSector}
        onLogout={() => {
          setIsLoggedIn(false);
          setActiveTab('dashboard');
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={`bg-white dark:bg-[#121215] text-zinc-600 dark:text-zinc-300 flex flex-col border-r border-zinc-200 dark:border-zinc-800/80 transition-all duration-200 shrink-0 ${
            sidebarCollapsed ? 'w-16' : 'w-60'
          }`}
        >
          {/* Sidebar Toggle & Header */}
          <div className="p-3 border-b border-zinc-200/80 dark:border-zinc-800/60 flex items-center justify-between text-xs">
            {!sidebarCollapsed && (
              <span className="font-semibold text-[11px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Menu
              </span>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-[#1c1c22] rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 ml-auto transition-colors"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto p-2.5 space-y-3.5">
            {navGroups.map((grp) => (
              <div key={grp.group} className="space-y-0.5">
                {!sidebarCollapsed && (
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {grp.group}
                  </div>
                )}
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (item.id === 'matching') {
                          setMatchingInitialFilter('');
                        }
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs transition-colors font-medium text-left ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold shadow-2xs'
                          : 'hover:bg-zinc-100 dark:hover:bg-[#1c1c22] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`} />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer User Box */}
          {!sidebarCollapsed && (
            <div className="p-3 bg-zinc-50 dark:bg-[#0e0e11] border-t border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px]">
                  {currentUser.role.substring(0, 2).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="font-medium text-zinc-800 dark:text-zinc-200 truncate text-[11px]">{currentUser.full_name}</div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{currentUser.role}</div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Primary Content View Area */}
        <main className="flex-1 overflow-y-auto p-5 md:p-6 lg:p-8 bg-[#fafafa] dark:bg-[#0c0c0e] transition-colors">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'home' && (
              <HomeView
                onNavigate={setActiveTab}
                onOpenSearchBeforeCreate={() => setShowSearchBeforeCreate(true)}
                onOpenResetDemo={() => setShowResetDemo(true)}
                onSelectDemoCase={handleSelectDemoCase}
              />
            )}
            {activeTab === 'dashboard' && (
              <DashboardView
                onNavigate={setActiveTab}
                onOpenSearchBeforeCreate={() => setShowSearchBeforeCreate(true)}
              />
            )}
            {activeTab === 'materials' && (
              <MaterialsView
                onSelectMaterial={(id) => setSelectedMaterialId(id)}
                onNavigateToUpload={() => setActiveTab('upload')}
                onOpenSearchBeforeCreate={() => setShowSearchBeforeCreate(true)}
              />
            )}
            {activeTab === 'upload' && (
              <UploadView
                onBack={() => setActiveTab('materials')}
                onUploadSuccess={() => setActiveTab('materials')}
              />
            )}
            {activeTab === 'quality' && (
              <DataQualityView onSelectMaterial={(id) => setSelectedMaterialId(id)} />
            )}
            {activeTab === 'cpses' && (
              <CpseManagementView
                onNavigateToMaterials={(cpseCode) => {
                  setActiveTab('materials');
                }}
                onNavigateToUpload={() => setActiveTab('upload')}
              />
            )}
            {activeTab === 'matching' && (
              <MatchingView
                onSelectMaterial={(id) => setSelectedMaterialId(id)}
                initialFilter={matchingInitialFilter}
              />
            )}
            {activeTab === 'approval_center' && (
              <ApprovalCenterView
                currentUser={currentUser}
                onSelectMaterial={(id) => setSelectedMaterialId(id)}
              />
            )}
            {activeTab === 'normalization' && <NormalizationView />}
            {activeTab === 'cnmc' && (
              <CnmcCatalogView onSelectMaterial={(id) => setSelectedMaterialId(id)} />
            )}
            {activeTab === 'rationalization' && <RationalizationView />}
            {activeTab === 'procurement' && <ProcurementView />}
            {activeTab === 'graph' && (
              <KnowledgeGraphView onSelectMaterial={(id) => setSelectedMaterialId(id)} />
            )}
            {activeTab === 'problem_solution' && (
              <ProblemSolutionView onNavigate={setActiveTab} />
            )}
            {activeTab === 'audit' && <AuditTrailView />}
            {activeTab === 'settings' && (
              <SettingsView
                activeSector={activeSector}
                onSectorChange={setActiveSector}
                pilotMode={pilotMode}
                onTogglePilotMode={setPilotMode}
                onOpenResetDemo={() => setShowResetDemo(true)}
              />
            )}
            {activeTab === 'docs' && <DocsView />}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      {/* 1. Deep 9-Tab Material Master Detail Modal */}
      <MaterialDetailModal
        materialId={selectedMaterialId}
        onClose={() => setSelectedMaterialId(null)}
      />

      {/* 2. Search-Before-Create Gateway Pre-Creation Warning Modal */}
      <SearchBeforeCreateModal
        isOpen={showSearchBeforeCreate}
        onClose={() => setShowSearchBeforeCreate(false)}
        onSelectExisting={(materialId) => {
          setShowSearchBeforeCreate(false);
          setSelectedMaterialId(materialId);
        }}
      />

      {/* 3. Demo Data Safe Reset Modal */}
      <ResetDemoModal
        isOpen={showResetDemo}
        onClose={() => setShowResetDemo(false)}
        onResetComplete={() => {
          setShowResetDemo(false);
          setActiveTab('dashboard');
        }}
      />
    </div>
  );
};

export default App;
