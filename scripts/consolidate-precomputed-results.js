import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Model alias mapping to normalize model names - keep in sync with src/lib/constants.ts
const MODEL_NAME_ALIASES = {
  // Meta Llama 3.1 70B variants
  'meta-llama_Meta_Llama-3.1-70B-Instruct': 'meta-llama/Meta-Llama-3.1-70B-Instruct',
  'LLama-3.1-70B-Instruct': 'meta-llama/Meta-Llama-3.1-70B-Instruct',
  'Llama-3.1-70B-Instruct': 'meta-llama/Meta-Llama-3.1-70B-Instruct',
  
  // Meta Llama 3.3 70B variants
  'meta-llama_Llama-3.3-70B-Instruct': 'meta-llama/Llama-3.3-70B-Instruct',
  'Llama3.3-70B-Instruct': 'meta-llama/Llama-3.3-70B-Instruct',
  'LLama-3.3-70B-Instruct': 'meta-llama/Llama-3.3-70B-Instruct',
  'Llama-3.3-70B-Instruct': 'meta-llama/Llama-3.3-70B-Instruct',
  
  // Meta Llama 3.1 8B variants
  'meta-llama_Llama-3.1-8B-Instruct': 'meta-llama/Llama-3.1-8B-Instruct',
  'LLama-3.1-8B-Instruct': 'meta-llama/Llama-3.1-8B-Instruct',
  'Llama-3.1-8B-Instruct': 'meta-llama/Llama-3.1-8B-Instruct',
  
  // Meta Llama 4 Scout variants
  'meta-llama_Llama-4-Scout-17B-16E-Instruct': 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
  'LLama-4-Scout-17B-16E-Instruct': 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
  'Llama-4-Scout-17B-16E-Instruct': 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
  'meta-llama/Llama-4-Scout-17B-16E-Instruct': 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
  
  // Claude 3.5 Sonnet variants
  'Claude-3.5-sonnet-20241022': 'Claude-3.5-Sonnet-20241022',
  'claude-3.5-Sonnet-20241022': 'Claude-3.5-Sonnet-20241022',
  'Claude-3-5-Sonnet-20241022': 'Claude-3.5-Sonnet-20241022',
  
  // Google Gemma 3 27B variants
  'google_gemma-3-27b-it': 'google/gemma-3-27b-it',
  'Gemma-3-27B-Instruct': 'google/gemma-3-27b-it',
  
  // Qwen variants
  'Qwen/Qwen2.5-Coder-32B-Instrct': 'Qwen/Qwen2.5-Coder-32B-Instruct', // Fix typo
};

/**
 * Normalize a model name to a canonical form to prevent duplicates
 */
function canonicalizeModelName(modelName) {
  if (!modelName) return modelName;
  // Only apply explicit alias mapping; do not trim or fuzzy-match to preserve version semantics
  if (MODEL_NAME_ALIASES[modelName]) return MODEL_NAME_ALIASES[modelName];
  return modelName;
}

// Models to exclude from generation (as specified in todo.md)
const EXCLUDED_MODELS = new Set([
  'o3-mini',
  'o4-mini', 
  'gpt-4.1-2025-04-14',
  'grok-3-mini-beta',
  'Gemma-3-27B-Instruct',
  'Llama-4-Scout-17B-16E-Instruct',
  'google/gemma-3-27b=it', // Note: this appears to be a typo, should be 'google/gemma-3-27b-it'
  'Qwen/Qwen2.5-Coder-32B-Instrct', // Note: this appears to be a typo, should be 'Qwen/Qwen2.5-Coder-32B-Instruct'
  'meta-llama/Llama-4-Scout-17B-16E-Instruct'
]);

/**
 * Check if a model should be excluded from processing
 */
function shouldExcludeModel(modelName) {
  if (!modelName) return false;
  
  // Check both original and canonical names
  const canonicalName = canonicalizeModelName(modelName);
  return EXCLUDED_MODELS.has(modelName) || EXCLUDED_MODELS.has(canonicalName);
}

// Task mappings
const TASK_MAPPINGS = {
  'code generation': 'code-generation',
  'code translation': 'code-translation', 
  'code summarization': 'code-summarization',
  'code review': 'code-review',
  'input prediction': 'input-prediction',
  'output prediction': 'output-prediction',
  'vulnerability detection': 'vulnerability-detection',
  'code-web': 'code-web',
  'mr-web': 'mr-web',
  'interaction-2-code': 'interaction-2-code',
  'code-robustness': 'code-robustness',
};

