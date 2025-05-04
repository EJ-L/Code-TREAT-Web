import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// 添加动态配置
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const directory = searchParams.get('directory');
    const file = searchParams.get('file');

    if (!directory) {
      return NextResponse.json({ error: 'Directory parameter is required' }, { status: 400 });
    }

    // 获取工作目录的根路径
    const rootDir = process.cwd();
    const fullPath = path.join(rootDir, directory);

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
    const filePath = path.join(fullPath, file);
    
    try {
      // 检查文件是否存在
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read the file as a string
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    // Handle different file types
    if (file.endsWith('.json')) {
      // Handle single JSON file
      try {
        const jsonData = JSON.parse(fileContent);
        return NextResponse.json(jsonData);
      } catch (error) {
        console.error(`Error parsing JSON file:`, error);
        return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 });
      }
    } else if (file.endsWith('.jsonl')) {
      // Handle JSONL file (line-by-line JSON)
      const lines = fileContent.split('\n').filter(line => line.trim() !== '');
      
      const data: any[] = [];
      let lineCount = lines.length;

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