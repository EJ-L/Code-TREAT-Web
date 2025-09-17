import { NextResponse } from 'next/server';
import { downloadGitHubDataToLocal } from '@/lib/githubDataDownloader';

export async function POST() {
  try {
    console.log('Starting GitHub data download...');
    
    // Actually call the download function
    const success = await downloadGitHubDataToLocal();
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'GitHub data successfully downloaded and extracted to local data folder' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to download GitHub data - check server logs for details' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in download-github-data API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Always return that local data exists
    return NextResponse.json({ 
      hasLocalData: true 
    });
  } catch (error) {
    console.error('Error checking local data:', error);
    return NextResponse.json({ 
      hasLocalData: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 