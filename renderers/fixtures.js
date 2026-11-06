/**
 * renderers/fixtures.js — sample view models for preview.html.
 *
 * These are hand-built payloads in the EXACT shape the tablet pushes over Cast
 * ({game, view}; layout is optional and omitted here so the preview exercises
 * the receiver's default per-game layout), one or more per game covering early /
 * mid / win states. The
 * view model is what axethrowapp/src/lib/cast-view.js produces; the preview page
 * feeds these through the real renderers so you can verify every board's look on
 * a desktop, with no Chromecast and no CAF SDK.
 *
 * Not loaded by receiver.html — preview-only.
 */

(function () {
  // Ring scoreboard cell helpers (one cell per round).
  const played = (score) => ({ played: true, score });
  const empty = () => ({ played: false, score: 0 });
  // Pad a row's cells out to `rounds` with empty cells.
  function ringCells(scores, rounds) {
    const cells = scores.map(played);
    while (cells.length < rounds) cells.push(empty());
    return cells;
  }

  // ---- ring-target family (target / watl / iatf): scoreboard grid ----------
  const targetMid = {
    kind: 'ring',
    rounds: 5,
    // Active thrower's throws so far this round — marked on the target face.
    recentThrows: [6, 4],
    status: { done: false, name: 'Alice', meta: 'Round 2 · Throw 3 of 5' },
    rows: [
      { name: 'Alice', total: 28, leader: true, active: true, cells: ringCells([20, 8], 5) },
      { name: 'Bob', total: 10, leader: false, active: false, cells: ringCells([10], 5) },
    ],
  };

  const watlMid = {
    kind: 'ring',
    rounds: 5,
    // Include a killshot (8) and a bullseye (6) to exercise the dot markers.
    recentThrows: [8, 6],
    status: { done: false, name: 'Ava', meta: 'Round 2 · Throw 1 of 5' },
    rows: [
      { name: 'Ava', total: 31, leader: false, active: true, cells: ringCells([31], 5) },
      { name: 'Ben', total: 15, leader: false, active: false, cells: ringCells([15], 5) },
      { name: 'Cy', total: 34, leader: true, active: false, cells: ringCells([34], 5) },
    ],
  };

  // Full lane: 6 players with max-length (12-char) names, in the default strip
  // and in a small reduced box like staff calibrate on real boards.
  const sixNames = ['Christopher', 'Maximilian12', 'Alexandra', 'Bo', 'Jonathan', 'Sam'];
  const sixMid = {
    kind: 'ring',
    rounds: 5,
    recentThrows: [4],
    status: { done: false, name: 'Bo', meta: 'Round 3 · Throw 2 of 5' },
    rows: sixNames.map((name, i) => ({
      name,
      total: [44, 51, 38, 30, 47, 29][i],
      leader: i === 1,
      active: i === 3,
      cells: ringCells(i < 3 ? [20, 18 + i, 6] : [15, 11 + i], 5),
    })),
  };
  const sixDefault = {
    ...sixMid,
    rows: sixMid.rows.map((row, i) => ({ ...row, name: `Player ${i + 1}` })),
  };
  const dartSix = {
    kind: 'darts',
    recentThrows: [],
    status: { done: false, name: 'Bo', meta: '301 remaining · Dart 1 of 3' },
    rows: sixNames.map((name, i) => ({
      name,
      remaining: [421, 180, 455, 301, 212, 388][i],
      leader: i === 1,
      active: i === 3,
      winner: false,
    })),
  };
  const smallBox = {
    primary: { x: 0.22, y: 0.2, w: 0.56, h: 0.76 },
    secondary: { x: 0.3, y: 0.02, w: 0.4, h: 0.18 },
    rotation: 0,
  };

  const iatfComplete = {
    kind: 'ring',
    rounds: 5,
    status: { done: true, name: null, meta: 'Game complete' },
    rows: [
      {
        name: 'Alice',
        total: 80,
        leader: false,
        active: false,
        cells: [played(16), played(16), played(16), played(16), played(16)],
      },
      {
        name: 'Bob',
        total: 95,
        leader: true,
        active: false,
        cells: [played(19), played(19), played(19), played(19), played(19)],
      },
    ],
  };

  // ---- dartboard (501): count-down scoreboard ------------------------------
  const dartMid = {
    kind: 'darts',
    // Darts thrown so far this visit — shown as chips under the scoreboard.
    recentThrows: [20, 20],
    status: { done: false, name: 'Alice', meta: '461 remaining · Dart 3 of 3' },
    rows: [
      { name: 'Alice', remaining: 461, leader: true, active: true, winner: false },
      { name: 'Bob', remaining: 501, leader: false, active: false, winner: false },
    ],
  };

  const dartWin = {
    kind: 'darts',
    status: { done: true, name: 'Alice', meta: 'wins!' },
    rows: [
      { name: 'Alice', remaining: 0, leader: true, active: false, winner: true },
      { name: 'Bob', remaining: 84, leader: false, active: false, winner: false },
    ],
  };

  // ---- grid games (tic-tac-toe / connect 4) --------------------------------
  // Build N cells from { idx: mark }; others blank, winning line flagged.
  function gridCells(count, marks, line = []) {
    const win = new Set(line);
    return Array.from({ length: count }, (_, i) => ({
      mark: marks[i] ?? null,
      win: win.has(i),
    }));
  }

  const tttMid = {
    kind: 'grid',
    cells: gridCells(9, { 0: 'x', 2: 'o', 4: 'x', 8: 'o' }),
    status: { kind: 'turn', mark: 'x', name: 'Red' },
  };
  const tttWin = {
    kind: 'grid',
    cells: gridCells(9, { 0: 'x', 1: 'x', 2: 'x', 3: 'o', 4: 'o' }, [0, 1, 2]),
    status: { kind: 'win', mark: 'x', name: 'Red' },
  };

  const c4Mid = {
    kind: 'grid',
    cells: gridCells(42, { 31: 'b', 37: 'b', 38: 'a', 39: 'a' }),
    status: { kind: 'turn', mark: 'a', name: 'Orange' },
  };
  const c4Win = {
    kind: 'grid',
    cells: gridCells(
      42,
      { 36: 'a', 37: 'a', 38: 'a', 39: 'a', 29: 'b', 30: 'b', 31: 'b' },
      [36, 37, 38, 39]
    ),
    status: { kind: 'win', mark: 'a', name: 'Orange' },
  };

  // ---- pairs ---------------------------------------------------------------
  const DOWN = { faceUp: false, matched: false, leftover: false, joker: false, rank: '', suit: '', red: false };
  const face = (rank, suit, red, matched = false) => ({
    faceUp: true, matched, leftover: false, joker: false, rank, suit, red,
  });
  const D = '\u2666', C = '\u2663', H = '\u2665', S = '\u2660';

  const pairsMid = {
    kind: 'pairs',
    status: { matchedPairs: 1, total: 4, won: false },
    cards: [
      face('J', D, true, true),
      { ...DOWN },
      face('Q', H, true),
      { ...DOWN },
      face('J', D, true, true),
      { ...DOWN },
      { ...DOWN },
      { ...DOWN },
      { ...DOWN },
    ],
  };
  const pairsWin = {
    kind: 'pairs',
    status: { matchedPairs: 4, total: 4, won: true },
    cards: [
      face('J', D, true, true),
      face('K', C, false, true),
      face('Q', H, true, true),
      face('A', S, false, true),
      face('J', D, true, true),
      face('K', C, false, true),
      face('Q', H, true, true),
      face('A', S, false, true),
      { faceUp: false, matched: false, leftover: true, joker: true, rank: '', suit: '', red: false },
    ],
  };

  const tttEmpty = {
    kind: 'grid',
    cells: Array.from({ length: 9 }, () => ({ mark: null, win: false })),
    status: { kind: 'turn', mark: 'x', name: 'Player 1' },
  };
  const tttLongName = { ...tttEmpty, status: { kind: 'turn', mark: 'o', name: 'Maximilian12' } };

  // ---- calibration demos ---------------------------------------------------
  // These pass an explicit `layout` (the exact shape the calibration editor
  // pushes: {primary, secondary, rotation}) so the preview shows what a few
  // button taps on the tablet do to the projected board — move, resize, rotate.
  // Compare "Axe Classic — mid" (default layout) against these to SEE the
  // receiver react to calibration, pixel-identical to the real projector.
  const calibratedShift = {
    // Board shrunk and pushed down-right; scoreboard stretched across the top.
    primary: { x: 0.4, y: 0.32, w: 0.5, h: 0.5 },
    secondary: { x: 0.05, y: 0.03, w: 0.9, h: 0.12 },
    rotation: 0,
  };
  const calibratedRotated = {
    // Same board, rotated a quarter turn — for a board mounted sideways.
    primary: { x: 0.25, y: 0.2, w: 0.5, h: 0.72 },
    secondary: { x: 0.1, y: 0.03, w: 0.8, h: 0.13 },
    rotation: 90,
  };

  // Ordered list the preview renders as tabs.
  window.FIXTURES = [
    { label: 'Idle (waiting)', game: null, view: null },
    { label: 'Axe Classic — mid', game: 'target', view: targetMid },
    { label: 'Axe Classic — CAL: shifted/scaled', game: 'target', view: targetMid, layout: calibratedShift },
    { label: 'Axe Classic — CAL: rotated 90°', game: 'target', view: targetMid, layout: calibratedRotated },
    { label: 'WATL — mid (3P)', game: 'watl', view: watlMid },
    { label: 'Axe Classic — 6P', game: 'target', view: sixMid },
    { label: 'Axe Classic — 6P default names', game: 'target', view: sixDefault },
    { label: 'Axe Classic — 6P small box', game: 'target', view: sixMid, layout: smallBox },
    { label: 'IATF — complete', game: 'iatf', view: iatfComplete },
    { label: '501 — mid', game: 'dartboard', view: dartMid },
    { label: '501 — 6P long names', game: 'dartboard', view: dartSix },
    { label: '501 — win', game: 'dartboard', view: dartWin },
    { label: 'Tic-Tac-Toe — empty', game: 'tictactoe', view: tttEmpty },
    { label: 'Tic-Tac-Toe — long name', game: 'tictactoe', view: tttLongName },
    { label: 'Tic-Tac-Toe — mid', game: 'tictactoe', view: tttMid },
    { label: 'Tic-Tac-Toe — win', game: 'tictactoe', view: tttWin },
    { label: 'Connect 4 — mid', game: 'connect4', view: c4Mid },
    { label: 'Connect 4 — win', game: 'connect4', view: c4Win },
    { label: 'Pairs — mid', game: 'pairs', view: pairsMid },
    { label: 'Pairs — win', game: 'pairs', view: pairsWin },
  ];
})();
