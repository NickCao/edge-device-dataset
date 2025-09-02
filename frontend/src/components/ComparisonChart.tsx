import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import type { ComparisonResult } from '../types/calculator';
import { BarChart3, TrendingUp, Clock, Zap } from 'lucide-react';

interface ComparisonChartProps {
  comparisons: ComparisonResult[];
}

type ChartType = 'performance' | 'bottleneck' | 'throughput';

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ comparisons }) => {
  const [chartType, setChartType] = useState<ChartType>('performance');

  // Prepare data for performance chart (times)
  const performanceData = comparisons.map(comp => ({
    name: comp.gpu.name.replace('NVIDIA ', '').replace(' SXM', ''),
    prefillTime: comp.results.prefillTime,
    timePerToken: comp.results.timePerToken,
    totalTime: comp.results.totalGenerationTime,
    throughput: comp.results.throughputTokensPerSecond,
  }));

  // Prepare data for bottleneck analysis
  const bottleneckData = comparisons.map(comp => ({
    name: comp.gpu.name.replace('NVIDIA ', '').replace(' SXM', ''),
    opsToByteRatio: comp.results.opsToByteRatio,
    arithmeticIntensity: comp.results.arithmeticIntensity,
    isMemoryBound: comp.results.isMemoryBound,
  }));

  // Prepare data for throughput comparison
  const throughputData = comparisons.map(comp => ({
    name: comp.gpu.name.replace('NVIDIA ', '').replace(' SXM', ''),
    throughput: comp.results.throughputTokensPerSecond,
    computeBandwidth: comp.gpu.computeBandwidth,
    memoryBandwidth: comp.gpu.memoryBandwidth,
  }));

  const formatTooltipValue = (value: number, name: string) => {
    if (name.includes('Time') || name.includes('time')) {
      return value < 1000 ? `${value.toFixed(1)}ms` : `${(value / 1000).toFixed(2)}s`;
    }
    if (name.includes('throughput') || name.includes('Throughput')) {
      return `${value.toFixed(0)} tokens/s`;
    }
    if (name.includes('Bandwidth') || name.includes('bandwidth')) {
      return name.includes('compute') ? `${value} TFLOPS` : `${value} GB/s`;
    }
    return `${value.toFixed(1)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${formatTooltipValue(entry.value, entry.name)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case 'performance':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData} margin={{ top: 10, right: 20, left: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={11}
              />
              <YAxis 
                label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }}
                fontSize={11}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend fontSize={11} />
              <Bar dataKey="prefillTime" fill="#3B82F6" name="Prefill Time" />
              <Bar dataKey="timePerToken" fill="#10B981" name="Time per Token" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'bottleneck':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bottleneckData} margin={{ top: 10, right: 20, left: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={11}
              />
              <YAxis 
                label={{ value: 'Ops/Byte', angle: -90, position: 'insideLeft' }}
                fontSize={11}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend fontSize={11} />
              <Line 
                type="monotone" 
                dataKey="opsToByteRatio" 
                stroke="#8B5CF6" 
                name="Ops:Byte Ratio"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="arithmeticIntensity" 
                stroke="#F59E0B" 
                name="Arithmetic Intensity"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'throughput':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={throughputData} margin={{ top: 10, right: 20, left: 10, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={11}
              />
              <YAxis 
                label={{ value: 'Tokens/Second', angle: -90, position: 'insideLeft' }}
                fontSize={11}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend fontSize={11} />
              <Bar dataKey="throughput" fill="#EF4444" name="Throughput" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Chart Type Selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setChartType('performance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            chartType === 'performance'
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Clock className="h-4 w-4" />
          Performance Times
        </button>
        
        <button
          onClick={() => setChartType('bottleneck')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            chartType === 'bottleneck'
              ? 'bg-purple-50 border-purple-200 text-purple-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Bottleneck Analysis
        </button>
        
        <button
          onClick={() => setChartType('throughput')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            chartType === 'throughput'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Throughput
        </button>
      </div>

      {/* Chart */}
      <div className="bg-white p-4 rounded-md border border-gray-200">
        {renderChart()}
      </div>

      {/* Chart Description */}
      <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
        <div className="flex items-start gap-2">
          <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-700">
            {chartType === 'performance' && (
              <p>
                <strong>Performance Times:</strong> Compare prefill and generation times. Lower is better.
              </p>
            )}
            {chartType === 'bottleneck' && (
              <p>
                <strong>Bottleneck Analysis:</strong> When intensity below ratio line, it's memory-bound. Above = compute-bound.
              </p>
            )}
            {chartType === 'throughput' && (
              <p>
                <strong>Throughput:</strong> Total tokens/second including input and output. Higher is better.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* GPU Ranking */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-green-50 rounded-md border border-green-200">
          <h4 className="text-xs font-medium text-green-900 mb-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Fastest (Throughput)
          </h4>
          <div className="space-y-1">
            {comparisons
              .sort((a, b) => b.results.throughputTokensPerSecond - a.results.throughputTokensPerSecond)
              .slice(0, 3)
              .map((comp, index) => (
                <div key={comp.gpu.name} className="flex justify-between items-center text-xs">
                  <span className="text-green-700">
                    {index + 1}. {comp.gpu.name.replace('NVIDIA ', '')}
                  </span>
                  <span className="font-mono text-green-600">
                    {comp.results.throughputTokensPerSecond.toFixed(0)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="p-3 bg-orange-50 rounded-md border border-orange-200">
          <h4 className="text-xs font-medium text-orange-900 mb-2 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Lowest Latency
          </h4>
          <div className="space-y-1">
            {comparisons
              .sort((a, b) => a.results.timePerToken - b.results.timePerToken)
              .slice(0, 3)
              .map((comp, index) => (
                <div key={comp.gpu.name} className="flex justify-between items-center text-xs">
                  <span className="text-orange-700">
                    {index + 1}. {comp.gpu.name.replace('NVIDIA ', '')}
                  </span>
                  <span className="font-mono text-orange-600">
                    {comp.results.timePerToken < 1000 
                      ? `${comp.results.timePerToken.toFixed(1)}ms`
                      : `${(comp.results.timePerToken / 1000).toFixed(2)}s`
                    }
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
