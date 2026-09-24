'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  LineChart as LineIcon,
  PieChart as PieIcon,
  ScatterChart as ScatterIcon,
  Sliders,
  Download,
  Loader2,
  Sparkles,
  Layers,
  BoxSelect
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Dataset, DatasetProfile, generateChart } from '@/lib/api';

interface VisualizerViewProps {
  selectedDataset: Dataset | null;
  profile: DatasetProfile | null;
}

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6'];

export const VisualizerView: React.FC<VisualizerViewProps> = ({ selectedDataset, profile }) => {
  const [chartType, setChartType] = useState<string>('bar');
  const [xCol, setXCol] = useState<string>('');
  const [yCol, setYCol] = useState<string>('');
  const [aggregation, setAggregation] = useState<string>('sum');
  const [limit, setLimit] = useState<number>(20);

  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize columns when profile is loaded
  useEffect(() => {
    if (profile && profile.columns.length > 0) {
      const defaultX = profile.categorical_columns[0] || profile.columns[0]?.name;
      const defaultY = profile.numeric_columns[0] || '';
      setXCol(defaultX);
      setYCol(defaultY);
      fetchChart(chartType, defaultX, defaultY, aggregation, limit);
    }
  }, [profile]);

  const fetchChart = async (
    type: string,
    x: string,
    y: string,
    agg: string,
    lim: number
  ) => {
    if (!selectedDataset || !x) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateChart(selectedDataset.id, {
        chart_type: type,
        x_col: x,
        y_col: y || undefined,
        aggregation: agg,
        limit: lim,
      });
      setChartData(res);
    } catch (err: any) {
      setError(err.message || 'Could not generate visualization');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    fetchChart(chartType, xCol, yCol, aggregation, limit);
  };

  const exportChartData = () => {
    if (!chartData) return;
    const blob = new Blob([JSON.stringify(chartData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chart_${xCol}_${chartType}.json`;
    a.click();
  };

  if (!selectedDataset || !profile) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
        <Layers className="w-8 h-8 text-indigo-400 animate-pulse" />
        <span>Select or upload a dataset to begin charting</span>
      </div>
    );
  }

  const chartTypes = [
    { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { id: 'line', label: 'Line Chart', icon: LineIcon },
    { id: 'scatter', label: 'Scatter Plot', icon: ScatterIcon },
    { id: 'pie', label: 'Pie / Donut', icon: PieIcon },
    { id: 'histogram', label: 'Histogram', icon: BarChart3 },
    { id: 'boxplot', label: 'Boxplot', icon: BoxSelect },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Chart Configuration Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5">
          <div>
            <h2 className="text-base font-semibold text-white">Visualization Studio</h2>
            <p className="text-xs text-slate-400">
              Select chart type, dimensions, and aggregation functions to explore multi-dimensional patterns.
            </p>
          </div>

          {/* Chart Type Segmented Control */}
          <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {chartTypes.map((t) => {
              const Icon = t.icon;
              const active = chartType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setChartType(t.id);
                    fetchChart(t.id, xCol, yCol, aggregation, limit);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dimension Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* X Axis */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              X-Axis Dimension
            </label>
            <select
              value={xCol}
              onChange={(e) => setXCol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            >
              {profile.columns.map((c) => (
                <option key={c.name} value={c.name} className="bg-slate-900">
                  {c.name} ({c.type === 'numeric' ? 'num' : 'cat'})
                </option>
              ))}
            </select>
          </div>

          {/* Y Axis (Optional for Histogram / Boxplot) */}
          {chartType !== 'histogram' && chartType !== 'boxplot' && (
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Y-Axis Metric
              </label>
              <select
                value={yCol}
                onChange={(e) => setYCol(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="" className="bg-slate-900">
                  (Count / Frequency)
                </option>
                {profile.numeric_columns.map((c) => (
                  <option key={c} value={c} className="bg-slate-900">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Aggregation Function */}
          {chartType !== 'histogram' && chartType !== 'boxplot' && chartType !== 'scatter' && (
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Aggregation Math
              </label>
              <select
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="sum" className="bg-slate-900">Sum</option>
                <option value="mean" className="bg-slate-900">Average / Mean</option>
                <option value="median" className="bg-slate-900">Median</option>
                <option value="min" className="bg-slate-900">Minimum</option>
                <option value="max" className="bg-slate-900">Maximum</option>
                <option value="count" className="bg-slate-900">Count of Records</option>
              </select>
            </div>
          )}

          {/* Top Limit */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Data Points Limit
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value={10} className="bg-slate-900">Top 10</option>
              <option value={20} className="bg-slate-900">Top 20</option>
              <option value={50} className="bg-slate-900">Top 50</option>
              <option value={100} className="bg-slate-900">Top 100</option>
            </select>
          </div>

          {/* Update Action */}
          <div className="flex items-end">
            <button
              onClick={handleApply}
              disabled={loading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sliders className="w-3.5 h-3.5" />}
              <span>Render Chart</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[460px] flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {chartData?.title || 'Interactive Visual Canvas'}
            </h3>
            <span className="text-[11px] text-slate-400">
              Rendered via Recharts &bull; Responsive SVG Canvas
            </span>
          </div>

          {chartData?.data?.length > 0 && (
            <button
              onClick={exportChartData}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          )}
        </div>

        {/* Chart Rendering */}
        <div className="flex-1 w-full flex items-center justify-center min-h-[380px]">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span>Computing mathematical aggregations...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          ) : chartData?.data?.length > 0 ? (
            <ResponsiveContainer width="100%" height={380}>
              {chartType === 'bar' ? (
                <BarChart data={chartData.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={chartData.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              ) : chartType === 'scatter' ? (
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="x" name={chartData.x_label} stroke="#94a3b8" fontSize={11} />
                  <YAxis dataKey="y" name={chartData.y_label} stroke="#94a3b8" fontSize={11} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                  <Scatter name="Points" data={chartData.data} fill="#818cf8" />
                </ScatterChart>
              ) : chartType === 'pie' ? (
                <PieChart>
                  <Pie data={chartData.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                    {chartData.data.map((_: any, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={PALETTE[idx % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
                </PieChart>
              ) : chartType === 'histogram' ? (
                <BarChart data={chartData.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="bin" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                /* Boxplot Summary Display */
                <div className="w-full max-w-xl p-6 bg-slate-950 rounded-xl border border-slate-800 text-slate-200">
                  <div className="text-sm font-semibold mb-4 text-indigo-400">Five-Number Boxplot Quantiles for {xCol}</div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Lower Whisker</span>
                      <span className="font-bold text-sm">{chartData.data[0]?.lower_whisker}</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Q1 (25th %)</span>
                      <span className="font-bold text-sm">{chartData.data[0]?.q1}</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-indigo-400 block text-[10px] font-semibold">Median (50th %)</span>
                      <span className="font-bold text-sm text-white">{chartData.data[0]?.median}</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Q3 (75th %)</span>
                      <span className="font-bold text-sm">{chartData.data[0]?.q3}</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Upper Whisker</span>
                      <span className="font-bold text-sm">{chartData.data[0]?.upper_whisker}</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-amber-400 block text-[10px]">Outliers Count</span>
                      <span className="font-bold text-sm text-amber-300">{chartData.data[0]?.outliers_count}</span>
                    </div>
                  </div>
                </div>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-500 text-xs">
              No chart data available for the chosen configuration.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
