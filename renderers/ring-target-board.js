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
 *   - secondary = the bowling-style scoreboard (status line + per-round grid)
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

  function renderStatus(status) {
    if (!status) return el('div', { class: 'rcv-status', text: '—' });
    if (status.done) {
      return el('div', {
        class: 'rcv-status rcv-status--done',
        text: status.meta || 'Game complete',
      });
    }
    return el('div', { class: 'rcv-status' }, [
      el('span', { class: 'rcv-status__name', text: status.name ?? '—' }),
      el('span', { class: 'rcv-status__meta', text: status.meta ?? '' }),
    ]);
  }

  function renderRingTargetBoard(view, game) {
    const rounds = view?.rounds ?? 0;
    const rows = view?.rows ?? [];

    const header = el('div', { class: 'sb__row sb__row--head' }, [
      el('div', { class: 'sb__cell sb__cell--name', text: 'PLAYER' }),
      ...Array.from({ length: rounds }, (_, i) =>
        el('div', { class: 'sb__cell sb__cell--head', text: `R${i + 1}` })
      ),
      el('div', { class: 'sb__cell sb__cell--total', text: 'TOTAL' }),
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

    const board = el('div', { class: 'sb__grid' }, [header, ...playerRows]);
    board.style.setProperty('--sb-rounds', String(rounds));

    const secondary = el('section', { class: 'rcv' }, [
      renderStatus(view?.status),
      el('div', { class: 'sb', 'aria-label': 'Scoreboard' }, [board]),
    ]);

    // The target face is a pure drawing owned by the receiver (targets.js); only
    // the dynamic recent-throw values are pushed. buildRingFace needs the
    // specific ring game ('target' | 'watl' | 'iatf') to pick the right geometry.
    const primary = window.receiverTargets.buildRingFace(game, view?.recentThrows ?? []);

    return { primary, secondary };
  }

  window.renderRingTargetBoard = renderRingTargetBoard;
})();
