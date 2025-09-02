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
  // Server/Datacenter GPUs
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
  
  // NVIDIA Jetson Edge Devices
  {
    name: "Jetson AGX Thor",
    computeBandwidth: 200, // TFLOPS FP16 (estimated from 2070 TFLOPS FP4-Sparse)
    memoryBandwidth: 273, // GB/s
    memorySize: 128, // GB
  },
  {
    name: "Jetson T5000", 
    computeBandwidth: 200, // TFLOPS FP16 (estimated from 2070 TFLOPS FP4-Sparse)
    memoryBandwidth: 273, // GB/s
    memorySize: 128, // GB
  },
  {
    name: "Jetson T4000",
    computeBandwidth: 120, // TFLOPS FP16 (estimated from 1200 TFLOPS FP4-Sparse)
    memoryBandwidth: 273, // GB/s
    memorySize: 64, // GB
  },
  {
    name: "Jetson AGX Orin 64GB",
    computeBandwidth: 27, // TFLOPS FP16 (estimated from 275 TOPS INT8-Sparse)
    memoryBandwidth: 204.8, // GB/s
    memorySize: 64, // GB
  },
  {
    name: "Jetson AGX Orin 32GB",
    computeBandwidth: 20, // TFLOPS FP16 (estimated from 200 TOPS INT8-Sparse)
    memoryBandwidth: 204.8, // GB/s
    memorySize: 32, // GB
  },
  {
    name: "Jetson Orin NX 16GB",
    computeBandwidth: 16, // TFLOPS FP16 (estimated from 157 TOPS INT8-Sparse)
    memoryBandwidth: 102.4, // GB/s
    memorySize: 16, // GB
  },
  {
    name: "Jetson Orin NX 8GB",
    computeBandwidth: 12, // TFLOPS FP16 (estimated from 117 TOPS INT8-Sparse)
    memoryBandwidth: 102.4, // GB/s
    memorySize: 8, // GB
  },
  {
    name: "Jetson Orin Nano 8GB",
    computeBandwidth: 7, // TFLOPS FP16 (estimated from 67 TOPS INT8-Sparse)
    memoryBandwidth: 102, // GB/s
    memorySize: 8, // GB
  },
  {
    name: "Jetson Orin Nano 4GB",
    computeBandwidth: 3.4, // TFLOPS FP16 (estimated from 34 TOPS INT8-Sparse)
    memoryBandwidth: 51, // GB/s
    memorySize: 4, // GB
  },
  {
    name: "Jetson AGX Xavier 64GB",
    computeBandwidth: 5.5, // TFLOPS FP16 (estimated from 32 TOPS INT8-Sparse)
    memoryBandwidth: 136.5, // GB/s
    memorySize: 64, // GB
  },
  {
    name: "Jetson AGX Xavier 32GB",
    computeBandwidth: 5.5, // TFLOPS FP16 (estimated from 32 TOPS INT8-Sparse)
    memoryBandwidth: 136.5, // GB/s
    memorySize: 32, // GB
  },
  {
    name: "Jetson Xavier NX 16GB",
    computeBandwidth: 3.6, // TFLOPS FP16 (estimated from 21 TOPS INT8-Sparse)
    memoryBandwidth: 59.7, // GB/s
    memorySize: 16, // GB
  },
  {
    name: "Jetson Xavier NX 8GB",
    computeBandwidth: 3.6, // TFLOPS FP16 (estimated from 21 TOPS INT8-Sparse)
    memoryBandwidth: 59.7, // GB/s
    memorySize: 8, // GB
  },
  {
    name: "Jetson TX2",
    computeBandwidth: 1.3, // TFLOPS FP16 (from spec: 1.33 TFLOPS FP16-Dense)
    memoryBandwidth: 59.7, // GB/s
    memorySize: 8, // GB
  },
  {
    name: "Jetson TX2 NX",
    computeBandwidth: 1.3, // TFLOPS FP16 (from spec: 1.33 TFLOPS FP16-Dense)
    memoryBandwidth: 51.2, // GB/s
    memorySize: 4, // GB
  },
  {
    name: "Jetson Nano",
    computeBandwidth: 0.47, // TFLOPS FP16 (from spec: 0.472 TFLOPS FP16-Dense)
    memoryBandwidth: 25.6, // GB/s
    memorySize: 4, // GB
  },
];

export const DEFAULT_MODEL: ModelSpecs = {
  parameters: 7, // 7B parameters
  sequenceLength: 2048,
  batchSize: 1,
  promptTokens: 350,
  outputTokens: 150,
};
