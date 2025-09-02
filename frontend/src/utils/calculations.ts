import type { GPUSpecs, ModelSpecs, CalculationResults, QuantizationInfo } from '../types/calculator';
import { QUANTIZATION_OPTIONS } from '../types/calculator';

/**
 * Get quantization information for a given quantization type
 */
function getQuantizationInfo(quantization: string): QuantizationInfo {
  return QUANTIZATION_OPTIONS.find(q => q.name === quantization) || QUANTIZATION_OPTIONS[1]; // Default to FP16
}

/**
 * Calculate model size in bytes based on parameters and quantization
 */
function calculateModelSizeBytes(model: ModelSpecs): number {
  const quantInfo = getQuantizationInfo(model.quantization);
  return model.parameters * 1e9 * quantInfo.bytesPerParameter;
}

/**
 * Calculate the operations-to-byte ratio of a GPU
 * This tells us how many FLOPS we can complete for every byte of memory access
 */
export function calculateOpsToByteRatio(gpu: GPUSpecs): number {
  // Convert TFLOPS to FLOPS and GB/s to bytes/s
  const computeFlops = gpu.computeBandwidth * 1e12; // TFLOPS to FLOPS
  const memoryBytesPerSecond = gpu.memoryBandwidth * 1e9; // GB/s to bytes/s
  
  return computeFlops / memoryBytesPerSecond;
}

/**
 * Calculate arithmetic intensity for transformer attention operations
 * Using exact formula from Baseten blog: https://www.baseten.co/blog/llm-transformer-inference-guide/
 * 
 * Breaking down the attention equation step by step:
 * total_memory_movement = 8N^2 + 8Nd bytes
 * total_compute = 4(N^2)d + 3N^2 ops  
 * arithmetic_intensity = total_compute / total_memory_movement
 */
export function calculateArithmeticIntensity(model: ModelSpecs): number {
  // For Llama-style transformers, estimate model dimensions
  // Based on standard transformer architectures
  const d = estimateModelDimension(model.parameters); // hidden dimension
  const N = model.sequenceLength; // sequence length
  
  // From Baseten's detailed attention breakdown:
  // Memory movement in bytes (accounting for quantization):
  // = (2 * 2 * (N * d)) + (2 * (N * N)) + (2 * ((N*N) + (N * d))) + (2 * (N * N)) + (2 * (N * N)) + (2 * (N * d))
  // = 8N^2 + 8Nd bytes
  
  const quantInfo = getQuantizationInfo(model.quantization);
  const totalMemoryMovement = (8 * N * N + 8 * N * d) * quantInfo.bytesPerParameter / 2; // Adjust for quantization vs FP16 baseline
  
  // Compute operations (from summing the second column in their table):
  // = ((2 * d) * (N * N)) + (3 * (N * N)) + ((2 * N) * (N * d))
  // = 4(N^2)d + 3N^2 ops
  const totalCompute = 4 * N * N * d + 3 * N * N;
  
  // Arithmetic intensity = total compute / total memory movement
  let arithmeticIntensity = totalCompute / totalMemoryMovement;
  
  // Apply batching effect - operations scale with batch size but memory movement stays constant
  arithmeticIntensity = arithmeticIntensity * model.batchSize;
  
  return Math.max(0.1, arithmeticIntensity); // Minimum realistic bound
}

/**
 * Estimate model hidden dimension based on parameter count
 * Based on standard transformer scaling relationships
 */
function estimateModelDimension(parameters: number): number {
  // Standard transformer relationships (approximate)
  // 7B models typically have d_model = 4096
  // 13B models typically have d_model = 5120
  // 70B models typically have d_model = 8192
  
  if (parameters <= 1) return 2048;      // Small models
  else if (parameters <= 3) return 3072; // 3B models  
  else if (parameters <= 7) return 4096; // 7B models
  else if (parameters <= 13) return 5120; // 13B models
  else if (parameters <= 30) return 6656; // 30B models
  else if (parameters <= 65) return 8192; // 65B models
  else return Math.round(8192 * Math.sqrt(parameters / 65)); // Larger models
}

/**
 * Calculate time for prefill phase (processing input tokens)
 * Assumes compute-bound operation during prefill
 */
export function calculatePrefillTime(gpu: GPUSpecs, model: ModelSpecs): number {
  // Prefill time = number of tokens * (number of parameters * 2 FLOP) / compute bandwidth
  // Factor of 2 accounts for forward pass operations
  // Quantization affects compute performance
  const quantInfo = getQuantizationInfo(model.quantization);
  const totalFlops = model.promptTokens * (model.parameters * 1e9) * 2;
  const effectiveComputeFlops = gpu.computeBandwidth * 1e12 * quantInfo.computeMultiplier;
  
  return (totalFlops / effectiveComputeFlops) * 1000; // Convert to milliseconds
}

/**
 * Calculate time per token during generation phase
 * Assumes memory-bound operation for single token generation
 */
