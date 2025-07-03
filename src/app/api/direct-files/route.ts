import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('file');
    
    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }
    
    // Security check - only allow access to precomputed data files
    if (!filePath.startsWith('data/precomputed/')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Construct the full path
    const fullPath = path.join(process.cwd(), filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Read and return the file content
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const jsonData = JSON.parse(fileContent);
    
    return NextResponse.json(jsonData);
    
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 