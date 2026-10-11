/**
 * renderers/pairs-board.js — receiver display for Pairs (memory match).
 *
 * PURE PAINTER: no game logic. The tablet computes the view model
 * (axethrowapp/src/lib/cast-view.js, kind: 'pairs') — which cards are face-up,
 * matched, or the leftover, plus the pairs-matched count — and pushes it; this
 * just lays out the 3x3 grid it was handed.
 *
 * Returns { primary, secondary } for the stage layout engine (index.js):
 *   - primary   = the 3x3 card grid
 *   - secondary = the status line (pairs matched / won)
 *
 * View shape:
 *   { kind:'pairs',
 *     status:{ matchedPairs:number, total:number, won:bool },
 *     cards:[ { faceUp:bool, matched:bool, leftover:bool, joker:bool,
 *               rank:string, suit:string, red:bool } x9 ] }
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

  function renderStatus(status) {
    if (status?.won) {
      return el('div', { class: 'rcv-status rcv-status--done', text: 'All pairs matched!' });
    }
    return el('div', { class: 'rcv-status' }, [
      el('span', {
        class: 'rcv-status__name',
        text: `Pairs ${status?.matchedPairs ?? 0} / ${status?.total ?? 4}`,
      }),
    ]);
  }

  function cardFace(card) {
    if (card.joker) {
      return el('div', { class: 'pairs__joker' }, [
        el('div', { class: 'pairs__joker-star', text: '★' }),
        el('div', { text: 'JOKER' }),
      ]);
    }
    const colour = card.red ? 'pairs__card--red' : 'pairs__card--black';
    return el('div', { class: colour }, [
      el('div', { class: 'pairs__rank', text: card.rank ?? '?' }),
      el('div', { class: 'pairs__suit', text: card.suit ?? '' }),
    ]);
  }

  function renderPairsBoard(view, game) {
    const cards = (view?.cards ?? []).map((card) => {
      if (!card.faceUp && !card.leftover) {
        return el('div', { class: 'pairs__card pairs__card--down', text: '?' });
      }
      const cls = [
        'pairs__card',
        'pairs__card--up',
        card.matched ? 'pairs__card--matched' : '',
        card.leftover ? 'pairs__card--leftover' : '',
      ]
        .filter(Boolean)
        .join(' ');
      return el('div', { class: cls }, [cardFace(card)]);
    });

    const secondary = el('div', { class: 'rcv-status-wrap' }, [renderStatus(view?.status)]);
    const primary = el('div', { class: 'pairs' }, [
      el('div', { class: 'pairs__grid', 'aria-label': 'Pairs board' }, cards),
    ]);

    return { primary, secondary };
  }

  window.renderPairsBoard = renderPairsBoard;
})();
