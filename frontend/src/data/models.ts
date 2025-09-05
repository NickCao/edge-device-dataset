import type { QuantizationType } from '../types/calculator';

export interface ModelPreset {
  name: string;
  parameters: number;
  sequenceLength: number;
  headDimension: number;
  nLayers: number;
  nHeads: number;
  defaultQuantization: QuantizationType;
}

export const MODELS: ModelPreset[] = [
  {
    name: "Llama 2 7B",
    parameters: 7,
    sequenceLength: 4096,
    headDimension: 128,
    nLayers: 32,
    nHeads: 32,
    defaultQuantization: "FP16"
  },
  {
    name: "Llama 2 13B",
    parameters: 13,
    sequenceLength: 4096,
    headDimension: 128,
    nLayers: 40,
    nHeads: 40,
    defaultQuantization: "FP16"
  },
  {
    name: "Llama 2 70B",
    parameters: 70,
    sequenceLength: 4096,
    headDimension: 128,
    nLayers: 64,
    nHeads: 80,
    defaultQuantization: "INT8"
  },
  {
    name: "Granite 3.3 2B",
    parameters: 2,
    sequenceLength: 131072,
    headDimension: 64,
    nLayers: 40,
    nHeads: 32,
    defaultQuantization: "FP16"
  },
  {
    name: "Granite 3.3 8B",
    parameters: 8,
    sequenceLength: 131072,
    headDimension: 128,
    nLayers: 40,
    nHeads: 32,
    defaultQuantization: "FP16"
  },
  {
    name: "Custom",
    parameters: 0,
    sequenceLength: 2048,
    headDimension: 128,
    nLayers: 32,
    nHeads: 32,
    defaultQuantization: "FP16"
  }
];
