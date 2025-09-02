import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import type { GPUSpecs, ModelSpecs, CalculationResults, ComparisonResult } from '../types/calculator';
import { COMMON_GPUS, DEFAULT_MODEL } from '../types/calculator';
import { calculatePerformance } from '../utils/calculations';
import { GPUSelector } from './GPUSelector';
import { ModelInputs } from './ModelInputs';
import { ResultsDisplay } from './ResultsDisplay';
import { ComparisonChart } from './ComparisonChart';
import { Cpu, Zap, Clock, TrendingUp } from 'lucide-react';

export const AIModelCalculator: React.FC = () => {
  const [selectedGPU, setSelectedGPU] = useState<GPUSpecs>(COMMON_GPUS[1]); // Default to A10
  const [modelSpecs, setModelSpecs] = useState<ModelSpecs>(DEFAULT_MODEL);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);

  // Calculate results whenever GPU or model specs change
  useEffect(() => {
    if (selectedGPU && modelSpecs) {
      const calculationResults = calculatePerformance(selectedGPU, modelSpecs);
      setResults(calculationResults);
      
      // Calculate comparison results for all GPUs
      const comparisons = COMMON_GPUS.map(gpu => ({
        gpu,
        results: calculatePerformance(gpu, modelSpecs),
      }));
      setComparisonResults(comparisons);
    }
  }, [selectedGPU, modelSpecs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center py-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Model Performance Calculator
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Calculate if your LLM inference is compute-bound or memory-bound on different GPUs. 
            Based on{' '}
            <a 
              href="https://www.baseten.co/blog/llm-transformer-inference-guide/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Baseten's methodology
            </a>.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Cpu className="w-4 h-4" />
                  GPU
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <GPUSelector
                  selectedGPU={selectedGPU}
                  onGPUChange={setSelectedGPU}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="w-4 h-4" />
                  Model
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <ModelInputs
                  modelSpecs={modelSpecs}
                  onModelChange={setModelSpecs}
                />
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-3 space-y-4">
            {results && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="w-4 h-4" />
                      Performance Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <ResultsDisplay 
                      gpu={selectedGPU}
                      results={results}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="w-4 h-4" />
                      GPU Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <ComparisonChart 
                      comparisons={comparisonResults}
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-3 text-gray-400">
          <p className="text-xs">
            Estimates based on theoretical models. Real performance may vary.
          </p>
        </div>
      </div>
    </div>
  );
};
