import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  Star,
  Shield,
  Clock,
  TrendingUp,
  CheckCircle,
  HelpCircle,
  Briefcase,
  BarChart,
} from 'lucide-react';

import {
  getFirstContactResolutionRate,
  getAverageInitialResponseTime,
  getAverageCustomerSatisfactionScore,
  getEscalationRate,
  getAverageServiceRequestThroughputTime,
  getOrdersSourcedFromChatRate,
  getJobOrderAccuracyRate,
  getOrderStatusInquiryRate,
  getUpToDateServicePortfolioRate,
  getServicePortfolioUtilizationRate,
} from './getKpi';

// --- TYPE DEFINITIONS ---
interface DateRange {
  startDate: string;
  endDate: string;
}

type KpiFunc =
  | ((range: DateRange) => Promise<number | null>)
  | ((range: DateRange, otherOrders: number) => Promise<number | null>);

interface KpiDefinition {
  id: string;
  name: string;
  func: KpiFunc;
  unit: string;
  icon: React.ElementType;
  color: string;
  target: string;
}

interface CardProps {
  kpi: KpiDefinition;
  value: number | null | undefined;
  loading: boolean;
}

// --- KPI DEFINITIONS ---
const kpiDefinitions: KpiDefinition[] = [
  {
    id: 'fcr',
    name: '1. Chatbot FCR Rate',
    func: getFirstContactResolutionRate,
    unit: '%',
    icon: Zap,
    color: 'text-green-500',
    target: 'High',
  },
  {
    id: 'avgResponse',
    name: '2. Avg Initial Response Time',
    func: getAverageInitialResponseTime,
    unit: 's',
    icon: Clock,
    color: 'text-blue-500',
    target: 'Low',
  },
  {
    id: 'csat',
    name: '3. Customer Satisfaction Score (CSAT)',
    func: getAverageCustomerSatisfactionScore,
    unit: '/5',
    icon: Star,
    color: 'text-yellow-500',
    target: 'High',
  },
  {
    id: 'escalation',
    name: '4. Escalation Rate',
    func: getEscalationRate,
    unit: '%',
    icon: Shield,
    color: 'text-red-500',
    target: 'Low',
  },
  {
    id: 'srtt',
    name: '5. Avg Request Throughput Time (SRTT)',
    func: getAverageServiceRequestThroughputTime,
    unit: 'hrs', // display hours in the dashboard (getKpi still returns seconds)
    icon: Clock,
    color: 'text-orange-500',
    target: 'Low',
  },
  {
    id: 'chatSource',
    name: '6. Service Requests via PRINTY',
    func: getOrdersSourcedFromChatRate,
    unit: '%',
    icon: TrendingUp,
    color: 'text-purple-500',
    target: 'High/Increasing',
  },
  {
    id: 'joar',
    name: '7. Job Order Accuracy Rate (JOAR)',
    func: getJobOrderAccuracyRate,
    unit: '%',
    icon: CheckCircle,
    color: 'text-green-600',
    target: 'High',
  },
  {
    id: 'inquiryRate',
    name: '8. Status Inquiry Rate',
    func: getOrderStatusInquiryRate,
    unit: ' per order',
    icon: HelpCircle,
    color: 'text-pink-500',
    target: 'Diagnostic (Low)',
  },
  {
    id: 'portfolioRate',
    name: '9. Up-to-date Service Portfolio Rate',
    func: getUpToDateServicePortfolioRate,
    unit: '%',
    icon: Briefcase,
    color: 'text-cyan-500',
    target: '100%',
  },
  {
    id: 'spur',
    name: '10. Service Portfolio Utilization Rate (SPUR)',
    func: getServicePortfolioUtilizationRate,
    unit: '%',
    icon: BarChart,
    color: 'text-indigo-500',
    target: 'High',
  },
];

// Helper function to get today's date in 'YYYY-MM-DD' format
const getToday = (): string => new Date().toISOString().split('T')[0];
// Helper function to get the date 30 days ago
const getOneMonthAgo = (): string => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split('T')[0];
};

