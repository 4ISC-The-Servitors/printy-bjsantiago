import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
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
    unit: 's',
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
    name: '8. Order Status Inquiry Rate',
    func: getOrderStatusInquiryRate,
    unit: 'per order',
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
  // Use 'value === undefined' for initial render check, 'value === null' for explicit error
  const displayValue = loading
    ? '...'
    : value === undefined || value === null
      ? 'N/A'
      : typeof value === 'number'
        ? value.toFixed(1) + kpi.unit
        : value;

  return (
    // Applied rounded-2xl and increased padding for a softer, more modern card
    <div className="bg-white p-6 rounded-2xl shadow-lg transition duration-300 hover:shadow-xl border border-gray-100">
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
          <p className="text-3xl font-bold text-gray-800 tabular-nums">
            {displayValue}
          </p>
        </div>
      </div>
      <p className="mt-3 text-lg font-semibold text-gray-700">{kpi.name}</p>
      <p className="text-sm text-gray-500 mt-1">
        Target Impact:{' '}
        <span className="font-medium text-gray-600">{kpi.target}</span>
      </p>
      {value === null && !loading && (
        <p className="text-xs text-red-500 mt-2">
          Error: Data missing or calculation failed.
        </p>
      )}
    </div>
  );
};

// Use React.FC for the main component
const SuperAdminDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: getOneMonthAgo(),
    endDate: getToday(),
  });
  // The state will hold KPI IDs mapped to their number values, or null if failed.
  const [kpiData, setKpiData] = useState<
    Record<string, number | null | undefined>
  >({});
  const [loading, setLoading] = useState<boolean>(false);
  // State for the external input required by KPI 6
  const [ordersFromOtherChannels, setOrdersFromOtherChannels] =
    useState<number>(0);

  // Function to fetch all KPI data, explicitly typed
  const fetchKpiData = useCallback(async () => {
    setLoading(true);
    // Use Record<string, ...> for the results object
    const results: Record<string, number | null | undefined> = {};

    // Use Promise.allSettled to handle errors in individual KPI calls gracefully
    const promises = kpiDefinitions.map(async kpi => {
      let value: number | null = null;
      try {
        // Special handling for KPI 6 which requires an additional parameter
        if (kpi.id === 'chatSource') {
          // Type assertion to satisfy TypeScript
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
        // If there's an error, the value remains null, which the card handles
        value = null;
      }
      return { id: kpi.id, value };
    });

    // Explicitly define the type for the Promise.allSettled result
    const settledResults: PromiseSettledResult<{
      id: string;
      value: number | null;
    }>[] = await Promise.allSettled(promises);

    settledResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results[result.value.id] = result.value.value;
      }
      // If status is 'rejected', the value remains undefined/null, handled by initial declaration
    });

    setKpiData(results);
    setLoading(false);
  }, [dateRange, ordersFromOtherChannels]);

  // Effect to re-fetch data whenever the date range or the external order count changes
  useEffect(() => {
    fetchKpiData();
  }, [fetchKpiData]);

  // Render Section
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-['Inter']">
      <div className="max-w-7xl mx-auto">
        {/* Header and Controls: Updated to use rounded-2xl and indigo-700 */}
        <header className="bg-white p-8 rounded-2xl shadow-xl mb-10">
          <h1 className="text-4xl font-extrabold text-indigo-700 mb-2">
            PRINTY Superadmin KPI Dashboard
          </h1>
          <p className="text-gray-500 mb-6">
            Monitoring key metrics for chatbot effectiveness and service
            management.
          </p>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Date Range Picker */}
            <div className="flex flex-col sm:flex-row gap-3 flex-grow">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  Start Date
                </span>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                  // Added rounded-lg and focused ring color
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border focus:border-indigo-500 focus:ring-indigo-500 focus:ring-1 transition duration-150"
                  max={dateRange.endDate}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  End Date
                </span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                  // Added rounded-lg and focused ring color
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border focus:border-indigo-500 focus:ring-indigo-500 focus:ring-1 transition duration-150"
                  min={dateRange.startDate}
                  max={getToday()}
                />
              </label>
            </div>

            {/* External Input for KPI 6 */}
            <label className="block w-full sm:w-auto md:w-1/4">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Orders via Email/Call (#6)
              </span>
              <input
                type="number"
                value={ordersFromOtherChannels}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setOrdersFromOtherChannels(Number(e.target.value) || 0)
                }
                // Added rounded-lg and focused ring color
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 border focus:border-indigo-500 focus:ring-indigo-500 focus:ring-1 transition duration-150"
                placeholder="Enter non-chat orders"
                min="0"
              />
            </label>

            <button
              onClick={fetchKpiData}
              disabled={loading}
              // Updated to use bg-indigo-700 and font-bold, larger padding/size, and rounded-xl
              className={`w-full md:w-auto px-6 py-3 rounded-xl font-bold text-white transition duration-300 flex items-center justify-center ${
                loading
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-700 hover:bg-indigo-800 shadow-md hover:shadow-lg'
              }`}
            >
              <RefreshCw
                size={18}
                className={loading ? 'animate-spin mr-2' : 'mr-2'}
              />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
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

        {/* Footer/Instructions: Updated to use rounded-2xl */}
        <footer className="mt-8 text-center text-gray-500 text-sm p-4 bg-white rounded-2xl shadow-lg">
          <p>
            Values are based on live data from Supabase. This dashboard calls
            the 10 functions from <code>getKpi.ts</code> using the selected date
            range.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
