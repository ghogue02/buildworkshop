/**
 * Text analysis utilities for builder input analysis
 */

// Common English stopwords to filter out
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 
  'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 
  'their', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'will', 'with',
  'would', 'could', 'should', 'have', 'has', 'had', 'can', 'may', 'might', 'must',
  'shall', 'from', 'which', 'when', 'where', 'who', 'whom', 'whose', 'why', 'how'
]);

/**
 * Extract single words from text, filtering out stopwords and short words
 * @param {string} text - The text to analyze
 * @param {number} minLength - Minimum word length to include
 * @returns {string[]} Array of words
 */
export function extractWords(text, minLength = 4) {
  if (!text || typeof text !== 'string') return [];
  
  return text.toLowerCase()
    .split(/\W+/)
    .filter(word => 
      word.length >= minLength && 
      !STOPWORDS.has(word) &&
      !(/^\d+$/.test(word)) // Filter out numbers
    );
}

/**
 * Extract n-grams (phrases of n words) from text
 * @param {string} text - The text to analyze
 * @param {number} n - Number of words in each phrase
 * @returns {string[]} Array of phrases
 */
export function extractPhrases(text, n = 2) {
  if (!text || typeof text !== 'string') return [];
  
  const words = text.toLowerCase()
    .split(/\W+/)
    .filter(word => 
      word.length >= 3 && 
      !STOPWORDS.has(word) &&
      !(/^\d+$/.test(word))
    );
  
  const phrases = [];
  for (let i = 0; i <= words.length - n; i++) {
    phrases.push(words.slice(i, i + n).join(' '));
  }
  
  return phrases;
}

/**
 * Count frequencies of items in an array
 * @param {Array} items - Array of items to count
 * @param {number} limit - Maximum number of results to return
 * @returns {Array} Array of {item, count} objects, sorted by count
 */
export function countFrequencies(items, limit = 10) {
  const counts = {};
  
  items.forEach(item => {
    counts[item] = (counts[item] || 0) + 1;
  });
  
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([item, count]) => ({ item, count }));
}

/**
 * Analyze a specific field across multiple inputs
 * @param {Array} inputs - Array of input objects
 * @param {string} fieldPath - Path to the field to analyze (e.g., 'input_data.summary')
 * @param {boolean} usePhrases - Whether to extract phrases instead of single words
 * @returns {Array} Array of {item, count} objects
 */
export function analyzeField(inputs, fieldPath, usePhrases = true) {
  // Extract field values
  const fieldValues = inputs.map(input => {
    const parts = fieldPath.split('.');
    let value = input;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        value = undefined;
        break;
      }
    }
    
    return value;
  }).filter(Boolean);
  
  // Extract words or phrases
  const items = [];
  fieldValues.forEach(value => {
    if (typeof value === 'string') {
      const extracted = usePhrases ? extractPhrases(value, 2) : extractWords(value);
      items.push(...extracted);
    }
  });
  
  // Count frequencies
  return countFrequencies(items);
}

/**
 * Group inputs by completion status
 * @param {Array} inputs - Array of input objects
 * @param {Array} sectionOrder - Order of sections in the builder journey
 * @returns {Object} Object with completed and incomplete arrays
 */
export function groupByCompletion(inputs, sectionOrder) {
  // Group by session
  const sessions = {};
  
  inputs.forEach(input => {
    if (!sessions[input.session_id]) {
      sessions[input.session_id] = {
        sessionId: input.session_id,
        sections: new Set(),
        inputs: []
      };
    }
    
    sessions[input.session_id].sections.add(input.section_name);
    sessions[input.session_id].inputs.push(input);
  });
  
  // Split into completed and incomplete
  const completed = [];
  const incomplete = [];
  
  Object.values(sessions).forEach(session => {
    if (session.sections.size === sectionOrder.length) {
      completed.push(...session.inputs);
    } else {
      incomplete.push(...session.inputs);
    }
  });
  
  return { completed, incomplete };
}

/**
 * Compare field analysis between two groups
 * @param {Array} group1 - First group of inputs
 * @param {Array} group2 - Second group of inputs
 * @param {string} fieldPath - Path to the field to analyze
 * @returns {Array} Array of {item, group1Count, group2Count, difference} objects
 */
export function compareFieldAnalysis(group1, group2, fieldPath) {
  const analysis1 = analyzeField(group1, fieldPath);
  const analysis2 = analyzeField(group2, fieldPath);
  
  // Combine results
  const combined = {};
  
  analysis1.forEach(({ item, count }) => {
    combined[item] = { item, group1Count: count, group2Count: 0, difference: count };
  });
  
  analysis2.forEach(({ item, count }) => {
    if (combined[item]) {
      combined[item].group2Count = count;
      combined[item].difference = combined[item].group1Count - count;
    } else {
      combined[item] = { item, group1Count: 0, group2Count: count, difference: -count };
    }
  });
  
  // Sort by absolute difference
  return Object.values(combined)
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
    .slice(0, 10);
}