import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// No model exclusions - process all models

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
  'multi-modality': 'multi-modality',
  'mr-web': 'mr-web',
  'interaction-2-code': 'interaction-2-code',
  'code-robustness': 'code-robustness',
  'unit test generation': 'unit-test-generation',
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
        
        // Group results by model using original names from dataset
        if (data.results && Array.isArray(data.results)) {
          data.results.forEach(modelResult => {
            // Use model_name field if available, fall back to model for backwards compatibility
            const modelName = modelResult.model_name || modelResult.model;
            
            // Skip entries without model names
            if (!modelName) {
              return;
            }
            
            if (!targetData[modelName]) {
              targetData[modelName] = {};
            }
            
            // Remove model_url if it exists (as it's not needed)
            const cleanResult = { ...modelResult };
            delete cleanResult.model_url;
            delete cleanResult.model; // Remove model name since it's the key
            delete cleanResult.model_name; // Remove model_name since it's the key
            
            // Use original model name without canonicalization
            targetData[modelName][comboKey] = cleanResult;
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