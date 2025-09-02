import type { GPUSpecs, ModelSpecs, CalculationResults } from '../types/calculator';

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
 * Calculate arithmetic intensity of attention operation
 * For simplicity, we use a fixed arithmetic intensity based on typical attention patterns
 * In practice, this would vary based on sequence length and other factors
 */
export function calculateArithmeticIntensity(model: ModelSpecs): number {
  // For attention operations in transformers:
  // - Prefill phase has higher arithmetic intensity (compute bound)
  // - Generation phase has lower arithmetic intensity (memory bound)
  
  if (model.batchSize === 1) {
    // Single inference - typically memory bound
    // Arithmetic intensity is roughly 1-10 ops/byte for generation
    return 5; // Conservative estimate for generation phase
  } else {
    // Batched inference - more likely to be compute bound
    // Arithmetic intensity increases with batch size
    return Math.min(5 * model.batchSize, 200); // Cap at reasonable maximum
  }
}

/**
 * Calculate time for prefill phase (processing input tokens)
 * Assumes compute-bound operation during prefill
 */
export function calculatePrefillTime(gpu: GPUSpecs, model: ModelSpecs): number {
  // Prefill time = number of tokens * (number of parameters * 2 FLOP) / compute bandwidth
  // Factor of 2 accounts for forward pass operations
  const totalFlops = model.promptTokens * (model.parameters * 1e9) * 2;
  const computeFlops = gpu.computeBandwidth * 1e12;
  
  return (totalFlops / computeFlops) * 1000; // Convert to milliseconds
}

/**
 * Calculate time per token during generation phase
 * Assumes memory-bound operation for single token generation
 */
export function calculateTimePerToken(gpu: GPUSpecs, model: ModelSpecs): number {
  // Time per token = model size in bytes / memory bandwidth
  // Model size = parameters * 2 bytes (FP16)
  const modelSizeBytes = model.parameters * 1e9 * 2;
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
 * Main calculation function that computes all performance metrics
 */
export function calculatePerformance(gpu: GPUSpecs, model: ModelSpecs): CalculationResults {
  const opsToByteRatio = calculateOpsToByteRatio(gpu);
  const arithmeticIntensity = calculateArithmeticIntensity(model);
  const bottleneck = determineBottleneck(opsToByteRatio, arithmeticIntensity);
  
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
  };
}
