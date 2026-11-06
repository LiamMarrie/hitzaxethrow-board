/**
 * renderers/dartboard-board.js — receiver display for 501 ("dartboard").
 *
 * PURE PAINTER: no turn/visit logic here. The tablet computes the view model
 * (axethrowapp/src/lib/cast-view.js, kind: 'darts') — remaining per player,
 * leader, active thrower, winner, status line — and pushes it; this just lays it
 * out on the stage.
 *
 * Returns { primary, secondary, secondaryVariants } for the stage layout engine (index.js):
 *   - primary   = the static dartboard face (targets.js)
 *   - secondary = the name-and-remaining list (score-list.js), plus its
 *                 secondaryVariants for index.js to fit. Darts this visit stay
 *                 on the tablet.
 *
 * View shape:
 *   { kind:'darts', recentThrows:number[],
 *     status:{ done:bool, name:string|null, meta:string|null },
 *     rows:[ { name, remaining, leader:bool, active:bool, winner:bool } ] }
 */

(function () {
  function renderDartboardBoard(view, game) {
    const rows = (view?.rows ?? []).map((row) => ({
      name: row.name,
      value: row.remaining,
      active: row.active,
      leader: row.leader,
    }));
    const status = view?.status;
    const banner = status?.done ? `${status.name} ${status.meta}` : null;

    const primary = window.receiverTargets.buildDartboardFace();

    return { primary, ...window.receiverScoreList.build(rows, banner) };
  }

  window.renderDartboardBoard = renderDartboardBoard;
})();
