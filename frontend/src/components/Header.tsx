'use client';

import React from 'react';
import { Database, Plus, RefreshCw, Activity, ShieldCheck } from 'lucide-react';
import { Dataset } from '@/lib/api';

interface HeaderProps {
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  onSelectDataset: (d: Dataset) => void;
  onOpenUpload: () => void;
  onRefresh: () => void;
  qualityScore?: number;
}

export const Header: React.FC<HeaderProps> = ({
  datasets,
  selectedDataset,
  onSelectDataset,
  onOpenUpload,
  onRefresh,
  qualityScore,
}) => {
  return (
    <header className="h-16 px-6 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
      {/* Dataset Selector Dropdown */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800">
          <Database className="w-4 h-4 text-indigo-400" />
          <select
            value={selectedDataset?.id || ''}
            onChange={(e) => {
              const found = datasets.find((d) => d.id === e.target.value);
              if (found) onSelectDataset(found);
            }}
            className="bg-transparent text-sm font-medium text-slate-100 outline-none cursor-pointer pr-2"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id} className="bg-slate-900 text-slate-100">
                {d.name} {d.is_sample ? '(Sample)' : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedDataset && (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">
              {selectedDataset.row_count.toLocaleString()} rows
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">
              {selectedDataset.col_count} columns
            </span>
          </div>
        )}

        {qualityScore !== undefined && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Quality Score: {qualityScore}/100</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onRefresh}
          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          title="Refresh dataset metadata"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload Dataset</span>
        </button>
      </div>
    </header>
  );
};
