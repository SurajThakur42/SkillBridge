/**
 * Voice Fuzzy & Phonetic Distance Matcher
 * Dramatically boosts speech recognition accuracy by forgiving minor phonetic distortions,
 * accents, and speech recognition transcription quirks.
 */

// Normalized phonetic aliases and dictionary mapping
const PHONETIC_ALIASES: Record<string, string[]> = {
  'courses': ['curse', 'corse', 'corses', 'classes', 'lessons', 'training', 'modules', 'catalog'],
  'skill-gap': ['skill gap', 'skil gap', 'skil cap', 'gap analysis', 'readiness', 'competency gap', 'gap report'],
  'recommendations': ['recommendation', 'recs', 'recom', 'suggestions', 'recommended courses'],
  'skills': ['skill', 'my skills', 'skils', 'competencies', 'skills matrix'],
  'certificates': ['certificate', 'certify', 'cert', 'certs', 'diploma', 'credentials', 'verifications'],
  'dashboard': ['dash', 'home', 'overview', 'portal'],
  'profile': ['account', 'user profile', 'settings'],
  'quiz': ['test', 'exam', 'assessment', 'take quiz', 'take assessment', 'quize'],
  'dark mode': ['night mode', 'black mode', 'dark theme', 'dark'],
  'light mode': ['bright mode', 'white mode', 'light theme', 'day mode', 'light'],
  'numbers': ['badges', 'number tags', 'tag numbers', 'show tags', 'show digits'],
  'read': ['read page', 'speak page', 'read aloud', 'narrate', 'listen to page']
};

/**
  * Calculate Levenshtein edit distance between two strings
  */
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= bn; i++) matrix[i] = [i];
  for (let j = 0; j <= an; j++) matrix[0][j] = j;

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * Calculate string similarity score from 0.0 to 1.0
 */
export function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(s1, s2);
  return Math.max(0, (maxLen - distance) / maxLen);
}

/**
 * Clean & normalize speech transcript
 */
export function normalizeTranscript(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find best matching phrase from dictionary or target phrases
 */
export function findBestVoiceMatch(
  userInput: string,
  candidatePhrases: string[],
  threshold = 0.70
): { match: string | null; score: number } {
  const normInput = normalizeTranscript(userInput);
  let bestPhrase: string | null = null;
  let bestScore = 0;

  for (const phrase of candidatePhrases) {
    const normCandidate = normalizeTranscript(phrase);

    // Exact or substring match
    if (normInput === normCandidate) {
      return { match: phrase, score: 1.0 };
    }

    if (normInput.includes(normCandidate) || normCandidate.includes(normInput)) {
      const score = 0.88;
      if (score > bestScore) {
        bestScore = score;
        bestPhrase = phrase;
      }
    }

    // Levenshtein fuzzy score
    const sim = stringSimilarity(normInput, normCandidate);
    if (sim > bestScore) {
      bestScore = sim;
      bestPhrase = phrase;
    }
  }

  // Also check phonetic aliases
  for (const [key, aliases] of Object.entries(PHONETIC_ALIASES)) {
    for (const alias of aliases) {
      const aliasSim = stringSimilarity(normInput, alias);
      if (aliasSim >= 0.82) {
        // If candidate list contains key or alias
        const targetInCandidates = candidatePhrases.find(p => p.toLowerCase().includes(key) || key.includes(p.toLowerCase()));
        if (targetInCandidates && aliasSim > bestScore) {
          bestScore = aliasSim;
          bestPhrase = targetInCandidates;
        }
      }
    }
  }

  if (bestScore >= threshold) {
    return { match: bestPhrase, score: bestScore };
  }

  return { match: null, score: bestScore };
}
