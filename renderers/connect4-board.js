/**
 * renderers/connect4-board.js — receiver display for Connect 4.
 *
 * PURE PAINTER: no game logic. The tablet computes the view model
 * (axethrowapp/src/lib/cast-view.js, kind: 'grid' with a/b disc marks) and
 * pushes it; this lays out the 7x6 grid and status it was handed. Cell order is
 * row-major (row 0 at the TOP), matching the tablet board.
 *
 * Returns { primary, secondary } for the stage layout engine (index.js):
 *   - primary   = the 7x6 framed grid
 *   - secondary = the status line (whose turn / winner)
 *
 * View shape:
 *   { kind:'grid',
 *     cells:[ { mark:'a'|'b'|null, win:bool } x42 ],
 *     status:{ kind:'turn'|'win'|'draw', mark:'a'|'b'|null, name:string|null } }
 */

(function () {
  const DISC_CLASS = { a: 'c4__cell--a', b: 'c4__cell--b' };

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
      return el('div', { class: 'rcv-status rcv-status--done', text: 'Draw — board full' });
    }
    if (status.kind === 'win') {
      return el('div', { class: 'rcv-status rcv-status--done' }, [
        el('span', { class: 'rcv-status__name', text: status.name ?? '—' }),
        el('span', { class: 'rcv-status__meta', text: 'wins!' }),
      ]);
    }
    const dot = el('span', { class: `c4-dot ${DISC_CLASS[status.mark] ?? ''}` });
    dot.style.cssText =
      'display:inline-block;width:0.8em;height:0.8em;border-radius:50%;vertical-align:middle;';
    return el('div', { class: 'rcv-status' }, [
      dot,
      el('span', { class: 'rcv-status__name', text: `${status.name ?? '—'}'s turn` }),
    ]);
  }

  function renderConnect4Board(view, game) {
    const cells = (view?.cells ?? []).map((c) => {
      const cls = [
        'c4__cell',
        c.mark ? DISC_CLASS[c.mark] : '',
        c.win ? 'c4__cell--win' : '',
      ]
        .filter(Boolean)
        .join(' ');
      return el('div', { class: cls });
    });

    const secondary = el('div', { class: 'rcv-status-wrap' }, [renderStatus(view?.status)]);
    const primary = el('div', { class: 'c4' }, [
      el('div', { class: 'c4__frame' }, [
        el('div', { class: 'c4__grid', 'aria-label': 'Connect 4 board' }, cells),
      ]),
    ]);

    return { primary, secondary };
  }

  window.renderConnect4Board = renderConnect4Board;
})();
