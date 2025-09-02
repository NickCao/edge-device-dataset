import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Paper,
  Tooltip,
  IconButton,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import type { ModelSpecs, QuantizationType } from '../types/calculator';
import { QUANTIZATION_OPTIONS } from '../types/calculator';

interface ModelInputsProps {
  modelSpecs: ModelSpecs;
  onModelChange: (specs: ModelSpecs) => void;
}

const COMMON_MODELS = [
  { name: 'Llama 2 7B', parameters: 7 },
  { name: 'Llama 2 13B', parameters: 13 },
  { name: 'Llama 2 70B', parameters: 70 },
  { name: 'Mistral 7B', parameters: 7 },
  { name: 'GPT-3.5 equivalent', parameters: 175 },
  { name: 'Custom', parameters: 0 },
];

export const ModelInputs: React.FC<ModelInputsProps> = ({ modelSpecs, onModelChange }) => {
  const handleInputChange = (field: keyof ModelSpecs, value: number | QuantizationType) => {
    onModelChange({ ...modelSpecs, [field]: value });
  };

  const handlePresetChange = (parameters: number) => {
    if (parameters > 0) {
      onModelChange({ ...modelSpecs, parameters });
    }
  };

  // Calculate model size based on quantization
  const quantInfo = QUANTIZATION_OPTIONS.find(q => q.name === modelSpecs.quantization) || QUANTIZATION_OPTIONS[1];
  const modelSizeGB = modelSpecs.parameters * quantInfo.bytesPerParameter;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Model Preset Selector */}
      <FormControl fullWidth size="small">
        <InputLabel id="model-preset-label">Model Preset</InputLabel>
        <Select
          labelId="model-preset-label"
          label="Model Preset"
          defaultValue=""
          onChange={(e) => {
            const model = COMMON_MODELS.find(m => m.name === e.target.value);
            if (model) handlePresetChange(model.parameters);
          }}
        >
          <MenuItem value="">Select a model...</MenuItem>
          {COMMON_MODELS.map((model) => (
            <MenuItem key={model.name} value={model.name}>
              {model.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Parameters Input */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          label="Parameters (Billions)"
          type="number"
          value={modelSpecs.parameters}
          onChange={(e) => handleInputChange('parameters', parseFloat(e.target.value) || 0)}
          size="small"
          fullWidth
          placeholder="7"
          inputProps={{ min: 0.1, step: 0.1 }}
          helperText={`~${modelSizeGB.toFixed(1)} GB (${modelSpecs.quantization})`}
        />
        <Tooltip title="Total parameters (e.g., 7 for Llama 2 7B)" placement="top">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Quantization */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="quantization-label">Quantization</InputLabel>
          <Select
            labelId="quantization-label"
            value={modelSpecs.quantization}
            label="Quantization"
            onChange={(e) => handleInputChange('quantization', e.target.value as QuantizationType)}
          >
            {QUANTIZATION_OPTIONS.map((quant) => (
              <MenuItem key={quant.name} value={quant.name}>
                {quant.name} ({quant.bytesPerParameter}x bytes/param)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title={quantInfo.description} placement="top">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Sequence Length */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          label="Max Sequence Length"
          type="number"
          value={modelSpecs.sequenceLength}
          onChange={(e) => handleInputChange('sequenceLength', parseInt(e.target.value) || 0)}
          size="small"
          fullWidth
          placeholder="2048"
          inputProps={{ min: 1, step: 1 }}
        />
        <Tooltip title="Context window size" placement="top">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Batch Size */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          label="Batch Size"
          type="number"
          value={modelSpecs.batchSize}
          onChange={(e) => handleInputChange('batchSize', parseInt(e.target.value) || 1)}
          size="small"
          fullWidth
          placeholder="1"
          inputProps={{ min: 1, step: 1 }}
        />
        <Tooltip title="Sequences processed simultaneously" placement="top">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Prompt Tokens */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          label="Prompt Tokens"
          type="number"
          value={modelSpecs.promptTokens}
          onChange={(e) => handleInputChange('promptTokens', parseInt(e.target.value) || 0)}
          size="small"
          fullWidth
          placeholder="350"
          inputProps={{ min: 1, step: 1 }}
        />
        <Tooltip title="Input tokens (prefill)" placement="top">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Output Tokens */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          label="Output Tokens"
          type="number"
          value={modelSpecs.outputTokens}
          onChange={(e) => handleInputChange('outputTokens', parseInt(e.target.value) || 0)}
          size="small"
          fullWidth
          placeholder="150"
          inputProps={{ min: 1, step: 1 }}
        />
        <Tooltip title="Tokens to generate" placement="top">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Summary */}
      <Paper sx={{ p: 2, backgroundColor: 'success.light', color: 'success.contrastText' }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          Summary
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="caption">
            Total tokens: {modelSpecs.promptTokens + modelSpecs.outputTokens}
          </Typography>
          <Typography variant="caption">
            Model size: ~{modelSizeGB.toFixed(1)} GB ({modelSpecs.quantization})
          </Typography>
          <Typography variant="caption">
            Batch size: {modelSpecs.batchSize}
          </Typography>
          <Typography variant="caption">
            Quantization: {modelSpecs.quantization} ({quantInfo.bytesPerParameter}x bytes/param)
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