// Use React.FC with CardProps for strict typing
const Card: React.FC<CardProps> = ({ kpi, value, loading }) => {
  const Icon = kpi.icon;

  // Convert SRTT seconds -> hours for display; leave other KPIs unchanged.
  let displayValue: string;
  if (loading) {
    displayValue = '...';
  } else if (value === undefined || value === null) {
    displayValue = 'N/A';
  } else if (typeof value === 'number') {
    if (kpi.id === 'srtt') {
      const hours = value / 3600;
      displayValue = `${Number(hours.toFixed(2))} ${kpi.unit}`; // unit set to 'h' above
    } else {
      displayValue = `${value.toFixed(1)}${kpi.unit}`;
    }
  } else {
    displayValue = String(value);
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        {/* Icon container retains the custom color logic */}
        <div
          className={`p-3 rounded-full ${kpi.color} bg-opacity-10`}
          style={{
            backgroundColor: `${kpi.color.replace('text-', '').replace('-500', '-100')}`,
          }}
        >
          <Icon size={24} className={kpi.color} />
        </div>
        <div className="text-right">
          <p className="device-text-heading font-semibold text-neutral-900 tabular-nums">
            {displayValue}
          </p>
        </div>
      </div>
      <p className="mt-3 device-text-body font-semibold text-neutral-700">
        {kpi.name}
      </p>
      <p className="device-text-caption text-neutral-600 mt-1">
        Target Impact:{' '}
        <span className="font-medium text-neutral-700">{kpi.target}</span>
      </p>
      {value === null && !loading && (
        <p className="text-xs text-error mt-2">
          Error: Data missing or calculation failed.
        </p>
      )}
    </div>
  );
};

// Storage key for persisting KPI data
const STORAGE_KEY = 'superadmin-kpi-data';

// Interface for stored data
interface StoredKpiData {
  kpiData: Record<string, number | null | undefined>;
  dateRange: DateRange;
  ordersFromOtherChannels: number;
  timestamp: number;
}

// Helper function to load data from localStorage
const loadStoredData = (): Partial<StoredKpiData> | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StoredKpiData;
      // Validate that stored data is not too old (e.g., 24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const now = Date.now();
      if (now - parsed.timestamp < maxAge) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading stored KPI data:', error);
  }
  return null;
};

