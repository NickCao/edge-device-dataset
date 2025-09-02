import React from 'react';
import type { GPUSpecs, CalculationResults } from '../types/calculator';
import { AlertTriangle, CheckCircle, Clock, Zap, TrendingUp, Gauge } from 'lucide-react';

interface ResultsDisplayProps {
  gpu: GPUSpecs;
  results: CalculationResults;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ gpu, results }) => {
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatNumber = (num: number, decimals: number = 1): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toFixed(decimals);
  };

  return (
    <div className="space-y-4">
      {/* Bottleneck Analysis */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-md border border-blue-200 bg-blue-50">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-medium text-blue-900">Ops:Byte Ratio</h4>
          </div>
          <div className="text-xl font-bold text-blue-700">
            {formatNumber(results.opsToByteRatio)}
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Hardware capability
          </p>
        </div>

        <div className="p-3 rounded-md border border-purple-200 bg-purple-50">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-purple-600" />
            <h4 className="text-sm font-medium text-purple-900">Arithmetic Intensity</h4>
          </div>
          <div className="text-xl font-bold text-purple-700">
            {formatNumber(results.arithmeticIntensity)}
          </div>
          <p className="text-xs text-purple-600 mt-1">
            Model requirement
          </p>
        </div>
      </div>

      {/* Bottleneck Result */}
      <div className={`p-3 rounded-md border ${
        results.isMemoryBound 
          ? 'border-orange-200 bg-orange-50' 
          : 'border-green-200 bg-green-50'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {results.isMemoryBound ? (
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <h3 className={`text-base font-medium ${
            results.isMemoryBound ? 'text-orange-900' : 'text-green-900'
          }`}>
            {results.isMemoryBound ? 'Memory Bound' : 'Compute Bound'}
          </h3>
        </div>
        
        <div className={`text-xs ${
          results.isMemoryBound ? 'text-orange-700' : 'text-green-700'
        }`}>
          <p className="mb-1">
            Arithmetic intensity ({results.arithmeticIntensity.toFixed(1)}) vs Ops:Byte ratio ({results.opsToByteRatio.toFixed(1)})
          </p>
          {results.isMemoryBound ? (
            <p><strong>Tip:</strong> Increase batch size or use higher memory bandwidth GPU</p>
          ) : (
            <p><strong>Tip:</strong> Upgrade compute power or use optimization techniques</p>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-md border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-3 w-3 text-gray-500" />
            <h4 className="text-xs font-medium text-gray-700">Prefill Time</h4>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {formatTime(results.prefillTime)}
          </div>
          <p className="text-xs text-gray-500">
            Input processing
          </p>
        </div>

        <div className="p-3 bg-white rounded-md border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-3 w-3 text-gray-500" />
            <h4 className="text-xs font-medium text-gray-700">Per Token</h4>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {formatTime(results.timePerToken)}
          </div>
          <p className="text-xs text-gray-500">
            Generation
          </p>
        </div>

        <div className="p-3 bg-white rounded-md border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-3 w-3 text-gray-500" />
            <h4 className="text-xs font-medium text-gray-700">Total Time</h4>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {formatTime(results.totalGenerationTime)}
          </div>
          <p className="text-xs text-gray-500">
            End-to-end
          </p>
        </div>

        <div className="p-3 bg-white rounded-md border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-3 w-3 text-gray-500" />
            <h4 className="text-xs font-medium text-gray-700">Throughput</h4>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {formatNumber(results.throughputTokensPerSecond, 0)}
          </div>
          <p className="text-xs text-gray-500">
            tokens/s
          </p>
        </div>
      </div>


    </div>
  );
};
