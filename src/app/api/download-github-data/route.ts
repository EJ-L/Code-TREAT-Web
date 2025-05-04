import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Since GitHub data downloading is disabled, just return success
    return NextResponse.json({ 
      success: true, 
      message: 'GitHub data downloading is disabled, using local data only' 
    });
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