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
 *   - secondary = the bowling-style scoreboard (per-round grid), plus
 *                 secondaryVariants: the same board split into 1..3 side-by-side
 *                 panels, for index.js to pick whichever fits its box best
 *
 * View shape:
 *   { kind:'ring', rounds:number, recentThrows:number[],
 *     status:{ done:bool, name:string|null, meta:string|null },
 *     rows:[ { name, total, leader:bool, active:bool,
 *              cells:[ { played:bool, score:number } ] } ] }
 */

(function () {
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
      const isNode = child && typeof child === 'object' && child.nodeType;
      node.append(isNode ? child : node.ownerDocument.createTextNode(String(child)));
    }
    return node;
  }

  // Most side-by-side panels the scoreboard will split players into. The layout
  // engine (index.js) measures each arrangement against the calibrated box and
  // keeps whichever scales largest, so a wide strip gets 3 short panels and a
  // narrow box keeps 1 tall one.
  const MAX_PANELS = 3;

  // One mini grid: a header (blank | 1..n | T) then the given player rows. Each
  // panel carries its own header so it reads on its own.
  function renderPanel(rows, rounds) {
    const header = el('div', { class: 'sb__row sb__row--head' }, [
      el('div', { class: 'sb__cell sb__cell--name sb__cell--head' }),
      ...Array.from({ length: rounds }, (_, i) =>
        el('div', { class: 'sb__cell sb__cell--head', text: String(i + 1) })
      ),
      el('div', { class: 'sb__cell sb__cell--total sb__cell--head', text: 'T' }),
    ]);

    const playerRows = rows.map((row) => {
      const cells = (row.cells ?? []).map((c) =>
        el(
          'div',
          { class: `sb__cell sb__cell--score${c.played ? '' : ' sb__cell--empty'}` },
          [c.played ? String(c.score) : '/']
        )
      );
      const rowClass = [
        'sb__row',
        row.leader ? 'sb__row--leader' : '',
        row.active ? 'sb__row--active' : '',
      ]
        .filter(Boolean)
        .join(' ');
      return el('div', { class: rowClass }, [
        el('div', { class: 'sb__cell sb__cell--name' }, [
          row.leader ? el('span', { class: 'sb__crown', text: '🪓' }) : '',
          el('span', { class: 'sb__playername', text: row.name }),
        ]),
        ...cells,
        el('div', { class: 'sb__cell sb__cell--total', text: String(row.total) }),
      ]);
    });

    const grid = el('div', { class: 'sb__grid' }, [header, ...playerRows]);
    grid.style.setProperty('--sb-rounds', String(rounds));
    return grid;
  }

  // The whole scoreboard with players split evenly across panels of `perPanel`
  // rows. There's no separate whose-turn line (the active row is filled
  // instead, which saves a full line of height); only "Game complete" shows.
  function renderScoreboard(view, perPanel) {
    const rounds = view?.rounds ?? 0;
    const rows = view?.rows ?? [];
    const panels = [];
    for (let i = 0; i < rows.length; i += perPanel) {
      panels.push(renderPanel(rows.slice(i, i + perPanel), rounds));
    }
    if (!panels.length) panels.push(renderPanel([], rounds));

    const done = view?.status?.done;
    return el('section', { class: 'rcv' }, [
      done
        ? el('div', {
            class: 'rcv-status rcv-status--done sb__done',
            text: view.status.meta || 'Game complete',
          })
        : '',
      el('div', { class: 'sb', 'aria-label': 'Scoreboard' }, panels),
    ]);
  }

  function renderRingTargetBoard(view, game) {
    const count = Math.max(1, (view?.rows ?? []).length);

    // One candidate per distinct rows-per-panel (e.g. 6 players -> 6, 3, 2).
    const perPanels = [];
    for (let p = 1; p <= MAX_PANELS; p++) {
      const per = Math.ceil(count / p);
      if (!perPanels.includes(per)) perPanels.push(per);
    }
    const secondaryVariants = perPanels.map((per) => renderScoreboard(view, per));
    const secondary = secondaryVariants[0];

    // The target face is a pure drawing owned by the receiver (targets.js); only
    // the dynamic recent-throw values are pushed. buildRingFace needs the
    // specific ring game ('target' | 'watl' | 'iatf') to pick the right geometry.
    const primary = window.receiverTargets.buildRingFace(game, view?.recentThrows ?? []);

    return { primary, secondary, secondaryVariants };
  }

  window.renderRingTargetBoard = renderRingTargetBoard;
})();
