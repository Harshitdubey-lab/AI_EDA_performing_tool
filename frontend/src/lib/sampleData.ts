import { Dataset, DatasetProfile } from './api';

export const FALLBACK_DATASETS: Dataset[] = [
  {
    id: 'sample-sales',
    name: 'Global Retail Sales & Returns',
    filename: 'sample_sales_data.csv',
    row_count: 650,
    col_count: 16,
    file_size_kb: 48.5,
    created_at: new Date().toISOString(),
    is_sample: true
  },
  {
    id: 'sample-churn',
    name: 'Customer Churn & Retention',
    filename: 'customer_churn.csv',
    row_count: 1000,
    col_count: 12,
    file_size_kb: 64.2,
    created_at: new Date().toISOString(),
    is_sample: true
  },
  {
    id: 'sample-housing',
    name: 'Residential Housing Valuations',
    filename: 'housing_prices.csv',
    row_count: 800,
    col_count: 14,
    file_size_kb: 52.8,
    created_at: new Date().toISOString(),
    is_sample: true
  }
];

export const FALLBACK_PROFILES: Record<string, DatasetProfile> = {
  'sample-sales': {
    shape: {
      rows: 650,
      columns: 16,
      numeric_columns_count: 8,
      categorical_columns_count: 8
    },
    quality_score: 94.5,
    duplicate_rows: 0,
    missing_cells: 0,
    missing_cells_percentage: 0.0,
    numeric_columns: ['quantity', 'unit_price', 'discount', 'revenue', 'profit', 'delivery_days', 'customer_satisfaction', 'returned'],
    categorical_columns: ['order_id', 'order_date', 'region', 'city', 'product_category', 'product_name', 'payment_method', 'customer_segment'],
    columns: [
      {
        name: 'revenue',
        type: 'numeric',
        dtype: 'float64',
        missing_count: 0,
        missing_percentage: 0.0,
        unique_count: 580,
        sample_values: [1250.0, 480.5, 3200.0, 890.0, 150.0],
        stats: { min: 45.0, q1: 350.0, median: 780.0, q3: 1850.0, max: 9800.0, mean: 1240.5, std: 1120.4, skewness: 1.8 }
      },
      {
        name: 'profit',
        type: 'numeric',
        dtype: 'float64',
        missing_count: 0,
        missing_percentage: 0.0,
        unique_count: 560,
        sample_values: [320.0, 110.2, 850.0, 190.0, 35.0],
        stats: { min: -120.0, q1: 85.0, median: 210.0, q3: 490.0, max: 2450.0, mean: 310.2, std: 280.6, skewness: 1.4 }
      },
      {
        name: 'product_category',
        type: 'categorical',
        dtype: 'object',
        missing_count: 0,
        missing_percentage: 0.0,
        unique_count: 5,
        sample_values: ['Technology', 'Office Supplies', 'Furniture', 'Electronics', 'Apparel'],
        top_categories: [
          { value: 'Technology', count: 210, percentage: 32.3 },
          { value: 'Electronics', count: 180, percentage: 27.7 },
          { value: 'Office Supplies', count: 140, percentage: 21.5 },
          { value: 'Furniture', count: 80, percentage: 12.3 },
          { value: 'Apparel', count: 40, percentage: 6.2 }
        ]
      },
      {
        name: 'region',
        type: 'categorical',
        dtype: 'object',
        missing_count: 0,
        missing_percentage: 0.0,
        unique_count: 4,
        sample_values: ['North America', 'Europe', 'Asia Pacific', 'Latin America'],
        top_categories: [
          { value: 'North America', count: 260, percentage: 40.0 },
          { value: 'Europe', count: 190, percentage: 29.2 },
          { value: 'Asia Pacific', count: 140, percentage: 21.5 },
          { value: 'Latin America', count: 60, percentage: 9.3 }
        ]
      }
    ],
    stats_summary: {
      revenue: { count: 650, mean: 1240.5, std: 1120.4, min: 45.0, median: 780.0, max: 9800.0 },
      profit: { count: 650, mean: 310.2, std: 280.6, min: -120.0, median: 210.0, max: 2450.0 }
    },
    outlier_summary: {
      revenue: { count: 12, lower_fence: 0.0, upper_fence: 4100.0, percentage: 1.8 },
      profit: { count: 8, lower_fence: -100.0, upper_fence: 1100.0, percentage: 1.2 }
    },
    correlation_matrix: {
      columns: ['quantity', 'unit_price', 'revenue', 'profit', 'discount', 'returned'],
      matrix: [
        { feature: 'quantity', quantity: 1.0, unit_price: -0.05, revenue: 0.72, profit: 0.58, discount: 0.12, returned: 0.04 },
        { feature: 'unit_price', quantity: -0.05, unit_price: 1.0, revenue: 0.65, profit: 0.61, discount: -0.08, returned: 0.02 },
        { feature: 'revenue', quantity: 0.72, unit_price: 0.65, revenue: 1.0, profit: 0.84, discount: 0.05, returned: 0.06 },
        { feature: 'profit', quantity: 0.58, unit_price: 0.61, revenue: 0.84, profit: 1.0, discount: -0.35, returned: -0.08 },
        { feature: 'discount', quantity: 0.12, unit_price: -0.08, revenue: 0.05, profit: -0.35, discount: 1.0, returned: 0.22 },
        { feature: 'returned', quantity: 0.04, unit_price: 0.02, revenue: 0.06, profit: -0.08, discount: 0.22, returned: 1.0 }
      ]
    },
    suggested_questions: [
      'What is the total revenue and profit margin by product category?',
      'Which region has the highest order return rate?',
      'How does discount percentage affect overall profitability?'
    ]
  }
};
