export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';

export interface Dataset {
  id: string;
  name: string;
  filename: string;
  row_count: number;
  col_count: number;
  rows?: number;
  columns?: number;
  file_size_kb: number;
  created_at: string;
  is_sample: boolean;
  cleaned_path?: string;
}

export interface ColumnProfile {
  name: string;
  type: 'numeric' | 'categorical';
  dtype: string;
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
  sample_values: any[];
  stats?: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    mean: number;
    std: number;
    skewness: number;
  };
  outliers?: {
    count: number;
    percentage: number;
    lower_bound: number;
    upper_bound: number;
  };
  top_categories?: Array<{ value: string; count: number; percentage: number }>;
}

export interface DatasetProfile {
  shape: {
    rows: number;
    columns: number;
    numeric_columns_count: number;
    categorical_columns_count: number;
  };
  quality_score: number;
  duplicate_rows: number;
  missing_cells: number;
  missing_cells_percentage: number;
  numeric_columns: string[];
  categorical_columns: string[];
  columns: ColumnProfile[];
  stats_summary: Record<string, any>;
  outlier_summary: Record<string, any>;
  correlation_matrix: {
    columns: string[];
    matrix: Array<Record<string, any>>;
  };
  suggested_questions?: string[];
}

export interface MLModelResult {
  name: string;
  task_type: 'classification' | 'regression';
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    r2_score?: number;
    mae?: number;
    rmse?: number;
    mse?: number;
  };
  confusion_matrix?: {
    labels: string[];
    matrix: number[][];
  };
}

export interface MLTrainingResponse {
  target_column: string;
  task_type: 'classification' | 'regression';
  train_samples: number;
  test_samples: number;
  best_model: string;
  models: MLModelResult[];
  feature_importance: Array<{ feature: string; importance: number }>;
  feature_columns: string[];
}

// API methods
export async function getDatasets(): Promise<Dataset[]> {
  const res = await fetch(`${API_BASE_URL}/api/datasets`);
  if (!res.ok) throw new Error('Failed to fetch datasets');
  return res.json();
}

export async function uploadDataset(file: File, name?: string): Promise<Dataset> {
  const formData = new FormData();
  formData.append('file', file);
  if (name) formData.append('name', name);

  const res = await fetch(`${API_BASE_URL}/api/datasets/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to upload dataset');
  }
  return res.json();
}

export async function getDatasetProfile(id: string): Promise<DatasetProfile> {
  const res = await fetch(`${API_BASE_URL}/api/datasets/${id}/profile`);
  if (!res.ok) throw new Error('Failed to fetch dataset profile');
  return res.json();
}

export async function getDatasetPreview(
  id: string,
  page: number = 1,
  pageSize: number = 50,
  search?: string
): Promise<{
  total_rows: number;
  page: number;
  page_size: number;
  total_pages: number;
  columns: string[];
  data: Array<Record<string, any>>;
}> {
  const url = new URL(`${API_BASE_URL}/api/datasets/${id}/preview`);
  url.searchParams.append('page', String(page));
  url.searchParams.append('page_size', String(pageSize));
  if (search) url.searchParams.append('search', search);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch dataset preview');
  return res.json();
}

export async function askQuestion(
  id: string,
  question: string
): Promise<{
  answer: string;
  chart?: any;
  referenced_columns?: string[];
}> {
  const res = await fetch(`${API_BASE_URL}/api/datasets/${id}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to answer query');
  }
  return res.json();
}

export async function generateChart(
  id: string,
  params: {
    chart_type: string;
    x_col: string;
    y_col?: string;
    aggregation?: string;
    group_by?: string;
    limit?: number;
  }
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/datasets/${id}/chart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to generate chart');
  }
  return res.json();
}

export async function cleanDataset(
  id: string,
  options: {
    remove_duplicates: boolean;
    missing_strategy: string;
    outlier_strategy: string;
  }
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/datasets/${id}/clean`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to clean dataset');
  }
  return res.json();
}

export async function trainModel(
  id: string,
  target_column: string,
  feature_columns?: string[],
  task_type?: string
): Promise<MLTrainingResponse> {
  const res = await fetch(`${API_BASE_URL}/api/datasets/${id}/train-model`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target_column,
      feature_columns,
      task_type,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to train models');
  }
  return res.json();
}

export async function getModelResults(id: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/datasets/${id}/model-results`);
  if (!res.ok) throw new Error('Failed to fetch model results');
  return res.json();
}

export async function predictSample(id: string, features: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/datasets/${id}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Prediction failed');
  }
  return res.json();
}

export async function generateReport(id: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/datasets/${id}/generate-report`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to generate report');
  }
  return res.json();
}

export async function importOpenMLDataset(datasetName: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/public/openml/import?dataset_name=${datasetName}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to import OpenML dataset');
  }
  return res.json();
}

// --- AI Data Scientist & Autonomous Multi-Dataset EDA ---

export interface CatalogDataset {
  id: string;
  name: string;
  filename: string;
  is_sample: boolean;
  row_count: number;
  col_count: number;
  numeric_count: number;
  categorical_count: number;
  missing_cells: number;
  missing_cells_percentage: number;
  duplicate_rows: number;
  quality_score: number;
  readiness: string;
  readiness_color: string;
  content_hash: string;
  created_at: string;
}

export interface AutoEDAReport {
  dataset_id: string;
  dataset_name: string;
  content_hash: string;
  generated_at: string;
  status: string;
  narrative: string;
  quality_score: number;
  readiness_tier: string;
  key_findings: string[];
  recommendations: string[];
  hallucination_checks: {
    verified: boolean;
    total_numbers_checked: number;
    fabricated_numbers_stripped: number;
    violations_detected: string[];
    canonical_ground_truth_items?: number;
  };
  from_cache: boolean;
}

export async function getEDACatalog(): Promise<CatalogDataset[]> {
  const res = await fetch(`${API_BASE_URL}/api/eda/catalog`);
  if (!res.ok) throw new Error('Failed to fetch dataset catalog');
  return res.json();
}

export async function getAutoEDAReport(datasetId: string, forceRefresh: boolean = false): Promise<AutoEDAReport> {
  const url = `${API_BASE_URL}/api/dataset/${datasetId}/auto-eda${forceRefresh ? '?force_refresh=true' : ''}`;
  const res = await fetch(url, {
    method: forceRefresh ? 'POST' : 'GET',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to generate auto-EDA report');
  }
  const data = await res.json();
  return data.report || data;
}

export async function compareDatasets(datasetIds: string[]): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/eda/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataset_ids: datasetIds }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to compare datasets');
  }
  return res.json();
}

export async function askPortfolio(question: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/eda/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to query dataset portfolio');
  }
  return res.json();
}

