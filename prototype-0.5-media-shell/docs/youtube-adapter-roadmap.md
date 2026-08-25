# YouTube Adapter Roadmap

This work is intentionally split into testable checkpoints. Each step should be checked before the next one changes the system.

1. **Provider Contract v2 - complete.** Normalize commands, events, errors, surface interactions, and capability flags. Keep native HTML media details inside the HTML provider.
2. **YouTube URL parser - complete.** Recognize watch, shortened, Shorts, live, and embed URL shapes and return one normalized video ID without creating a player or contacting YouTube.
3. **Desktop identity - complete.** Give official YouTube embed requests the prototype desktop app identity required for a WebView and normalize documented player errors, including missing identity error 153.
4. **Resting object - complete.** Show a lightweight YouTube thumbnail, normalized source details, and an original-source action without creating an iframe.
5. **YouTube provider - implemented; live validation pending.** The official IFrame Player API now implements Provider Contract v2, activates on request, and is destroyed on rest. A live Electron playback check remains before this checkpoint is confirmed complete.
6. **Transcript states - pending.** Clearly distinguish unavailable, creator-provided, imported, and generated transcript sources.

No YouTube video extraction, restreaming, caption scraping, or interface replacement belongs in this adapter. The official embedded player remains the playback surface.
