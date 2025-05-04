import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

// GitHub API configuration
const GITHUB_OWNER = 'derek33125';
const GITHUB_REPO = 'Code-TREAT-Data';

// GitHub Personal Access Token (set in environment variables)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

interface GitHubRelease {
  tag_name: string;
  name: string;
  zipball_url: string;
}

/**
 * Download GitHub release data and extract to local data folder
 * Supports both public and private repositories
 */
export async function downloadGitHubDataToLocal(): Promise<boolean> {
  try {
    console.log('Downloading GitHub release data...');
    
    // Prepare headers for authentication
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'Code-TREAT-App'
    };
    
    // Add authentication for private repos
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
      console.log('Using GitHub token for private repository access');
    } else {
      console.log('No GitHub token found, assuming public repository');
    }
    
    // Get release information
    const releaseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
    const releaseResponse = await fetch(releaseUrl, { headers });
    
    if (!releaseResponse.ok) {
      if (releaseResponse.status === 404) {
        throw new Error(`Repository not found or no access. Status: ${releaseResponse.status}. ${GITHUB_TOKEN ? 'Check if token has correct permissions.' : 'If repo is private, add GITHUB_TOKEN environment variable.'}`);
      }
      throw new Error(`Failed to fetch release info: ${releaseResponse.status}`);
    }
    
    const release: GitHubRelease = await releaseResponse.json();
    console.log(`Found release: ${release.name} (${release.tag_name})`);
    
    // Download the source code zip
    const zipUrl = release.zipball_url;
    const zipResponse = await fetch(zipUrl, { headers });
    
    if (!zipResponse.ok) {
      throw new Error(`Failed to download release zip: ${zipResponse.status}`);
    }
    
    const zipBuffer = await zipResponse.arrayBuffer();
    
    // Extract ZIP file
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipBuffer);
    
    // Find the data folder in the ZIP (it will be in a subdirectory like "derek33125-Code-TREAT-Data-abc123/data/")
    const dataFolderPattern = /^[^\/]+\/data\//;
    const dataFiles = Object.keys(zipContent.files).filter(fileName => 
      dataFolderPattern.test(fileName) && !zipContent.files[fileName].dir
    );
    
    if (dataFiles.length === 0) {
      throw new Error('No data folder found in the release');
    }
    
    console.log(`Found ${dataFiles.length} data files in release`);
    
    // Create local data directory if it doesn't exist
    const localDataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(localDataDir)) {
      fs.mkdirSync(localDataDir, { recursive: true });
    }
    
    // Extract each data file to the local data folder
    for (const filePath of dataFiles) {
      const file = zipContent.files[filePath];
      
      // Get the relative path within the data folder
      // e.g., "derek33125-Code-TREAT-Data-abc123/data/code-generation/file.jsonl" -> "code-generation/file.jsonl"
      const relativePath = filePath.replace(dataFolderPattern, '');
      const localFilePath = path.join(localDataDir, relativePath);
      
      // Create subdirectories if needed
      const localFileDir = path.dirname(localFilePath);
      if (!fs.existsSync(localFileDir)) {
        fs.mkdirSync(localFileDir, { recursive: true });
      }
      
      // Extract file content
      const content = await file.async('text');
      fs.writeFileSync(localFilePath, content, 'utf8');
      
      console.log(`Extracted: ${relativePath}`);
    }
    
    console.log('GitHub data successfully downloaded and extracted to local data folder');
    return true;
    
  } catch (error) {
    console.error('Error downloading GitHub data:', error);
    return false;
  }
}

/**
 * Check if local data folder exists and has content
 */
export function hasLocalData(): boolean {
  const localDataDir = path.join(process.cwd(), 'data');
  
  if (!fs.existsSync(localDataDir)) {
    return false;
  }
  
  // Check if there are any subdirectories with .jsonl files
  try {
    const subdirs = fs.readdirSync(localDataDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    for (const subdir of subdirs) {
      const subdirPath = path.join(localDataDir, subdir);
      const files = fs.readdirSync(subdirPath);
      if (files.some(file => file.endsWith('.jsonl'))) {
        return true;
      }
    }
  } catch (error) {
    console.error('Error checking local data:', error);
  }
  
  return false;
} 