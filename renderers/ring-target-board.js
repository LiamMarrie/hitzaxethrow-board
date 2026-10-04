/**
 * renderers/ring-target-board.js — receiver display for the ring-target games
 * (Axe Classic / "target", and later WATL, IATF — same state shape).
 *
 * This is the DISPLAY-ONLY port of the tablet's live score view. On the tablet
 * the score grid is src/ui/scoreboard.js and the tappable target is
 * src/ui/ring-target-board.js; the projector only needs to SHOW the score, so
 * this ports the scoreboard grid plus a "whose throw is up" status line, and
 * drops everything interactive (the SVG target, tap handlers, hit-feedback,
 * MISS/Undo, row-tap-to-pick-player).
 *
 * The pure scoring helpers below are copied from the tablet's
 * src/games/ring-target-scoring.js — duplicated on purpose, since this page is
 * an isolated environment that can't import the tablet's modules. Keep them in
 * sync with that file if the scoring model ever changes.
 */

const ROUNDS = 5;
const THROWS_PER_ROUND = 5;

/** Sum of a round's thrown values (ignores unthrown null slots). */
function roundScore(round) {
  if (!Array.isArray(round)) return 0;
  return round.reduce((sum, t) => sum + (typeof t === 'number' ? t : 0), 0);
}

/** True once any throw is entered — distinguishes an all-miss 0 from unplayed. */
function roundPlayed(round) {
  return Array.isArray(round) && round.some((t) => typeof t === 'number');
}

/** Running total across all of a player's rounds. */
function totalScore(rounds) {
  if (!Array.isArray(rounds)) return 0;
  return rounds.reduce((sum, r) => sum + roundScore(r), 0);
}

function isEmptySlot(slot) {
  return slot === null || slot === undefined;
}

/** Where the next throw goes, or null when the game is complete. */
function activePosition(state) {
  const players = state?.players ?? [];
  const scores = state?.scores ?? {};
  const rounds = state?.rounds ?? ROUNDS;
  const throwsPerRound = state?.throwsPerRound ?? THROWS_PER_ROUND;
  if (players.length === 0) return null;

  for (let round = 0; round < rounds; round++) {
    for (let playerIdx = 0; playerIdx < players.length; playerIdx++) {
      const player = players[playerIdx];
      const grid = scores[player.id] ?? [];
      const roundThrows = grid[round] ?? [];
      for (let throwIdx = 0; throwIdx < throwsPerRound; throwIdx++) {
        if (isEmptySlot(roundThrows[throwIdx])) {
          return { playerId: player.id, playerIdx, round, throwIdx };
        }
      }
    }
  }
  return null;
}

/** Whether every throw of every player has been entered. */
function isComplete(state) {
  const players = state?.players ?? [];
  if (players.length === 0) return false;
  return activePosition(state) === null;
}

// --- tiny DOM helper (mirrors src/ui/render.js `el`, display subset) ---------
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (v !== false && v !== null && v !== undefined) {
      node.setAttribute(k, v === true ? '' : String(v));
    }
  }
  for (const child of children) {
    // Use the node's own document rather than a bare `Node`/`document` global so
    // this works under any realm (Chromecast browser, test harness alike).
    const isNode = child && typeof child === 'object' && child.nodeType;
    node.append(isNode ? child : node.ownerDocument.createTextNode(String(child)));
  }
  return node;
}

/**
 * Status line: whose throw is up and which round/throw, or "Game complete".
 * @param {object} state
 * @returns {HTMLElement}
 */
function renderStatus(state) {
  if (isComplete(state)) {
    return el('div', { class: 'rcv-status rcv-status--done', text: 'Game complete' });
  }
  const pos = activePosition(state);
  if (!pos) return el('div', { class: 'rcv-status', text: '—' });
  const player = state.players[pos.playerIdx];
  return el('div', { class: 'rcv-status' }, [
    el('span', { class: 'rcv-status__name', text: player?.name ?? '—' }),
    el('span', {
      class: 'rcv-status__meta',
      text: `Round ${pos.round + 1} · Throw ${pos.throwIdx + 1} of ${
        state.throwsPerRound ?? THROWS_PER_ROUND
      }`,
    }),
  ]);
}

/**
 * Render the live scoreboard: one row per player (name, a cell per round, a
 * running total), with a crown on the leader and a highlight on the player
 * who's up. Pure projection — no interactivity.
 * @param {object} state  ring-target game state from the Cast payload
 * @param {HTMLElement} container  #board-root
 */
function renderRingTargetBoard(state, container) {
  const { players = [], rounds = 0, scores = {} } = state ?? {};
  const activeId = activePosition(state)?.playerId ?? null;

  const totals = players.map((p) => totalScore(scores[p.id]));
  const anyPlayed = players.some((p) =>
    (scores[p.id] ?? []).some((r) => roundPlayed(r))
  );
  const topScore = anyPlayed ? Math.max(...totals) : -1;

  // Header: PLAYER | R1..Rn | TOTAL
  const roundHeaders = Array.from({ length: rounds }, (_, i) =>
    el('div', { class: 'sb__cell sb__cell--head', text: `R${i + 1}` })
  );
  const header = el('div', { class: 'sb__row sb__row--head' }, [
    el('div', { class: 'sb__cell sb__cell--name', text: 'PLAYER' }),
    ...roundHeaders,
    el('div', { class: 'sb__cell sb__cell--total', text: 'TOTAL' }),
  ]);

  const playerRows = players.map((p, idx) => {
    const grid = scores[p.id] ?? [];
    const isLeader = anyPlayed && totals[idx] === topScore;
    const isActive = p.id === activeId;

    const cells = Array.from({ length: rounds }, (_, r) => {
      const round = grid[r];
      const played = roundPlayed(round);
      return el(
        'div',
        { class: `sb__cell sb__cell--score${played ? '' : ' sb__cell--empty'}` },
        [played ? String(roundScore(round)) : '/']
      );
    });

    const rowClass = [
      'sb__row',
      isLeader ? 'sb__row--leader' : '',
      isActive ? 'sb__row--active' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return el('div', { class: rowClass }, [
      el('div', { class: 'sb__cell sb__cell--name' }, [
        isLeader ? el('span', { class: 'sb__crown', text: '🪓' }) : '',
        el('span', { class: 'sb__playername', text: p.name }),
      ]),
      ...cells,
      el('div', { class: 'sb__cell sb__cell--total', text: String(totals[idx]) }),
    ]);
  });

  const board = el('div', { class: 'sb__grid' }, [header, ...playerRows]);
  board.style.setProperty('--sb-rounds', String(rounds));

  const screen = el('section', { class: 'rcv' }, [
    renderStatus(state),
    el('div', { class: 'sb', 'aria-label': 'Scoreboard' }, [board]),
  ]);

  container.replaceChildren(screen);
}
