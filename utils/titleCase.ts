/**
 * Convert a string to Title Case
 * Handles common edge cases and exceptions
 */
export function toTitleCase(str: string): string {
  // List of words that should remain lowercase unless they're the first word
  const lowercaseWords = [
    'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from',
    'in', 'into', 'nor', 'of', 'on', 'or', 'so', 'the', 'to',
    'up', 'with', 'yet'
  ];

  // List of words that should remain uppercase
  const uppercaseWords = ['AI', 'API', 'CEO', 'CTO', 'FAQ', 'HR', 'ID', 'IT', 'URL', 'USA', 'UK', 'LEGO'];

  return str
    .split(' ')
    .map((word, index) => {
      // Remove leading/trailing whitespace
      word = word.trim();
      
      // If empty, skip
      if (!word) return word;

      // Check if it's an uppercase word
      const upperWord = uppercaseWords.find(uw => uw.toLowerCase() === word.toLowerCase());
      if (upperWord) return upperWord;

      // Check if it's a lowercase word (but not the first word)
      if (index > 0 && lowercaseWords.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }

      // Handle hyphenated words
      if (word.includes('-')) {
        return word
          .split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join('-');
      }

      // Handle apostrophes (e.g., "don't", "it's")
      if (word.includes("'")) {
        const parts = word.split("'");
        return parts
          .map((part, i) => {
            if (i === 0) {
              return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
            }
            return part.toLowerCase();
          })
          .join("'");
      }

      // Standard title case
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}