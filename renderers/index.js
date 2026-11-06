/**
 * renderers/index.js — generic receiver router + stage layout engine.
 *
 * One key per game type, each mapping to a renderer. receiver.html hands every
 * incoming Cast message here; this picks the renderer for the message's `game`
 * key, gets back its two display parts, and positions them on a 16:9 stage using
 * the per-game `layout` the tablet pushed. Unknown game keys log and no-op so an
 * unexpected payload never throws on the projector.
 *
 * The receiver is a PURE PAINTER: the tablet computes a ready-to-display view
 * model (axethrowapp/src/lib/cast-view.js) and pushes { game, view, layout }.
 * These renderers only lay out what they were handed — no scoring, turn or win
 * logic lives here, and the receiver never captures input.
 *
 * Layout model (mirrors axethrowapp/src/lib/cast-layout.js): every game has a
 * PRIMARY region (the target face / game board) and a SECONDARY region (the
 * scoreboard / status strip), each a normalised rect {x,y,w,h} in 0..1 of the
 * 16:9 stage, plus a `rotation` (0/90/180/270°) applied to the primary region so
 * a board mounted sideways still projects upright. Staff calibrate these per
 * game on the tablet so the projected target lines up with the real wooden
 * board; the saved rects + rotation arrive here and position the two regions.
 * When no layout is sent we fall back to the same built-in defaults the tablet
 * ships with (rotation 0).
 */

// Each renderer returns { primary, secondary } DOM nodes rather than painting
// into the container itself, so this module owns all positioning. A renderer may
// also return `secondaryVariants` (alternative arrangements of the secondary
// content); refit() keeps whichever fits the calibrated box largest.
const RENDERERS = {
  target: renderRingTargetBoard,
  watl: renderRingTargetBoard,
  iatf: renderRingTargetBoard,
  dartboard: renderDartboardBoard,
  tictactoe: renderTicTacToeBoard,
  connect4: renderConnect4Board,
  pairs: renderPairsBoard,
};

// Games whose primary element is a throwing target (vs a flat game board). Kept
// in sync with THROWING_GAMES in axethrowapp/src/lib/cast-layout.js.
const THROWING = new Set(['target', 'watl', 'iatf', 'dartboard']);

// Fallback layouts, identical to cast-layout.js's THROWING_DEFAULT / BOARD_DEFAULT.
const THROWING_DEFAULT = {
  primary: { x: 0.22, y: 0.2, w: 0.56, h: 0.76 },
  secondary: { x: 0.25, y: 0.03, w: 0.5, h: 0.13 },
};
const BOARD_DEFAULT = {
  primary: { x: 0.21, y: 0.16, w: 0.58, h: 0.8 },
  secondary: { x: 0.1, y: 0.03, w: 0.8, h: 0.1 },
};

function defaultLayout(game) {
  return THROWING.has(game) ? THROWING_DEFAULT : BOARD_DEFAULT;
}

/** An absolutely-positioned stage region filling the given normalised rect. */
function regionBox(rect, fallback) {
  const r = rect ?? fallback;
  const box = document.createElement('div');
  box.className = 'stage__region';
  box.style.left = `${(r.x ?? fallback.x) * 100}%`;
  box.style.top = `${(r.y ?? fallback.y) * 100}%`;
  box.style.width = `${(r.w ?? fallback.w) * 100}%`;
  box.style.height = `${(r.h ?? fallback.h) * 100}%`;
  return box;
}

// Largest scale-up the secondary fit will apply, so a scoreboard box made huge
// doesn't blow a one-line status up to billboard size.
const MAX_FIT = 3;

// The last-rendered secondary region, re-fitted when the viewport resizes.
let lastFit = null;

/**
 * Scale the secondary content (scoreboard / status) to fit its region. The
 * content is sized in vmin, so on its own it ignores the region staff set.
 * Instead, lay it out at its natural (max-content) size, measure it, and scale
 * it uniformly to fill the region without clipping, then centre it. Measuring
 * the natural size is what lets short content scale UP: anything stretched to
 * the box width measures as already fitting. Returns the scale applied (0 when
 * the box isn't laid out, e.g. the jsdom smoke test).
 */
function fitNatural(box, fit) {
  const bw = box.clientWidth;
  const bh = box.clientHeight;
  if (!bw || !bh) return 0;

  fit.style.transform = '';
  fit.style.width = 'max-content';
  const w = fit.offsetWidth;
  const h = fit.offsetHeight;
  if (!w || !h) return 0;
  return place(box, fit, w, h);
}

/** Scale a measured w×h block to fit the box, centre it, and return the scale. */
function place(box, fit, w, h) {
  const bw = box.clientWidth;
  const bh = box.clientHeight;
  const s = Math.min(bw / w, bh / h, MAX_FIT);
  const dx = (bw - w * s) / 2;
  const dy = (bh - h * s) / 2;
  fit.style.transform = `translate(${dx}px, ${dy}px) scale(${s})`;
  return s;
}

/**
 * Fit the last-rendered secondary content. When the renderer offered several
 * arrangements (the score list in 1 or 2 columns), try each against the
 * calibrated box and keep whichever ends up scaled largest, so a small or
 * oddly-shaped box still gets the biggest possible names.
 */
function refit() {
  if (!lastFit) return;
  const { box, fit, variants } = lastFit;
  let best = variants[0];
  let bestScale = -1;
  for (const v of variants) {
    fit.replaceChildren(v);
    const s = fitNatural(box, fit);
    if (s > bestScale) {
      best = v;
      bestScale = s;
    }
  }
  fit.replaceChildren(best);
  fitNatural(box, fit);
}

window.addEventListener('resize', refit);

window.renderers = {
  /**
   * @param {string} game       game key from the Cast payload
   * @param {object} view       the ready-to-paint view model
   * @param {object} [layout]   per-game {primary, secondary} rects (optional)
   * @param {HTMLElement} container  mount point (#board-root)
   */
  render(game, view, layout, container) {
    const renderFn = RENDERERS[game];
    if (!renderFn) {
      console.warn('No renderer registered for game type:', game);
      return;
    }

    const parts = renderFn(view, game) ?? {};
    const def = defaultLayout(game);
    const lay = layout ?? def;

    const stage = document.createElement('div');
    stage.className = 'stage';

    if (parts.primary) {
      const box = regionBox(lay.primary, def.primary);
      box.classList.add('stage__region--primary');
      // Rotate the primary element in place (about its centre) for boards mounted
      // sideways. 0 is the common case and leaves transform untouched.
      const rot = Number(lay.rotation) || 0;
      if (rot) box.style.transform = `rotate(${rot}deg)`;
      box.append(parts.primary);
      stage.append(box);
    }
    if (parts.secondary) {
      const box = regionBox(lay.secondary, def.secondary);
      box.classList.add('stage__region--secondary');
      const fit = document.createElement('div');
      fit.className = 'stage__fit';
      fit.append(parts.secondary);
      box.append(fit);
      stage.append(box);
      const variants = parts.secondaryVariants?.length ? parts.secondaryVariants : [parts.secondary];
      lastFit = { box, fit, variants };
    } else {
      lastFit = null;
    }

    container.replaceChildren(stage);
    refit();
  },
};