export function calculateTimePerToken(gpu: GPUSpecs, model: ModelSpecs): number {
  // Time per token = model size in bytes / memory bandwidth
  // Model size depends on quantization
  const modelSizeBytes = calculateModelSizeBytes(model);
  const memoryBytesPerSecond = gpu.memoryBandwidth * 1e9;
  
  return (modelSizeBytes / memoryBytesPerSecond) * 1000; // Convert to milliseconds
}

/**
 * Calculate total generation time
 */
export function calculateTotalGenerationTime(
  prefillTime: number,
  timePerToken: number,
  outputTokens: number
): number {
  return prefillTime + (timePerToken * outputTokens);
}

/**
 * Calculate throughput in tokens per second
 */
export function calculateThroughput(totalTime: number, totalTokens: number): number {
  if (totalTime === 0) return 0;
  return (totalTokens / totalTime) * 1000; // Convert from tokens/ms to tokens/s
}

/**
 * Determine if the operation is memory-bound or compute-bound
 */
export function determineBottleneck(opsToByteRatio: number, arithmeticIntensity: number): {
  isMemoryBound: boolean;
  isComputeBound: boolean;
} {
  return {
    isMemoryBound: arithmeticIntensity < opsToByteRatio,
    isComputeBound: arithmeticIntensity >= opsToByteRatio,
  };
}

/**
 * Check if model fits in GPU memory and calculate memory utilization
 */
function checkMemoryFit(gpu: GPUSpecs, model: ModelSpecs): {
  modelSizeGB: number;
  memoryUtilization: number;
  hasMemoryWarning: boolean;
  memoryWarningMessage?: string;
} {
  const modelSizeBytes = calculateModelSizeBytes(model);
  const modelSizeGB = modelSizeBytes / (1024 ** 3); // Convert to GB
  const gpuMemoryGB = gpu.memorySize;
  
  // Calculate memory utilization including overhead
  // Typical overhead: ~20% for CUDA context, activations, etc.
  const memoryOverheadMultiplier = 1.2;
  const totalMemoryNeeded = modelSizeGB * memoryOverheadMultiplier;
  
  // Add memory for KV cache (depends on sequence length and batch size)
  const kvCacheGB = (model.sequenceLength * model.batchSize * model.parameters * 2 * 2) / (1024 ** 3); // Rough estimate
  const totalMemoryWithKV = totalMemoryNeeded + kvCacheGB;
  
  const memoryUtilization = (totalMemoryWithKV / gpuMemoryGB) * 100;
  
  let hasMemoryWarning = false;
  let memoryWarningMessage: string | undefined;
  
  if (totalMemoryWithKV > gpuMemoryGB) {
    hasMemoryWarning = true;
    const shortfall = totalMemoryWithKV - gpuMemoryGB;
    memoryWarningMessage = `Model requires ${totalMemoryWithKV.toFixed(1)}GB but GPU only has ${gpuMemoryGB}GB. Shortfall: ${shortfall.toFixed(1)}GB. Consider using a smaller model, better quantization, or a GPU with more memory.`;
  } else if (memoryUtilization > 90) {
    hasMemoryWarning = true;
    memoryWarningMessage = `High memory usage (${memoryUtilization.toFixed(1)}%). May cause performance issues or OOM errors. Consider reducing batch size or sequence length.`;
  } else if (memoryUtilization > 80) {
    hasMemoryWarning = true;
    memoryWarningMessage = `Moderate memory usage (${memoryUtilization.toFixed(1)}%). Monitor for potential memory pressure.`;
  }
  
  return {
    modelSizeGB,
    memoryUtilization: Math.min(memoryUtilization, 999), // Cap at 999% for display
    hasMemoryWarning,
    memoryWarningMessage,
  };
}

/**
 * Main calculation function that computes all performance metrics
 */
export function calculatePerformance(gpu: GPUSpecs, model: ModelSpecs): CalculationResults {
  const opsToByteRatio = calculateOpsToByteRatio(gpu);
  const arithmeticIntensity = calculateArithmeticIntensity(model);
  const bottleneck = determineBottleneck(opsToByteRatio, arithmeticIntensity);
  const memoryCheck = checkMemoryFit(gpu, model);
  
  const prefillTime = calculatePrefillTime(gpu, model);
  const timePerToken = calculateTimePerToken(gpu, model);
  const totalGenerationTime = calculateTotalGenerationTime(
    prefillTime,
    timePerToken,
    model.outputTokens
  );
  
  const totalTokens = model.promptTokens + model.outputTokens;
  const throughputTokensPerSecond = calculateThroughput(totalGenerationTime, totalTokens);
  
  return {
    opsToByteRatio,
    arithmeticIntensity,
    ...bottleneck,
    prefillTime,
    timePerToken,
    totalGenerationTime,
    throughputTokensPerSecond,
    ...memoryCheck,
  };
}
