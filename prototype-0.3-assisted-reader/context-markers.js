window.CONTEXT_MARKER_META = {
  name: "Italian context marker layer",
  generatedAt: "2026-07-12T22:18:02.336Z",
  sourceFile: "context list.json",
  markerCount: 15,
  clusterCount: 7,
  sourceNote: "Prototype pragmatic/context marker seed; human review required before release.",
  tuple: ["phrase", "normalizedPhrase", "register", "position", "englishEquivalents", "function", "instruction", "example", "components"]
};

window.ITALIAN_CONTEXT_MARKERS = 
[
  [
    "allora",
    "allora",
    "informal",
    "sentence_start",
    [
      "so",
      "well",
      "then"
    ],
    "Sets a baseline for conversation, acts as a cognitive placeholder to buy time, or signals a transition to a new topic.",
    "Use at the absolute start of a thought or when moving to a new point. Can be drawn out (allora...) to show thinking.",
    "Allora, vediamo cosa possiamo fare per questo progetto.",
    [
      "allora"
    ]
  ],
  [
    "boh",
    "boh",
    "informal",
    "standalone_or_sentence_start",
    [
      "I don't know",
      "no clue"
    ],
    "Signals total ignorance, complete indifference, or a lack of responsibility for providing an answer.",
    "Use to instantly dismiss a question or show that the speaker has zero information. High semantic bleaching.",
    "Boh, io non ne so niente di questa storia.",
    [
      "boh"
    ]
  ],
  [
    "mah",
    "mah",
    "informal",
    "standalone_or_sentence_start",
    [
      "we'll see",
      "hm",
      "I doubt it"
    ],
    "Expresses skepticism, deep doubt, hesitation, or a polite refusal to commit to an opinion.",
    "Use when the model needs to show hesitation or mild disbelief about an outcome.",
    "Mah, speriamo che funzioni, ma ho i miei dubbi.",
    [
      "mah"
    ]
  ],
  [
    "cioè",
    "cioe",
    "informal",
    "mid_sentence_or_clause_start",
    [
      "I mean",
      "like",
      "that is to say"
    ],
    "Functions as a self-correction tool, an explainer, or a mid-sentence pivot. Frequently used as a pure filler word.",
    "Insert mid-thought when the model is 'rephrasing' or breaking down a concept informally.",
    "Non mi piace molto, cioè, è carino ma non fa per me.",
    [
      "cioe"
    ]
  ],
  [
    "beh",
    "beh",
    "informal",
    "sentence_start",
    [
      "well"
    ],
    "Introduces a concession, reluctant agreement, or a shift toward the climax of a story.",
    "Often paired with trailing punctuation. Good for starting an answer where the solution isn't black and white.",
    "Beh, dopotutto non hai tutti i torti.",
    [
      "beh"
    ]
  ],
  [
    "insomma",
    "insomma",
    "informal",
    "sentence_start_or_standalone",
    [
      "in short",
      "basically",
      "so-so"
    ],
    "Compresses a complex thought into a summary, or signals a neutral, unenthusiastic emotional state when used alone.",
    "Use to wrap up a chaotic explanation or to give a lukewarm response to a status check.",
    "Insomma, alla fine della fiera abbiamo deciso di non andare.",
    [
      "insomma"
    ]
  ],
  [
    "vabbè",
    "vabbe",
    "informal",
    "sentence_start_or_standalone",
    [
      "whatever",
      "alright then",
      "oh well"
    ],
    "Signals resignation, dropping an argument, or accepting a less-than-ideal situation.",
    "Crucial for realistic dialogue where an agent concedes a point or lets go of a disagreement.",
    "Vabbè, facciamo come dici tu e non pensiamoci più.",
    [
      "vabbe"
    ]
  ],
  [
    "dai",
    "dai",
    "informal",
    "sentence_start_or_sentence_end",
    [
      "come on",
      "no way"
    ],
    "Urges the listener to action, expresses disbelief, or pushes dialogue forward. Completely divorced from the verb 'dare'.",
    "Use to inject energy, encouragement, or mild shock into conversational dialogue.",
    "Dai, sbrigati che facciamo tardi!",
    [
      "dai"
    ]
  ],
  [
    "tuttavia",
    "tuttavia",
    "professional",
    "clause_start",
    [
      "however",
      "nevertheless"
    ],
    "Introduces a logical contrast, counter-argument, or exception without breaking formal tone.",
    "Use in corporate reports or structured reasoning to pivot between conflicting data points.",
    "Il budget è limitato; tuttavia, procederemo con lo sviluppo.",
    [
      "tuttavia"
    ]
  ],
  [
    "in sostanza",
    "in sostanza",
    "professional",
    "sentence_start_or_parenthetical",
    [
      "in essence",
      "fundamentally"
    ],
    "Synthesizes a complex professional argument into its core business value or logical bottom line.",
    "Excellent for summary generations or high-level executive overviews.",
    "In sostanza, la nuova strategia ridurrà i costi del venti percento.",
    [
      "in",
      "sostanza"
    ]
  ],
  [
    "ossia",
    "ossia",
    "professional",
    "mid_sentence",
    [
      "that is",
      "namely"
    ],
    "Provides a precise, technical definition or clarification of an immediately preceding term.",
    "Replaces the informal 'cioè' when operating in academic, legal, or highly technical prompts.",
    "Dobbiamo ottimizzare l'algoritmo, ossia ridurre la complessità computazionale.",
    [
      "ossia"
    ]
  ],
  [
    "dunque",
    "dunque",
    "professional",
    "sentence_start_or_mid_sentence",
    [
      "consequently",
      "therefore",
      "so"
    ],
    "Draws a formal, definitive logical conclusion from previously established premises.",
    "Signals that the model is about to deliver the final resolution of a logical chain.",
    "I dati confermano il trend; dunque, approviamo la mozione.",
    [
      "dunque"
    ]
  ],
  [
    "pertanto",
    "pertanto",
    "professional",
    "sentence_start",
    [
      "therefore",
      "for this reason"
    ],
    "Links cause and effect in a highly authoritative, structured manner. Common in legal and corporate text.",
    "Use to dictate an action or consequence resulting from formal rules or findings.",
    "La documentazione è incompleta, pertanto la richiesta è respinta.",
    [
      "pertanto"
    ]
  ],
  [
    "inoltre",
    "inoltre",
    "professional",
    "sentence_start_or_clause_start",
    [
      "furthermore",
      "in addition"
    ],
    "Appends an independent, distinct point to an existing argument to strengthen it.",
    "Use instead of repeatedly writing 'e' (and) or 'anche' (also) when listing arguments.",
    "Il software aumenta la sicurezza. Inoltre, dimezza i tempi di calcolo.",
    [
      "inoltre"
    ]
  ],
  [
    "premesso che",
    "premesso che",
    "professional",
    "sentence_start",
    [
      "given that",
      "provided that"
    ],
    "Establishes baseline assumptions, context, or constraints before delivering the core statement.",
    "Perfect for legal contexts or defining boundaries before answering a complex technical prompt.",
    "Premesso che i fondi siano disponibili, il progetto partirà a marzo.",
    [
      "premesso",
      "che"
    ]
  ]
];

