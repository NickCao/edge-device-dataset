import React from 'react';
import {
  TextField,
  Box,
  Typography,
  Paper,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import type { SystemOverhead } from '../types/calculator';

interface SystemOverheadInputsProps {
  systemOverhead: SystemOverhead;
  onSystemOverheadChange: (overhead: SystemOverhead) => void;
}

export const SystemOverheadInputs: React.FC<SystemOverheadInputsProps> = ({
  systemOverhead,
  onSystemOverheadChange
}) => {
  const handleInputChange = (field: keyof SystemOverhead, value: number) => {
    onSystemOverheadChange({ ...systemOverhead, [field]: value });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Prefill Coefficient */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          label="Prefill Coefficient"
          type="number"
          value={systemOverhead.prefillCoefficient}
          onChange={(e) => handleInputChange('prefillCoefficient', parseFloat(e.target.value) || 1.0)}
          size="small"
          fullWidth
          placeholder="1.0"
          inputProps={{ min: 0.1, max: 10.0, step: 0.1 }}
        />
        <Tooltip title="Multiplier for prefill time calculations (1.0 = theoretical baseline, >1.0 = slower, <1.0 = faster due to system overhead)" placement="top">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Decode Coefficient */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          label="Decode Coefficient"
          type="number"
          value={systemOverhead.decodeCoefficient}
          onChange={(e) => handleInputChange('decodeCoefficient', parseFloat(e.target.value) || 1.0)}
          size="small"
          fullWidth
          placeholder="1.0"
          inputProps={{ min: 0.1, max: 10.0, step: 0.1 }}
        />
        <Tooltip title="Multiplier for decode/time-per-token calculations (1.0 = theoretical baseline, >1.0 = slower, <1.0 = faster due to system overhead)" placement="top">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Summary */}
      <Paper sx={{ p: 2, backgroundColor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          System Overhead Summary
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="caption">
            Prefill multiplier: {systemOverhead.prefillCoefficient.toFixed(1)}x
          </Typography>
          <Typography variant="caption">
            Decode multiplier: {systemOverhead.decodeCoefficient.toFixed(1)}x
          </Typography>
          <Typography variant="caption">
            {systemOverhead.prefillCoefficient === 1.0 && systemOverhead.decodeCoefficient === 1.0 
              ? 'Using theoretical performance (no overhead)'
              : `Adjusted for system overhead: ${
                  systemOverhead.prefillCoefficient > 1.0 || systemOverhead.decodeCoefficient > 1.0
                    ? 'slower than theoretical'
                    : 'faster than theoretical'
                }`
            }
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
