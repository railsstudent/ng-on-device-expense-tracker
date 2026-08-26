// Suffix manipulations list (Step 2)
const STEP2_LIST: Record<string, string> = {
  ational: 'ate',
  tional: 'tion',
  enci: 'ence',
  anci: 'ance',
  izer: 'ize',
  bli: 'ble',
  alli: 'al',
  entli: 'ent',
  eli: 'e',
  ousli: 'ous',
  ization: 'ize',
  ation: 'ate',
  ator: 'ate',
  alism: 'al',
  iveness: 'ive',
  fulness: 'ful',
  ousness: 'ous',
  aliti: 'al',
  iviti: 'ive',
  biliti: 'ble',
  logi: 'log',
};

// Suffix manipulations list (Step 3)
const STEP3_LIST: Record<string, string> = {
  icate: 'ic',
  ative: '',
  alize: 'al',
  iciti: 'ic',
  ical: 'ic',
  ful: '',
  ness: '',
};

// Porter Stemmer Consonant-vowel patterns
const CONSONANT = '[^aeiou]';
const VOWEL = '[aeiouy]';
const CONSONANTS = '(' + CONSONANT + '[^aeiouy]*)';
const VOWELS = '(' + VOWEL + '[aeiou]*)';

const GT0 = new RegExp('^' + CONSONANTS + '?' + VOWELS + CONSONANTS);
const GT1 = new RegExp('^' + CONSONANTS + '?(' + VOWELS + CONSONANTS + '){2,}');
const VOWEL_IN_STEM = new RegExp('^' + CONSONANTS + '?' + VOWEL);
const CONSONANT_LIKE = new RegExp('^' + CONSONANTS + VOWEL + '[^aeiouwxy]$');

const SFX_LL = /ll$/;
const SFX_E = /^(.+?)e$/;
const SFX_Y = /^(.+?)y$/;
const SFX_ION = /^(.+?(s|t))(ion)$/;
const SFX_ED_OR_ING = /^(.+?)(ed|ing)$/;
const SFX_AT_OR_BL_OR_IZ = /(at|bl|iz)$/;
const SFX_EED = /^(.+?)eed$/;
const SFX_S = /^(.+?)(ss|i)es$/;
const SFX_S_SINGLE = /^(.+?)([^s])s$/;

// Step 4 suffix checks
const STEP4_SFX = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;

/**
 * A type-safe generic pipe helper for functional composition.
 */
const pipe =
  <T>(...fns: ((arg: T) => T)[]) =>
  (initialValue: T): T =>
    fns.reduce((value, fn) => fn(value), initialValue);

/**
 * Handles Step 1 suffix reductions (Step 1a, 1b, and 1c).
 */
function stemStep1A(stem: string): string {
  let s = stem;

  // STEP 1A: Plural stripping
  if (SFX_S.test(s)) {
    s = s.replace(SFX_S, '$1$2');
  } else if (SFX_S_SINGLE.test(s)) {
    s = s.replace(SFX_S_SINGLE, '$1$2');
  }

  return s;
}

function stemEdOrIng(s: string): string {
  const matches = s.match(SFX_ED_OR_ING);
  if (matches && VOWEL_IN_STEM.test(matches[1])) {
    let stemPart = matches[1];
    if (SFX_AT_OR_BL_OR_IZ.test(stemPart)) {
      stemPart += 'e';
    } else if (stemPart.length > 1 && stemPart.charAt(stemPart.length - 1) === stemPart.charAt(stemPart.length - 2)) {
      const lastChar = stemPart.charAt(stemPart.length - 1);
      if (lastChar !== 'l' && lastChar !== 's' && lastChar !== 'z') {
        stemPart = stemPart.slice(0, -1);
      }
    } else if (CONSONANT_LIKE.test(stemPart)) {
      stemPart += 'e';
    }
    return stemPart;
  }
  return s;
}

function stemStep1B(stem: string): string {
  let s = stem;

  // STEP 1B: Past tense and continuous stripping
  if (SFX_EED.test(s)) {
    const fp = s.match(SFX_EED);
    if (fp && GT0.test(fp[1])) {
      s = s.replace(SFX_EED, '$1ee');
    }
  } else if (SFX_ED_OR_ING.test(s)) {
    s = stemEdOrIng(s);
  }

  return s;
}

function stemStep1C(stem: string): string {
  let s = stem;

  // STEP 1C: Y suffix mapping
  if (SFX_Y.test(s)) {
    const matches = s.match(SFX_Y);
    if (matches && VOWEL_IN_STEM.test(matches[1])) {
      s = matches[1] + 'i';
    }
  }

  return s;
}

/**
 * Handles Step 1 suffix reductions (Step 1a, 1b, and 1c).
 */
const stemStep1 = pipe(stemStep1A, stemStep1B, stemStep1C);

/**
 * Handles Step 2 and Step 3 double and simple suffix reductions.
 */
function stemSteps2And3(stem: string): string {
  let s = stem;

  // STEP 2: Double suffix reduction
  const step2Sfx =
    /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
  if (step2Sfx.test(s)) {
    const matches = s.match(step2Sfx);
    if (matches && GT0.test(matches[1])) {
      const suffix = matches[2];
      s = matches[1] + STEP2_LIST[suffix];
    }
  }

  // STEP 3: Simple suffix reduction
  const step3Sfx = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
  if (step3Sfx.test(s)) {
    const matches = s.match(step3Sfx);
    if (matches && GT0.test(matches[1])) {
      const suffix = matches[2];
      s = matches[1] + STEP3_LIST[suffix];
    }
  }

  return s;
}

/**
 * Handles Step 4 and Step 5 suffix stripping.
 */
function stemStep4(stem: string): string {
  let s = stem;

  // STEP 4: Suffix stripping based on measure m > 1
  if (STEP4_SFX.test(s)) {
    const matches = s.match(STEP4_SFX);
    if (matches && GT1.test(matches[1])) {
      s = matches[1];
    }
  } else if (SFX_ION.test(s)) {
    const matches = s.match(SFX_ION);
    if (matches && GT1.test(matches[1])) {
      s = matches[1];
    }
  }

  return s;
}

function stemStep5(stem: string): string {
  let s = stem;

  // STEP 5A: E stripping based on measure and consonant-like stems
  if (SFX_E.test(s)) {
    const matches = s.match(SFX_E);
    if (matches) {
      const stemPart = matches[1];
      if (GT1.test(stemPart) || (GT0.test(stemPart) && !CONSONANT_LIKE.test(stemPart))) {
        s = stemPart;
      }
    }
  }

  // STEP 5B: Double L stripping
  if (SFX_LL.test(s) && GT1.test(s)) {
    s = s.slice(0, -1);
  }

  return s;
}

/**
 * Handles Step 4 and Step 5 suffix stripping.
 */
const stemSteps4And5 = pipe(stemStep4, stemStep5);

/**
 * Strongly typed Porter Stemmer algorithm ported from words/stemmer.
 * Returns the structural root/stem of an English word.
 */
export function stemmer(value: string): string {
  const word = value.toLowerCase().replace(/[^a-z]/g, '');

  if (word.length < 3) {
    return word;
  }

  let s = word;
  const firstCharacter = s.charAt(0);

  // Turn initial y into Y to treat it as a consonant
  if (firstCharacter === 'y') {
    s = 'Y' + s.slice(1);
  }

  s = stemStep1(s);
  s = stemSteps2And3(s);
  s = stemSteps4And5(s);

  // Turn initial Y back into y
  if (firstCharacter === 'y') {
    s = 'y' + s.slice(1);
  }

  return s;
}
