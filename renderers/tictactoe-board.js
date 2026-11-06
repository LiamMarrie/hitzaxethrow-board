/**
 * renderers/tictactoe-board.js — receiver display for Tic-Tac-Toe.
 *
 * PURE PAINTER: no game logic. The tablet computes the view model
 * (axethrowapp/src/lib/cast-view.js, kind: 'grid' with x/o marks) and pushes it;
 * this lays out the 3x3 board and status it was handed.
 *
 * Returns { primary, secondary } for the stage layout engine (index.js):
 *   - primary   = the 3x3 board: one SVG (viewBox 0 0 300 300), so the lines and
 *                 marks keep their weight at any region size and nothing depends
 *                 on the fonts the Chromecast has
 *   - secondary = the status line (whose turn / winner)
 *
 * View shape:
 *   { kind:'grid',
 *     cells:[ { mark:'x'|'o'|null, win:bool } x9 ],
 *     status:{ kind:'turn'|'win'|'draw', mark:'x'|'o'|null, name:string|null } }
 */

(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const CELL = 100;
  const MARK_CLASS = { x: 'ttt__mark--x', o: 'ttt__mark--o' };
  // How far the strike line runs past the centres of the end cells.
  const STRIKE_OVERRUN = 35;

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

  function svg(tag, attrs = {}, children = []) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    node.append(...children);
    return node;
  }

  /** A drawn X or O in its own 100x100 box; `attrs` place it inside the board. */
  function markSvg(mark, attrs = {}) {
    const shape =
      mark === 'x'
        ? [svg('path', { d: 'M18 18 L82 82 M82 18 L18 82' })]
        : [svg('circle', { cx: 50, cy: 50, r: 34 })];
    return svg(
      'svg',
      {
        class: `ttt__mark ${MARK_CLASS[mark]}`,
        viewBox: '0 0 100 100',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': 16,
        'stroke-linecap': 'round',
        ...attrs,
      },
      shape
    );
  }

  const cellCentre = (i) => ({
    x: (i % 3) * CELL + CELL / 2,
    y: Math.floor(i / 3) * CELL + CELL / 2,
  });

  /** The line through the winning cells, or null when nobody has won. */
  function strikeLine(cells) {
    const wins = cells.flatMap((c, i) => (c.win ? [i] : []));
    if (wins.length < 2) return null;
    const a = cellCentre(wins[0]);
    const b = cellCentre(wins[wins.length - 1]);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const ux = ((b.x - a.x) / len) * STRIKE_OVERRUN;
    const uy = ((b.y - a.y) / len) * STRIKE_OVERRUN;
    return svg('line', {
      class: 'ttt__strike',
      x1: a.x - ux,
      y1: a.y - uy,
      x2: b.x + ux,
      y2: b.y + uy,
    });
  }

  function renderBoard(cells) {
    const lines = [CELL, CELL * 2].flatMap((p) => [
      svg('line', { class: 'ttt__line', x1: p, y1: 4, x2: p, y2: 296 }),
      svg('line', { class: 'ttt__line', x1: 4, y1: p, x2: 296, y2: p }),
    ]);
    const marks = cells.flatMap((c, i) =>
      c.mark
        ? [
            markSvg(c.mark, {
              x: (i % 3) * CELL,
              y: Math.floor(i / 3) * CELL,
              width: CELL,
              height: CELL,
            }),
          ]
        : []
    );
    const strike = strikeLine(cells);
    return svg(
      'svg',
      {
        class: 'ttt__board',
        viewBox: '0 0 300 300',
        role: 'group',
        'aria-label': 'Tic-Tac-Toe board',
      },
      [...lines, ...marks, ...(strike ? [strike] : [])]
    );
  }

  function renderStatus(status) {
    if (!status) return el('div', { class: 'rcv-status', text: '—' });
    if (status.kind === 'draw') {
      return el('div', { class: 'rcv-status rcv-status--done', text: "Draw — cat's game" });
    }
    if (status.kind === 'win') {
      return el('div', { class: 'rcv-status rcv-status--done' }, [
        el('span', {
          class: `rcv-status__name ${MARK_CLASS[status.mark] ?? ''}`,
          text: status.name ?? '—',
        }),
        el('span', { class: 'rcv-status__meta', text: 'wins!' }),
      ]);
    }
    return el('div', { class: 'rcv-status' }, [
      ...(MARK_CLASS[status.mark] ? [markSvg(status.mark)] : []),
      el('span', { class: 'rcv-status__name', text: `${status.name ?? '—'}'s turn` }),
    ]);
  }

  function renderTicTacToeBoard(view, game) {
    const secondary = el('div', { class: 'rcv-status-wrap' }, [renderStatus(view?.status)]);
    const primary = el('div', { class: 'ttt' }, [renderBoard(view?.cells ?? [])]);

    return { primary, secondary };
  }

  window.renderTicTacToeBoard = renderTicTacToeBoard;
})();
