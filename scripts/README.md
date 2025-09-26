# Model Comparison Table Generator

This script generates a comparison table of model performance across different tasks, similar to the one shown in the paper. It helps diagnose differences between the current implementation and the expected results.

## Features

- Extracts model scores across all tasks
- Formats data in a table similar to the paper
- Calculates average ranks for each model
- Highlights top performers in each task
- Exports results to CSV for further analysis

## Usage

```bash
node generate-model-comparison-table.js [options]
```

### Options

- `--data-dir <path>`: Path to the precomputed data directory (default: ../data/precomputed)
- `--output <path>`: Path to save the output as CSV (optional)
- `--top-n <number>`: Number of top models to highlight (default: 3)
- `--filter <regex>`: Filter models by name (optional)
- `--tasks <task1,task2>`: Comma-separated list of tasks to include (optional)
- `--no-color`: Disable colored output
- `--help`: Show help message

### Examples

Generate the default table:
```bash
node generate-model-comparison-table.js
```

Save results to CSV:
```bash
node generate-model-comparison-table.js --output model-comparison.csv
```

Filter models by name:
```bash
node generate-model-comparison-table.js --filter "GPT|Claude"
```

Include only specific tasks:
```bash
node generate-model-comparison-table.js --tasks "code generation,code summarization,vulnerability detection"
```

## Understanding the Results

The table shows:
- Model performance (%) on each task
- Top performers highlighted in color (green for 1st, yellow for 2nd, blue for 3rd)
- Average rank across all tasks

This helps identify discrepancies between the current implementation and the expected results in the paper. By comparing the scores and rankings, you can pinpoint which tasks or metrics might be causing differences in the overall ranking.

## Metrics Used

The script uses the following primary metrics for each task:

- Code Generation (CG): pass@1
- Code Summarization (CS): LLM Judge
- Code Translation (CT): pass@1
- Code Review (CR): LLM Judge
- Code-Robustness (CRv): ALL
- Unit Test Generation (TG): line_coverage
- Vulnerability Detection (VD): Accuracy

You can modify these metrics in the script if needed.
