export interface GPUSpecs {
  name: string;
  computeBandwidth: number; // TFLOPS
  memoryBandwidth: number; // GB/s
  memorySize: number; // GB
}

export interface ModelSpecs {
  parameters: number; // in billions
  sequenceLength: number;
  batchSize: number;
  promptTokens: number;
  outputTokens: number;
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
}

export interface ComparisonResult {
  gpu: GPUSpecs;
  results: CalculationResults;
}

export const COMMON_GPUS: GPUSpecs[] = [
  {
    name: "NVIDIA T4",
    computeBandwidth: 65, // TFLOPS FP16
    memoryBandwidth: 300, // GB/s
    memorySize: 16, // GB
  },
  {
    name: "NVIDIA A10",
    computeBandwidth: 125, // TFLOPS FP16
    memoryBandwidth: 600, // GB/s
    memorySize: 24, // GB
  },
  {
    name: "NVIDIA A100 SXM 80GB",
    computeBandwidth: 312, // TFLOPS FP16
    memoryBandwidth: 2039, // GB/s
    memorySize: 80, // GB
  },
  {
    name: "NVIDIA H100 SXM",
    computeBandwidth: 989, // TFLOPS FP16
    memoryBandwidth: 3352, // GB/s
    memorySize: 80, // GB
  },
  {
    name: "NVIDIA RTX 4090",
    computeBandwidth: 165, // TFLOPS FP16
    memoryBandwidth: 1008, // GB/s
    memorySize: 24, // GB
  },
];

export const DEFAULT_MODEL: ModelSpecs = {
  parameters: 7, // 7B parameters
  sequenceLength: 2048,
  batchSize: 1,
  promptTokens: 350,
  outputTokens: 150,
};
