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
 * Calculate arithmetic intensity for transformer operations
 * Arithmetic Intensity = FLOPs per byte of data accessed
 * This varies significantly between prefill and generation phases
 */
export function calculateArithmeticIntensity(model: ModelSpecs): number {
  // Get quantization info for bytes per parameter
  const quantInfo = getQuantizationInfo(model.quantization);
  
  // For transformer inference, we have two main phases:
  // 1. Prefill: Process all input tokens at once (higher arithmetic intensity)
  // 2. Generation: Generate tokens one by one (lower arithmetic intensity)
  
  // Calculate effective sequence length (consider both input and context)
  const effectiveSeqLen = Math.max(model.promptTokens, 512); // Minimum context for meaningful calculation
  
  // For generation phase (which is typically the bottleneck for large models):
  // - Operations: ~4 * parameters (forward pass through all layers)
  // - Memory access: parameters * bytes_per_param (loading model weights)
  // - Plus attention operations which scale with sequence length
  
  // Base arithmetic intensity from parameter access
  const baseIntensity = 4 / quantInfo.bytesPerParameter; // ~2 for FP16, ~4 for FP32, ~8 for INT8
  
  // Attention arithmetic intensity scales with sequence length and batch size
  // Attention has O(seq_len) operations per parameter for generation
  const attentionMultiplier = Math.log2(effectiveSeqLen / 128) * 0.5 + 1; // Logarithmic scaling
  
  // Batch size increases arithmetic intensity (more operations per memory access)
  const batchMultiplier = Math.sqrt(model.batchSize); // Square root scaling to avoid unrealistic values
  
  // Combine factors
  let arithmeticIntensity = baseIntensity * attentionMultiplier * batchMultiplier;
  
  // Apply realistic bounds based on transformer architecture
  // Generation phase typically ranges from 0.5 to 50 ops/byte depending on model size and quantization
  arithmeticIntensity = Math.max(0.5, Math.min(arithmeticIntensity, 100));
  
  return arithmeticIntensity;
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
