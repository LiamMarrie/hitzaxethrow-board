/**
 * renderers/index.js — generic receiver router.
 *
 * Mirrors the shape of the tablet's src/games/index.js: one key per game type,
 * each mapping to a render(state, container) function. receiver.html hands every
 * incoming Cast message here; this picks the renderer for the message's `game`
 * key and calls it, or logs and no-ops for an unknown type so an unexpected
 * payload never throws on the projector.
 *
 * This is a PORT, not a shared import: the receiver page is an isolated
 * environment (GitHub Pages, Chromecast runtime) with no access to the tablet's
 * modules, so each renderer duplicates just the DISPLAY logic from the matching
 * src/ui/*-board.js — with every input-only part stripped (tap handlers,
 * hit-feedback, MISS/Undo buttons, localStorage). The receiver only ever shows
 * state; it never captures input.
 */

// One key per game type, matching src/games/index.js on the tablet. Ported
// end-to-end one at a time (see the Build Guide porting order) — 'target' first.
const RENDERERS = {
  target: renderRingTargetBoard,
  // watl:      renderRingTargetBoard,   // same board family — add when ported + tested
  // iatf:      renderRingTargetBoard,
  // dartboard: renderDartboard,
  // tictactoe: renderTicTacToe,
  // connect4:  renderConnect4,
  // pairs:     renderPairs,
};

window.renderers = {
  /**
   * @param {string} game       game key from the Cast payload
   * @param {object} state      the game's serialized state
   * @param {HTMLElement} container  mount point (#board-root)
   */
  render(game, state, container) {
    const renderFn = RENDERERS[game];
    if (!renderFn) {
      console.warn('No renderer registered for game type:', game);
      return;
    }
    renderFn(state, container);
  },
};
