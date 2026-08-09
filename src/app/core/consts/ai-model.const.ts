/**
 * Name of the Cache Storage bucket where sharded model weights are saved.
 */
export const AI_CACHE_NAME = 'JMWebAIModels';

/**
 * Fallback local filename used if SubtleCrypto hashing is unavailable or fails.
 */
export const DEFAULT_MODEL_FILENAME = 'gemma-4-E2B-it.litertlm';

/**
 * Official Hugging Face URL for the quantized Gemma 4 E2B LiteRT-LM model.
 */
export const GEMMA_MODEL_URL =
  'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it.litertlm';
