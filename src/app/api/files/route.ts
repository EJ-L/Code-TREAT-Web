import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// 添加动态配置
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Security: Define allowed directories to prevent path traversal
const ALLOWED_DIRECTORIES = [
  'data/code-generation',
  'data/code-review', 
  'data/code-summarization',
  'data/code-translation',
  'data/input_prediction',
  'data/output_prediction',
  'data/vulnerability-detection',
  'data/code-web',
  'data/interaction-2-code',
  'data/code-robustness',
  'data/mr-web',
  'data/overall'
];

// Security: Validate and sanitize path input
function validatePath(directory: string, file?: string): { isValid: boolean; error?: string } {
  // Remove any path traversal attempts
  const cleanDirectory = directory.replace(/\.\./g, '').replace(/\\/g, '/');
  const cleanFile = file ? file.replace(/\.\./g, '').replace(/\\/g, '/') : '';
  
  // Check if directory is in allowed list
  if (!ALLOWED_DIRECTORIES.includes(cleanDirectory)) {
    return { isValid: false, error: 'Directory not allowed' };
  }
  
  // If file specified, ensure it's just a filename (no subdirectory traversal)
  if (cleanFile && (cleanFile.includes('/') || cleanFile.includes('\\'))) {
    return { isValid: false, error: 'File path not allowed' };
  }
  
  // Only allow specific file extensions
  if (cleanFile && !cleanFile.match(/\.(json|jsonl)$/i)) {
    return { isValid: false, error: 'File type not allowed' };
  }
  
  return { isValid: true };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const directory = searchParams.get('directory');
    const file = searchParams.get('file');

    if (!directory) {
      return NextResponse.json({ error: 'Directory parameter is required' }, { status: 400 });
    }

    // Security: Validate paths
    const validation = validatePath(directory, file || undefined);
    if (!validation.isValid) {
      console.warn(`Security: Path validation failed - ${validation.error}`, { directory, file });
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    // 获取工作目录的根路径
    const rootDir = process.cwd();
    const cleanDirectory = directory.replace(/\.\./g, '').replace(/\\/g, '/');
    const fullPath = path.resolve(rootDir, cleanDirectory); // Use path.resolve for absolute path
    
    // Security: Ensure the resolved path is still within the project directory
    if (!fullPath.startsWith(rootDir)) {
      console.warn(`Security: Path traversal attempt detected`, { directory, fullPath, rootDir });
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    // 如果没有指定文件，则返回目录列表
    if (!file) {
      try {
        const files = await fs.readdir(fullPath);
        const dataFiles = files.filter(f => f.endsWith('.jsonl') || f.endsWith('.json'));
        return NextResponse.json(dataFiles);
      } catch (error) {
        console.error('Error reading directory:', error);
        return NextResponse.json({ error: 'Failed to read directory' }, { status: 500 });
      }
    }

    // 如果指定了文件，则读取文件内容
    const cleanFile = file.replace(/\.\./g, '').replace(/\\/g, '/');
    const filePath = path.resolve(fullPath, cleanFile); // Use path.resolve
    
    // Security: Ensure the file path is still within the allowed directory
    if (!filePath.startsWith(fullPath)) {
      console.warn(`Security: File path traversal attempt detected`, { file, filePath, fullPath });
      return NextResponse.json({ error: 'Invalid file path' }, { status: 403 });
    }
    
    try {
      // 检查文件是否存在
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read the file as a string with size limit for security
    const stats = await fs.stat(filePath);
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit
    
    if (stats.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }
    
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    // Handle different file types
    if (cleanFile.endsWith('.json')) {
      // Handle single JSON file
      try {
        const jsonData = JSON.parse(fileContent);
        return NextResponse.json(jsonData);
      } catch (error) {
        console.error(`Error parsing JSON file:`, error);
        return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 });
      }
    } else if (cleanFile.endsWith('.jsonl')) {
      // Handle JSONL file (line-by-line JSON)
      const lines = fileContent.split('\n').filter(line => line.trim() !== '');
      
      const data: any[] = [];
      let lineCount = lines.length;
      const MAX_LINES = 100000; // Limit lines to prevent memory issues

      if (lineCount > MAX_LINES) {
        return NextResponse.json({ error: 'File has too many lines' }, { status: 413 });
      }

      // Parse each line as JSON
      for (const line of lines) {
        try {
          const jsonData = JSON.parse(line);
          data.push(jsonData);
        } catch (error) {
          console.error(`Error parsing JSON line:`, error);
        }
      }

      return NextResponse.json({
        data,
        totalLines: lineCount,
        totalEntries: data.length
      });
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 