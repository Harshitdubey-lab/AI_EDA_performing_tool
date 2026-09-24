'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DashboardView } from '@/components/views/DashboardView';
import { UploadView } from '@/components/views/UploadView';
import { ExplorerView } from '@/components/views/ExplorerView';
import { ChatView } from '@/components/views/ChatView';
import { VisualizerView } from '@/components/views/VisualizerView';
import { MLStudioView } from '@/components/views/MLStudioView';
import { ReportsView } from '@/components/views/ReportsView';
import { CleanerView } from '@/components/views/CleanerView';
import { DataScientistView } from '@/components/views/DataScientistView';

import {
  Dataset,
  DatasetProfile,
  getDatasets,
  getDatasetProfile,
  API_BASE_URL
} from '@/lib/api';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);

  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load: Fetch datasets
  const loadDatasets = async (selectId?: string) => {
    try {
      const list = await getDatasets();
      setDatasets(list);

      if (list.length > 0) {
        const target = selectId
          ? list.find((d) => d.id === selectId) || list[0]
          : selectedDataset || list[0];
        setSelectedDataset(target);
        await loadProfile(target.id);
      }
    } catch (err: any) {
      setError(`Could not connect to FastAPI backend on ${API_BASE_URL}. Ensure the backend server is running.`);
    } finally {
      setLoadingInitial(false);
    }
  };

  const loadProfile = async (datasetId: string) => {
    try {
      const p = await getDatasetProfile(datasetId);
      setProfile(p);
    } catch (err: any) {
      console.error('Failed to load profile:', err);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const handleSelectDataset = (d: Dataset) => {
    setSelectedDataset(d);
    loadProfile(d.id);
  };

  const handleDatasetUploaded = (newDataset: Dataset) => {
    loadDatasets(newDataset.id);
    setActiveTab('explorer');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        datasetName={selectedDataset?.name}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          datasets={datasets}
          selectedDataset={selectedDataset}
          onSelectDataset={handleSelectDataset}
          onOpenUpload={() => setActiveTab('upload')}
          onRefresh={() => {
            if (selectedDataset) {
              loadProfile(selectedDataset.id);
            }
          }}
          qualityScore={profile?.quality_score}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {loadingInitial ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="text-sm font-medium">Initializing InsightPilot AI Workspace...</span>
            </div>
          ) : error && datasets.length === 0 ? (
            <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-2xl max-w-xl mx-auto text-center mt-12">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <h2 className="text-base font-bold text-white">Backend Connection Notice</h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setLoadingInitial(true);
                  loadDatasets();
                }}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  datasets={datasets}
                  selectedDataset={selectedDataset}
                  profile={profile}
                  onSelectDataset={handleSelectDataset}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'data-scientist' && (
                <DataScientistView
                  selectedDataset={selectedDataset}
                  onSelectDataset={handleSelectDataset}
                />
              )}

              {activeTab === 'upload' && (
                <UploadView
                  selectedDataset={selectedDataset}
                  onDatasetUploaded={handleDatasetUploaded}
                  onSelectDataset={handleSelectDataset}
                  datasets={datasets}
                />
              )}

              {activeTab === 'explorer' && (
                <ExplorerView
                  profile={profile}
                  datasetName={selectedDataset?.name}
                  datasetId={selectedDataset?.id}
                />
              )}

              {activeTab === 'chat' && (
                <ChatView
                  selectedDataset={selectedDataset}
                  profile={profile}
                />
              )}

              {activeTab === 'visualizer' && (
                <VisualizerView
                  selectedDataset={selectedDataset}
                  profile={profile}
                />
              )}

              {activeTab === 'ml-studio' && (
                <MLStudioView
                  selectedDataset={selectedDataset}
                  profile={profile}
                />
              )}

              {activeTab === 'cleaner' && (
                <CleanerView
                  selectedDataset={selectedDataset}
                  profile={profile}
                  onRefreshProfile={() => selectedDataset && loadProfile(selectedDataset.id)}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  selectedDataset={selectedDataset}
                  profile={profile}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
