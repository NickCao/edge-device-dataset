import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import {
  Computer as ComputerIcon,
  Memory as ModelIcon,
  AccessTime as ClockIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import type { GPUSpecs, ModelSpecs, CalculationResults, ComparisonResult } from '../types/calculator';
import { COMMON_GPUS, DEFAULT_MODEL } from '../types/calculator';
import { calculatePerformance } from '../utils/calculations';
import { GPUSelector } from './GPUSelector';
import { ModelInputs } from './ModelInputs';
import { ResultsDisplay } from './ResultsDisplay';
import { ComparisonChart } from './ComparisonChart';

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
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: 3,
    }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold', 
              color: 'text.primary',
              mb: 2 
            }}
          >
            AI Model Performance Calculator
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ maxWidth: '600px', mx: 'auto' }}
          >
            Calculate if your LLM inference is compute-bound or memory-bound on different GPUs. 
            Based on{' '}
            <Typography
              component="a"
              href="https://www.baseten.co/blog/llm-transformer-inference-guide/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                fontWeight: 500,
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Baseten's methodology
            </Typography>.
          </Typography>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 3 
        }}>
          {/* Input Section */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              gap: 3 
            }}>
              <Box sx={{ flex: 1 }}>
                <Card elevation={3}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ComputerIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" component="h2">
                        GPU Configuration
                      </Typography>
                    </Box>
                    <GPUSelector
                      selectedGPU={selectedGPU}
                      onGPUChange={setSelectedGPU}
                    />
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Card elevation={3}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ModelIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" component="h2">
                        Model Configuration
                      </Typography>
                    </Box>
                    <ModelInputs
                      modelSpecs={modelSpecs}
                      onModelChange={setModelSpecs}
                    />
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Box>

          {/* Results Section */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {results && (
                <>
                  <Card elevation={3}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ClockIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" component="h2">
                          Performance Analysis
                        </Typography>
                      </Box>
                      <ResultsDisplay 
                        gpu={selectedGPU}
                        results={results}
                      />
                    </CardContent>
                  </Card>

                  <Card elevation={3}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <TrendingUpIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" component="h2">
                          GPU Comparison
                        </Typography>
                      </Box>
                      <ComparisonChart 
                        comparisons={comparisonResults}
                      />
                    </CardContent>
                  </Card>
                </>
              )}
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', py: 3, mt: 4 }}>
          <Typography variant="caption" color="text.secondary">
            Estimates based on theoretical models. Real performance may vary.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
