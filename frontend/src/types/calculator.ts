export interface GPUSpecs {
  name: string;
  computeBandwidth: number; // TFLOPS
  memoryBandwidth: number; // GB/s
  memorySize: number; // GB
}

export interface ModelSpecs {
  parameters: number; // in billions
  sequenceLength: number; // N - context length for attention calculation
  batchSize: number;
  promptTokens: number;
  outputTokens: number;
  quantization: QuantizationType;
  headDimension?: number; // d_head - dimension of a single attention head
  nLayers?: number; // number of transformer layers
  nHeads?: number; // number of attention heads (d_model = d_head * n_heads)
}

export interface SystemOverhead {
  prefillEfficiencyPercent: number; // efficiency for prefill time calculations in percentage (default: 100)
  decodeEfficiencyPercent: number; // efficiency for decode/time-per-token calculations in percentage (default: 100)
}

export type QuantizationType = 'FP32' | 'FP16' | 'INT8' | 'INT4';

export interface QuantizationInfo {
  name: QuantizationType;
  bytesPerParameter: number;
  description: string;
  computeMultiplier: number; // Performance multiplier for compute operations
}

export interface CalculationResults {
  opsToByteRatio: number;
  arithmeticIntensity: number;
  isMemoryBound: boolean;
  isComputeBound: boolean;
  prefillTime: number; // ms
  timePerToken: number; // ms
  totalGenerationTime: number; // ms
  throughputTokensPerSecond: number;
  modelSizeGB: number; // Model size in GB
  memoryUtilization: number; // Percentage of GPU memory used
  hasMemoryWarning: boolean; // True if model doesn't fit in GPU memory
  memoryWarningMessage?: string; // Warning message if memory insufficient
  kvCachePerTokenGB: number; // KV cache memory per token in GB
  freeMemoryForKVCacheGB: number; // Available memory for KV cache in GB
  maxKVCacheTokens: number; // Maximum tokens that can fit in KV cache
  maxBatchSize: number; // Maximum batch size based on available memory
  totalMemoryUsedGB: number; // Total memory used (model + KV cache + overhead) in GB
  currentKVCacheGB: number; // Current KV cache size for current batch and sequence length in GB
  hasPerformanceWarning: boolean; // True if throughput is too low
  performanceWarningMessage?: string; // Warning message for poor performance
}

export interface ComparisonResult {
  gpu: GPUSpecs;
  results: CalculationResults;
}

export const QUANTIZATION_OPTIONS: QuantizationInfo[] = [
  {
    name: 'FP32',
    bytesPerParameter: 4,
    description: '32-bit floating point - highest precision, largest size',
    computeMultiplier: 0.5, // Slower than FP16
  },
  {
    name: 'FP16',
    bytesPerParameter: 2,
    description: '16-bit floating point - good precision/performance balance',
    computeMultiplier: 1.0, // Baseline
  },
  {
    name: 'INT8',
    bytesPerParameter: 1,
    description: '8-bit integer - smaller size, slight quality loss',
    computeMultiplier: 2.0, // Faster compute
  },
  {
    name: 'INT4',
    bytesPerParameter: 0.5,
    description: '4-bit integer - smallest size, noticeable quality loss',
    computeMultiplier: 4.0, // Much faster compute
  },
];


export const DEFAULT_MODEL: ModelSpecs = {
  parameters: 7, // 7B parameters
  sequenceLength: 4096, // N - Llama 2 7B context length for attention calculation
  batchSize: 1,
  promptTokens: 350,
  outputTokens: 150,
  quantization: 'FP16',
  headDimension: 128, // d_head - Llama 2 7B attention head dimension
  nLayers: 32, // Llama 2 7B has 32 layers
  nHeads: 32, // Llama 2 7B has 32 attention heads (d_model = 128 * 32 = 4096)
};

export const DEFAULT_SYSTEM_OVERHEAD: SystemOverhead = {
  prefillEfficiencyPercent: 80, // default efficiency for prefill time calculations
  decodeEfficiencyPercent: 80, // default efficiency for decode time calculations
};
