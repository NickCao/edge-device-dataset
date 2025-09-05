import { useState, useEffect, useCallback } from 'react';
import type { GPUSpecs, ModelPreset } from '../types/calculator';
import gpusData from '../data/gpus.json';
import modelsData from '../data/models.json';
import { loadModelFromHub } from '../utils/huggingface';

export type { ModelPreset } from '../types/calculator';

export const useGPUs = () => {
  const [gpus, setGPUs] = useState<GPUSpecs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate async loading to maintain consistent API
    const loadGPUs = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to show loading state
        setGPUs(gpusData as GPUSpecs[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadGPUs();
  }, []);

  return { gpus, loading, error };
};

export const useModels = () => {
  const [models, setModels] = useState<ModelPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hubModels, setHubModels] = useState<ModelPreset[]>([]);

  useEffect(() => {
    // Load static models
    const loadModels = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to show loading state
        setModels(modelsData as ModelPreset[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  // Function to add a model from Hugging Face Hub
  const addModelFromHub = useCallback(async (modelId: string): Promise<ModelPreset> => {
    try {
      const model = await loadModelFromHub(modelId);
      const enhancedModel: ModelPreset = {
        ...model,
        isFromHub: true,
        hubUrl: `https://huggingface.co/${modelId}`
      };
      
      // Add to hub models list (avoid duplicates)
      setHubModels(prev => {
        const exists = prev.find(m => m.name === enhancedModel.name);
        if (exists) return prev;
        return [...prev, enhancedModel];
      });
      
      return enhancedModel;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load model from hub';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Combined models list (static + hub)
  const allModels = [...models, ...hubModels];

  return { 
    models: allModels, 
    staticModels: models,
    hubModels,
    loading, 
    error,
    addModelFromHub
  };
};
