(function (root) {
  "use strict";

  function exactKey(value) {
    return String(value || "").normalize("NFC").toLowerCase()
      .replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();
  }

  // Inputs are views supplied by the caller. Never write into a source dictionary.
  function createSelector(provider = { entries: [] }) {
    const groups = new Map();
    for (const sense of provider.entries || []) {
      if (sense.review?.status !== "approved" || sense.license?.status !== "verified"
          || sense.confidence !== "high" || sense.register === "unknown") continue;
      const key = exactKey(sense.headword);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(sense);
    }
    for (const senses of groups.values()) {
      if (senses.filter((sense) => sense.preferred).length !== 1) {
        throw new Error("Foundation group must contain exactly one preferred sense");
      }
    }

    return function selectLexicalMeaning({ token, lemma, lemmaMethod, legacy = [] }) {
      let senses = groups.get(exactKey(token)) || [];
      const trustedLemma = ["known-exact-form", "known-accented-form", "accent-sensitive"]
        .includes(lemmaMethod);
      if (!senses.length && trustedLemma) senses = groups.get(exactKey(lemma)) || [];
      const views = senses.map((sense) => ({ ...sense, providerId: "italian-foundation" }));
      const english = legacy.filter((sense) => sense.definition?.language === "en");
      const fallback = english.find((sense) => sense.providerId === "learner-enrichment")
        || english.find((sense) => sense.providerId === "core-dictionary") || null;
      const preferred = views.find((sense) => sense.preferred) || fallback;
      return {
        preferred,
        alternatives: [...views, ...english].filter((sense) => sense !== preferred),
        italianDefinitions: legacy.filter((sense) => sense.definition?.language === "it"),
        unknownDefinitions: legacy.filter((sense) => !["en", "it"].includes(sense.definition?.language)),
        selectionReason: preferred?.providerId === "italian-foundation"
          ? "Reviewed foundation default" : preferred ? "Legacy English fallback" : "No English meaning"
      };
    };
  }

  const api = { exactKey, createSelector };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PASSATO_LEXICAL = api;
})(typeof window === "undefined" ? globalThis : window);
