import { NextResponse } from 'next/server';
import { downloadGitHubDataToLocal, hasLocalData } from '@/lib/githubDataDownloader';

export async function POST() {
  try {
    // Check if we already have local data
    if (hasLocalData()) {
      return NextResponse.json({ 
        success: true, 
        message: 'Local data already exists, skipping download' 
      });
    }
    
    // Download GitHub data to local folder
    const success = await downloadGitHubDataToLocal();
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'GitHub data successfully downloaded to local folder' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to download GitHub data' 
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
    // Just check if local data exists
    const hasData = hasLocalData();
    return NextResponse.json({ 
      hasLocalData: hasData 
    });
  } catch (error) {
    console.error('Error checking local data:', error);
    return NextResponse.json({ 
      hasLocalData: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 