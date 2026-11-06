/**
 * renderers/targets.js — static target faces for the receiver.
 *
 * PURE DRAWING: this draws the axe-throwing target faces (Axe Classic / WATL /
 * IATF rings + dots) and the 501 dartboard as display-only SVG — the same
 * geometry the tablet's src/ui/*-board.js uses (colours are the projector palette
 * in receiver.css), with every tap handler, MISS/Undo button and hit-feedback
 * stripped. The receiver never scores or runs logic; it
 * only paints what the tablet tells it. This is what gets projected onto the
 * physical wooden board so throwers aim at it.
 *
 * The geometry (ring radii, dot positions, wedge order) is pure presentation, so
 * it lives here rather than being pushed over Cast. Only DYNAMIC data — which
 * recent throws to mark — is passed in from the view model.
 *
 * Exposes window.receiverTargets = { buildRingFace, buildDartboardFace }.
 */

(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const CX = 500;
  const CY = 500;

  function svg(tag, attrs = {}, children = []) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') node.textContent = v;
      else if (v !== false && v !== null && v !== undefined) {
        node.setAttribute(k, v === true ? '' : String(v));
      }
    }
    for (const child of children) {
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  // ---- ring-target geometry, ported verbatim from the tablet specs ----------
  const RING_SPECS = {
    target: {
      ariaLabel: 'Axe Classic target',
      lineWidth: 7,
      discs: [
        { r: 430, points: 1 },
        { r: 362, points: 2 },
        { r: 294, points: 3 },
        { r: 226, points: 4 },
        { r: 158, points: 5 },
        { r: 90, points: 6 },
      ],
      spots: [],
    },
    watl: {
      ariaLabel: 'WATL target',
      lineWidth: 7,
      discs: [
        { r: 390, points: 1 },
        { r: 324, points: 2 },
        { r: 258, points: 3 },
        { r: 192, points: 4 },
        { r: 126, points: 5 },
        { r: 66, points: 6 },
      ],
      spots: [
        { cx: 432, cy: 432, r: 15, points: 6, kind: 'cluster' },
        { cx: 568, cy: 432, r: 15, points: 6, kind: 'cluster' },
        { cx: 432, cy: 568, r: 15, points: 6, kind: 'cluster' },
        { cx: 568, cy: 568, r: 15, points: 6, kind: 'cluster' },
        { cx: 221, cy: 140, r: 30, points: 8, kind: 'killshot' },
        { cx: 779, cy: 140, r: 30, points: 8, kind: 'killshot' },
        { cx: 221, cy: 860, r: 30, points: 8, kind: 'killshot' },
        { cx: 779, cy: 860, r: 30, points: 8, kind: 'killshot' },
      ],
    },
    iatf: {
      ariaLabel: 'IATF target',
      lineWidth: 8,
      discs: [
        { r: 340, points: 1 },
        { r: 220, points: 3 },
        { r: 104, points: 5 },
      ],
      spots: [
        { cx: 235, cy: 161, r: 44, points: 7, kind: 'clutch' },
        { cx: 765, cy: 161, r: 44, points: 7, kind: 'clutch' },
      ],
    },
  };

  /** The point numerals along the horizontal centre line (outer → bullseye). */
  function ringNumbers(discs) {
    return discs.map((disc, i) => {
      const innerR = discs[i + 1]?.r ?? 0;
      const bandMid = (disc.r + innerR) / 2;
      return svg('text', {
        class: 'rt__num',
        x: CX - bandMid,
        y: CY,
        'aria-hidden': 'true',
        text: String(disc.points),
      });
    });
  }

  /**
   * Where to drop a marker for a throw worth `value`. We only know WHICH zone was
   * hit (the scored value), not the exact x/y the axe landed, so markers sit at a
   * representative spot on the scored ring/dot, fanned out by throw index so
   * repeats on the same ring don't stack.
   */
  function markerPos(spec, value, i) {
    const fan = ((-1.1 + i * 0.7) * Math.PI) / 3; // spread across ~upper arc
    // Disc hit: place at the middle of that ring's band, fanned by angle.
    const discIdx = spec.discs.findIndex((d) => d.points === value);
    if (discIdx >= 0) {
      const d = spec.discs[discIdx];
      const innerR = spec.discs[discIdx + 1]?.r ?? 0;
      const bandMid = (d.r + innerR) / 2 || d.r * 0.5;
      return { x: CX + bandMid * Math.sin(fan), y: CY - bandMid * Math.cos(fan) };
    }
    // Dot hit (killshot / clutch / cluster): place on a matching dot in turn.
    const dots = spec.spots.filter((s) => s.points === value);
    if (dots.length) {
      const dot = dots[i % dots.length];
      return { x: dot.cx, y: dot.cy };
    }
    // Miss (0) or unknown: drop into the dark corner field beyond the rings.
    return { x: CX + 470 * Math.sin(fan + 0.6), y: CY - 470 * Math.cos(fan + 0.6) };
  }

  /** Transient axe-hit markers for the given recent throw values. */
  function throwMarkers(spec, recentThrows) {
    const marks = [];
    (recentThrows ?? []).forEach((value, i) => {
      const { x, y } = markerPos(spec, value, i);
      marks.push(
        svg('g', { class: 'rt__mark' }, [
          svg('circle', { class: 'rt__mark-dot', cx: x, cy: y, r: 36 }),
          svg('text', { class: 'rt__mark-num', x, y, text: String(value) }),
        ])
      );
    });
    return marks;
  }

  /**
   * Build a ring-target face (Axe Classic / WATL / IATF), with optional markers
   * for the current round's throws.
   * @param {string} gameKey  'target' | 'watl' | 'iatf'
   * @param {number[]} recentThrows  current round's scored values
   * @returns {SVGElement}
   */
  function buildRingFace(gameKey, recentThrows) {
    const spec = RING_SPECS[gameKey] ?? RING_SPECS.target;
    const field = svg('rect', { class: 'rt__field', x: 0, y: 0, width: 1000, height: 1000 });
    // Classes, not fill attributes: CSS on .rt__disc would beat an attribute.
    const discClass = (i) => {
      if (i === spec.discs.length - 1) return 'rt__disc rt__disc--bull';
      return i % 2 === 0 ? 'rt__disc rt__disc--band' : 'rt__disc';
    };
    const discs = spec.discs.map((d, i) =>
      svg('circle', { class: discClass(i), cx: CX, cy: CY, r: d.r })
    );
    const lines = spec.discs.map((d) =>
      svg('circle', { class: 'rt__line', cx: CX, cy: CY, r: d.r, 'stroke-width': spec.lineWidth })
    );
    const numbers = ringNumbers(spec.discs);
    const spots = spec.spots.map((s) =>
      svg('circle', { class: `rt__${s.kind}`, cx: s.cx, cy: s.cy, r: s.r })
    );
    const marks = throwMarkers(spec, recentThrows);

    return svg(
      'svg',
      { class: 'rt__svg', viewBox: '0 0 1000 1000', role: 'group', 'aria-label': spec.ariaLabel },
      [field, ...discs, ...lines, ...numbers, ...spots, ...marks]
    );
  }

  // ---- 501 dartboard geometry, ported verbatim from the tablet board --------
  const R = {
    innerBull: 15,
    outerBull: 38,
    tripleIn: 233,
    tripleOut: 252,
    doubleIn: 381,
    doubleOut: 400,
    number: 436,
  };
  const COL = {
    black: '#161616',
    cream: '#e6d9b8',
    red: '#bf352e',
    green: '#2c8a4c',
    wire: 'rgba(210,224,213,.34)',
    wireLit: 'rgba(228,240,228,.55)',
  };
  const ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

  function pt(r, deg) {
    const a = (deg * Math.PI) / 180;
    return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
  }
  function ringPath(r1, r2, a1, a2) {
    const [x1, y1] = pt(r2, a1);
    const [x2, y2] = pt(r2, a2);
    const [x3, y3] = pt(r1, a2);
    const [x4, y4] = pt(r1, a1);
    return `M${x1} ${y1} A${r2} ${r2} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${r1} ${r1} 0 0 0 ${x4} ${y4} Z`;
  }

  function wedges() {
    const segs = [];
    ORDER.forEach((num, i) => {
      const c = i * 18;
      const a1 = c - 9;
      const a2 = c + 9;
      const isDark = i % 2 === 0;
      const single = isDark ? COL.black : COL.cream;
      const mult = isDark ? COL.red : COL.green;
      const seg = (d, fill) =>
        svg('path', { d, fill, class: 'db__seg', stroke: COL.wire, 'stroke-width': 1.6, 'stroke-linejoin': 'round' });
      segs.push(
        seg(ringPath(R.outerBull, R.tripleIn, a1, a2), single),
        seg(ringPath(R.tripleIn, R.tripleOut, a1, a2), mult),
        seg(ringPath(R.tripleOut, R.doubleIn, a1, a2), single),
        seg(ringPath(R.doubleIn, R.doubleOut, a1, a2), mult)
      );
    });
    return segs;
  }

  function spider() {
    const children = [];
    [R.outerBull, R.tripleIn, R.tripleOut, R.doubleIn].forEach((r) =>
      children.push(svg('circle', { cx: CX, cy: CY, r }))
    );
    children.push(
      svg('circle', { cx: CX, cy: CY, r: R.doubleOut, stroke: 'rgba(232,244,232,.7)', 'stroke-width': 3 })
    );
    for (let i = 0; i < 20; i++) {
      const a = i * 18 - 9;
      const [x1, y1] = pt(R.outerBull, a);
      const [x2, y2] = pt(R.doubleOut, a);
      children.push(svg('line', { x1, y1, x2, y2 }));
    }
    return svg(
      'g',
      { class: 'db__spider', fill: 'none', stroke: COL.wireLit, 'stroke-width': 2, 'pointer-events': 'none' },
      children
    );
  }

  function bull() {
    return [
      svg('circle', { cx: CX, cy: CY, r: R.outerBull, fill: COL.green, class: 'db__bull', stroke: COL.wireLit, 'stroke-width': 2 }),
      svg('circle', { cx: CX, cy: CY, r: R.innerBull, fill: COL.red, class: 'db__bull', stroke: COL.wireLit, 'stroke-width': 2 }),
    ];
  }

  function numerals() {
    return ORDER.map((num, i) => {
      const [x, y] = pt(R.number, i * 18);
      return svg('text', { x, y, class: 'db__num', text: String(num) });
    });
  }

  /** Build the static 501 dartboard face. */
  function buildDartboardFace() {
    const defs = svg('defs', {}, [
      svg('radialGradient', { id: 'db-disc', cx: '50%', cy: '46%', r: '60%' }, [
        svg('stop', { offset: '0%', 'stop-color': '#171b21' }),
        svg('stop', { offset: '70%', 'stop-color': '#0a0c10' }),
        svg('stop', { offset: '100%', 'stop-color': '#050609' }),
      ]),
      svg('radialGradient', { id: 'db-halo', cx: '50%', cy: '50%', r: '50%' }, [
        svg('stop', { offset: '82%', 'stop-color': 'rgba(0,0,0,0)' }),
        svg('stop', { offset: '100%', 'stop-color': 'rgba(0,0,0,.55)' }),
      ]),
    ]);
    const cabinet = [
      svg('circle', { cx: CX, cy: CY, r: 472, fill: 'url(#db-disc)' }),
      svg('circle', { cx: CX, cy: CY, r: 472, fill: 'url(#db-halo)' }),
      svg('circle', { cx: CX, cy: CY, r: 470, fill: 'none', stroke: 'rgba(255,255,255,.05)', 'stroke-width': 2 }),
    ];
    const board = svg('g', { class: 'db__board' }, [...wedges(), spider(), ...bull(), ...numerals()]);
    return svg(
      'svg',
      { class: 'db__svg', viewBox: '0 0 1000 1000', role: 'group', 'aria-label': 'Dartboard' },
      [defs, ...cabinet, board]
    );
  }

  window.receiverTargets = { buildRingFace, buildDartboardFace };
})();
