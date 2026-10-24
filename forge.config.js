module.exports = {
  packagerConfig: {
    asar: true,
    executableName: "PassatoProssimo",
    ignore: [
      /^\/tmp(?:\/|$)/,
      /^\/immersion-hub(?:\/|$)/,
      /^\/\.agents(?:\/|$)/,
      /^\/\.git(?:\/|$)/,
      /^\/out(?:\/|$)/,
      /^\/mobile(?:\/|$)/,
      /^\/releases(?:\/|$)/,
      /^\/public-repo(?:\/|$)/,
      /^\/tools(?:\/|$)/,
      /^\/src\/(?!main\.js$|preload\.js$|books\.js$)/,
      /^\/prototype-0\.4-breakdown(?:\/|$)/,
      /^\/prototype-0\.2-lexical-coverage\/(?!lexicon\.js$|core-dictionary\.js$)/,
      /^\/prototype-0\.3-assisted-reader\/(?!paisa-frequency\.js$|learner-enrichment\.js$|dictionary-overflow\.js$|context-markers\.js$|accent-rules\.js$|elision-rules\.js$)/,
      /^\/prototype-0\.5-media-shell\/(?!index\.html$|styles\.css$|platform-adapter\.js$|app\.js$|reader-dict-en-trial\.js$|word-lens-trial\.js$|reviewed-verbs-data\.js$|reviewed-word-lens\.js$|source-lexicon\.js$|source-lexicon-index\.js$|data(?:\/|$))/,
      /^\/prototype-0\.5-media-shell\/data\/(?!source-lexicon(?:\/|$))/,
      /^\/backup-surviving-source-.*\.zip$/,
      /^\/Run Immersion Project\.bat$/,
      /^\/(?:README\.md|package-lock\.json|forge\.config\.js)$/
    ]
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "passato_prossimo",
        authors: "Passato Prossimo Project",
        description: "Italian immersion reader and media learning prototype",
        setupExe: "Passato-Prossimo-Setup.exe",
        noMsi: true
      }
    }
  ]
};
