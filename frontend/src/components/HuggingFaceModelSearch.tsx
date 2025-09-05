import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Paper,
  Chip,
  Alert,
  Autocomplete,
  Divider,
} from '@mui/material';
import { Search as SearchIcon, CloudDownload as DownloadIcon } from '@mui/icons-material';
import { searchModels, loadModelFromHub, POPULAR_MODELS } from '../utils/huggingface';
import type { ModelPreset } from '../types/calculator';

interface HuggingFaceModelSearchProps {
  onModelLoad: (model: ModelPreset) => void;
  onError?: (error: string) => void;
}

interface ModelSearchResult {
  id: string;
  downloads?: number;
  likes?: number;
  pipeline_tag?: string;
  tags?: string[];
}

export const HuggingFaceModelSearch: React.FC<HuggingFaceModelSearchProps> = ({
  onModelLoad,
  onError
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ModelSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Memoized popular models for autocomplete
  const popularModelsOptions = useMemo(() => POPULAR_MODELS.map(model => ({
    label: model,
    value: model
  })), []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const results = await searchModels(query, {
        limit: 10,
        sort: 'downloads',
        direction: 'desc',
        filter: 'text-generation'
      });

      setSearchResults(results.models || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSearching(false);
    }
  }, [onError]);

  const handleLoadModel = useCallback(async (modelId: string) => {
    setIsLoading(true);
    setError('');

    try {
      const model = await loadModelFromHub(modelId);
      // Add HF Hub metadata
      const enhancedModel: ModelPreset = {
        ...model,
        isFromHub: true,
        hubUrl: `https://huggingface.co/${modelId}`
      };
      
      onModelLoad(enhancedModel);
      setSelectedModel(modelId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load model';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [onModelLoad, onError]);

  const handleSearchInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    
    // Debounced search
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [handleSearch]);

  const formatDownloads = (downloads?: number): string => {
    if (!downloads) return '0';
    if (downloads < 1000) return downloads.toString();
    if (downloads < 1000000) return `${(downloads / 1000).toFixed(1)}K`;
    return `${(downloads / 1000000).toFixed(1)}M`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DownloadIcon />
        Load from Hugging Face Hub
      </Typography>

      {/* Popular Models Quick Select */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
          Popular Models (Quick Load)
        </Typography>
        <Autocomplete
          options={popularModelsOptions}
          getOptionLabel={(option) => option.label}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select a popular model..."
              size="small"
              InputProps={{
                ...params.InputProps,
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Typography variant="body2">{option.label}</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadModel(option.value);
                  }}
                  disabled={isLoading}
                  sx={{ ml: 1 }}
                >
                  Load
                </Button>
              </Box>
            </Box>
          )}
          sx={{ mb: 2 }}
        />
      </Box>

      <Divider>
        <Typography variant="caption" color="text.secondary">
          OR
        </Typography>
      </Divider>

      {/* Custom Search */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
          Search Custom Model
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search for models (e.g., 'meta-llama/Llama-3.2-1B')..."
          value={searchQuery}
          onChange={handleSearchInputChange}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
            endAdornment: isSearching && <CircularProgress size={20} />
          }}
        />
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
          <List dense>
            {searchResults.map((model, index) => (
              <React.Fragment key={model.id}>
                <ListItem
                  disablePadding
                  secondaryAction={
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleLoadModel(model.id)}
                      disabled={isLoading}
                      sx={{ minWidth: 60 }}
                    >
                      {isLoading && selectedModel === model.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        'Load'
                      )}
                    </Button>
                  }
                >
                  <ListItemButton sx={{ pr: 8 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {model.id}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                          {model.downloads && (
                            <Chip
                              label={`${formatDownloads(model.downloads)} downloads`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {model.likes && (
                            <Chip
                              label={`${model.likes} likes`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {model.pipeline_tag && (
                            <Chip
                              label={model.pipeline_tag}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                {index < searchResults.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Loading model configuration from Hugging Face Hub...
          </Typography>
        </Box>
      )}

      {/* Help Text */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        Search for any text-generation model on Hugging Face Hub. 
        The model's configuration will be automatically loaded and converted to the calculator format.
      </Typography>
    </Box>
  );
};
