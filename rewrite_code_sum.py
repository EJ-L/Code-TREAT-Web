import json
import os
from pathlib import Path

def process_code_summarization_files():
    """
    Process all files under data/code-summarization/ directory and keep only specific fields:
    task, lang, url, prompt_category, prompt_id, model_name, and metrics
    """
    # Get the directory path
    dir_path = Path('data/code-summarization')
    
    # Fields to keep
    fields_to_keep = {
        'task', 'lang', 'url', 'prompt_category', 
        'prompt_id', 'model_name', 'metrics'
    }
    
    # Process each file in the directory
    for file_path in dir_path.glob('*.jsonl'):
        print(f"Processing file: {file_path}")
        
        # Read and process the file
        processed_lines = []
        with open(file_path, 'r') as f:
            for line in f:
                try:
                    # Parse JSON line
                    data = json.loads(line.strip())
                    
                    # Keep only specified fields
                    filtered_data = {
                        key: data[key] 
                        for key in fields_to_keep 
                        if key in data
                    }
                    
                    # Add to processed lines
                    processed_lines.append(filtered_data)
                except json.JSONDecodeError as e:
                    print(f"Error processing line in {file_path}: {e}")
                    continue
        
        # Write back to the same file
        with open(file_path, 'w') as f:
            for data in processed_lines:
                json.dump(data, f)
                f.write('\n')
        
        print(f"Completed processing {file_path}")

if __name__ == "__main__":
    process_code_summarization_files()
