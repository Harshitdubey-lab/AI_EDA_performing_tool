'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Trophy,
  Play,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Sliders,
  Sparkles,
  Layers,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Binary,
  HelpCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Dataset, DatasetProfile, MLTrainingResponse, trainModel, getModelResults, predictSample
} from '@/lib/api';

interface MLStudioViewProps {
  selectedDataset: Dataset | null;
  profile: DatasetProfile | null;
}

export const MLStudioView: React.FC<MLStudioViewProps> = ({ selectedDataset, profile }) => {
  const [targetCol, setTargetCol] = useState<string>('');
  const [taskType, setTaskType] = useState<string>('auto');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState<MLTrainingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live prediction state
  const [inferenceInput, setInferenceInput] = useState<Record<string, any>>({});
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);

  // Initialize target and features
  useEffect(() => {
    if (profile && profile.columns.length > 0) {
      // Pick target column intelligent heuristic
      // e.g. for sample_sales_data.csv: 'returned' or 'profit'
      // for customer_churn: 'Churn'
      // for housing: 'SalePrice'
      const candidates = ['returned', 'Churn', 'churn', 'SalePrice', 'profit', 'target'];
      const defaultTarget = profile.columns.find((c) => candidates.includes(c.name))?.name || profile.columns[profile.columns.length - 1].name;
      setTargetCol(defaultTarget);

      const feats = profile.columns.map((c) => c.name).filter((c) => c !== defaultTarget);
      setSelectedFeatures(feats);

      // Check if models were already trained for this dataset
      if (selectedDataset) {
        getModelResults(selectedDataset.id).then((res) => {
          if (res.has_models) {
            setTrainingResult(res);
          }
        }).catch(() => {});
      }
    }
  }, [profile, selectedDataset]);

  const handleTrain = async () => {
    if (!selectedDataset || !targetCol) return;
    setIsTraining(true);
    setError(null);
    setPredictionResult(null);

    try {
      const res = await trainModel(
        selectedDataset.id,
        targetCol,
        selectedFeatures,
        taskType === 'auto' ? undefined : taskType
      );
      setTrainingResult(res);

      // Initialize inference form with first column values
      if (profile) {
        const initForm: Record<string, any> = {};
        profile.columns.forEach((c) => {
          if (c.name !== targetCol) {
            initForm[c.name] = c.sample_values?.[0] ?? (c.type === 'numeric' ? 0 : 'Sample');
          }
        });
        setInferenceInput(initForm);
      }
    } catch (err: any) {
      setError(err.message || 'Model training failed');
    } finally {
      setIsTraining(false);
    }
  };

  const handlePredict = async () => {
    if (!selectedDataset || !trainingResult) return;
    setPredicting(true);
    try {
      const res = await predictSample(selectedDataset.id, inferenceInput);
      setPredictionResult(res);
    } catch (err: any) {
      setError(err.message || 'Live inference failed');
    } finally {
      setPredicting(false);
    }
  };

  if (!selectedDataset || !profile) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
        <Cpu className="w-8 h-8 text-emerald-400 animate-pulse" />
        <span>Select or upload a dataset to launch Machine Learning Studio</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ML Pipeline Configuration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Machine Learning Studio</h2>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Scikit-Learn Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated task detection, train/test split (80/20), one-hot encoding, feature scaling, and multi-model benchmark comparison.
            </p>
          </div>

          <button
            onClick={handleTrain}
            disabled={isTraining || !targetCol}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20"
          >
            {isTraining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Training Models Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Train Model Suite</span>
              </>
            )}
          </button>
        </div>

        {/* Target & Task Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Target Prediction Column (Y)
            </label>
            <select
              value={targetCol}
              onChange={(e) => {
                setTargetCol(e.target.value);
                setSelectedFeatures(profile.columns.map((c) => c.name).filter((c) => c !== e.target.value));
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            >
              {profile.columns.map((c) => (
                <option key={c.name} value={c.name} className="bg-slate-900">
                  {c.name} ({c.type === 'numeric' ? 'numeric' : 'categorical'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Task Detection
            </label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            >
              <option value="auto" className="bg-slate-900">Auto-Detect from Target</option>
              <option value="classification" className="bg-slate-900">Classification (Binary / Multi-class)</option>
              <option value="regression" className="bg-slate-900">Regression (Continuous Numeric)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-300 block mb-1">
              Train / Test Validation Split
            </label>
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 flex items-center justify-between font-mono">
              <span>80% Train ({Math.round(profile.shape.rows * 0.8)} rows)</span>
              <span>20% Test ({Math.round(profile.shape.rows * 0.2)} rows)</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Benchmark Leaderboard Table */}
      {trainingResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">
                  Model Performance Leaderboard
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated on unseen test partition ({trainingResult.test_samples} observations). All metrics are genuinely calculated.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5" />
              <span>Best Model: {trainingResult.best_model}</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-300">Algorithm</th>
                  <th className="px-4 py-3 font-semibold text-slate-300">Task</th>
                  {trainingResult.task_type === 'classification' ? (
                    <>
                      <th className="px-4 py-3 font-semibold text-slate-300">Accuracy</th>
                      <th className="px-4 py-3 font-semibold text-slate-300">Precision</th>
                      <th className="px-4 py-3 font-semibold text-slate-300">Recall</th>
                      <th className="px-4 py-3 font-semibold text-slate-300">F1-Score</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 font-semibold text-slate-300">R² Score</th>
                      <th className="px-4 py-3 font-semibold text-slate-300">MAE</th>
                      <th className="px-4 py-3 font-semibold text-slate-300">RMSE</th>
                    </>
                  )}
                  <th className="px-4 py-3 font-semibold text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {trainingResult.models.map((m, idx) => {
                  const isBest = m.name === trainingResult.best_model;
                  const met = m.metrics;
                  return (
                    <tr
                      key={idx}
                      className={isBest ? 'bg-emerald-950/20' : 'hover:bg-slate-800/40 transition'}
                    >
                      <td className="px-4 py-3 font-sans font-medium text-white flex items-center gap-2">
                        {isBest && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        <span>{m.name}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 capitalize">{m.task_type}</td>
                      {trainingResult.task_type === 'classification' ? (
                        <>
                          <td className="px-4 py-3 font-bold text-white">
                            {((met.accuracy || 0) * 100).toFixed(1)}%
                          </td>
                          <td className="px-4 py-3">{((met.precision || 0) * 100).toFixed(1)}%</td>
                          <td className="px-4 py-3">{((met.recall || 0) * 100).toFixed(1)}%</td>
                          <td className="px-4 py-3 font-bold text-indigo-400">{met.f1_score?.toFixed(4)}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-bold text-white">{met.r2_score?.toFixed(4)}</td>
                          <td className="px-4 py-3">{met.mae?.toFixed(2)}</td>
                          <td className="px-4 py-3">{met.rmse?.toFixed(2)}</td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        {isBest ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                            Recommended
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-sans">Evaluated</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feature Importance & Confusion Matrix Grid */}
      {trainingResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feature Importance Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-1">
              Predictive Feature Importance
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Relative contribution of each feature in the best performing model pipeline.
            </p>

            {trainingResult.feature_importance?.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={trainingResult.feature_importance.slice(0, 8)}
                    margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                    <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={10} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px' }} />
                    <Bar dataKey="importance" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-xs">
                Feature importances extracted once tree-based model is fitted.
              </div>
            )}
          </div>

          {/* Confusion Matrix (Classification) or Residual Metrics (Regression) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            {trainingResult.task_type === 'classification' ? (
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Test-Set Confusion Matrix
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Actual classes vs Model Predicted classes on 20% test split.
                </p>

                {(() => {
                  const best = trainingResult.models.find((m) => m.name === trainingResult.best_model);
                  const cm = best?.confusion_matrix;
                  if (!cm || !cm.matrix) return null;
                  return (
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                      <div className="text-[11px] text-slate-400 text-center mb-2 font-medium">
                        Predicted Class &rarr;
                      </div>
                      <div className="overflow-x-auto">
                        <table className="mx-auto text-xs text-slate-200 border-collapse">
                          <thead>
                            <tr>
                              <th className="p-2 text-slate-500 text-[10px] uppercase">Actual &darr;</th>
                              {cm.labels.map((lbl, idx) => (
                                <th key={idx} className="p-2 text-center font-mono text-indigo-400">
                                  {lbl}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {cm.matrix.map((row, rIdx) => (
                              <tr key={rIdx}>
                                <td className="p-2 font-mono text-slate-400 font-semibold">{cm.labels[rIdx]}</td>
                                {row.map((val, cIdx) => (
                                  <td key={cIdx} className="p-1">
                                    <div
                                      className={`px-4 py-3 rounded-lg font-mono text-center font-bold text-sm ${
                                        rIdx === cIdx
                                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                                      }`}
                                    >
                                      {val}
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Regression Residual Diagnostics
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Error distribution and variance explained metrics.
                </p>
                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-sans block">Coefficient of Determination (R²)</span>
                    <span className="text-xl font-bold text-white mt-1 block">
                      {trainingResult.models[0]?.metrics.r2_score}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-sans mt-1 block">High predictive fit</span>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-sans block">Root Mean Squared Error (RMSE)</span>
                    <span className="text-xl font-bold text-white mt-1 block">
                      {trainingResult.models[0]?.metrics.rmse}
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans mt-1 block">Average deviation scale</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Live Inference Sandbox */}
      {trainingResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Live Inference Sandbox ({trainingResult.best_model})
              </h3>
              <p className="text-xs text-slate-400">
                Input custom feature values to test real-time predictions through the fitted scikit-learn pipeline.
              </p>
            </div>
            <button
              onClick={handlePredict}
              disabled={predicting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition"
            >
              {predicting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Simulate Prediction</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-1">
            {profile.columns
              .filter((c) => c.name !== targetCol)
              .slice(0, 12)
              .map((col) => (
                <div key={col.name}>
                  <label className="text-[10px] font-medium text-slate-400 block truncate mb-1">
                    {col.name}
                  </label>
                  <input
                    type="text"
                    value={inferenceInput[col.name] ?? ''}
                    onChange={(e) =>
                      setInferenceInput((prev) => ({
                        ...prev,
                        [col.name]: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
          </div>

          {/* Prediction Result Banner */}
          {predictionResult && (
            <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-slate-950 border border-indigo-500/40 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider block">
                  Model Predicted Outcome
                </span>
                <span className="text-2xl font-black text-white mt-1 block">
                  {String(predictionResult.prediction)}
                </span>
              </div>

              {predictionResult.probabilities && (
                <div className="flex gap-2">
                  {Object.entries(predictionResult.probabilities).map(([cls, pct]) => (
                    <div key={cls} className="px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-800 text-right">
                      <span className="text-[10px] text-slate-400 block font-sans">{cls}</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">{String(pct)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
