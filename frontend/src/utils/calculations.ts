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
 * Based on Baseten's methodology: https://www.baseten.co/blog/llm-transformer-inference-guide/
 * Arithmetic Intensity = FLOPs per byte of memory accessed
 */
export function calculateArithmeticIntensity(model: ModelSpecs): number {
  // Get quantization info for bytes per parameter
  const quantInfo = getQuantizationInfo(model.quantization);
  
  // Transformer inference has two main phases with different arithmetic intensities:
  // 1. Prefill: Process all input tokens in parallel (compute-bound)
  // 2. Autoregressive generation: Generate tokens one by one (memory-bound)
  
  // For autoregressive generation (the bottleneck for most LLM inference):
  // - Operations per token: ~2 * parameters (forward pass through all layers)
  // - Memory access per token: parameters * bytes_per_parameter (loading model weights)
  // - Base arithmetic intensity = (2 * parameters) / (parameters * bytes_per_parameter) = 2 / bytes_per_parameter
  
  const baseArithmeticIntensity = 2 / quantInfo.bytesPerParameter;
  
  // Batching increases arithmetic intensity by reusing loaded weights:
  // - Operations: batch_size * 2 * parameters
  // - Memory access: parameters * bytes_per_parameter (weights loaded once)
  // - Arithmetic intensity = (batch_size * 2 * parameters) / (parameters * bytes_per_parameter) = batch_size * 2 / bytes_per_parameter
  
  const batchedArithmeticIntensity = baseArithmeticIntensity * model.batchSize;
  
  // For prefill phase, we can process multiple tokens in parallel:
  // - Operations: prompt_tokens * batch_size * 2 * parameters  
  // - Memory access: parameters * bytes_per_parameter (weights loaded once)
  // - Prefill arithmetic intensity = prompt_tokens * batch_size * 2 / bytes_per_parameter
  
  const prefillArithmeticIntensity = (model.promptTokens * model.batchSize * 2) / quantInfo.bytesPerParameter;
  
  // The overall arithmetic intensity depends on the workload characteristics:
  // - Single token generation (batch=1): Very low intensity, memory-bound
  // - Batched generation: Higher intensity, potentially compute-bound
  // - Prefill: Very high intensity, compute-bound
  
  // For inference analysis, we focus on the generation phase as it's the sustained workload
  // But we factor in some prefill benefits for longer prompts
  const prefillWeight = Math.min(model.promptTokens / 1000, 0.3); // Cap prefill influence at 30%
  const generationWeight = 1 - prefillWeight;
  
  const weightedArithmeticIntensity = 
    (prefillWeight * prefillArithmeticIntensity) + 
    (generationWeight * batchedArithmeticIntensity);
  
  // Apply realistic bounds based on transformer characteristics
  // Lower bound: Single token generation is always at least 0.5 ops/byte
  return Math.max(0.5, weightedArithmeticIntensity);
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