function consolidateResults() {
  console.log('Consolidating precomputed results by model...');
  
  // Read combinations metadata
  const metadataPath = path.join(__dirname, '..', 'data', 'precomputed', 'combinations-metadata.json');
  if (!fs.existsSync(metadataPath)) {
    console.error('combinations-metadata.json not found. Please run generate-precomputed-results.js first.');
    return;
  }
  
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  
  // Process each task
  Object.keys(metadata.tasks).forEach(taskName => {
    console.log(`\nProcessing ${taskName}...`);
    
    const taskDir = TASK_MAPPINGS[taskName];
    if (!taskDir) {
      console.warn(`No mapping found for task: ${taskName}`);
      return;
    }
    
    const taskPath = path.join(__dirname, '..', 'data', 'precomputed', taskDir);
    if (!fs.existsSync(taskPath)) {
      console.warn(`Directory not found: ${taskPath}`);
      return;
    }
    
    const combinations = metadata.tasks[taskName].combinations;
    const noDifficultyData = {};
    const difficultyData = {};
    
    // Create filter mappings for both difficulty and non-difficulty data
    const noDifficultyFilterMappings = {};
    const difficultyFilterMappings = {};
    
    // Process each combination file
    combinations.forEach(combo => {
      const filePath = path.join(taskPath, combo.filename);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
      }
      
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Extract combination key from filename (remove .json extension)
        let comboKey = combo.filename.replace('.json', '').replace(`${taskDir}_`, '');
        
        // Remove 'difficulty_' prefix from comboKey if it exists
        if (comboKey.startsWith('difficulty_')) {
          comboKey = comboKey.replace('difficulty_', '');
        }
        
        // Choose the appropriate data container based on showByDifficulty
        const targetData = combo.showByDifficulty ? difficultyData : noDifficultyData;
        const targetFilterMappings = combo.showByDifficulty ? difficultyFilterMappings : noDifficultyFilterMappings;
        
        // Add filter mapping for this combination ONLY if it has results
        if (data.filters && data.results && Array.isArray(data.results) && data.results.length > 0) {
          targetFilterMappings[comboKey] = data.filters;
        }
        
        // Group results by model using canonical names to prevent duplicates and exclude unwanted models
        if (data.results && Array.isArray(data.results)) {
          data.results.forEach(modelResult => {
            const originalModelName = modelResult.model;
            
            // Skip excluded models
            if (shouldExcludeModel(originalModelName)) {
              return;
            }
            
            const canonicalModelName = canonicalizeModelName(originalModelName);
            
            // Double-check after canonicalization
            if (shouldExcludeModel(canonicalModelName)) {
              return;
            }
            
            if (!targetData[canonicalModelName]) {
              targetData[canonicalModelName] = {};
            }
            
            // Remove model_url if it exists (as it's not needed)
            const cleanResult = { ...modelResult };
            delete cleanResult.model_url;
            delete cleanResult.model; // Remove model name since it's the key
            
            // If this canonical model already has data for this combination, merge/overwrite
            // (This handles the case where multiple alias variants exist in the data)
            targetData[canonicalModelName][comboKey] = cleanResult;
          });
        }
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
      }
    });
    
    // Save consolidated data for no difficulty
    const noDifficultyConsolidated = {
      task: taskName,
      filterMappings: noDifficultyFilterMappings,
      data: noDifficultyData
    };
    
    const noDifficultyPath = path.join(__dirname, '..', 'data', 'precomputed', `${taskDir}_consolidated.json`);
    fs.writeFileSync(noDifficultyPath, JSON.stringify(noDifficultyConsolidated, null, 2));
    
    const noDifficultyModelCount = Object.keys(noDifficultyData).length;
    const noDifficultyCombos = combinations.filter(c => !c.showByDifficulty).length;
    console.log(`  Saved ${noDifficultyPath}`);
    console.log(`  Models: ${noDifficultyModelCount}, Combinations: ${noDifficultyCombos}`);
    
    // Save consolidated data for difficulty (only if there are difficulty combinations)
    const difficultyCombos = combinations.filter(c => c.showByDifficulty);
    if (difficultyCombos.length > 0) {
      const difficultyConsolidated = {
        task: taskName,
        filterMappings: difficultyFilterMappings,
        data: difficultyData
      };
      
      const difficultyPath = path.join(__dirname, '..', 'data', 'precomputed', `${taskDir}_difficulty_consolidated.json`);
      fs.writeFileSync(difficultyPath, JSON.stringify(difficultyConsolidated, null, 2));
      
      const difficultyModelCount = Object.keys(difficultyData).length;
      console.log(`  Saved ${difficultyPath}`);
      console.log(`  Models: ${difficultyModelCount}, Combinations: ${difficultyCombos.length}`);
    }
  });
  
  console.log('\n✅ Consolidation complete!');
  console.log('\nGenerated files:');
  Object.values(TASK_MAPPINGS).forEach(taskDir => {
    const noDifficultyPath = `data/precomputed/${taskDir}_consolidated.json`;
    const difficultyPath = `data/precomputed/${taskDir}_difficulty_consolidated.json`;
    
    if (fs.existsSync(noDifficultyPath)) {
      console.log(`  ${noDifficultyPath}`);
    }
    if (fs.existsSync(difficultyPath)) {
      console.log(`  ${difficultyPath}`);
    }
  });
}

// Run the consolidation
consolidateResults(); 