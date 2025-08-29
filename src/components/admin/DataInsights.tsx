import React, { useState, useMemo } from 'react';
import { Text, Badge, Button, Card } from '../shared';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Filter, Download, Calendar } from 'lucide-react';

export interface DataPoint {
  label: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  category?: string;
  color?: string;
}

export interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'metric';
  data: DataPoint[];
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  description?: string;
  insights?: string[];
}

interface DataInsightsProps {
  charts: ChartData[];
  onPeriodChange: (chartId: string, period: ChartData['period']) => void;
  onExport: (chartId: string) => void;
}

const DataInsights: React.FC<DataInsightsProps> = ({
  charts,
  onPeriodChange: _onPeriodChange,
  onExport,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ChartData['period']>('month');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    charts.forEach(chart => {
      chart.data.forEach(point => {
        if (point.category) categories.add(point.category);
      });
    });
    return Array.from(categories);
  }, [charts]);

  const filteredCharts = useMemo(() => {
    if (activeFilters.length === 0) return charts;
    return charts.filter(chart => 
      chart.data.some(point => 
        point.category && activeFilters.includes(point.category)
      )
    );
  }, [charts, activeFilters]);

  const toggleFilter = (category: string) => {
    setActiveFilters(prev => 
      prev.includes(category) 
        ? prev.filter(f => f !== category)
        : [...prev, category]
    );
  };

  const renderMetricChart = (chart: ChartData) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {chart.data.map((point, index) => (
        <div key={index} className="bg-white p-4 rounded-lg border border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <Text variant="p" size="sm" color="muted">
              {point.label}
            </Text>
            {point.change && (
              <div className={`flex items-center gap-1 text-xs ${
                point.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {point.changeType === 'increase' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(point.change)}%
              </div>
            )}
          </div>
          <Text variant="h3" size="2xl" weight="bold" className="mb-2">
            {point.value.toLocaleString()}
          </Text>
          {point.category && (
            <Badge variant="secondary" size="sm">
              {point.category}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );

  const renderBarChart = (chart: ChartData) => {
    const maxValue = Math.max(...chart.data.map(d => d.value));
    
    return (
      <div className="space-y-3">
        {chart.data.map((point, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-24 text-sm text-neutral-600 truncate">
              {point.label}
            </div>
            <div className="flex-1 bg-neutral-200 rounded-full h-6 relative">
              <div
                className="h-6 rounded-full transition-all duration-300"
                style={{
                  width: `${(point.value / maxValue) * 100}%`,
                  backgroundColor: point.color || '#3b82f6'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Text variant="p" size="xs" weight="medium" className="text-white">
                  {point.value.toLocaleString()}
                </Text>
              </div>
            </div>
            {point.change && (
              <div className={`flex items-center gap-1 text-xs w-16 ${
                point.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {point.changeType === 'increase' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(point.change)}%
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPieChart = (chart: ChartData) => {
    const total = chart.data.reduce((sum, point) => sum + point.value, 0);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Simple pie chart visualization */}
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            {chart.data.map((point, index) => {
              const percentage = (point.value / total) * 100;
              const rotation = chart.data
                .slice(0, index)
                .reduce((sum, p) => sum + (p.value / total) * 360, 0);
              
              return (
                <div
                  key={index}
                  className="absolute inset-0 rounded-full border-4 border-transparent"
                  style={{
                    borderTopColor: point.color || '#3b82f6',
                    transform: `rotate(${rotation}deg)`,
                    clipPath: `polygon(50% 0%, 50% 50%, ${50 + percentage * 0.5}% 50%)`
                  }}
                />
              );
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="space-y-2">
          {chart.data.map((point, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: point.color || '#3b82f6' }}
              />
              <Text variant="p" size="sm" className="flex-1">
                {point.label}
              </Text>
              <Text variant="p" size="sm" weight="medium">
                {((point.value / total) * 100).toFixed(1)}%
              </Text>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderChart = (chart: ChartData) => {
    switch (chart.type) {
      case 'metric':
        return renderMetricChart(chart);
      case 'bar':
        return renderBarChart(chart);
      case 'pie':
        return renderPieChart(chart);
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  const getChartIcon = (type: ChartData['type']) => {
    switch (type) {
      case 'line':
        return <TrendingUp className="w-5 h-5" />;
      case 'bar':
        return <BarChart3 className="w-5 h-5" />;
      case 'pie':
        return <PieChart className="w-5 h-5" />;
      case 'metric':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <BarChart3 className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Text variant="h2" size="2xl" weight="semibold">Data Insights</Text>
          <Text variant="p" color="muted">Analytics and performance metrics</Text>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as ChartData['period'])}
              className="text-sm border border-neutral-300 rounded px-2 py-1"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="year">Year</option>
            </select>
          </div>
          
          {/* Category Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            {availableCategories.map(category => (
              <button
                key={category}
                onClick={() => toggleFilter(category)}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  activeFilters.includes(category)
                    ? 'bg-brand-primary text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCharts.map(chart => (
          <Card key={chart.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {getChartIcon(chart.type)}
                <div>
                  <Text variant="h3" size="lg" weight="semibold">
                    {chart.title}
                  </Text>
                  {chart.description && (
                    <Text variant="p" size="sm" color="muted">
                      {chart.description}
                    </Text>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onExport(chart.id)}
                  className="text-neutral-500 hover:text-neutral-700"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Chart Content */}
            <div className="mb-4">
              {renderChart(chart)}
            </div>
            
            {/* Insights */}
            {chart.insights && chart.insights.length > 0 && (
              <div className="border-t border-neutral-200 pt-4">
                <Text variant="h4" size="sm" weight="semibold" className="mb-2">
                  Key Insights
                </Text>
                <ul className="space-y-1">
                  {chart.insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-neutral-600">
                      <div className="w-1.5 h-1.5 bg-brand-primary rounded-full mt-2 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>
      
      {/* Empty State */}
      {filteredCharts.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
          <Text variant="h3" size="lg" weight="semibold" className="mb-2">
            No data available
          </Text>
          <Text variant="p" color="muted">
            {activeFilters.length > 0 
              ? 'Try adjusting your filters or select a different time period.'
              : 'Select a time period to view insights.'
            }
          </Text>
        </div>
      )}
    </div>
  );
};

export default DataInsights;
