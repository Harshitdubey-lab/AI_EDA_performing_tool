'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Layers,
  Database,
  Calendar,
  Table,
  Cpu,
  ArrowRight,
  TrendingUp,
  Sliders,
  Send,
  Loader2,
  FileCheck2,
  GitCompare,
  Search,
  Download
} from 'lucide-react';
import {
  Dataset,
  CatalogDataset,
  AutoEDAReport,
  getEDACatalog,
  getAutoEDAReport,
  compareDatasets,
  askPortfolio,
  API_BASE_URL
} from '@/lib/api';

interface DataScientistViewProps {
  selectedDataset: Dataset | null;
  onSelectDataset: (d: Dataset) => void;
}

export const DataScientistView: React.FC<DataScientistViewProps> = ({
  selectedDataset,
  onSelectDataset,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'single' | 'portfolio' | 'ask'>('single');

  // Single Dataset EDA Report State
  const [report, setReport] = useState<AutoEDAReport | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Portfolio Catalog State
  const [catalog, setCatalog] = useState<CatalogDataset[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(false);

  // Compare State
  const [compareResult, setCompareResult] = useState<any>(null);
  const [comparing, setComparing] = useState<boolean>(false);

  // Ask Portfolio State
  const [askQuery, setAskQuery] = useState<string>('');
  const [askResult, setAskResult] = useState<any>(null);
  const [asking, setAsking] = useState<boolean>(false);

  // Load single dataset report whenever selectedDataset changes
  useEffect(() => {
    if (selectedDataset) {
      loadReport(selectedDataset.id, false);
    }
    loadCatalog();
  }, [selectedDataset]);

  const loadReport = async (datasetId: string, forceRefresh: boolean = false) => {
    setLoadingReport(true);
    setReportError(null);
    try {
      const data = await getAutoEDAReport(datasetId, forceRefresh);
      setReport(data);
    } catch (err: any) {
      setReportError(err.message || 'Failed to generate autonomous EDA report');
    } finally {
      setLoadingReport(false);
    }
  };

  const loadCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const list = await getEDACatalog();
      setCatalog(list);
      // Pre-select up to 3 datasets for compare
      if (selectedIds.length === 0 && list.length > 0) {
        setSelectedIds(list.slice(0, 3).map((d) => d.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleCompare = async () => {
    if (selectedIds.length === 0) return;
    setComparing(true);
    try {
      const res = await compareDatasets(selectedIds);
      setCompareResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setComparing(false);
    }
  };

  const handleAsk = async (questionText: string) => {
    if (!questionText.trim()) return;
    setAsking(true);
    try {
      const res = await askPortfolio(questionText);
      setAskResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setAsking(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Autonomous AI Data Scientist Agent
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Comprehensive EDA & Strategic Modeling Agent
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic two-pass zero-hallucination verification &bull; Proactive portfolio intelligence &bull; Multi-dataset comparative diagnostics
          </p>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('single')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSubTab === 'single'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Single Dataset EDA</span>
          </button>
          <button
            onClick={() => setActiveSubTab('portfolio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSubTab === 'portfolio'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Catalog & Compare</span>
          </button>
          <button
            onClick={() => setActiveSubTab('ask')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSubTab === 'ask'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Portfolio Q&A</span>
          </button>
        </div>
      </div>

      {/* 1. SINGLE DATASET EDA VIEW */}
      {activeSubTab === 'single' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white block truncate">
                  {selectedDataset?.name || 'No Dataset Selected'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  SHA-256: {report?.content_hash ? report.content_hash.slice(0, 16) + '...' : 'pending'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {report && (
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Last generated: <b className="text-slate-200">{report.generated_at}</b></span>
                  {report.from_cache && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      Cached
                    </span>
                  )}
                </div>
              )}

              {selectedDataset && report && (
                <div className="flex items-center gap-1.5">
                  <a
                    href={`${API_BASE_URL}/api/dataset/${selectedDataset.id}/export-eda?format=markdown`}
                    download
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
                    title="Download complete EDA dossier as Markdown (.md)"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Download Dossier (.md)</span>
                  </a>

                  <a
                    href={`${API_BASE_URL}/api/dataset/${selectedDataset.id}/export-eda?format=json`}
                    download
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
                    title="Download complete EDA report payload as JSON"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>JSON</span>
                  </a>
                </div>
              )}

              <button
                disabled={loadingReport || !selectedDataset}
                onClick={() => selectedDataset && loadReport(selectedDataset.id, true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                {loadingReport ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Regenerate Analysis</span>
              </button>
            </div>
          </div>

          {/* Report Content */}
          {loadingReport ? (
            <div className="h-96 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <span className="text-sm font-medium">Running Autonomous Two-Pass EDA Engine...</span>
            </div>
          ) : reportError ? (
            <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-xl text-red-400 text-xs">
              {reportError}
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* Health Score & Guardrail Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] text-slate-400 font-medium block">Quality Benchmark</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{report.quality_score}/100</div>
                  <span className="text-xs text-slate-400 mt-0.5 block">{report.readiness_tier}</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] text-slate-400 font-medium block">Zero-Hallucination Guardrail</span>
                  <div className="text-2xl font-black text-white mt-1 flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    <span>Verified</span>
                  </div>
                  <span className="text-xs text-emerald-400 mt-0.5 block">
                    {report.hallucination_checks?.fabricated_numbers_stripped || 0} fabricated stats detected
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] text-slate-400 font-medium block">Mathematical Cross-Check</span>
                  <div className="text-2xl font-black text-indigo-300 mt-1 font-mono">
                    {report.hallucination_checks?.total_numbers_checked || 0} items
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5 block">
                    Checked against ground truth payload
                  </span>
                </div>
              </div>

              {/* Narrative Dossier Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                <div className="prose prose-invert prose-xs md:prose-sm max-w-none text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {report.narrative}
                </div>

                {/* Footer Guardrail Verification Stamp */}
                <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pass-2 Deterministic Number Verification Engine: 100% Mathematically Grounded</span>
                  </span>
                  <span className="font-mono">
                    Ground Truth Elements: {report.hallucination_checks?.canonical_ground_truth_items || 0}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* 2. PORTFOLIO CATALOG & COMPARE VIEW */}
      {activeSubTab === 'portfolio' && (
        <div className="space-y-6">
          {/* Catalog Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Dataset Portfolio Catalog ({catalog.length} Active Tables)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select 2 or more datasets to run multi-dataset comparative profiling and cross-schema benchmarking.
                </p>
              </div>

              <button
                disabled={selectedIds.length < 2 || comparing}
                onClick={handleCompare}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm self-start sm:self-auto"
              >
                {comparing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitCompare className="w-3.5 h-3.5" />}
                <span>Compare Selected ({selectedIds.length})</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-3 w-10 text-center">Select</th>
                    <th className="px-4 py-3 font-semibold text-slate-300">Dataset Name</th>
                    <th className="px-4 py-3 font-semibold text-slate-300">Dimensions</th>
                    <th className="px-4 py-3 font-semibold text-slate-300">Quality Score</th>
                    <th className="px-4 py-3 font-semibold text-slate-300">Missing / Dups</th>
                    <th className="px-4 py-3 font-semibold text-slate-300">Readiness Tier</th>
                    <th className="px-4 py-3 font-semibold text-slate-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {catalog.map((d) => {
                    const isChecked = selectedIds.includes(d.id);
                    return (
                      <tr key={d.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(d.id)}
                            className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-sans font-medium text-white">
                          <div className="flex items-center gap-2">
                            <span>{d.name}</span>
                            {d.is_sample && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                                Sample
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block">{d.filename}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {d.row_count.toLocaleString()} rows &bull; {d.col_count} cols
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-400">
                          {d.quality_score}/100
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {d.missing_cells} nulls ({d.missing_cells_percentage}%) &bull; {d.duplicate_rows} dups
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              d.readiness_color === 'emerald'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : d.readiness_color === 'sky'
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {d.readiness}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-sans">
                          <button
                            onClick={() => {
                              onSelectDataset(d as any);
                              setActiveSubTab('single');
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                          >
                            View Dossier &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compare Result Card */}
          {compareResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-emerald-400" />
                  <span>Comparative Portfolio Evaluation</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Total Observations Analyzed: <b>{compareResult.total_observations_analyzed?.toLocaleString()} rows</b> across {compareResult.compared_datasets?.length} datasets
                </span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Highest Quality Score</span>
                  <span className="text-base font-bold text-emerald-400 mt-1 block">
                    {compareResult.highest_quality_dataset}
                  </span>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Largest Volume Scale</span>
                  <span className="text-base font-bold text-indigo-400 mt-1 block">
                    {compareResult.largest_dataset}
                  </span>
                </div>
              </div>

              {/* Comparative Markdown */}
              <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 prose prose-invert prose-xs max-w-none whitespace-pre-wrap text-slate-200">
                {compareResult.narrative}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. CROSS-DATASET AI INTELLIGENCE VIEW */}
      {activeSubTab === 'ask' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-1">Portfolio-Wide Analytical Query</h3>
            <p className="text-xs text-slate-400 mb-4">
              Ask natural language questions across the entire registered dataset library.
            </p>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="e.g., 'What is the total data volume across all registered datasets?' or 'Which dataset has the highest quality score?'"
                value={askQuery}
                onChange={(e) => setAskQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk(askQuery)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
              <button
                disabled={asking || !askQuery.trim()}
                onClick={() => handleAsk(askQuery)}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
              >
                {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Ask Portfolio</span>
              </button>
            </div>

            {/* Suggested Chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                'What is the total data volume across all registered datasets?',
                'Which dataset has the highest data quality score?',
                'Show summary breakdown of all available tables.',
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAskQuery(q);
                    handleAsk(q);
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Ask Result */}
          {askResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="prose prose-invert prose-xs md:prose-sm max-w-none text-slate-200 whitespace-pre-wrap leading-relaxed">
                {askResult.answer}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
