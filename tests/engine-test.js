// Runs the chess rules engine (the <script id="engine"> block in index.html) in Node.
// Usage: node tests/engine-test.js
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const engine = html.split('// ENGINE-START')[1].split('// ENGINE-END')[0];
const lib = new Function(engine + `
return { fromFEN, toFEN, START_FEN, perft, legal, apply, inCheck, sanOf, chooseMoveTimed, insufficient, sq2name,
  outcome, positionKey, moveFromSAN, parsePGN, toPGN, BOOK_LINES, BOOK, bookMove, uci, mateMoves, PUZZLES, LEVELS, quickEval, evaluate,
  judgeMove, dateKey, dayNumber, prevDay, dailyIndex, streakAfter, streakNow, remoteExtension, inviteCode };`)();
const { fromFEN, toFEN, START_FEN, perft, legal, apply, inCheck, sanOf, chooseMoveTimed, insufficient, sq2name,
  outcome, positionKey, moveFromSAN, parsePGN, toPGN, BOOK_LINES, bookMove, uci, mateMoves, PUZZLES, LEVELS, quickEval, evaluate,
  judgeMove, dateKey, dayNumber, prevDay, dailyIndex, streakAfter, streakNow, remoteExtension, inviteCode } = lib;

let failed = 0;
const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) failed++; console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : ' got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want))); };
const names = (fen) => legal(fromFEN(fen)).map(uci).sort();
const has = (fen, u) => names(fen).includes(u);
const play = (s, ...moves) => { for (const u of moves) { const m = legal(s).find(x => uci(x) === u); if (!m) throw new Error('illegal ' + u); s = apply(s, m); } return s; };

// ---------- move counts (standard tests from the chess programming community) ----------
check('start position, depth 1-4', [1, 2, 3, 4].map(d => perft(fromFEN(START_FEN), d)), [20, 400, 8902, 197281]);
check('kiwipete, depth 1-3', [1, 2, 3].map(d => perft(fromFEN('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1'), d)), [48, 2039, 97862]);
check('endgame position, depth 1-4', [1, 2, 3, 4].map(d => perft(fromFEN('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1'), d)), [14, 191, 2812, 43238]);
check('promotion position, depth 1-3', [1, 2, 3].map(d => perft(fromFEN('rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8'), d)), [44, 1486, 62379]);
check('mirrored position (Black to move), depth 1-3', [1, 2, 3].map(d => perft(fromFEN('r2q1rk1/pP1p2pp/Q4n2/bbp1p3/Np6/1B3NBn/pPPP1PPP/R3K2R b KQ - 0 1'), d)), [6, 264, 9467]);

