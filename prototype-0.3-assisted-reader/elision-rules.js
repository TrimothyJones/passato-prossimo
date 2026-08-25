window.ITALIAN_ELISION_RULE_META = {
  name: "Italian elision and contraction rules",
  ruleCount: 14,
  sourceNote: "Prototype high-confidence Italian forms; examples and edge cases require continued human review.",
  tuple: ["prefix", "expansion", "label", "meaning", "note"]
};

window.ITALIAN_ELISION_RULES = [
  ["dell'", "di + l'", "articulated preposition", "of the / from the", "The preposition di combines with a shortened definite article before a vowel."],
  ["all'", "a + l'", "articulated preposition", "to the / at the", "The preposition a combines with a shortened definite article before a vowel."],
  ["dall'", "da + l'", "articulated preposition", "from the / by the", "The preposition da combines with a shortened definite article before a vowel."],
  ["nell'", "in + l'", "articulated preposition", "in the / inside the", "The preposition in combines with a shortened definite article before a vowel."],
  ["sull'", "su + l'", "articulated preposition", "on the / about the", "The preposition su combines with a shortened definite article before a vowel."],
  ["coll'", "con + l'", "articulated preposition", "with the", "This literary or less common form combines con with a shortened definite article."],
  ["quest'", "questo / questa", "elided demonstrative", "this", "The demonstrative drops its final vowel before another vowel."],
  ["quell'", "quello / quella", "elided demonstrative", "that", "The demonstrative drops its final vowel before another vowel."],
  ["senz'", "senza", "elided preposition", "without", "Senza may drop its final vowel before another vowel, especially in established or literary phrasing."],
  ["dov'", "dove", "elided question word", "where", "Dove drops its final vowel before a following vowel, commonly a form of essere."],
  ["com'", "come", "elided comparison word", "how / as", "Come drops its final vowel before a following vowel, commonly a form of essere."],
  ["un'", "una", "elided indefinite article", "a / an", "The feminine article una drops its final vowel before a vowel-initial word."],
  ["c'", "ci", "elided particle", "there / in it", "Ci drops its vowel before a following vowel; with essere it often introduces existence, as in c'e or c'era."],
  ["l'", "lo / la", "elided article or pronoun", "the / him / her / it", "Lo or la drops its vowel before a following vowel. Nearby grammar determines whether it acts as an article or object pronoun."]
];
