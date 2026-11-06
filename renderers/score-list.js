/**
 * renderers/score-list.js — the projected scoreboard for the throwing games
 * (ring-target family and 501): one line per player, name then score.
 *
 * Kept deliberately simple. It has to read from the throwing line on a wall, in
 * the small box above the target, and every extra column costs text size. The
 * round-by-round detail stays on the tablet.
 *
 * PURE PAINTER: rows arrive ready to show. Turn and leader are decided by the
 * tablet (axethrowapp/src/lib/cast-view.js).
 *
 * Exposes window.receiverScoreList = { build }.
 */

(function () {
  // Most side-by-side columns. Three would be too wide for the lane. The layout
  // engine (index.js) keeps whichever arrangement scales largest in its box.
  const MAX_COLUMNS = 2;

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v);
    }
    node.append(...children);
    return node;
  }

  function renderRow(row) {
    const cls = [
      'sl__row',
      row.active ? 'sl__row--active' : '',
      row.leader ? 'sl__row--leader' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return el('div', { class: cls }, [
      el('span', { class: 'sl__name', text: row.name }),
      el('span', { class: 'sl__value', text: String(row.value) }),
    ]);
  }

  function renderList(rows, perColumn, banner) {
    const columns = [];
    for (let i = 0; i < rows.length; i += perColumn) {
      columns.push(el('div', { class: 'sl__col' }, rows.slice(i, i + perColumn).map(renderRow)));
    }
    if (!columns.length) columns.push(el('div', { class: 'sl__col' }));

    return el('section', { class: 'rcv sl', 'aria-label': 'Scoreboard' }, [
      ...(banner ? [el('div', { class: 'sl__banner', text: banner })] : []),
      el('div', { class: 'sl__cols' }, columns),
    ]);
  }

  /**
   * @param {{name:string,value:number,active:boolean,leader:boolean}[]} rows
   * @param {string|null} banner  a line above the rows, e.g. "Alice wins!"
   * @returns {{secondary:HTMLElement, secondaryVariants:HTMLElement[]}}
   */
  function build(rows, banner) {
    const count = Math.max(1, rows.length);
    // One candidate per distinct rows-per-column (6 players -> 6, 3).
    const perColumns = [];
    for (let c = 1; c <= MAX_COLUMNS; c++) {
      const per = Math.ceil(count / c);
      if (!perColumns.includes(per)) perColumns.push(per);
    }
    const secondaryVariants = perColumns.map((per) => renderList(rows, per, banner));
    return { secondary: secondaryVariants[0], secondaryVariants };
  }

  window.receiverScoreList = { build };
})();
