# Precomputed Results System

This system generates precomputed JSON files for all possible filter combinations across different leaderboard tasks to improve performance and reduce loading times.

## Overview

The system consists of three main components:

1. **Combination Generator** (`scripts/generate-precomputed-results.js`)
2. **Data Processor** (`scripts/process-precomputed-data.js`) 
3. **Enhanced Export Naming** (updated filename generation in the React app)

## Features

### Enhanced Export Filenames

The CSV export functionality now generates descriptive filenames that include:

- **Task name**: The leaderboard task (e.g., `code-generation`, `mr-web`)
- **Difficulty setting**: Added `_difficulty` suffix when enabled
- **Applied filters**: All active filters with their values
- **Date**: Current date in YYYY-MM-DD format

#### Filename Examples

```
code-generation_overall_2025-07-03.csv                                    # No filters
code-generation_difficulty_overall_2025-07-03.csv                         # Difficulty mode, no filters
code-generation_dataset-HackerRank_modality-Python_2025-07-03.csv        # Dataset and modality filters
mr-web_knowledge-Visual_reasoning-CoT_2025-07-03.csv                      # MR-Web with task and method filters
```

### Precomputed Results

Instead of processing data in real-time, the system can pre-generate results for all meaningful filter combinations:

#### Combination Counts (Current)
- **code generation**: 36 combinations
- **code translation**: 33 combinations  
- **code summarization**: 15 combinations
- **code review**: 15 combinations
- **input prediction**: 28 combinations
- **output prediction**: 28 combinations
- **vulnerability detection**: 7 combinations
- **code-web**: 10 combinations
- **mr-web**: 8 combinations
- **interaction-2-code**: 1 combination
- **code-robustness**: 5 combinations

**Total**: 186 combinations (down from 69,721 with optimizations)

## Usage

### Generate Filter Combinations

```bash
# Generate all possible filter combinations
node scripts/generate-precomputed-results.js

# Check the summary
node scripts/check-summary.js
```

This creates:
- `data/precomputed/combinations-metadata.json` - Contains all combination definitions
- Directory structure under `data/precomputed/[task-name]/`

### Process Data for Combinations

```bash
# Process all combinations (will take time with real data)
node scripts/process-precomputed-data.js

# Process specific task only
node scripts/process-precomputed-data.js --task "mr-web"

# Dry run to see what would be processed
node scripts/process-precomputed-data.js --dry-run

# Generate index only
node scripts/process-precomputed-data.js --index-only
```

This creates:
- Individual JSON files for each combination (e.g., `mr-web_overall.json`)
- `data/precomputed/index.json` - Quick lookup index

### File Structure

```
data/precomputed/
├── combinations-metadata.json       # Generated combinations
├── index.json                      # Quick lookup index
├── code-generation/
│   ├── code-generation_overall.json
│   ├── code-generation_difficulty_overall.json
│   ├── code-generation_dataset-HackerRank_modality-Python.json
│   └── ...
├── mr-web/
│   ├── mr-web_overall.json
│   ├── mr-web_knowledge-Visual.json
│   ├── mr-web_reasoning-CoT.json
│   └── ...
└── [other-tasks]/
```

## Optimizations Applied

### Filter Optimization

1. **Code Summarization & Code Review**: Ignore `dataset` and `llmJudges` filters since they typically use the same values
2. **Single-option filters**: Skip filter types that only have one option
3. **Practical combinations**: Generate meaningful combinations instead of all possible permutations
4. **Difficulty constraints**: For code translation with difficulty, only allow HackerRank dataset

### Combination Strategy

Instead of generating all possible permutations (2^n), the system generates:

1. **Base combination** (no filters applied)
2. **Single filter types** (all values for each filter type)
3. **Individual values** (one value per filter type)
4. **Common useful combinations** (e.g., dataset + modality pairs)

This reduces combinations from exponential to linear growth.

## Implementation Details

### Export Filename Generation

The filename generation logic in `src/app/components/sections/Leaderboard/index.tsx` now includes:

```javascript
const csvFilename = useMemo(() => {
  const date = new Date().toISOString().split('T')[0];
  let filename = currentTask.replace(/\s+/g, '-');
  
  // Add difficulty suffix if enabled
  if (showByDifficulty) {
    filename += '_difficulty';
  }
  
  // Add filter information
  const filterParts = [];
  // ... process all filter types ...
  
  if (filterParts.length === 0) {
    filterParts.push('overall');
  }
  
  filename += '_' + filterParts.join('_');
  return `${filename}_${date}.csv`;
}, [currentTask, selectedAbilities, showByDifficulty]);
```

### Data Processing Integration

The processing script simulates the same logic as the React app:

1. Load raw JSONL data
2. Apply task-specific processing
3. Apply filters in the same order
4. Format results consistently
5. Save as JSON with metadata

## Next Steps

1. **Integrate with real data processing**: Replace mock data in `scripts/process-precomputed-data.js` with actual data loading and processing logic
2. **Add caching layer**: Implement logic to serve precomputed results when available
3. **Add regeneration triggers**: Set up automated regeneration when source data changes
4. **Optimize further**: Consider most-used filter combinations for priority processing

## Benefits

- **Faster loading**: No real-time data processing for common filter combinations
- **Better UX**: Immediate results for frequently used filters
- **Descriptive exports**: Clear filename indicating what data was exported
- **Scalable**: Easy to add new filter combinations as needed
- **Maintainable**: Clear separation between combination generation and data processing 