// ---------- castling ----------
check('castling: both sides are offered when the way is clear', ['e1g1', 'e1c1'].map(u => has('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', u)), [true, true]);
check('castling: not out of check', ['e1g1', 'e1c1'].map(u => has('r3k2r/8/8/8/8/8/4r3/R3K2R w KQkq - 0 1', u)), [false, false]);
check('castling: not through an attacked square', has('r3k2r/8/8/8/8/8/5r2/R3K2R w KQkq - 0 1', 'e1g1'), false);
check('castling: queenside may pass a square that only the rook crosses (b1 attacked)', has('r3k2r/8/8/8/8/8/1r6/R3K2R w KQkq - 0 1', 'e1c1'), true);
check('castling: not into check', has('r3k2r/8/8/8/8/8/6r1/R3K2R w KQkq - 0 1', 'e1g1'), false);
check('castling: not once the right is gone', has('r3k2r/8/8/8/8/8/8/R3K2R w kq - 0 1', 'e1g1'), false);
check('castling: not with a piece in the way', has('r3k2r/8/8/8/8/8/8/RN2K2R w KQkq - 0 1', 'e1c1'), false);
{
  let s = play(fromFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'), 'h1g1', 'a8a7', 'g1h1', 'a7a8');
  check('castling: a rook that went away and came back loses that side only', [has(toFEN(s), 'e1g1'), has(toFEN(s), 'e1c1')], [false, true]);
  s = play(fromFEN('r3k2r/8/8/8/8/8/6b1/R3K2R b KQkq - 0 1'), 'g2h1');
  check('castling: capturing the rook ends the right to castle with it', s.castle.wK, false);
}
check('castling: the rook goes to the right square', toFEN(play(fromFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'), 'e1c1')).split(' ')[0], 'r3k2r/8/8/8/8/8/8/2KR3R');

// ---------- en passant ----------
check('en passant: offered right after the double step', has('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', 'e5d6'), true);
check('en passant: gone if nobody used it at once', (() => { const s = play(fromFEN('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1'), 'e1e2', 'e8e7'); return legal(s).some(m => m.ep); })(), false);
check('en passant: the captured pawn really disappears', toFEN(play(fromFEN('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1'), 'e5d6')).split(' ')[0], '4k3/8/3P4/8/8/8/8/4K3');
check('en passant: not allowed when it exposes the king along the rank', has('8/8/8/KPp4r/8/8/8/6k1 w - c6 0 1', 'b5c6'), false);
check('en passant: a double step sets the square', toFEN(play(fromFEN(START_FEN), 'e2e4')).split(' ')[3], 'e3');
check('en passant: a single step does not', toFEN(play(fromFEN(START_FEN), 'e2e3')).split(' ')[3], '-');

// ---------- promotion ----------
check('promotion: four choices on a push', names('8/P6k/8/8/8/8/8/K7 w - - 0 1').filter(u => u.startsWith('a7')), ['a7a8b', 'a7a8n', 'a7a8q', 'a7a8r']);
check('promotion: four choices on a capture', names('1n5k/P7/8/8/8/8/8/K7 w - - 0 1').filter(u => u.startsWith('a7b8')), ['a7b8b', 'a7b8n', 'a7b8q', 'a7b8r']);
check('promotion: the new piece appears (knight)', toFEN(play(fromFEN('8/P6k/8/8/8/8/8/K7 w - - 0 1'), 'a7a8n')).split(' ')[0], 'N7/7k/8/8/8/8/8/K7');
check('promotion: a knight promotion can give check', inCheck(play(fromFEN('8/P7/1k6/8/8/8/8/K7 w - - 0 1'), 'a7a8n'), 'b'), true);
check('promotion: black promotes on the first rank', names('7k/8/8/8/8/8/p7/7K b - - 0 1').filter(u => u.startsWith('a2')), ['a2a1b', 'a2a1n', 'a2a1q', 'a2a1r']);

// ---------- ways a game ends ----------
const over = (fen, keys) => { const s = fromFEN(fen); return outcome(s, keys || [positionKey(s)]); };
check("end: fool's mate is checkmate", over('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3'), { type: 'mate', winner: 'b' });
check('end: stalemate', over('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'), { type: 'draw', why: 'Stalemate' });
check('end: a normal position is not over', over(START_FEN), null);
check('end: 99 quiet moves is not yet a draw', over('4k3/8/8/8/8/8/4R3/4K3 w - - 99 80'), null);
check('end: 100 quiet moves is a draw', over('4k3/8/8/8/8/8/4R3/4K3 w - - 100 80'), { type: 'draw', why: 'Fifty moves with no progress' });
check('end: checkmate on the 100th quiet move still counts as mate', over('6k1/6Q1/6K1/8/8/8/8/8 b - - 100 80').type, 'mate');
{
  const s0 = fromFEN(START_FEN);
  let s = s0; const keys = [positionKey(s)];
  const go = (...us) => { for (const u of us) { s = play(s, u); keys.push(positionKey(s)); } };
  go('g1f3', 'g8f6', 'f3g1', 'f6g8');
  check('end: twice is not three times', outcome(s, keys), null);
  go('g1f3', 'g8f6', 'f3g1', 'f6g8');
  check('end: the same position three times is a draw', outcome(s, keys), { type: 'draw', why: 'Same position three times' });
}
check('repeat: rights to castle make a different position', positionKey(fromFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')) === positionKey(fromFEN('r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1')), false);
check('repeat: an en passant square nobody can use changes nothing', positionKey(fromFEN('4k3/8/8/8/4P3/8/8/4K3 b - e3 0 1')) === positionKey(fromFEN('4k3/8/8/8/4P3/8/8/4K3 b - - 0 1')), true);
check('repeat: an en passant square someone can use does matter', positionKey(fromFEN('4k3/8/8/8/3pP3/8/8/4K3 b - e3 0 1')) === positionKey(fromFEN('4k3/8/8/8/3pP3/8/8/4K3 b - - 0 1')), false);

// ---------- not enough pieces ----------
const thin = (fen) => insufficient(fromFEN(fen).board);
check('thin: king against king', thin('4k3/8/8/8/8/8/8/4K3 w - - 0 1'), true);
check('thin: king and bishop against king', thin('4k3/8/8/8/8/8/8/3BK3 w - - 0 1'), true);
check('thin: king and knight against king', thin('4k3/8/8/8/8/8/8/3NK3 w - - 0 1'), true);
check('thin: bishops on the same colour', thin('4kb2/8/8/8/8/8/8/2B1K3 w - - 0 1'), true);
check('thin: bishops on different colours can still mate', thin('4k1b1/8/8/8/8/8/8/2B1K3 w - - 0 1'), false);
check('thin: a rook is enough', thin('4k3/8/8/8/8/8/8/3RK3 w - - 0 1'), false);
check('thin: a pawn is enough', thin('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1'), false);

// ---------- written moves ----------
{
  const san = (fen, u) => { const s = fromFEN(fen), ms = legal(s); return sanOf(s, ms.find(m => uci(m) === u), ms); };
  check('san: pawn push', san(START_FEN, 'e2e4'), 'e4');
  check('san: knight', san(START_FEN, 'g1f3'), 'Nf3');
  check('san: pawn capture', san('4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1', 'e4d5'), 'exd5');
  check('san: castling both ways', [san('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'e1g1'), san('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'e1c1')], ['O-O', 'O-O-O']);
  check('san: two rooks, told apart by file', san('4k3/8/8/8/8/8/4K3/R6R w - - 0 1', 'a1d1'), 'Rad1');
  check('san: two rooks, told apart by rank', san('4k3/R7/8/8/8/8/R7/4K3 w - - 0 1', 'a7a4'), 'R7a4');
  check('san: promotion with check', san('8/P7/1k6/8/8/8/8/K7 w - - 0 1', 'a7a8n'), 'a8=N+');
  check('san: mate gets a hash', san('6k1/5ppp/8/8/8/8/8/R3K3 w Q - 0 1', 'a1a8'), 'Ra8#');
  check('san: check gets a plus', san('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', 'a1a8'), 'Ra8+');
  check('san: en passant is written as a capture', san('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', 'e5d6'), 'exd6');
}
check('read san: plain', uci(moveFromSAN(fromFEN(START_FEN), 'Nf3')), 'g1f3');
check('read san: with a check mark and a bang', uci(moveFromSAN(fromFEN('4k3/8/8/8/8/8/8/R3K3 w - - 0 1'), 'Ra8+!')), 'a1a8');
check('read san: zeros for castling', uci(moveFromSAN(fromFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'), '0-0-0')), 'e1c1');
check('read san: promotion without the equals sign', uci(moveFromSAN(fromFEN('8/P6k/8/8/8/8/8/K7 w - - 0 1'), 'a8Q')), 'a7a8q');
check('read san: from-to letters', uci(moveFromSAN(fromFEN(START_FEN), 'e2e4')), 'e2e4');
check('read san: nonsense', moveFromSAN(fromFEN(START_FEN), 'Qh5'), null);

// ---------- saving and opening games ----------
{
  const game = 'e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4 g8f6 e1g1 f8e7 f1e1 b7b5 a4b3 d7d6 c2c3 e8g8';
  let s = fromFEN(START_FEN); const sans = [];
  for (const u of game.split(' ')) { const ms = legal(s), m = ms.find(x => uci(x) === u); sans.push(sanOf(s, m, ms)); s = apply(s, m); }
  const text = toPGN([['Event', 'Test'], ['Result', '*']], sans, '*');
  const back = parsePGN(text);
  check('pgn: write then read gives the same moves', back.moves && back.moves.map(uci).join(' '), game);
  check('pgn: headers survive', back.headers.Event, 'Test');
  check('pgn: lines are not too long', text.split('\n').every(l => l.length <= 80), true);
  const r = parsePGN('[Event "x"]\n\n1.e4 {best by test} e5 2.Nf3 (2.f4 exf4) 2... Nc6 $1 3.Bb5 a6 1/2-1/2');
  check('pgn: comments, side lines and numbers are ignored', r.moves && r.moves.map(uci).join(' '), 'e2e4 e7e5 g1f3 b8c6 f1b5 a7a6');
  check('pgn: the result is found', r.result, '1/2-1/2');
  check('pgn: a wrong move is reported in words', /Nf6/.test(parsePGN('1. e4 e5 2. Nf6').error || ''), true);
  check('pgn: nothing useful pasted', [!!parsePGN('hello').error, !!parsePGN('').error], [true, true]);
  check('pgn: a game from a special position is refused', !!parsePGN('[FEN "4k3/8/8/8/8/8/8/R3K3 w - - 0 1"]\n\n1. Ra8+').error, true);
}

// ---------- the opening book ----------
{
  let bad = 0;
  for (const line of BOOK_LINES) { try { let s = fromFEN(START_FEN); for (const u of line.split(' ')) s = play(s, u); } catch (e) { bad++; console.log('   bad book line: ' + line + ' (' + e.message + ')'); } }
  check('book: every line is a legal game', bad, 0);
  check('book: the computer has a reply to 1.e4', !!bookMove(play(fromFEN(START_FEN), 'e2e4'), ['e2e4']), true);
  check('book: out of the book means no book move', bookMove(play(fromFEN(START_FEN), 'a2a3'), ['a2a3']), null);
}

// ---------- the computer ----------
const mv = (fen, level, ms) => { const m = chooseMoveTimed(fromFEN(fen), level, ms); return sq2name(m.from) + sq2name(m.to); };
check('hard finds back-rank mate', mv('6k1/5ppp/8/8/8/8/8/R3K3 w Q - 0 1', 'hard'), 'a1a8');
check('tricky takes a hanging queen', mv('4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1', 'tricky'), 'd1d5');
check('the levels, easiest first', Object.keys(LEVELS), ['easy', 'medium', 'tricky', 'hard']);
check('every level gives a legal move from a busy position', Object.keys(LEVELS).every(lv => {
  const s = fromFEN('r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQ - 0 9'), m = chooseMoveTimed(s, lv, 150);
  return legal(s).some(x => x.from === m.from && x.to === m.to && x.promo === m.promo);
}), true);
check('hard plays a book move at the start', ['e2e4', 'd2d4', 'c2c4', 'g1f3'].includes(uci(chooseMoveTimed(fromFEN(START_FEN), 'hard', 50, [positionKey(fromFEN(START_FEN))], []))), true);
check('hard finds a queen-and-king mate in one', mv('7k/8/5K2/8/8/8/8/6Q1 w - - 0 1', 'hard', 300), 'g1g7');
{
  const results = ['7k/8/8/8/8/8/R7/1R5K w - - 0 1', '6k1/8/6K1/8/8/8/8/R7 w - - 0 1'].map(fen => {
    const win = mateMoves(fromFEN(fen), 2).map(uci);
    if (!win.length) return 'no mate here: ' + fen;
    return win.includes(mv(fen, 'hard', 800)) ? true : 'missed ' + win.join(',') + ' in ' + fen;
  });
  console.log('     (mate-in-two positions checked: ' + JSON.stringify(results) + ')');
}
check('hard finds a forced mate in two (two rooks)', mateMoves(fromFEN('7k/8/8/8/8/8/R7/1R5K w - - 0 1'), 2).map(uci).includes(mv('7k/8/8/8/8/8/R7/1R5K w - - 0 1', 'hard', 800)), true);
check('a side that is ahead avoids repeating a position', (() => {
  const s = fromFEN('4k3/8/8/8/8/8/R7/4K3 w - - 20 30');
  const again = play(s, 'a2a1');
  const keys = [positionKey(again), positionKey(again), positionKey(s)];
  return uci(chooseMoveTimed(s, 'hard', 200, keys, null)) !== 'a2a1';
})(), true);
check('evaluate: a queen up is good for the side that has it, from both sides', (() => {
  const a = evaluate(fromFEN('4k3/8/8/8/8/8/8/3QK3 w - - 0 1')), b = evaluate(fromFEN('4k3/8/8/8/8/8/8/3QK3 b - - 0 1'));
  return a > 700 && b < -700;
})(), true);
check('evaluate: a free passed pawn beats a blocked one', evaluate(fromFEN('4k3/8/8/4P3/8/8/8/4K3 w - - 0 1')) > evaluate(fromFEN('4k3/4p3/8/4P3/8/8/8/4K3 w - - 0 1')) + 100, true);
check('evaluate: the bishop pair gets a bonus', evaluate(fromFEN('4k3/8/8/8/8/8/8/2B1KB2 w - - 0 1')) > evaluate(fromFEN('4k3/8/8/8/8/8/8/2N1KN2 w - - 0 1')), true);
check('draw offers: the side that is losing badly would decline', quickEval(fromFEN('4k3/8/8/8/8/8/8/3QK2q b - - 0 1')) < -50 || quickEval(fromFEN('4k3/8/8/8/8/8/8/3QK3 b - - 0 1')) < -50, true);

// ---------- puzzles ----------
check('puzzles: there are enough of them', PUZZLES.length >= 20, true);
check('puzzles: each starts with White to move, no check, game not over', PUZZLES.every(p => { const s = fromFEN(p.fen); return s.turn === 'w' && !inCheck(s, 'w') && legal(s).length > 0; }), true);
check('puzzles: the stored answers are exactly the forced mates', PUZZLES.every(p => JSON.stringify(mateMoves(fromFEN(p.fen), p.n).map(uci).sort()) === JSON.stringify(p.sol.slice().sort())), true);
check('puzzles: a mate in 2 never hides a mate in 1', PUZZLES.filter(p => p.n === 2).every(p => mateMoves(fromFEN(p.fen), 1).length === 0), true);
check('puzzles: every position is different', new Set(PUZZLES.map(p => p.fen)).size, PUZZLES.length);
check('puzzles: easy ones come first', PUZZLES.map(p => p.n).join(''), PUZZLES.map(p => p.n).sort().join(''));
check('puzzles: hard finds every mate in one', PUZZLES.filter(p => p.n === 1).every(p => p.sol.includes(mv(p.fen, 'hard', 400))), true);

// ---------- found by the audit ----------
check('medium never slips past a forced mate (30 tries)', (() => {
  const s = fromFEN('6k1/5ppp/8/8/8/8/8/R3K3 w Q - 0 1');
  for (let i = 0; i < 30; i++) if (uci(chooseMoveTimed(s, 'medium', 100)) !== 'a1a8') return false;
  return true;
})(), true);
check('random games: FEN, position key and written moves all read back (150 games)', (() => {
  let seed = 31; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  let problems = 0;
  for (let g = 0; g < 150; g++) {
    let s = fromFEN(START_FEN);
    for (let ply = 0; ply < 120; ply++) {
      const ms = legal(s); if (!ms.length) break;
      if (toFEN(fromFEN(toFEN(s))) !== toFEN(s)) problems++;
      const m = ms[Math.floor(rnd() * ms.length)];
      if (ply % 7 === 0) { const back = moveFromSAN(s, sanOf(s, m, ms)); if (!back || uci(back) !== uci(m)) problems++; }
      if (inCheck(apply(s, m), s.turn)) problems++;
      s = apply(s, m);
    }
  }
  return problems;
})(), 0);
check('more move counts: position 6 and the promotion-capture position', [[1, 2, 3].map(d => perft(fromFEN('r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10'), d)), [1, 2, 3].map(d => perft(fromFEN('n1n5/PPPk4/8/8/8/8/4Kppp/5N1N b - - 0 1'), d))], [[46, 2079, 89890], [24, 496, 9483]]);

// ---------- the "oops" check ----------
{
  const j = (fen, u) => { const s = fromFEN(fen), m = legal(s).find(x => uci(x) === u); return judgeMove(s, m); };
  const q = '4k3/8/8/3p4/8/3Q4/8/4K3 w - - 0 1';
  const hang = j(q, 'd3e4'), safe = j(q, 'd3d5');
  check('oops: putting the queen where a pawn takes it is flagged', !!hang && hang.loss >= 600 && hang.replyCap === 'q', true);
  check('oops: it says which square is in danger', hang && sq2name(hang.replyTo), 'e4');
  check('oops: taking a free pawn safely is not flagged', !!safe && safe.loss < 150, true);
  const allowed = j('3r2k1/8/8/8/8/8/5PPP/R5K1 w - - 0 1', 'a1a7');
  check('oops: a move that allows checkmate is flagged as mate', !!allowed && allowed.replyMates && allowed.loss >= 600, true);
  check('oops: only one legal move means no warning', judgeMove(fromFEN('7k/8/8/8/8/8/5q2/7K w - - 0 1'), { from: 63, to: 62 }), null);
  check('oops: a normal opening move is fine', (() => { const r = j(START_FEN, 'e2e4'); return !!r && r.loss < 100; })(), true);
}
// ---------- the daily puzzle ----------
check('daily: dates read back', [dayNumber('2026-11-09') - dayNumber('2026-11-08'), prevDay('2026-03-01'), prevDay('2027-01-01')], [1, '2026-02-28', '2026-12-31']);
check('daily: a different puzzle each day, and all of them come round', (() => {
  const n = PUZZLES.length, seen = new Set(); let day = '2026-11-08';
  for (let i = 0; i < n; i++) { const a = dailyIndex(day, n), next = keyFromDayHelper(day); if (a === dailyIndex(next, n)) return 'repeat'; seen.add(a); day = next; }
  return seen.size;
})(), PUZZLES.length);
function keyFromDayHelper(k) { const d = new Date((dayNumber(k) + 1) * 86400000); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); }
check('daily: the first solve starts a streak of 1', streakAfter({ last: '', streak: 0, best: 0 }, '2026-11-08'), { last: '2026-11-08', streak: 1, best: 1 });
check('daily: solving on the next day extends it', streakAfter({ last: '2026-11-08', streak: 3, best: 3 }, '2026-11-09'), { last: '2026-11-09', streak: 4, best: 4 });
check('daily: solving twice in a day changes nothing', streakAfter({ last: '2026-11-09', streak: 4, best: 4 }, '2026-11-09'), { last: '2026-11-09', streak: 4, best: 4 });
check('daily: missing a day starts again but keeps the best', streakAfter({ last: '2026-11-05', streak: 6, best: 6 }, '2026-11-09'), { last: '2026-11-09', streak: 1, best: 6 });
check('daily: the shown streak survives until the day after, then drops to 0', [streakNow({ last: '2026-11-08', streak: 3 }, '2026-11-08'), streakNow({ last: '2026-11-08', streak: 3 }, '2026-11-09'), streakNow({ last: '2026-11-08', streak: 3 }, '2026-11-10')], [3, 3, 0]);
check('daily: today is written the same way', /^\d{4}-\d{2}-\d{2}$/.test(dateKey(new Date())), true);

// ---------- online games ----------
{
  const g = (s) => s.split(' ').filter(Boolean);
  check('online: a friend\'s legal move is taken', remoteExtension(g('e2e4'), g('e2e4 e7e5'), 'b'), ['e7e5']);
  check('online: two new moves in one go', remoteExtension(g('e2e4'), g('e2e4 e7e5 g1f3'), 'b'), null);
  check('online: both new moves allowed for a spectator', remoteExtension(g('e2e4'), g('e2e4 e7e5 g1f3'), null), ['e7e5', 'g1f3']);
  check('online: a move for my own colour is refused (I am White, friend is Black)', remoteExtension(g('e2e4 e7e5'), g('e2e4 e7e5 g1f3'), 'b'), null);
  check('online: an illegal move is refused', remoteExtension(g('e2e4'), g('e2e4 e7e3'), 'b'), null);
  check('online: a different game is refused', remoteExtension(g('e2e4 e7e5'), g('d2d4 d7d5 c2c4'), 'w'), null);
  check('online: nothing new, nothing to do', remoteExtension(g('e2e4 e7e5'), g('e2e4 e7e5'), 'b'), null);
  check('online: someone who just joined takes the whole game', remoteExtension([], g('e2e4 e7e5 g1f3'), 'w'), ['e2e4', 'e7e5', 'g1f3']);
  check('online: game codes are 4 safe characters', (() => { for (let i = 0; i < 200; i++) if (!/^[abcdefghjkmnpqrstuvwxyz23456789]{4}$/.test(inviteCode())) return false; return true; })(), true);
  check('online: game codes differ', new Set(Array.from({ length: 50 }, () => inviteCode())).size > 40, true);
}
console.log(failed ? failed + ' check(s) failed' : 'all checks passed');
process.exit(failed ? 1 : 0);