// Helper function to save data to localStorage
const saveStoredData = (
  kpiData: Record<string, number | null | undefined>,
  dateRange: DateRange,
  ordersFromOtherChannels: number
) => {
  try {
    const data: StoredKpiData = {
      kpiData,
      dateRange,
      ordersFromOtherChannels,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving KPI data to storage:', error);
  }
};

// Use React.FC for the main component
const SuperAdminDashboard: React.FC = () => {
  // Load initial state from localStorage or use defaults
  const storedData = loadStoredData();

  const [dateRange, setDateRange] = useState<DateRange>(
    storedData?.dateRange || {
      startDate: getOneMonthAgo(),
      endDate: getToday(),
    }
  );
  // The state will hold KPI IDs mapped to their number values, or null if failed.
  const [kpiData, setKpiData] = useState<
    Record<string, number | null | undefined>
  >(storedData?.kpiData || {});
  const [loading, setLoading] = useState<boolean>(false);
  // State for the external input required by KPI 6
  const [ordersFromOtherChannels, setOrdersFromOtherChannels] =
    useState<number>(storedData?.ordersFromOtherChannels || 0);

  // Function to fetch all KPI data, explicitly typed
  const fetchKpiData = useCallback(async () => {
    setLoading(true);
    // Dispatch loading started event for header button state
    window.dispatchEvent(
      new CustomEvent('superadmin-refresh-loading', {
        detail: { loading: true },
      })
    );

    const results: Record<string, number | null | undefined> = {};

    const promises = kpiDefinitions.map(async kpi => {
      let value: number | null = null;
      try {
        if (kpi.id === 'chatSource') {
          value = await (
            kpi.func as (
              range: DateRange,
              otherOrders: number
            ) => Promise<number | null>
          )(dateRange, ordersFromOtherChannels);
        } else {
          value = await (
            kpi.func as (range: DateRange) => Promise<number | null>
          )(dateRange);
        }
      } catch (e) {
        console.error(`Error fetching KPI ${kpi.id}:`, e);
        value = null;
      }
      return { id: kpi.id, value };
    });

    const settledResults: PromiseSettledResult<{
      id: string;
      value: number | null;
    }>[] = await Promise.allSettled(promises);

    settledResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results[result.value.id] = result.value.value;
      }
    });

    setKpiData(results);
    setLoading(false);
    // Save to localStorage for persistence
    saveStoredData(results, dateRange, ordersFromOtherChannels);
    // Dispatch loading finished event for header button state
    window.dispatchEvent(
      new CustomEvent('superadmin-refresh-loading', {
        detail: { loading: false },
      })
    );
  }, [dateRange, ordersFromOtherChannels]);

  // NOTE: KPI processing will only run when:
  // - a 'superadmin-refresh-data' event is dispatched from the header "Refresh Data" button
  // Data is loaded from localStorage on mount and persists across page refreshes

  // Listen for refresh events from SuperAdminRoot navbar
  useEffect(() => {
    const handleRefresh = () => {
      fetchKpiData();
    };

    window.addEventListener(
      'superadmin-refresh-data',
      handleRefresh as EventListener
    );
    return () => {
      window.removeEventListener(
        'superadmin-refresh-data',
        handleRefresh as EventListener
      );
    };
  }, [fetchKpiData]);

  // Save dateRange and ordersFromOtherChannels to localStorage when they change
  // (but only if we already have KPI data, to avoid overwriting with empty data)
  // The kpiData will be saved when fetchKpiData completes
  useEffect(() => {
    if (Object.keys(kpiData).length > 0) {
      saveStoredData(kpiData, dateRange, ordersFromOtherChannels);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, ordersFromOtherChannels]); // Note: kpiData intentionally excluded to avoid circular updates

  // Render Section
  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header and Controls */}
        <header className="card device-spacing-component mb-10">
          <h1 className="device-text-hero font-semibold text-brand-primary mb-2">
            PRINTY Superadmin KPI Dashboard
          </h1>
          <p className="device-text-body text-neutral-600 mb-6">
            Monitoring key metrics for chatbot effectiveness and service
            management.
          </p>

          <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
            {/* Date Range Picker */}
            <div className="flex flex-col lg:flex-row gap-3 flex-grow">
              <label className="block w-full lg:w-auto">
                <span className="device-text-caption font-medium text-neutral-700">
                  Start Date
                </span>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                  className="input device-input mt-1 w-full"
                  max={dateRange.endDate}
                />
              </label>
              <label className="block w-full lg:w-auto">
                <span className="device-text-caption font-medium text-neutral-700">
                  End Date
                </span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                  className="input device-input mt-1 w-full"
                  min={dateRange.startDate}
                  max={getToday()}
                />
              </label>
            </div>

            {/* External Input for KPI 6 */}
            <label className="block w-full lg:w-auto lg:min-w-[200px]">
              <span className="device-text-caption font-medium text-neutral-700">
                Orders via Email/Call (#6)
              </span>
              <input
                type="number"
                value={ordersFromOtherChannels}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setOrdersFromOtherChannels(Number(e.target.value) || 0)
                }
                className="input device-input mt-1 w-full"
                placeholder="Enter non-chat orders"
                min="0"
              />
            </label>
          </div>
        </header>

        {/* KPI Grid Display */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {kpiDefinitions.map((kpi: KpiDefinition) => (
            <Card
              key={kpi.id}
              kpi={kpi}
              value={kpiData[kpi.id]}
              loading={loading}
            />
          ))}
        </section>

        {/* Footer/Instructions */}
        <footer className="card device-spacing-component mt-8 text-center">
          <p className="device-text-caption text-neutral-600">
            Values are processed on demand. Click "Refresh Data" in the header
            to pull KPIs from Supabase.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
