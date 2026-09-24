'use client';

import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Sparkles,
  Loader2,
  Globe
} from 'lucide-react';
import { Dataset, uploadDataset, getDatasetPreview, importOpenMLDataset } from '@/lib/api';

interface UploadViewProps {
  selectedDataset: Dataset | null;
  onDatasetUploaded: (d: Dataset) => void;
  onSelectDataset: (d: Dataset) => void;
  datasets: Dataset[];
}

export const UploadView: React.FC<UploadViewProps> = ({
  selectedDataset,
  onDatasetUploaded,
  onSelectDataset,
  datasets,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Preview state
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [openmlLoading, setOpenmlLoading] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDataset) {
      loadPreview(selectedDataset.id, page, search);
    }
  }, [selectedDataset, page]);

  const loadPreview = async (datasetId: string, pageNum: number, searchStr: string) => {
    setPreviewLoading(true);
    try {
      const res = await getDatasetPreview(datasetId, pageNum, 30, searchStr);
      setPreviewData(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const newDataset = await uploadDataset(file, customName || undefined);
      const rCount = newDataset.rows || newDataset.row_count || 0;
      setUploadSuccess(`Successfully uploaded ${newDataset.name} (${rCount.toLocaleString()} rows)`);
      setFile(null);
      setCustomName('');
      onDatasetUploaded(newDataset);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenMLImport = async (openmlId: string) => {
    setOpenmlLoading(openmlId);
    setUploadError(null);
    try {
      const imported = await importOpenMLDataset(openmlId);
      const rCount = imported.rows || imported.row_count || 0;
      setUploadSuccess(`Imported OpenML benchmark: ${imported.name} (${rCount} rows)`);
      onDatasetUploaded(imported);
    } catch (err: any) {
      setUploadError(err.message || 'OpenML import failed');
    } finally {
      setOpenmlLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Upload Zone & Presets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Box */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-1">Upload New Dataset</h2>
          <p className="text-xs text-slate-400 mb-5">
            Supports CSV, TSV, and Excel (.xlsx) files up to 100MB with automated schema detection.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 rounded-xl p-8 text-center transition bg-slate-950/40 cursor-pointer"
            onClick={() => document.getElementById('file-upload-input')?.click()}
          >
            <input
              id="file-upload-input"
              type="file"
              accept=".csv,.xlsx,.xls,.tsv"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            {file ? (
              <div>
                <p className="text-sm font-semibold text-white">{file.name}</p>
                <p className="text-xs text-indigo-400 mt-1">{(file.size / 1024).toFixed(1)} KB selected</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Drag and drop your dataset here, or <span className="text-indigo-400 underline">browse files</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">UTF-8 CSV, Tab-Delimited TSV, or Excel (.xlsx)</p>
              </div>
            )}
          </div>

          {file && (
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="Dataset name (optional)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Dataset...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Confirm & Process</span>
                  </>
                )}
              </button>
            </div>
          )}

          {uploadSuccess && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {uploadError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Public Repositories / OpenML Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
              <Globe className="w-3.5 h-3.5" />
              External Public Repositories
            </div>
            <h3 className="text-sm font-semibold text-white">OpenML 1-Click Import</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Fetch real machine learning datasets from OpenML's open repository without needing an API key.
            </p>

            <div className="space-y-2">
              {[
                { id: 'credit-g', name: 'German Credit Risk', target: 'Risk classification' },
                { id: 'diabetes', name: 'Pima Diabetes Index', target: 'Medical diagnosis' },
                { id: 'iris', name: 'Iris Morphometrics', target: 'Multi-class botanic' },
              ].map((oml) => (
                <div
                  key={oml.id}
                  className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{oml.name}</div>
                    <div className="text-[11px] text-slate-500">{oml.target}</div>
                  </div>
                  <button
                    onClick={() => handleOpenMLImport(oml.id)}
                    disabled={openmlLoading === oml.id}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium rounded border border-slate-700 transition flex items-center gap-1.5"
                  >
                    {openmlLoading === oml.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>Import</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Also supports World Bank & Open-Meteo</span>
          </div>
        </div>
      </div>

      {/* Dataset Preview Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              <span>Workspace Data Preview: {selectedDataset?.name || 'None Selected'}</span>
            </h2>
            <p className="text-xs text-slate-400">
              Showing first 50 observations. Use the search filter to inspect specific rows or download the filtered dataset.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter table rows..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && selectedDataset) {
                    setPage(1);
                    loadPreview(selectedDataset.id, 1, search);
                  }
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 w-44"
              />
            </div>

            {selectedDataset && (
              <div className="flex items-center gap-1.5">
                <a
                  href={`http://127.0.0.1:8000/api/dataset/${selectedDataset.id}/export-filtered?format=csv${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                  download
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center gap-1.5"
                  title={search ? 'Download rows matching your filter as CSV' : 'Download complete dataset as CSV'}
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{search ? 'Export Filtered CSV' : 'Export CSV'}</span>
                </a>

                <a
                  href={`http://127.0.0.1:8000/api/dataset/${selectedDataset.id}/export-filtered?format=json${search ? `&search=${encodeURIComponent(search)}` : ''}`}
                  download
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center gap-1.5"
                  title="Download as JSON"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>JSON</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Table View */}
        {previewLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <span>Loading preview rows...</span>
          </div>
        ) : previewData?.data?.length > 0 ? (
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="px-3 py-2.5 font-medium text-slate-500 w-12">#</th>
                  {previewData.columns.map((col: string) => (
                    <th key={col} className="px-3 py-2.5 font-semibold text-slate-300 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {previewData.data.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="px-3 py-2 text-slate-600 text-[11px]">
                      {(page - 1) * previewData.page_size + i + 1}
                    </td>
                    {previewData.columns.map((col: string) => (
                      <td key={col} className="px-3 py-2 whitespace-nowrap truncate max-w-[200px]">
                        {row[col] === null ? (
                          <span className="text-amber-500/80 italic text-[10px]">null</span>
                        ) : typeof row[col] === 'boolean' ? (
                          <span className={row[col] ? 'text-emerald-400' : 'text-red-400'}>
                            {String(row[col])}
                          </span>
                        ) : (
                          String(row[col])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-48 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-xs">
            No rows match your query or no dataset is currently selected.
          </div>
        )}

        {/* Pagination Bar */}
        {previewData && (
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing {previewData.data?.length || 0} of {previewData.total_rows?.toLocaleString()} rows
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono">
                Page {page} of {previewData.total_pages || 1}
              </span>
              <button
                disabled={page >= (previewData.total_pages || 1)}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
