/**
 * renderers/dartboard-board.js — receiver display for 501 ("dartboard").
 *
 * PURE PAINTER: no turn/visit logic here. The tablet computes the view model
 * (axethrowapp/src/lib/cast-view.js, kind: 'darts') — remaining per player,
 * leader, active thrower, winner, status line — and pushes it; this just lays it
 * out on the stage.
 *
 * Returns { primary, secondary } for the stage layout engine (index.js):
 *   - primary   = the static dartboard face (targets.js)
 *   - secondary = the count-down scoreboard, plus chips for the darts thrown so
 *                 far this visit. (A dart value like 20 is ambiguous between
 *                 single/double/triple, so it can't be pinned to a wedge — the
 *                 projected board stays static and recent darts show as chips.)
 *
 * View shape:
 *   { kind:'darts', recentThrows:number[],
 *     status:{ done:bool, name:string|null, meta:string|null },
 *     rows:[ { name, remaining, leader:bool, active:bool, winner:bool } ] }
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
    if (!status) return el('div', { class: 'rcv-status', text: '—' });
    if (status.done) {
      return el('div', { class: 'rcv-status rcv-status--done' }, [
        el('span', { class: 'rcv-status__name', text: status.name ?? '—' }),
        el('span', { class: 'rcv-status__meta', text: status.meta ?? 'wins!' }),
      ]);
    }
    return el('div', { class: 'rcv-status' }, [
      el('span', { class: 'rcv-status__name', text: status.name ?? '—' }),
      el('span', { class: 'rcv-status__meta', text: status.meta ?? '' }),
    ]);
  }

  function renderChips(recentThrows) {
    const values = recentThrows ?? [];
    if (!values.length) return null;
    return el(
      'div',
      { class: 'db__chips', 'aria-label': 'Darts this visit' },
      values.map((v) => el('span', { class: 'db__chip', text: String(v) }))
    );
  }

  function renderDartboardBoard(view, game) {
    const rows = (view?.rows ?? []).map((row) => {
      const rowClass = [
        'db__row',
        row.winner ? 'db__row--winner' : row.leader ? 'db__row--leader' : '',
        row.active ? 'db__row--active' : '',
      ]
        .filter(Boolean)
        .join(' ');
      return el('div', { class: rowClass }, [
        el('div', { class: 'db__name' }, [
          row.leader || row.winner ? el('span', { class: 'db__crown', text: '🎯' }) : '',
          el('span', { text: row.name }),
        ]),
        el('div', {
          class: `db__remaining${row.remaining === 0 ? ' db__remaining--out' : ''}`,
          text: String(row.remaining),
        }),
      ]);
    });

    const chips = renderChips(view?.recentThrows);
    const secondary = el('section', { class: 'rcv' }, [
      renderStatus(view?.status),
      el('div', { class: 'db', 'aria-label': 'Scoreboard' }, rows),
      ...(chips ? [chips] : []),
    ]);

    const primary = window.receiverTargets.buildDartboardFace();

    return { primary, secondary };
  }

  window.renderDartboardBoard = renderDartboardBoard;
})();
