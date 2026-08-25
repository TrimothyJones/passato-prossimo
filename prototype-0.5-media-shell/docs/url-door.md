# URL Door

## Purpose

The URL Door turns a public web page into reviewed Italian reading material. It is the first source adapter in a larger source-independent reading pipeline: the reader should care about the resulting text and metadata, not whether they came from a book, article, or future transcript provider.

## Current workflow

1. The learner pastes a public HTTP or HTTPS URL.
2. The app downloads the page with size, timeout, redirect, and private-network limits.
3. Navigation and other common page furniture are removed.
4. The best readable container is extracted.
5. The app shows a preview without adding anything to the shelf.
6. The learner can review the title, author, source, language signal, length, and cleaned opening.
7. The full extracted text can be edited when the page includes unwanted material.
8. `Add to shelf` saves the reviewed result; `Cancel` discards it.
9. When the saved article is opened, a quiet source strip identifies the website and author and can reopen the original page outside the app.

## Preview confidence

Preview confidence describes the extraction, not the truth or quality of the article.

- `Clean extraction` means the result is substantial and has a strong Italian-language signal.
- `Looks usable` means the result appears readable but is shorter or has a weaker language signal.
- `Needs a quick review` means the page may be short, multilingual, or structurally difficult.

The language signal is a lightweight local heuristic. It is not full language identification.

## Storage boundary

In the desktop app, extracted pages are held temporarily under a preview token. The URL is written to the local shelf only after confirmation. Edited title, author, and text replace the extracted values when saved. Preview tokens are intentionally short-lived and cannot be reused after a successful save.

The standalone browser version follows the same visible workflow but keeps the temporary preview in page memory and stores confirmed articles in browser storage.

## Rights and attribution

The saved item retains its original URL, hostname, and import date. The reader exposes that trail through `Open original`. Importing a page creates a personal local reading copy; it does not transfer ownership or publication rights. Website access rules and copyright remain with the source.

## Future direction

A later workspace or collage board could display books, links, articles, images, and other immersion objects spatially. The URL Door is useful groundwork because every future visual object still needs a predictable source record and a deliberate save boundary. That board is not part of Prototype 0.4.
