/**
 * Utility functions for parsing hashtags and mentions in text content
 */

export interface ParsedText {
  text: string;
  hashtags: string[];
  mentions: string[];
}

/**
 * Extract hashtags from text (e.g., #toeic, #part1)
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex);
  if (!matches) return [];
  
  // Remove # and return unique hashtags
  return [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
}

/**
 * Extract mentions from text (e.g., @username)
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex);
  if (!matches) return [];
  
  // Remove @ and return unique mentions
  return [...new Set(matches.map(mention => mention.slice(1)))];
}

/**
 * Parse text and extract both hashtags and mentions
 */
export function parseText(text: string): ParsedText {
  return {
    text,
    hashtags: extractHashtags(text),
    mentions: extractMentions(text),
  };
}

/**
 * Highlight hashtags and mentions in text for display
 */
export function highlightText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(#\w+|@\w+)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add highlighted match
    const isHashtag = match[0].startsWith("#");
    parts.push(
      <span
        key={match.index}
        className={
          isHashtag
            ? "text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline"
            : "text-purple-600 dark:text-purple-400 font-medium cursor-pointer hover:underline"
        }
      >
        {match[0]}
      </span>
    );

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}