window.ITALIAN_CONTEXT_CLUSTERS = 
[
  [
    "eh vabbè allora",
    "eh vabbe allora",
    "informal",
    "sentence_start",
    [],
    "Signals total, dramatic resignation after trying to find an alternative. The speaker is completely throwing their hands up in the air.",
    "Use when an agent is forced to capitulate to the user's terms after a disagreement or a breakdown in options.",
    "Eh vabbè allora, facciamo come dici tu e non parliamone più.",
    [
      "eh",
      "vabbe",
      "allora"
    ]
  ],
  [
    "ma infatti",
    "ma infatti",
    "informal",
    "sentence_start_or_standalone",
    [],
    "Strong, enthusiastic validation of what the interlocutor just said. It means 'Exactly! That's precisely my point!'",
    "Use when the model wants to show high agreement or solidarity with a user's observation or complaint.",
    "Ma infatti! È esattamente quello che volevo dire io.",
    [
      "ma",
      "infatti"
    ]
  ],
  [
    "mah, cioè",
    "mah cioe",
    "informal",
    "sentence_start",
    [],
    "Signals that the speaker is deeply skeptical and struggling to find the words to explain why the other person's idea doesn't make sense.",
    "Use when the model needs to politely dismantle a deeply flawed premise or express confusion about a user's request.",
    "Mah, cioè... secondo me rischiamo solo di perdere tempo così.",
    [
      "mah",
      "cioe"
    ]
  ],
  [
    "no vabbè, dai",
    "no vabbe dai",
    "informal",
    "sentence_start_or_standalone",
    [],
    "Expresses total disbelief, shock, or amusement. Similar to the English 'No way, come on!' or 'You've got to be kidding me.'",
    "Perfect for casual, highly expressive dialogue where the model is reacting to a surprising or ridiculous statement.",
    "No vabbè, dai, non posso crederci che sia successa davvero una cosa del genere!",
    [
      "no",
      "vabbe",
      "dai"
    ]
  ],
  [
    "e allora scusa",
    "e allora scusa",
    "informal",
    "sentence_start",
    [],
    "Introduces a defensive or slightly confrontational counter-question. It calls out a logical contradiction in what the other person just said.",
    "Use when the model needs to challenge a user's contradictory input or clarify a logical conflict in the dialogue flow.",
    "E allora scusa, se sapevi già come fare, perché me lo hai chiesto?",
    [
      "e",
      "allora",
      "scusa"
    ]
  ],
  [
    "sì, vabbè, però",
    "si vabbe pero",
    "informal",
    "sentence_start",
    [],
    "Acknowledges the other person's point but immediately dismisses it as irrelevant or minor compared to the main objection.",
    "Use to create an agent that is stubborn, protective of its logic, or introducing a massive caveat to an agreement.",
    "Sì, vabbè, però non puoi pretendere che io faccia tutto da solo.",
    [
      "si",
      "vabbe",
      "pero"
    ]
  ],
  [
    "alla fin fine",
    "alla fin fine",
    "informal",
    "sentence_start_or_mid_sentence",
    [],
    "Idiomatic cluster meaning 'at the end of the day' or 'when all is said and done.' Synthesizes a messy situation down to its reality.",
    "Use to wrap up a casual story, evaluation, or conversational summary.",
    "Alla fin fine, la cosa importante è che siamo riusciti a risolvere il problema.",
    [
      "alla",
      "fin",
      "fine"
    ]
  ]
];
