import React, { useState } from 'react';
import type { GPUSpecs } from '../types/calculator';
import { COMMON_GPUS } from '../types/calculator';
import { ChevronDown } from 'lucide-react';

interface GPUSelectorProps {
  selectedGPU: GPUSpecs;
  onGPUChange: (gpu: GPUSpecs) => void;
}

export const GPUSelector: React.FC<GPUSelectorProps> = ({ selectedGPU, onGPUChange }) => {
  const [isCustom, setIsCustom] = useState(false);
  const [customGPU, setCustomGPU] = useState<GPUSpecs>(selectedGPU);

  const handlePresetChange = (gpuName: string) => {
    if (gpuName === 'custom') {
      setIsCustom(true);
      onGPUChange(customGPU);
    } else {
      setIsCustom(false);
      const gpu = COMMON_GPUS.find(g => g.name === gpuName);
      if (gpu) {
        onGPUChange(gpu);
      }
    }
  };

  const handleCustomGPUChange = (field: keyof GPUSpecs, value: string | number) => {
    const updatedGPU = { ...customGPU, [field]: value };
    setCustomGPU(updatedGPU);
    onGPUChange(updatedGPU);
  };

  return (
    <div className="space-y-3">
      {/* GPU Preset Selector */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Select GPU
        </label>
        <div className="relative">
          <select
            value={isCustom ? 'custom' : selectedGPU.name}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full pl-3 pr-8 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md appearance-none bg-white"
          >
            {COMMON_GPUS.map((gpu) => (
              <option key={gpu.name} value={gpu.name}>
                {gpu.name}
              </option>
            ))}
            <option value="custom">Custom GPU</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Custom GPU Inputs */}
      {isCustom && (
        <div className="space-y-2 p-3 bg-gray-50 rounded-md border">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              GPU Name
            </label>
            <input
              type="text"
              value={customGPU.name}
              onChange={(e) => handleCustomGPUChange('name', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Custom GPU"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Compute Bandwidth (TFLOPS)
            </label>
            <input
              type="number"
              value={customGPU.computeBandwidth}
              onChange={(e) => handleCustomGPUChange('computeBandwidth', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="125"
              min="0"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Memory Bandwidth (GB/s)
            </label>
            <input
              type="number"
              value={customGPU.memoryBandwidth}
              onChange={(e) => handleCustomGPUChange('memoryBandwidth', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="600"
              min="0"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Memory Size (GB)
            </label>
            <input
              type="number"
              value={customGPU.memorySize}
              onChange={(e) => handleCustomGPUChange('memorySize', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="24"
              min="0"
              step="1"
            />
          </div>
        </div>
      )}

      {/* GPU Specs Display */}
      <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
        <h4 className="text-xs font-medium text-blue-900 mb-2">Current GPU Specs</h4>
        <div className="grid grid-cols-1 gap-1 text-xs text-blue-700">
          <div className="flex justify-between">
            <span>Compute:</span>
            <span className="font-mono">{selectedGPU.computeBandwidth} TFLOPS</span>
          </div>
          <div className="flex justify-between">
            <span>Memory BW:</span>
            <span className="font-mono">{selectedGPU.memoryBandwidth} GB/s</span>
          </div>
          <div className="flex justify-between">
            <span>Memory:</span>
            <span className="font-mono">{selectedGPU.memorySize} GB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
