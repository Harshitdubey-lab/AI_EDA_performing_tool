'use client';

import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  FileSpreadsheet,
  Bot,
  BarChart3,
  Cpu,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Database,
  Wand2
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  datasetName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  datasetName,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'data-scientist', label: 'AI Data Scientist', icon: Sparkles, badge: 'Agent' },
    { id: 'upload', label: 'Datasets & Upload', icon: UploadCloud, badge: null },
    { id: 'explorer', label: 'Data Explorer', icon: FileSpreadsheet, badge: null },
    { id: 'chat', label: 'AI Analyst', icon: Bot, badge: 'Grounded' },
    { id: 'visualizer', label: 'Visual Studio', icon: BarChart3, badge: null },
    { id: 'ml-studio', label: 'ML Studio', icon: Cpu, badge: 'Real ML' },
    { id: 'cleaner', label: 'Data Cleaning', icon: Wand2, badge: null },
    { id: 'reports', label: 'Executive Reports', icon: FileText, badge: 'PDF' },
  ];

  return (
    <aside
      className={`h-screen bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 select-none z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight">InsightPilot</span>
              <span className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">AI</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Active Dataset Pill */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/40">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Database className="w-3 h-3 text-indigo-400" />
            Active Workspace
          </div>
          <div className="text-xs font-semibold text-slate-200 truncate">
            {datasetName || 'No Dataset Selected'}
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
              
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-indigo-300 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Tooltip in collapsed mode */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-md shadow-xl border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-800 text-xs text-slate-400">
        {!collapsed ? (
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-300">FastAPI & Scikit-Learn</span>
            </div>
            <p className="text-[11px] text-slate-500">Zero-Hallucination Engine</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Engine Online" />
          </div>
        )}
      </div>
    </aside>
  );
};
