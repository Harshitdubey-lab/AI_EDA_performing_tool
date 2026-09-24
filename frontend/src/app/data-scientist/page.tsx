'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DataScientistView } from '@/components/views/DataScientistView';
import { Dataset, DatasetProfile, getDatasets, getDatasetProfile } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DataScientistPage() {
  const router = useRouter();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const list = await getDatasets();
      setDatasets(list);
      if (list.length > 0) {
        setSelectedDataset(list[0]);
        const prof = await getDatasetProfile(list[0].id);
        setProfile(prof);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (d: Dataset) => {
    setSelectedDataset(d);
    try {
      const prof = await getDatasetProfile(d.id);
      setProfile(prof);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar
        activeTab="data-scientist"
        setActiveTab={(tab) => {
          if (tab === 'data-scientist') return;
          router.push('/');
        }}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        datasetName={selectedDataset?.name}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          datasets={datasets}
          selectedDataset={selectedDataset}
          onSelectDataset={handleSelect}
          onOpenUpload={() => router.push('/')}
          onRefresh={() => selectedDataset && handleSelect(selectedDataset)}
          qualityScore={profile?.quality_score}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="text-sm font-medium">Loading AI Data Scientist Agent...</span>
            </div>
          ) : (
            <DataScientistView
              selectedDataset={selectedDataset}
              onSelectDataset={handleSelect}
            />
          )}
        </main>
      </div>
    </div>
  );
}
