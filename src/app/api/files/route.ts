import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import readline from 'readline';

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
        const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
        return NextResponse.json(jsonlFiles);
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

    const fileStream = createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    const data: any[] = [];
    let lineCount = 0;

    // 读取所有行
    for await (const line of rl) {
      try {
        const jsonData = JSON.parse(line);
        data.push(jsonData);
      } catch (error) {
        console.error(`Error parsing JSON at line ${lineCount + 1}:`, error);
      }
      lineCount++;
    }

    return NextResponse.json({
      data,
      totalLines: lineCount,
      totalEntries: data.length
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 