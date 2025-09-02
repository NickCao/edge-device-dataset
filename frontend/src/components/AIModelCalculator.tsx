import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Computer as ComputerIcon,
  Memory as ModelIcon,
  AccessTime as ClockIcon,
  Calculate as CalculateIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import type { GPUSpecs, ModelSpecs, CalculationResults } from '../types/calculator';
import { COMMON_GPUS, DEFAULT_MODEL } from '../types/calculator';
import { calculatePerformance } from '../utils/calculations';
import { GPUSelector } from './GPUSelector';
import { ModelInputs } from './ModelInputs';
import { ResultsDisplay } from './ResultsDisplay';
import { ComparisonChart } from './ComparisonChart';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const AIModelCalculator: React.FC = () => {
  const [selectedGPU, setSelectedGPU] = useState<GPUSpecs>(COMMON_GPUS[1]); // Default to A10
  const [modelSpecs, setModelSpecs] = useState<ModelSpecs>(DEFAULT_MODEL);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Calculate results whenever GPU or model specs change
  useEffect(() => {
    if (selectedGPU && modelSpecs) {
      const calculationResults = calculatePerformance(selectedGPU, modelSpecs);
      setResults(calculationResults);
    }
  }, [selectedGPU, modelSpecs]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Navigation Bar */}
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            AI Model Performance Calculator
          </Typography>
        </Toolbar>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="calculator tabs"
            centered
          >
            <Tab 
              label="Calculator" 
              icon={<CalculateIcon />} 
              iconPosition="start"
              sx={{ minHeight: 64, textTransform: 'none', fontSize: '1rem' }}
            />
            <Tab 
              label="Comparison" 
              icon={<BarChartIcon />} 
              iconPosition="start"
              sx={{ minHeight: 64, textTransform: 'none', fontSize: '1rem' }}
            />
          </Tabs>
        </Box>
      </AppBar>

      {/* Tab Content */}
      <Container maxWidth="xl">
        {/* Calculator Tab */}
        <TabPanel value={tabValue} index={0}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', py: 2, mb: 2 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ fontWeight: 'bold', mb: 2 }}
            >
              Performance Calculator
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
              {results && (
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
              )}
            </Box>
          </Box>
        </TabPanel>

        {/* Comparison Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ textAlign: 'center', py: 2, mb: 3 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ fontWeight: 'bold', mb: 2 }}
            >
              GPU Comparison
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ maxWidth: '800px', mx: 'auto' }}
            >
              Compare performance across all GPUs using the current model configuration.
              Switch between performance metrics, bottleneck analysis, and throughput comparison.
            </Typography>
          </Box>

                <Card elevation={3}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <BarChartIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h2">
              Interactive Charts & Rankings
            </Typography>
          </Box>
          <ComparisonChart 
            availableModels={[
              { name: 'Current Model Configuration', specs: modelSpecs },
              { name: 'Llama 2 7B (Default)', specs: DEFAULT_MODEL },
            ]}
          />
        </CardContent>
      </Card>
        </TabPanel>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', py: 3, mt: 4, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            <strong>Performance estimates are theoretical</strong> - assuming prefill is compute-bound, 
            decode is memory-bound, and single batch inference.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Real-world performance may vary significantly based on implementation, hardware, and optimizations.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
