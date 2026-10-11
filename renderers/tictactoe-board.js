/**
 * renderers/tictactoe-board.js — receiver display for Tic-Tac-Toe.
 *
 * PURE PAINTER: no game logic. The tablet computes the view model
 * (axethrowapp/src/lib/cast-view.js, kind: 'grid' with x/o marks) and pushes it;
 * this lays out the 3x3 board and status it was handed.
 *
 * Returns { primary, secondary } for the stage layout engine (index.js):
 *   - primary   = the 3x3 board
 *   - secondary = the status line (whose turn / winner)
 *
 * View shape:
 *   { kind:'grid',
 *     cells:[ { mark:'x'|'o'|null, win:bool } x9 ],
 *     status:{ kind:'turn'|'win'|'draw', mark:'x'|'o'|null, name:string|null } }
 */

(function () {
  const GLYPH = { x: '✕', o: '◯' };
  const MARK_CLASS = { x: 'ttt__cell--x', o: 'ttt__cell--o' };

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
      el('span', {
        class: `rcv-status__name ${MARK_CLASS[status.mark] ?? ''}`,
        text: GLYPH[status.mark] ?? '',
      }),
      el('span', { class: 'rcv-status__meta', text: `${status.name ?? '—'}'s turn` }),
    ]);
  }

  function renderTicTacToeBoard(view, game) {
    const cells = (view?.cells ?? []).map((c) => {
      const cls = [
        'ttt__cell',
        c.mark ? MARK_CLASS[c.mark] : '',
        c.win ? 'ttt__cell--win' : '',
      ]
        .filter(Boolean)
        .join(' ');
      return el('div', { class: cls, text: c.mark ? GLYPH[c.mark] : '' });
    });

    const secondary = el('div', { class: 'rcv-status-wrap' }, [renderStatus(view?.status)]);
    const primary = el('div', { class: 'ttt' }, [
      el('div', { class: 'ttt__grid', 'aria-label': 'Tic-Tac-Toe board' }, cells),
    ]);

    return { primary, secondary };
  }

  window.renderTicTacToeBoard = renderTicTacToeBoard;
})();
