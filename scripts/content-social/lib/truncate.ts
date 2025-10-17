/**
 * Social Media Publishing - Text Truncation Utilities
 * 
 * Smart truncation functions that respect word boundaries and URL lengths.
 */

/**
 * Truncate text at word boundary with ellipsis
 * 
 * @param text - Text to truncate
 * @param maxChars - Maximum characters (including ellipsis)
 * @returns Truncated text with "..." if needed
 */
export function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  
  // Reserve 3 chars for "..."
  const truncated = text.slice(0, maxChars - 3);
  
  // Find last space to avoid cutting mid-word
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + '...';
  }
  
  // No spaces found - just truncate hard
  return truncated + '...';
}

/**
 * Get first sentence from text, truncated if needed
 * 
 * @param text - Text to extract sentence from
 * @param maxChars - Maximum characters (including ellipsis)
 * @returns First sentence, truncated if too long
 */
export function getFirstSentence(text: string, maxChars: number): string {
  // Match first sentence (ending with . ! ? or end of string)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const firstSentence = sentences[0].trim();
  
  if (firstSentence.length <= maxChars) {
    return firstSentence;
  }
  
  // Sentence too long - truncate at word boundary
  return truncateText(firstSentence, maxChars);
}

/**
 * Calculate actual tweet length (URLs counted as 23 chars)
 * Twitter auto-shortens all URLs to t.co links (23 chars)
 * 
 * @param text - Tweet text
 * @returns Actual character count as Twitter sees it
 */
export function calculateTweetLength(text: string): number {
  // Twitter counts URLs as 23 chars regardless of actual length
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlRegex) || [];
  
  let length = text.length;
  
  // Subtract actual URL length, add 23 for each URL
  urls.forEach(url => {
    length = length - url.length + 23;
  });
  
  return length;
}

/**
 * Build URL-safe version of tweet while staying under limit
 * Ensures URL is included and text is truncated to fit
 * 
 * @param text - Main tweet text
 * @param url - URL to include
 * @param maxChars - Maximum characters (default: 280)
 * @returns Tweet text with URL, truncated to fit
 */
export function buildTweetWithUrl(
  text: string,
  url: string,
  maxChars: number = 280
): string {
  // URL takes 23 chars (Twitter shortened) + 1 space
  const urlLength = 24;
  const availableForText = maxChars - urlLength;
  
  if (text.length <= availableForText) {
    return `${text}\n\n${url}`;
  }
  
  // Truncate text to fit
  const truncatedText = truncateText(text, availableForText);
  return `${truncatedText}\n\n${url}`;
}

/**
 * Validate tweet length (including URL calculation)
 * 
 * @param text - Tweet text
 * @param maxChars - Maximum characters (default: 280)
 * @returns True if valid, false if too long
 */
export function isValidTweetLength(text: string, maxChars: number = 280): boolean {
  return calculateTweetLength(text) <= maxChars;
}

/**
 * Create separator line for text formatting
 * 
 * @param char - Character to repeat (default: '━')
 * @param length - Length of separator (default: 43)
 * @returns Separator string
 */
export function separator(char: string = '━', length: number = 43): string {
  return char.repeat(length);
}

/**
 * Format number with position emoji
 * 
 * @param position - Position number (1-10)
 * @returns Emoji representation (1️⃣ - 🔟)
 */
export function positionEmoji(position: number): string {
  const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  
  if (position < 1 || position > 10) {
    return `${position}.`;
  }
  
  return emojis[position - 1] || `${position}.`;
}

/**
 * Format date for human reading
 * 
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @returns Formatted date (e.g., "October 16, 2025")
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format date for short display
 * 
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @returns Short formatted date (e.g., "Oct 16, 2025")
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
