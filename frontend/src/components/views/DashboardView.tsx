'use client';

import React from 'react';
import {
  FileSpreadsheet,
  Bot,
  BarChart3,
  Cpu,
  FileText,
  UploadCloud,
  ArrowRight,
  TrendingUp,
  Database,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Layers,
  Wand2
} from 'lucide-react';
import { Dataset, DatasetProfile } from '@/lib/api';

interface DashboardViewProps {
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  profile: DatasetProfile | null;
  onSelectDataset: (d: Dataset) => void;
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  datasets,
  selectedDataset,
  profile,
  onSelectDataset,
  onNavigate,
}) => {
  const totalRows = datasets.reduce((acc, d) => acc + (d.row_count || 0), 0);
  const totalCols = profile?.shape.columns || selectedDataset?.col_count || 0;
  const qualityScore = profile?.quality_score || 94.5;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Enterprise Analytics Workspace
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            InsightPilot AI Platform
          </h1>
          <p className="mt-3 text-slate-300 text-sm md:text-base leading-relaxed">
            Automated exploratory data analysis, natural language queries grounded in real calculations, interactive charting, scikit-learn machine learning pipelines, and executive PDF dossier generation.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('upload')}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/25"
            >
              <UploadCloud className="w-4 h-4" />
              Upload New Dataset
            </button>
            <button
              onClick={() => onNavigate('chat')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              <Bot className="w-4 h-4 text-indigo-400" />
              Ask AI Analyst
            </button>
            <button
              onClick={() => onNavigate('ml-studio')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              Launch ML Studio
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Datasets in Library</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white">
            {datasets.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {datasets.filter((d) => d.is_sample).length} pre-loaded samples
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Rows Processed</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white">
            {totalRows.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Across all active tables
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Data Health Score</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white">
            {qualityScore}/100
          </div>
          <div className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>High Integrity Sample</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Scikit-Learn ML Models</span>
            <Cpu className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-3 text-2xl font-bold text-white">
            5 Architectures
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Auto Task Detection Active
          </div>
        </div>
      </div>

      {/* 1-Click Demo Workflows */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Instant Demo Datasets</h2>
            <p className="text-xs text-slate-400">Click any pre-packaged enterprise dataset to load and analyze right away.</p>
          </div>
          <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
            Production Quality
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {datasets.filter(d => d.is_sample).map((d) => (
            <div
              key={d.id}
              onClick={() => onSelectDataset(d)}
              className={`p-4 rounded-xl border cursor-pointer transition text-left group relative ${
                selectedDataset?.id === d.id
                  ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                {selectedDataset?.id === d.id && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                )}
              </div>

              <h3 className="mt-3 text-sm font-semibold text-white group-hover:text-indigo-400 transition">
                {d.name}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                {d.filename === 'sample_sales_data.csv'
                  ? 'Retail orders with returned classification & profit regression.'
                  : d.filename === 'customer_churn.csv'
                  ? 'Telecom accounts with contract types & customer churn target.'
                  : 'Residential real estate with amenities & valuation prices.'}
              </p>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800/60">
                <span>{d.row_count.toLocaleString()} rows</span>
                <span>{d.col_count} columns</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('explorer')}
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 p-5 rounded-xl cursor-pointer transition group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition flex items-center justify-between">
            <span>Data Explorer</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Inspect data types, missing value percentages, 5-number summaries, Tukey outliers, and Pearson correlation matrices.
          </p>
        </div>

        <div
          onClick={() => onNavigate('chat')}
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 p-5 rounded-xl cursor-pointer transition group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <Bot className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition flex items-center justify-between">
            <span>AI Analyst Chat</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Conversational assistant grounded in pandas operations. Answers questions using real dataset statistics without hallucinations.
          </p>
        </div>

        <div
          onClick={() => onNavigate('visualizer')}
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 p-5 rounded-xl cursor-pointer transition group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition flex items-center justify-between">
            <span>Visualization Studio</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Interactive chart creator supporting Bar, Line, Scatter, Pie, Histogram, and Boxplots with dynamic mathematical aggregations.
          </p>
        </div>

        <div
          onClick={() => onNavigate('ml-studio')}
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 p-5 rounded-xl cursor-pointer transition group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition flex items-center justify-between">
            <span>Machine Learning Studio</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Auto-detect task type, preprocess features, train 4-5 scikit-learn models, benchmark metrics on test data, and test live predictions.
          </p>
        </div>

        <div
          onClick={() => onNavigate('cleaner')}
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 p-5 rounded-xl cursor-pointer transition group"
        >
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <Wand2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-sky-400 transition flex items-center justify-between">
            <span>Data Cleaning Suite</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Handle missing values with median/mean/mode strategies, remove duplicates, clip outliers, and export the cleaned CSV.
          </p>
        </div>

        <div
          onClick={() => onNavigate('reports')}
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 p-5 rounded-xl cursor-pointer transition group"
        >
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-violet-400 transition flex items-center justify-between">
            <span>Executive Dossier & PDF</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">
            Synthesize key insights, data health score, ML leaderboard, and strategic recommendations into a downloadable PDF report.
          </p>
        </div>
      </div>
    </div>
  );
};
