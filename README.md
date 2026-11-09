# Doodle Chess (by Hugh)

Chess drawn as cartoon doodles on notebook paper. One page, no build step, no libraries, no tracking.

**Play it:** <add your GitHub Pages link here> — or clone the repo and open `index.html` in a browser.

Pick your paper and your pieces on the first screen (nine papers: lined, graph, dotted, plain, legal pad,
kraft, parchment, napkin, blueprint; light or dark; ten piece sets). Then play a friend across the table or
the computer at four strengths, with hints, clocks, sound and puzzles. Everything is remembered on your own
device; nothing is sent anywhere.

## What's in it

- **Undo and Redo.** Against the computer, one tap takes back (or puts back) your move and its reply.
- **Look back.** The « ‹ › » buttons (or Home / PageUp / PageDown / End, or the arrow keys on the buttons) step through the game; tap any move in the list; tap the board to return.
- **Puzzles.** 26 checkmate puzzles (mate in 1, then mate in 2). Progress is remembered.
- **Today's puzzle** is a different puzzle every day, with a daily streak.
- **Your record** against each computer level.
- **Games as PGN.** "Copy game (PGN)" saves a game; "Paste a game" opens one (games that start the usual way).
- **Two players:** an optional setting turns the board toward whoever moves next.
- **Play as White or Black** against the computer (the board turns to face you, and the computer opens if you choose Black).
- **Oops warnings.** After your move against the computer, a quick check looks for a blunder (a piece left hanging, or a checkmate allowed). You can take the move back or keep it. Turn it off in Settings.
- **Capture show.** Taken pieces get a hand-drawn starburst, dust and a word; big pieces shake the board, and the piece flies into the Captured box. Switched off by Reduce Motion.
- **Ten piece sets, each drawn from scratch** (cats/dogs, space, ocean, fantasy, dinosaurs, robots, school supplies, pixel, sweets, classic) with their own shapes for all six pieces, not costumes on one body.
- **Works offline and installs** on a phone's home screen when served from a web address (`manifest.webmanifest`, `sw.js`, icons).
- **Wobbly lines** (the hand-drawn look) can be turned off in Settings; they switch off by themselves on very small devices.
- **Keyboard and screen reader.** Every square is a button with a spoken label, moves are announced as they are made, and the board can be played with the arrow keys alone.

## Files

- `index.html` is the whole game: styles, drawings, rules engine, computer player and page.
- `manifest.webmanifest`, `sw.js`, `icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` make it installable and let it work offline. The game runs fine without them (for example from a `file://` page).
- `tests/engine-test.js` checks the rules engine, the computer, the opening book, PGN reading/writing and every puzzle. Run it with `node tests/engine-test.js` — no dependencies, no test runner.

## Notes

- The rules engine sits in `<script id="engine">` (between `ENGINE-START` and `ENGINE-END`). The page also loads it into a background worker so the computer never freezes the page.
- The computer searches with a transposition table, killer/history move ordering, null-move pruning, check extensions and a quiescence search, and avoids repeating positions when it is ahead. Medium sometimes plays its second or third choice on purpose. Every level above easy uses a small opening book (`BOOK_LINES`).
- Puzzles (`PUZZLES`) are checked by the tests: each stored answer must be exactly the set of forced mates.
- Piece drawings are SVG symbols in the page. Each set is a function `ART.<set>(type, team)` that writes its six pieces for both teams from a small kit (`PK`); the classic set (`g-*` symbols) and the sweets set (`f-*` symbols) are hand-written symbols. The pixel set is drawn from letter pictures (`MASKS`).
- The only request the page makes to anyone else is the Google Fonts stylesheet for its two handwriting fonts. There is no analytics, no tracking and no account.
- There is one feature you will not see here: live online play against a friend, through the "room" feature of the page host. It only works when the page is opened inside Claude, so everywhere else that section of the panel is hidden and the rest of the game is unchanged.

## How it was built

I built this with [Claude Code](https://claude.com/claude-code), specifying what I wanted, reviewing the
result and testing it. The chess rules, the search, the artwork and the tests are all the product of that
back-and-forth. I am putting it in my portfolio as an example of directing and shipping a working piece of
software, not as hand-typed code.

## Licence

MIT — see [LICENSE](LICENSE). The piece artwork is drawn from scratch in SVG and is covered by the same
licence; the two fonts are loaded from Google Fonts under the SIL Open Font License and are not included here.
