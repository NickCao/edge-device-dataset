import type { ModelPreset, QuantizationType } from '../types/calculator';

interface HuggingFaceConfig {
  architectures?: string[];
  hidden_size?: number;
  intermediate_size?: number;
  max_position_embeddings?: number;
  num_attention_heads?: number;
  num_hidden_layers?: number;
  num_key_value_heads?: number;
  vocab_size?: number;
  rope_theta?: number;
  rms_norm_eps?: number;
  tie_word_embeddings?: boolean;
  torch_dtype?: string;
  transformers_version?: string;
  model_type?: string;
  bos_token_id?: number;
  eos_token_id?: number;
  pad_token_id?: number;
  [key: string]: any;
}

interface ModelInfo {
  id: string;
  tags?: string[];
  downloads?: number;
  likes?: number;
  library_name?: string;
  pipeline_tag?: string;
  [key: string]: any;
}

export interface HFModelSearchResult {
  models: ModelInfo[];
  nextCursor?: string;
}

/**
 * Search for models on Hugging Face Hub
 */
export async function searchModels(
  query: string = '',
  options: {
    limit?: number;
    sort?: 'trending' | 'downloads' | 'likes' | 'updated';
    direction?: -1 | 1;
    filter?: string;
    full?: boolean;
  } = {}
): Promise<HFModelSearchResult> {
  try {
    const searchParams = new URLSearchParams();
    
    if (query) {
      searchParams.append('search', query);
    }
    
    searchParams.append('limit', (options.limit || 20).toString());
    
    if (options.sort) {
      searchParams.append('sort', options.sort);
    }
    
    if (options.direction) {
      searchParams.append('direction', options.direction.toString());
    }
    
    if (options.filter) {
      searchParams.append('filter', options.filter);
    }
    
    if (options.full) {
      searchParams.append('full', 'true');
    }

    const response = await fetch(`https://huggingface.co/api/models?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to search models: ${response.statusText}`);
    }
    
    const models = await response.json();
    
    return {
      models: models || []
    };
  } catch (error) {
    console.error('Error searching models:', error);
    throw new Error('Failed to search models from Hugging Face Hub');
  }
}

/**
 * Load model configuration from Hugging Face Hub
 */
export async function loadModelConfig(modelId: string): Promise<HuggingFaceConfig> {
  try {
    // Direct URL to the config.json file on Hugging Face Hub
    const configUrl = `https://huggingface.co/${modelId}/resolve/main/config.json`;

    const response = await fetch(configUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch config for ${modelId}: ${response.statusText}`);
    }
    
    const config = await response.json();
    return config;
  } catch (error) {
    console.error('Error loading model config:', error);
    throw new Error(`Failed to load configuration for model ${modelId}`);
  }
}

/**
 * Estimate model parameters from config
 */
function estimateParameters(config: HuggingFaceConfig): number {
  const {
    hidden_size = 4096,
    intermediate_size = 11008,
    num_hidden_layers = 32,
    num_attention_heads = 32,
    vocab_size = 32000,
  } = config;

  // Rough estimation based on transformer architecture
  // This is a simplified calculation and may not be 100% accurate
  const embedding_params = vocab_size * hidden_size;
  const attention_params = num_hidden_layers * (
    4 * hidden_size * hidden_size + // Q, K, V, O projections
    hidden_size // layer norm
  );
  const mlp_params = num_hidden_layers * (
    hidden_size * intermediate_size * 2 + // up and down projections
    hidden_size // layer norm
  );
  const final_layer_norm = hidden_size;
  
  const total_params = embedding_params + attention_params + mlp_params + final_layer_norm;
  
  // Convert to billions
  return total_params / 1_000_000_000;
}

/**
 * Map model's torch_dtype to quantization type
 */
function getQuantizationFromTorchDtype(config: HuggingFaceConfig): QuantizationType {
  // Use the model's default tensor type (torch_dtype)
  if (config.torch_dtype) {
    const dtype = config.torch_dtype.toLowerCase();
    if (dtype.includes('float32') || dtype.includes('fp32')) return 'FP32';
    if (dtype.includes('float16') || dtype.includes('fp16') || dtype.includes('bfloat16') || dtype.includes('bf16')) return 'FP16';
    if (dtype.includes('int8')) return 'INT8';
    if (dtype.includes('int4')) return 'INT4';
  }
  
  // Default to FP16 if no torch_dtype specified (most common for modern models)
  return 'FP16';
}

/**
 * Convert Hugging Face config to ModelPreset
 */
export function configToModelPreset(modelId: string, config: HuggingFaceConfig): ModelPreset {
  const parameters = estimateParameters(config);
  const sequenceLength = config.max_position_embeddings || 4096;
  const headDimension = config.hidden_size && config.num_attention_heads 
    ? config.hidden_size / config.num_attention_heads 
    : 128;
  const nLayers = config.num_hidden_layers || 32;
  const nHeads = config.num_attention_heads || 32;
  const defaultQuantization = getQuantizationFromTorchDtype(config);

  return {
    name: modelId,
    parameters,
    sequenceLength,
    headDimension,
    nLayers,
    nHeads,
    defaultQuantization,
  };
}

/**
 * Load a model preset from Hugging Face Hub
 */
export async function loadModelFromHub(modelId: string): Promise<ModelPreset> {
  try {
    const config = await loadModelConfig(modelId);
    return configToModelPreset(modelId, config);
  } catch (error) {
    console.error('Error loading model from hub:', error);
    throw error;
  }
}

/**
 * Suggested model presets for quick access
 */
export const SUGGESTED_MODELS = [
  'ibm-granite/granite-3.3-2b-instruct',
  'ibm-granite/granite-3.3-8b-instruct'
];
