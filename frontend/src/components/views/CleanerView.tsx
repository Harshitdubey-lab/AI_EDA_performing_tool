'use client';

import React, { useState } from 'react';
import {
  Wand2,
  CheckCircle2,
  Download,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Dataset, DatasetProfile, cleanDataset, API_BASE_URL } from '@/lib/api';

interface CleanerViewProps {
  selectedDataset: Dataset | null;
  profile: DatasetProfile | null;
  onRefreshProfile: () => void;
}

export const CleanerView: React.FC<CleanerViewProps> = ({
  selectedDataset,
  profile,
  onRefreshProfile,
}) => {
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [missingStrategy, setMissingStrategy] = useState('impute_median');
  const [outlierStrategy, setOutlierStrategy] = useState('clip_iqr');
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClean = async () => {
    if (!selectedDataset) return;
    setIsCleaning(true);
    setError(null);
    try {
      const res = await cleanDataset(selectedDataset.id, {
        remove_duplicates: removeDuplicates,
        missing_strategy: missingStrategy,
        outlier_strategy: outlierStrategy,
      });
      setCleanResult(res);
      onRefreshProfile();
    } catch (err: any) {
      setError(err.message || 'Cleaning pipeline failed');
    } finally {
      setIsCleaning(false);
    }
  };

  if (!selectedDataset || !profile) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
        <Wand2 className="w-8 h-8 text-sky-400 animate-pulse" />
        <span>Select or upload a dataset to launch Data Cleaning Suite</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Title Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Wand2 className="w-4 h-4 text-sky-400" />
          <h2 className="text-base font-semibold text-white">Automated Data Cleaning Suite</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Prepare raw tabular data for reliable analytics and model training. Configure transformation rules for missing cells, duplicate observations, and extreme outliers.
        </p>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Missing Values Strategy */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <label className="text-xs font-semibold text-white block mb-1">
            Missing Values Treatment
          </label>
          <p className="text-[11px] text-slate-400 mb-3">
            Currently detected: <b className="text-slate-300">{profile.missing_cells} cells</b>
          </p>
          <select
            value={missingStrategy}
            onChange={(e) => setMissingStrategy(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
          >
            <option value="impute_median" className="bg-slate-900">
              Impute Median (Numeric) / Mode (Categorical)
            </option>
            <option value="impute_mean" className="bg-slate-900">
              Impute Mean (Numeric) / Mode (Categorical)
            </option>
            <option value="drop" className="bg-slate-900">
              Drop Rows With Missing Values
            </option>
            <option value="impute_constant" className="bg-slate-900">
              Impute 0 / 'Missing' Constant
            </option>
            <option value="none" className="bg-slate-900">
              Keep As Is (No Treatment)
            </option>
          </select>
        </div>

        {/* Duplicate Rows */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <label className="text-xs font-semibold text-white block mb-1">
            Duplicate Rows Removal
          </label>
          <p className="text-[11px] text-slate-400 mb-3">
            Identified: <b className="text-slate-300">{profile.duplicate_rows} duplicate rows</b>
          </p>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 mt-2">
            <input
              type="checkbox"
              checked={removeDuplicates}
              onChange={(e) => setRemoveDuplicates(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0"
            />
            <span>Deduplicate entire identical rows</span>
          </label>
        </div>

        {/* Outliers Strategy */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <label className="text-xs font-semibold text-white block mb-1">
            Extreme Outlier Handling
          </label>
          <p className="text-[11px] text-slate-400 mb-3">
            Tukey's IQR Boundary
          </p>
          <select
            value={outlierStrategy}
            onChange={(e) => setOutlierStrategy(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
          >
            <option value="clip_iqr" className="bg-slate-900">
              Clip/Winsorize to [Q1-1.5*IQR, Q3+1.5*IQR]
            </option>
            <option value="drop" className="bg-slate-900">
              Drop Extreme Z-score Anomalies (|z| &gt; 3)
            </option>
            <option value="none" className="bg-slate-900">
              Retain Raw Values Unmodified
            </option>
          </select>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={handleClean}
          disabled={isCleaning}
          className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-sky-600/20"
        >
          {isCleaning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Applying Transformations...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Execute Cleaning Pipeline</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Summary & Download */}
      {cleanResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-white">Cleaning Pipeline Finished Successfully</h3>
            </div>

            <a
              href={`${API_BASE_URL}/api/exports/${selectedDataset.id}/cleaned-csv`}
              download
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Download Cleaned CSV</span>
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px] font-sans">Initial Observations</span>
              <span className="text-sm font-bold text-white">{cleanResult.metrics.initial_rows.toLocaleString()}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px] font-sans">Final Cleaned Observations</span>
              <span className="text-sm font-bold text-emerald-400">{cleanResult.metrics.final_rows.toLocaleString()}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px] font-sans">Missing Imputed</span>
              <span className="text-sm font-bold text-white">{cleanResult.metrics.missing_values_handled}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px] font-sans">Outliers Adjusted</span>
              <span className="text-sm font-bold text-white">{cleanResult.metrics.outliers_adjusted}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
