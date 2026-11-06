/**
 * renderers/ring-target-board.js — receiver display for the ring-target games
 * (Axe Classic / "target", WATL, IATF — one shared scoreboard).
 *
 * PURE PAINTER: this contains no scoring or turn logic. The tablet computes the
 * whole view model (see axethrowapp/src/lib/cast-view.js, kind: 'ring') and
 * pushes it; this just lays out the rows and status it was handed. The receiver
 * never derives totals, leaders or whose-turn — those arrive pre-computed.
 *
 * Returns { primary, secondary } for the stage layout engine (index.js):
 *   - primary   = the static target face (targets.js), with markers for the
 *                 active thrower's throws so far this round (view.recentThrows)
 *   - secondary = the name-and-total list (score-list.js), plus its
 *                 secondaryVariants for index.js to fit
 *
 * View shape:
 *   { kind:'ring', rounds:number, recentThrows:number[],
 *     status:{ done:bool, name:string|null, meta:string|null },
 *     rows:[ { name, total, leader:bool, active:bool, cells:[...] } ] }
 * `cells` (per-round scores) stay on the tablet and aren't painted here.
 */

(function () {
  function renderRingTargetBoard(view, game) {
    const rows = (view?.rows ?? []).map((row) => ({
      name: row.name,
      value: row.total,
      active: row.active,
      leader: row.leader,
    }));
    const banner = view?.status?.done ? view.status.meta || 'Game complete' : null;

    // The target face is a pure drawing owned by the receiver (targets.js); only
    // the dynamic recent-throw values are pushed. buildRingFace needs the
    // specific ring game ('target' | 'watl' | 'iatf') to pick the right geometry.
    const primary = window.receiverTargets.buildRingFace(game, view?.recentThrows ?? []);

    return { primary, ...window.receiverScoreList.build(rows, banner) };
  }

  window.renderRingTargetBoard = renderRingTargetBoard;
})();
