/**
 * Sharing Service
 * Provides methods for sharing content across different platforms with fallbacks
 */

interface ShareData {
  title: string;
  text: string;
  url?: string;
  files?: File[];
}

/**
 * Check if Web Share API is available
 */
export const isWebShareSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 
         !!navigator.share &&
         typeof navigator.share === 'function';
};

/**
 * Check if Web Share API with files is supported
 */
export const isFileShareSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 
         !!navigator.canShare;
};

/**
 * Share content using the best available method
 * @param data Content to share
 * @returns Promise that resolves when sharing is complete
 */
export const shareContent = async (data: ShareData): Promise<{success: boolean, method: string, error?: any}> => {
  try {
    // Try native sharing first (Web Share API)
    if (isWebShareSupported()) {
      // Check if we can share files (if any are provided)
      if (data.files && data.files.length > 0) {
        if (isFileShareSupported() && navigator.canShare && navigator.canShare({ files: data.files })) {
          await navigator.share({
            title: data.title,
            text: data.text,
            url: data.url,
            files: data.files
          });
          return { success: true, method: 'native-with-files' };
        } else {
          // Can't share files, use regular share
          await navigator.share({
            title: data.title,
            text: data.text,
            url: data.url
          });
          return { success: true, method: 'native' };
        }
      } else {
        // No files, use regular share
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url
        });
        return { success: true, method: 'native' };
      }
    }
    
    // Fallback to clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      const shareText = `${data.title}\n\n${data.text}\n\n${data.url || window.location.href}`;
      await navigator.clipboard.writeText(shareText);
      return { success: true, method: 'clipboard' };
    }
    
    // Last resort fallback - custom copy to clipboard
    const textArea = document.createElement('textarea');
    const shareText = `${data.title}\n\n${data.text}\n\n${data.url || window.location.href}`;
    textArea.value = shareText;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (success) {
      return { success: true, method: 'legacy-clipboard' };
    }
    
    return { success: false, method: 'failed', error: new Error('No sharing method available') };
  } catch (error) {
    return { success: false, method: 'error', error };
  }
};

/**
 * Share a file if possible
 * @param file File object to share
 * @param title Title for share
 * @param text Text for share
 * @returns Promise that resolves when sharing is complete
 */
export const shareFile = async (file: File, title: string, text: string): Promise<{success: boolean, method: string, error?: any}> => {
  return shareContent({
    title,
    text,
    files: [file]
  });
};

/**
 * Share repository information
 * @param repoUrl GitHub repository URL
 * @param analysis Analysis text
 * @param customInstructions Custom instructions text
 * @returns Promise that resolves when sharing is complete
 */
export const shareRepositoryAnalysis = async (
  repoUrl: string, 
  analysis: string, 
  customInstructions?: string
): Promise<{success: boolean, method: string, error?: any}> => {
  const title = `GitHub Repository Analysis for ${repoUrl}`;
  const text = `Analysis of ${repoUrl}\n\n${analysis.substring(0, 100)}...`;
  
  return shareContent({
    title,
    text,
    url: window.location.href
  });
};

/**
 * Generate and export analysis as a markdown file
 * @param repoUrl GitHub repository URL
 * @param analysis Analysis text
 * @param customInstructions Custom instructions text
 * @param repoStats Repository stats object (optional)
 */
export const exportMarkdown = (
  repoUrl: string, 
  analysis: string, 
  customInstructions?: string,
  repoStats?: any
): void => {
  const statsSection = repoStats 
    ? `## Repository Stats\n\n- Stars: ${repoStats.stars}\n- Forks: ${repoStats.forks}\n- Language: ${repoStats.language}\n- Updated: ${repoStats.updatedAt}`
    : 'No stats available';
  
  const markdownContent = `# GitHub Repository Analysis for ${repoUrl}\n\n## Analysis\n\n${analysis}\n\n` + 
    (customInstructions ? `## Development Guidelines\n\n${customInstructions}\n\n` : '') +
    statsSection;
  
  const blob = new Blob([markdownContent], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "github-analysis.md";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export analysis as a text file
 * @param repoUrl GitHub repository URL
 * @param analysis Analysis text
 */
export const exportText = (repoUrl: string, analysis: string): void => {
  const blob = new Blob([analysis], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "github-analysis.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};