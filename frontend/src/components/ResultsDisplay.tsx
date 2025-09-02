import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as ClockIcon,
  Bolt as BoltIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import type { GPUSpecs, CalculationResults } from '../types/calculator';

interface ResultsDisplayProps {
  gpu: GPUSpecs;
  results: CalculationResults;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Bottleneck Analysis */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <Paper sx={{ p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SpeedIcon sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Ops:Byte Ratio
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {formatNumber(results.opsToByteRatio)}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Hardware capability
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, backgroundColor: 'secondary.light', color: 'secondary.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <BoltIcon sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Arithmetic Intensity
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {formatNumber(results.arithmeticIntensity)}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Model requirement
          </Typography>
        </Paper>
      </Box>

            {/* Bottleneck Result */}
      <Alert 
        severity={results.isMemoryBound ? 'warning' : 'success'} 
        icon={results.isMemoryBound ? <WarningIcon /> : <CheckCircleIcon />}
        sx={{ p: 2 }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          {results.isMemoryBound ? 'Memory Bound' : 'Compute Bound'}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 1 }}>
          Arithmetic intensity ({results.arithmeticIntensity.toFixed(1)}) vs Ops:Byte ratio ({results.opsToByteRatio.toFixed(1)})
        </Typography>
        
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {results.isMemoryBound ? (
            <>Tip: Increase batch size or use higher memory bandwidth GPU</>
          ) : (
            <>Tip: Upgrade compute power or use optimization techniques</>
          )}
        </Typography>
      </Alert>

      {/* Performance Metrics */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, 
        gap: 2 
      }}>
        <Card elevation={2}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ClockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                Prefill Time
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {formatTime(results.prefillTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Input processing
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={2}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <BoltIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                Per Token
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {formatTime(results.timePerToken)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Generation
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={2}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ClockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                Total Time
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {formatTime(results.totalGenerationTime)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              End-to-end
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={2}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TrendingUpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                Throughput
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {formatNumber(results.throughputTokensPerSecond, 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              tokens/s
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
