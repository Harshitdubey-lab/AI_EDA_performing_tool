'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Trophy,
  Loader2,
  ShieldCheck,
  Calendar,
  Layers
} from 'lucide-react';
import { Dataset, DatasetProfile, generateReport, API_BASE_URL } from '@/lib/api';

interface ReportsViewProps {
  selectedDataset: Dataset | null;
  profile: DatasetProfile | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ selectedDataset, profile }) => {
  const [reportData, setReportData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedDataset) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await generateReport(selectedDataset.id);
      setReportData(res);
    } catch (err: any) {
      setError(err.message || 'Report generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!selectedDataset || !profile) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
        <FileText className="w-8 h-8 text-violet-400 animate-pulse" />
        <span>Select or upload a dataset to generate executive analytics reports</span>
      </div>
    );
  }

  const report = reportData?.data;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Generate Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Executive Analytics Dossier</h2>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
              PDF Export Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated compilation of data quality score, automated exploratory insights, machine learning benchmarks, and business recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {reportData?.pdf_download_url && (
            <a
              href={`${API_BASE_URL}${reportData.pdf_download_url}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-violet-400" />
              <span>Download PDF Dossier</span>
            </a>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-violet-600/20"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Compiling Dossier...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>{report ? 'Re-generate Dossier' : 'Generate Full Dossier'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Generated Report Presentation */}
      {report ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-8 max-w-5xl mx-auto shadow-xl">
          {/* Dossier Header */}
          <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-violet-400 block mb-1">
                INSIGHTPILOT AI // CONFIDENTIAL EXECUTIVE BRIEFING
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight">{report.title}</h1>
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {report.generated_at}
                </span>
                <span>Dataset: <b className="text-slate-300">{report.dataset_name}</b></span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Overall Integrity Score</span>
              <span className="text-3xl font-black text-emerald-400">{report.quality_score}/100</span>
            </div>
          </div>

          {/* Key Metrics Snapshot */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              1. Dataset Dimensions & Completeness
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px] font-sans">Observations (Rows)</span>
                <span className="text-sm font-bold text-white">{report.metrics?.total_rows?.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px] font-sans">Attributes (Columns)</span>
                <span className="text-sm font-bold text-white">{report.metrics?.total_columns}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px] font-sans">Numerical / Categorical</span>
                <span className="text-sm font-bold text-white">
                  {report.metrics?.numerical_features} / {report.metrics?.categorical_features}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px] font-sans">Duplicate Observations</span>
                <span className="text-sm font-bold text-white">{report.metrics?.duplicate_rows}</span>
              </div>
            </div>
          </div>

          {/* Core Insights */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              2. Automated Exploratory Insights
            </h3>
            <div className="space-y-3">
              {report.insights?.map((ins: any, idx: number) => {
                const isPos = ins.type === 'positive';
                const isWarn = ins.type === 'warning';
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                      isPos
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                        : isWarn
                        ? 'bg-amber-950/20 border-amber-500/30 text-slate-200'
                        : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}
                  >
                    {isPos ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : isWarn ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-white mb-0.5">{ins.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{ins.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Machine Learning Summary */}
          {report.ml_summary && (
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                3. Predictive Modeling Summary & Leaderboard
              </h3>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 text-xs">
                  <div>
                    <span className="text-slate-400">Target Column: </span>
                    <code className="text-indigo-400 font-bold">{report.ml_summary.target_column}</code>
                  </div>
                  <div>
                    <span className="text-slate-400">Best Performing Model: </span>
                    <b className="text-white">{report.ml_summary.best_model}</b>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[10px] text-slate-500 uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-2">Algorithm</th>
                        <th className="py-2">Primary Metric</th>
                        <th className="py-2">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {report.ml_summary.benchmarks?.map((b: any, idx: number) => {
                        const isBest = b.name === report.ml_summary.best_model;
                        const score =
                          b.task_type === 'classification'
                            ? `${(b.metrics.accuracy * 100).toFixed(1)}% Acc`
                            : `R² = ${b.metrics.r2_score}`;
                        return (
                          <tr key={idx} className={isBest ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                            <td className="py-2 font-sans flex items-center gap-1.5">
                              {isBest && <Trophy className="w-3 h-3 text-amber-400" />}
                              <span>{b.name}</span>
                            </td>
                            <td className="py-2 font-sans text-slate-400">
                              {b.task_type === 'classification' ? 'Accuracy / F1' : 'R² Score'}
                            </td>
                            <td className="py-2">{score}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Strategic Recommendations */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              4. Executive Recommendations & Next Steps
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {report.recommendations?.map((r: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        /* Empty Prompt State */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">Generate Executive Report</h3>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            Click below to generate a polished executive analytics brief complete with statistical findings, modeling performance, and PDF download.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Report Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
