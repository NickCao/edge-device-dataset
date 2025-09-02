import React from 'react';
import type { ModelSpecs, QuantizationType } from '../types/calculator';
import { QUANTIZATION_OPTIONS } from '../types/calculator';
import { Info } from 'lucide-react';

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
    <div className="space-y-3">
      {/* Model Preset Selector */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Model Preset
        </label>
        <select
          onChange={(e) => {
            const model = COMMON_MODELS.find(m => m.name === e.target.value);
            if (model) handlePresetChange(model.parameters);
          }}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white"
        >
          <option value="">Select a model...</option>
          {COMMON_MODELS.map((model) => (
            <option key={model.name} value={model.name}>
              {model.name}
            </option>
          ))}
        </select>
      </div>

      {/* Parameters Input */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Parameters (Billions)
          <div className="inline-flex items-center ml-1 group relative">
            <Info className="h-3 w-3 text-gray-400" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Total parameters (e.g., 7 for Llama 2 7B)
            </div>
          </div>
        </label>
        <input
          type="number"
          value={modelSpecs.parameters}
          onChange={(e) => handleInputChange('parameters', parseFloat(e.target.value) || 0)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="7"
          min="0.1"
          step="0.1"
        />
        <p className="text-xs text-gray-500 mt-0.5">
          ~{modelSizeGB.toFixed(1)} GB ({modelSpecs.quantization})
        </p>
      </div>

      {/* Quantization */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Quantization
          <div className="inline-flex items-center ml-1 group relative">
            <Info className="h-3 w-3 text-gray-400" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              {quantInfo.description}
            </div>
          </div>
        </label>
        <select
          value={modelSpecs.quantization}
          onChange={(e) => handleInputChange('quantization', e.target.value as QuantizationType)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white"
        >
          {QUANTIZATION_OPTIONS.map((quant) => (
            <option key={quant.name} value={quant.name}>
              {quant.name} ({quant.bytesPerParameter}x bytes/param)
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-0.5">
          {quantInfo.description}
        </p>
      </div>

      {/* Sequence Length */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Max Sequence Length
          <div className="inline-flex items-center ml-1 group relative">
            <Info className="h-3 w-3 text-gray-400" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Context window size
            </div>
          </div>
        </label>
        <input
          type="number"
          value={modelSpecs.sequenceLength}
          onChange={(e) => handleInputChange('sequenceLength', parseInt(e.target.value) || 0)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="2048"
          min="1"
          step="1"
        />
      </div>

      {/* Batch Size */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Batch Size
          <div className="inline-flex items-center ml-1 group relative">
            <Info className="h-3 w-3 text-gray-400" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Sequences processed simultaneously
            </div>
          </div>
        </label>
        <input
          type="number"
          value={modelSpecs.batchSize}
          onChange={(e) => handleInputChange('batchSize', parseInt(e.target.value) || 1)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="1"
          min="1"
          step="1"
        />
      </div>

      {/* Prompt Tokens */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Prompt Tokens
          <div className="inline-flex items-center ml-1 group relative">
            <Info className="h-3 w-3 text-gray-400" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Input tokens (prefill)
            </div>
          </div>
        </label>
        <input
          type="number"
          value={modelSpecs.promptTokens}
          onChange={(e) => handleInputChange('promptTokens', parseInt(e.target.value) || 0)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="350"
          min="1"
          step="1"
        />
      </div>

      {/* Output Tokens */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Output Tokens
          <div className="inline-flex items-center ml-1 group relative">
            <Info className="h-3 w-3 text-gray-400" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Tokens to generate
            </div>
          </div>
        </label>
        <input
          type="number"
          value={modelSpecs.outputTokens}
          onChange={(e) => handleInputChange('outputTokens', parseInt(e.target.value) || 0)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="150"
          min="1"
          step="1"
        />
      </div>

      {/* Summary */}
      <div className="p-3 bg-green-50 rounded-md border border-green-200">
        <h4 className="text-xs font-medium text-green-900 mb-2">Summary</h4>
        <div className="grid grid-cols-1 gap-0.5 text-xs text-green-700">
          <div>Total tokens: {modelSpecs.promptTokens + modelSpecs.outputTokens}</div>
          <div>Model size: ~{modelSizeGB.toFixed(1)} GB ({modelSpecs.quantization})</div>
          <div>Batch size: {modelSpecs.batchSize}</div>
          <div>Quantization: {modelSpecs.quantization} ({quantInfo.bytesPerParameter}x bytes/param)</div>
        </div>
      </div>
    </div>
  );
};
