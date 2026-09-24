'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Binary,
  Layers,
  Copy,
  Activity,
  Hash,
  Sparkles,
  PieChart as PieIcon,
  ChevronDown,
  Download,
  FileText,
  Database
} from 'lucide-react';
import { DatasetProfile } from '@/lib/api';

interface ExplorerViewProps {
  profile: DatasetProfile | null;
  datasetName?: string;
  datasetId?: string;
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({ profile, datasetName, datasetId }) => {
  const [selectedCol, setSelectedCol] = useState<string | null>(null);

  const downloadProfileJSON = () => {
    if (!profile) return;
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${datasetName || 'dataset'}_eda_profile.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadColumnStatsCSV = () => {
    if (!profile) return;
    const headers = ['Column', 'Type', 'Dtype', 'Missing Count', 'Missing %', 'Unique Count', 'Min', 'Q1', 'Median', 'Q3', 'Max', 'Mean', 'Std', 'Skewness', 'Outlier Count', 'Outlier %'];
    const rows = profile.columns.map((c) => [
      `"${c.name}"`,
      c.type,
      c.dtype,
      c.missing_count,
      `${c.missing_percentage}%`,
      c.unique_count,
      c.stats?.min ?? '',
      c.stats?.q1 ?? '',
      c.stats?.median ?? '',
      c.stats?.q3 ?? '',
      c.stats?.max ?? '',
      c.stats?.mean ?? '',
      c.stats?.std ?? '',
      c.stats?.skewness ?? '',
      c.outliers?.count ?? '',
      c.outliers ? `${c.outliers.percentage}%` : ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${datasetName || 'dataset'}_feature_statistics.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!profile) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
        <Layers className="w-8 h-8 text-indigo-400 animate-pulse" />
        <span>Select or upload a dataset to view automated EDA profile</span>
      </div>
    );
  }

  const activeColumn = profile.columns.find((c) => c.name === selectedCol) || profile.columns[0];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Action & Export Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Exploratory Data Analysis: {datasetName || 'Active Dataset'}</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium">
              Profile Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical distribution profiles, Tukey IQR outlier fences, and correlation matrix
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Raw/Filtered Data */}
          {datasetId && (
            <a
              href={`http://127.0.0.1:8000/api/dataset/${datasetId}/export-filtered?format=csv`}
              download
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
              title="Download full dataset as CSV"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export CSV</span>
            </a>
          )}

          {/* Download Column Stats CSV */}
          <button
            onClick={downloadColumnStatsCSV}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
            title="Download feature statistical summary table as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Stats Summary (CSV)</span>
          </button>

          {/* Download Full EDA Profile JSON */}
          <button
            onClick={downloadProfileJSON}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
            title="Download complete EDA profile with quantiles & correlations as JSON"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Profile JSON</span>
          </button>

          {/* Download Full AI EDA Dossier */}
          {datasetId && (
            <a
              href={`http://127.0.0.1:8000/api/dataset/${datasetId}/export-eda?format=markdown`}
              download
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-sm"
              title="Download AI Data Scientist EDA narrative dossier as Markdown"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>EDA Dossier (.md)</span>
            </a>
          )}
        </div>
      </div>
      {/* High-Level Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Dataset Dimensions</div>
          <div className="mt-2 text-2xl font-bold text-white">
            {profile.shape.rows.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">rows</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {profile.shape.columns} columns ({profile.shape.numeric_columns_count} num, {profile.shape.categorical_columns_count} cat)
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Data Completeness</div>
          <div className="mt-2 text-2xl font-bold text-white">
            {100 - profile.missing_cells_percentage}%
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {profile.missing_cells} missing cells ({profile.missing_cells_percentage}%)
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Duplicate Rows</div>
          <div className="mt-2 text-2xl font-bold text-white">
            {profile.duplicate_rows}
          </div>
          <div className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{profile.duplicate_rows === 0 ? 'Zero duplicates' : 'Duplicates identified'}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Data Quality Index</div>
          <div className="mt-2 text-2xl font-bold text-white">
            {profile.quality_score}
            <span className="text-xs font-normal text-slate-500">/100</span>
          </div>
          <div className="mt-1 text-xs text-indigo-400">
            Automated health heuristic
          </div>
        </div>
      </div>

      {/* Columns Inspector & Selected Column Deep-Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columns List Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Feature Dimensions ({profile.columns.length})</h3>
          <p className="text-xs text-slate-400 mb-4">Click any feature to inspect distribution, quantiles, and outliers.</p>

          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            {profile.columns.map((c) => {
              const isSelected = activeColumn?.name === c.name;
              return (
                <div
                  key={c.name}
                  onClick={() => setSelectedCol(c.name)}
                  className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        c.type === 'numeric' ? 'bg-indigo-400' : 'bg-emerald-400'
                      }`}
                    />
                    <div className="truncate text-xs font-medium">{c.name}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {c.missing_count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {c.missing_percentage}% null
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {c.type === 'numeric' ? 'num' : 'cat'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Column Detail Panel */}
        {activeColumn && (
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{activeColumn.name}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-mono">
                      {activeColumn.dtype}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeColumn.unique_count.toLocaleString()} unique values &bull; {activeColumn.missing_count} nulls ({activeColumn.missing_percentage}%)
                  </p>
                </div>
              </div>

              {/* Numeric Column 5-Number Stats */}
              {activeColumn.type === 'numeric' && activeColumn.stats && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Five-Number Summary & Moments</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-500 block">Min</span>
                      <span className="text-sm font-bold text-slate-200">{activeColumn.stats.min}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-500 block">Q1 (25th %)</span>
                      <span className="text-sm font-bold text-slate-200">{activeColumn.stats.q1}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-indigo-400 block font-semibold">Median (Q2)</span>
                      <span className="text-sm font-bold text-white">{activeColumn.stats.median}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-500 block">Q3 (75th %)</span>
                      <span className="text-sm font-bold text-slate-200">{activeColumn.stats.q3}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-500 block">Max</span>
                      <span className="text-sm font-bold text-slate-200">{activeColumn.stats.max}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-500 block">Mean</span>
                      <span className="text-sm font-bold text-slate-200">{activeColumn.stats.mean}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-500 block">Std Dev (σ)</span>
                      <span className="text-sm font-bold text-slate-200">{activeColumn.stats.std}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-500 block">Skewness</span>
                      <span className="text-sm font-bold text-slate-200">{activeColumn.stats.skewness}</span>
                    </div>
                  </div>

                  {/* Outliers Box */}
                  {activeColumn.outliers && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Tukey's IQR Outlier Detection (1.5 × IQR)</span>
                        </span>
                        <span className="text-xs font-mono text-amber-400 font-bold">
                          {activeColumn.outliers.count} records ({activeColumn.outliers.percentage}%)
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Normal range fence: <code className="text-slate-300">[{activeColumn.outliers.lower_bound}, {activeColumn.outliers.upper_bound}]</code>. Values beyond these limits are statistical anomalies.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Categorical Top Frequencies */}
              {activeColumn.type === 'categorical' && activeColumn.top_categories && (
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Top Frequency Distribution</h4>
                  <div className="space-y-2">
                    {activeColumn.top_categories.map((cat, idx) => (
                      <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-slate-200">{cat.value}</span>
                          <span className="text-slate-400 font-mono">
                            {cat.count.toLocaleString()} ({cat.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, cat.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sample Values Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Sample Values Recorded
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeColumn.sample_values.map((val, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300"
                  >
                    {String(val)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pearson Correlation Heatmap */}
      {profile.correlation_matrix.columns.length >= 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Pearson Correlation Heatmap</h3>
              <p className="text-xs text-slate-400">
                Linear correlation coefficients (r) between all numerical features. Blue: positive association, Red: negative association.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950 p-4">
            <table className="text-xs text-slate-300 border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left font-medium text-slate-500 text-[10px] uppercase">Feature</th>
                  {profile.correlation_matrix.columns.map((c) => (
                    <th key={c} className="p-2 text-center font-semibold text-slate-300 whitespace-nowrap text-[11px]">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profile.correlation_matrix.matrix.map((row) => (
                  <tr key={row.feature} className="border-t border-slate-800/60">
                    <td className="p-2 font-medium text-slate-300 whitespace-nowrap text-[11px]">
                      {row.feature}
                    </td>
                    {profile.correlation_matrix.columns.map((col) => {
                      const val = Number(row[col] || 0);
                      const isDiag = row.feature === col;
                      // Color mapping
                      const bg = isDiag
                        ? 'bg-slate-800 text-slate-400'
                        : val > 0.6
                        ? 'bg-indigo-600 text-white font-bold'
                        : val > 0.3
                        ? 'bg-indigo-900/80 text-indigo-200'
                        : val < -0.6
                        ? 'bg-rose-700 text-white font-bold'
                        : val < -0.3
                        ? 'bg-rose-950 text-rose-300'
                        : 'bg-slate-900/40 text-slate-400';

                      return (
                        <td key={col} className="p-1 text-center">
                          <div className={`px-2 py-1.5 rounded font-mono text-[11px] ${bg}`}>
                            {val.toFixed(2)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
