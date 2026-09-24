'use client';

import React, { useState } from 'react';
import {
  Bot,
  Send,
  User,
  Sparkles,
  BarChart3,
  Copy,
  Check,
  Loader2,
  Database,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Dataset, DatasetProfile, askQuestion } from '@/lib/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  chart?: any;
  referenced_columns?: string[];
  timestamp: string;
}

interface ChatViewProps {
  selectedDataset: Dataset | null;
  profile: DatasetProfile | null;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

export const ChatView: React.FC<ChatViewProps> = ({ selectedDataset, profile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your **InsightPilot AI Analyst**. I perform grounded statistical queries directly on **${selectedDataset?.name || 'your dataset'}** using pandas without hallucination.\n\nAsk me anything about distributions, top categories, correlations, outliers, or summary metrics!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const suggestedQuestions = profile?.suggested_questions || [
    'Provide a comprehensive data health and quality summary.',
    'Which category generates the highest average value?',
    'Are there any statistical outliers in this dataset?',
    'What features have the strongest correlation?',
  ];

  const handleSend = async (questionText: string) => {
    if (!questionText.trim() || !selectedDataset) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await askQuestion(selectedDataset.id, questionText);
      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: res.answer,
        chart: res.chart,
        referenced_columns: res.referenced_columns,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: `⚠️ Analysis failed: ${err.message || 'Could not process query'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderInlineChart = (chart: any) => {
    if (!chart || !chart.data || chart.data.length === 0) return null;

    if (chart.type === 'bar') {
      return (
        <div className="h-64 w-full mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-300 mb-2">{chart.title}</div>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey={chart.x_key || 'name'} stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
              <Bar dataKey={chart.y_key || 'value'} fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (chart.type === 'histogram') {
      return (
        <div className="h-64 w-full mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-300 mb-2">{chart.title}</div>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="bin" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (chart.type === 'scatter') {
      return (
        <div className="h-64 w-full mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-300 mb-2">{chart.title}</div>
          <ResponsiveContainer width="100%" height="85%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="x" name={chart.x_label} stroke="#94a3b8" fontSize={11} />
              <YAxis dataKey="y" name={chart.y_label} stroke="#94a3b8" fontSize={11} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
              <Scatter name="Points" data={chart.data} fill="#818cf8" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (chart.type === 'pie') {
      return (
        <div className="h-64 w-full mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
          <div className="text-xs font-semibold text-slate-300 mb-2">{chart.title}</div>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {chart.data.map((_: any, idx: number) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-fadeIn">
      {/* Chat Top Banner */}
      <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <span>InsightPilot Analytical Agent</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                Grounded Python / Pandas
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Querying context: <span className="text-slate-200 font-medium">{selectedDataset?.name || 'No dataset'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'welcome',
                sender: 'assistant',
                text: 'Conversation history reset. Ask a question to analyze your dataset.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ])
          }
          className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
        >
          Clear Chat
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-3xl ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 border border-slate-700 text-indigo-400'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`p-4 rounded-2xl text-xs leading-relaxed border ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 border-indigo-500 text-white rounded-tr-none'
                  : 'bg-slate-950/80 border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
              }`}
            >
              <div className="prose prose-invert prose-xs max-w-none whitespace-pre-wrap">
                {msg.text}
              </div>

              {/* Dynamic Inline Chart */}
              {msg.chart && renderInlineChart(msg.chart)}

              {/* Referenced Columns */}
              {msg.referenced_columns && msg.referenced_columns.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Database className="w-3 h-3 text-indigo-400" />
                  <span>Referenced features:</span>
                  {msg.referenced_columns.map((c) => (
                    <span key={c} className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-300 text-[10px]">
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {/* Timestamp & Copy Button */}
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                <span>{msg.timestamp}</span>
                {msg.sender === 'assistant' && (
                  <button
                    onClick={() => copyToClipboard(msg.text, msg.id)}
                    className="hover:text-slate-300 transition flex items-center gap-1"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 mr-auto max-w-lg">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs flex items-center gap-2 rounded-tl-none">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Analyzing dataset and calculating metrics...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-6 py-2.5 bg-slate-950/40 border-t border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          Suggested:
        </span>
        {suggestedQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] whitespace-nowrap transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3 shrink-0">
        <input
          type="text"
          placeholder="Ask any question about your data (e.g., 'show average profit by category' or 'check for outliers')..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend(query)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition"
        />
        <button
          disabled={!query.trim() || loading || !selectedDataset}
          onClick={() => handleSend(query)}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-indigo-600/20 shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </div>
    </div>
  );
};
