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
  Divider,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import type { ModelSpecs, QuantizationType } from '../types/calculator';
import { QUANTIZATION_OPTIONS } from '../types/calculator';

interface ModelInputsProps {
  modelSpecs: ModelSpecs;
  onModelChange: (specs: ModelSpecs) => void;
}

const COMMON_MODELS = [
  { 
    name: 'Llama 2 7B', 
    parameters: 7, 
    sequenceLength: 4096, // N - context length
    headDimension: 128,   // d_head - attention head dimension
    nLayers: 32,          // number of transformer layers
    nHeads: 32           // number of attention heads (d_model = d_head * n_heads = 128 * 32 = 4096)
  },
  {
    name: 'Llama 2 13B', 
    parameters: 13, 
    sequenceLength: 4096, 
    headDimension: 128,
    nLayers: 40,
    nHeads: 40
  },
  {
    name: 'Llama 2 70B', 
    parameters: 70, 
    sequenceLength: 4096, 
    headDimension: 128,
    nLayers: 64,
    nHeads: 80
  },
  {
    name: 'Granite 3.3 2B',
    parameters: 2,
    sequenceLength: 131072,
    headDimension: 64,
    nLayers: 40,
    nHeads: 32
  },
  {
    name: 'Granite 3.3 8B',
    parameters: 8,
    sequenceLength: 131072,
    headDimension: 128,
    nLayers: 40,
    nHeads: 32
  },
  { 
    name: 'Custom', 
    parameters: 0, 
    sequenceLength: 2048, 
    headDimension: 128,
    nLayers: 32,
    nHeads: 32
  },
];

export const ModelInputs: React.FC<ModelInputsProps> = ({ modelSpecs, onModelChange }) => {
  const handleInputChange = (field: keyof ModelSpecs, value: number | QuantizationType) => {
    onModelChange({ ...modelSpecs, [field]: value });
  };

  const handlePresetChange = (modelName: string) => {
    const selectedModel = COMMON_MODELS.find(m => m.name === modelName);
    if (selectedModel && selectedModel.parameters > 0) {
      onModelChange({ 
        ...modelSpecs, 
        parameters: selectedModel.parameters,
        sequenceLength: selectedModel.sequenceLength,
        headDimension: selectedModel.headDimension,
        nLayers: selectedModel.nLayers,
        nHeads: selectedModel.nHeads
      });
    }
  };

  // Calculate model size based on quantization
  const quantInfo = QUANTIZATION_OPTIONS.find(q => q.name === modelSpecs.quantization) || QUANTIZATION_OPTIONS[1];
  const modelSizeGB = modelSpecs.parameters * quantInfo.bytesPerParameter;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Model Preset Selector */}
      <FormControl fullWidth size="small">
        <InputLabel id="model-select-label">Model Preset</InputLabel>
        <Select
          labelId="model-select-label"
          value={COMMON_MODELS.find(m => 
            m.parameters === modelSpecs.parameters &&
            m.sequenceLength === modelSpecs.sequenceLength &&
            m.headDimension === modelSpecs.headDimension &&
            m.nLayers === modelSpecs.nLayers &&
            m.nHeads === modelSpecs.nHeads
          )?.name || 'Custom'}
          label="Model Preset"
          onChange={(e) => handlePresetChange(e.target.value as string)}
        >
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

                {/* Context Length */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              label="Context Length (N)"
              type="number"
              value={modelSpecs.sequenceLength}
              onChange={(e) => handleInputChange('sequenceLength', parseInt(e.target.value) || 0)}
              size="small"
              fullWidth
              placeholder="4096"
              inputProps={{ min: 1, step: 1 }}
            />
            <Tooltip title="N - context window size used in attention equation (4096 for Llama 2 7B)" placement="top">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Head Dimension */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              label="Attention Head Dimension (d)"
              type="number"
              value={modelSpecs.headDimension || 128}
              onChange={(e) => handleInputChange('headDimension', parseInt(e.target.value) || 128)}
              size="small"
              fullWidth
              placeholder="128"
              inputProps={{ min: 1, step: 1 }}
            />
            <Tooltip title="d - dimension of a single attention head (128 for Llama 2 7B)" placement="top">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Number of Layers */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              label="Number of Layers"
              type="number"
              value={modelSpecs.nLayers || 32}
              onChange={(e) => handleInputChange('nLayers', parseInt(e.target.value) || 32)}
              size="small"
              fullWidth
              placeholder="32"
              inputProps={{ min: 1, step: 1 }}
            />
            <Tooltip title="Number of transformer layers (32 for Llama 2 7B)" placement="top">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Number of Heads */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              label="Number of Heads (n_heads)"
              type="number"
              value={modelSpecs.nHeads || 32}
              onChange={(e) => handleInputChange('nHeads', parseInt(e.target.value) || 32)}
              size="small"
              fullWidth
              placeholder="32"
              inputProps={{ min: 1, step: 1 }}
            />
            <Tooltip title="Number of attention heads (32 for Llama 2 7B, d_model = d_head * n_heads)" placement="top">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

      {/* Separator */}
      <Divider sx={{ my: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
          Inference Parameters
        </Typography>
      </Divider>

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
            Attention dimensions: N={modelSpecs.sequenceLength}, d={modelSpecs.headDimension || 128}
          </Typography>
          <Typography variant="caption">
            Architecture: {modelSpecs.nLayers || 32} layers, {modelSpecs.nHeads || 32} heads, d_model={(modelSpecs.headDimension || 128) * (modelSpecs.nHeads || 32)}
          </Typography>
          <Typography variant="caption">
            Quantization: {modelSpecs.quantization} ({quantInfo.bytesPerParameter}x bytes/param)
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
