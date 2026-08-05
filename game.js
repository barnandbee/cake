/* ============================================================
   CONVEYOR BELT BIRTHDAY BAKERY
   Vanilla ES6+. No dependencies, no build step.

   Structure
     1. CONFIG          – tunable knobs
     2. INGREDIENTS     – the 40 items on the belt
     3. CAKES           – the 30 possible outcomes
     4. Mapping logic   – ingredients -> flavour profile -> cake
     5. Sound           – tiny WebAudio blip synth (no asset files)
     6. Sprites         – <img> with emoji fallback (swap in PNGs anytime)
     7. Engine          – screens, conveyor, input, results, confetti
   ============================================================ */

(() => {
  'use strict';

  /* ---------------------------------------------------------
     1. CONFIG
     --------------------------------------------------------- */
  const CONFIG = {
    maxPicks: 15,          // bowl capacity
    startTravelMs: 4200,   // time an item takes to cross the belt
    speedUpMs: 85,         // shaved off per item
    minTravelMs: 1900,
    gapMs: 260,            // pause between items
    swipeThreshold: 70,    // px drag before a decision registers
    bakeMs: 3200
  };

  /* ---------------------------------------------------------
     1b. CHEFS — Tara is available from the start; Garrington is
         unlocked once the player has baked their first cake.
         `aspect` matches each sprite's PNG so the two line up at
         the same height despite the gecko's tail.
     --------------------------------------------------------- */
  const CHEFS = [
    { id: 'tara', name: 'Tara Tapir', role: 'Checkout Chef', emoji: '👩‍🍳',
      sprite: 'assets/chef-tara.png', aspect: '203 / 420',
      line: 'Twenty years on the tills. Nothing on that belt is a surprise any more.' },
    { id: 'garrington', name: 'Garrington Gecko', role: 'Sous Lizard', emoji: '🦎',
      sprite: 'assets/chef-garrington.png', aspect: '280 / 420',
      line: 'Sticky-fingered, unflappable, and tastes everything with their feet.' }
  ];

  const DEFAULT_CHEF = CHEFS[0];
  const chefById = id => CHEFS.find(c => c.id === id) || DEFAULT_CHEF;

  /* ---------------------------------------------------------
     1c. SAVE — player name, chosen chef and how many cakes have
         been baked, in one localStorage blob. Every access is
         guarded: private mode and file:// can both refuse.
     --------------------------------------------------------- */
  const SAVE_KEY = 'cbbb.save.v1';

  const Save = {
    load() {
      try {
        const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
        return {
          name: typeof raw.name === 'string' ? raw.name.slice(0, 16) : '',
          chef: chefById(raw.chef).id,
          bakes: Number.isFinite(raw.bakes) && raw.bakes > 0 ? Math.floor(raw.bakes) : 0
        };
      } catch {
        return { name: '', chef: DEFAULT_CHEF.id, bakes: 0 };
      }
    },
    write(data) {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* not fatal */ }
    }
  };

  const chefsUnlocked = save => save.bakes >= 1;

  /* ---------------------------------------------------------
     2. INGREDIENTS — exactly 40, in four categories.
        `a` = flavour axes this item contributes.
        Art:  assets/ingredient-<id>.png   (emoji fallback below)
     --------------------------------------------------------- */
  const ing = (id, name, emoji, cat, a) => ({ id, name, emoji, cat, a });

  const INGREDIENTS = [
    // -- Core (1-6) --------------------------------------------------
    ing(1,  'Flour',            '🌾', 'core',   { base: 3 }),
    ing(2,  'Sugar',            '🍬', 'core',   { base: 2, sweet: 3 }),
    ing(3,  'Eggs',             '🥚', 'core',   { base: 3 }),
    ing(4,  'Butter',           '🧈', 'core',   { base: 2, cream: 2 }),
    ing(5,  'Milk',             '🥛', 'core',   { base: 2, cream: 2 }),
    ing(6,  'Baking Powder',    '🥄', 'core',   { base: 3 }),

    // -- Flavours (7-16) ---------------------------------------------
    ing(7,  'Vanilla',          '🌼', 'flavor', { sweet: 2, cream: 1, floral: 1 }),
    ing(8,  'Cocoa Powder',     '🍫', 'flavor', { choc: 4 }),
    ing(9,  'Strawberry Extract','🍓', 'flavor', { berry: 4, sweet: 1 }),
    ing(10, 'Matcha Powder',    '🍵', 'flavor', { green: 5 }),
    ing(11, 'Lemon Zest',       '🍋', 'flavor', { citrus: 4 }),
    ing(12, 'Espresso Shot',    '☕', 'flavor', { coffee: 5 }),
    ing(13, 'Orange Blossom',   '🍊', 'flavor', { citrus: 3, floral: 3 }),
    ing(14, 'Almond Extract',   '🌰', 'flavor', { nut: 4, floral: 1 }),
    ing(15, 'Cinnamon',         '🍂', 'flavor', { spice: 3, sweet: 1 }),
    ing(16, 'Maple Syrup',      '🍁', 'flavor', { sweet: 2, caramel: 3 }),

    // -- Mix-ins & toppings (17-30) ----------------------------------
    ing(17, 'Chocolate Chips',  '🟤', 'mixin',  { choc: 3, crunch: 1, sweet: 1 }),
    ing(18, 'Blueberries',      '🫐', 'mixin',  { berry: 3, fruit: 2 }),
    ing(19, 'Cherries',         '🍒', 'mixin',  { berry: 3, fruit: 2 }),
    ing(20, 'Sprinkles',        '🌈', 'mixin',  { sweet: 3, crunch: 2 }),
    ing(21, 'Chili Flakes',     '🌶️', 'mixin',  { spice: 5, chaos: 2 }),
    ing(22, 'Gummy Bears',      '🐻', 'mixin',  { sweet: 3, chaos: 1 }),
    ing(23, 'Pineapple',        '🍍', 'mixin',  { trop: 5, fruit: 2 }),
    ing(24, 'Seaweed',          '🌿', 'mixin',  { savory: 2, ocean: 4, chaos: 3 }),
    ing(25, 'Marshmallows',     '☁️', 'mixin',  { sweet: 3, cream: 2 }),
    ing(26, 'Caramel Sauce',    '🍯', 'mixin',  { caramel: 4, sweet: 2 }),
    ing(27, 'Peanut Butter',    '🥜', 'mixin',  { nut: 4, cream: 1 }),
    ing(28, 'Coconut Flakes',   '🥥', 'mixin',  { trop: 3, cream: 1, crunch: 1 }),
    ing(29, 'Banana',           '🍌', 'mixin',  { fruit: 4, trop: 1 }),
    ing(30, 'Cream Cheese',     '🍦', 'mixin',  { cream: 4, sweet: 1 }),

    // -- Weird / silly (31-40) ---------------------------------------
    ing(31, 'Edible Glitter',   '✨', 'weird',  { chaos: 3, sweet: 1 }),
    ing(32, 'Hot Sauce',        '🔥', 'weird',  { spice: 5, chaos: 3 }),
    ing(33, 'Stinky Cheese',    '🧀', 'weird',  { savory: 2, funk: 5, chaos: 4 }),
    ing(34, 'Pickles',          '🥒', 'weird',  { savory: 4, chaos: 3 }),
    ing(35, 'Garlic',           '🧄', 'weird',  { savory: 2, funk: 3, chaos: 3 }),
    ing(36, 'Energy Drink',     '⚡', 'weird',  { chaos: 4, sweet: 2 }),
    ing(37, 'Popcorn',          '🍿', 'weird',  { crunch: 4, savory: 1, chaos: 2 }),
    ing(38, 'Bubblegum',        '🫧', 'weird',  { sweet: 4, chaos: 3 }),
    ing(39, 'Ketchup',          '🍅', 'weird',  { savory: 4, chaos: 4 }),
    ing(40, 'Sardines',         '🐟', 'weird',  { savory: 2, ocean: 5, chaos: 5 })
  ];

  const BY_ID = new Map(INGREDIENTS.map(i => [i.id, i]));

  const CAT_LABEL = { core: 'Core', flavor: 'Flavour', mixin: 'Mix-in', weird: '?!?' };

  /* ---------------------------------------------------------
     3. CAKES — exactly 30 outcomes.
        needs  : any of these ingredient ids scores big
        combo  : ALL ids in a group present -> jackpot bonus
        likes  : flavour axis weights
        hates  : negative weights (keeps sane cakes away from chaos)
        art    : assets/cake-<id>.png, else the CSS/SVG cake below
        col    : [frosting, sponge, accent] for the drawn fallback
     --------------------------------------------------------- */
  const CAKES = [
    // ---------- Classic / conventional ----------
    { id: 1, name: 'Classic Victoria Sponge', emoji: '🍰', tier: 'classic',
      col: ['#fff6e5', '#f4d199', '#ff6f91'], bias: 0,
      likes: { base: 1.3, sweet: .8, cream: .6 },
      hates: { chaos: -3, savory: -3, choc: -1.6, green: -2 },
      blurb: 'Immaculate. Restrained. The cake equivalent of a firm handshake and a well-ironed apron.' },

    { id: 2, name: 'Decadent Chocolate Fudge', emoji: '🍫', tier: 'classic',
      col: ['#4a2c17', '#6b4423', '#d9a441'], needs: [8, 17],
      likes: { choc: 3, sweet: 1, cream: 1 }, hates: { chaos: -2, savory: -2, citrus: -1 },
      blurb: 'Dense enough to bend cutlery and rich enough to require a lie-down. The cocoa did not come to play.' },

    { id: 3, name: 'Strawberry Shortcake', emoji: '🍓', tier: 'classic',
      col: ['#fff1f3', '#ffd9a8', '#ff5c8a'], needs: [9],
      likes: { berry: 2.4, cream: 1.4, sweet: .8 }, hates: { chaos: -2.4, savory: -2.5, choc: -1.4 },
      blurb: 'Pink, wholesome and dangerously photogenic. Somewhere, a picnic blanket just unfolded itself.' },

    { id: 4, name: 'Funfetti Party Bomb', emoji: '🎊', tier: 'classic',
      col: ['#ffffff', '#ffe9b0', '#00e5ff'], needs: [20, 22],
      likes: { sweet: 1.8, crunch: 1.2 }, hates: { savory: -2.6, chaos: -1.2 },
      blurb: 'Every slice detonates a small confetti cannon of sugar. Dentists have flagged this cake as a person of interest.' },

    { id: 5, name: 'Red Velvet Dream', emoji: '❤️', tier: 'classic',
      col: ['#fdf6ee', '#b3122a', '#ffffff'], combo: [[8, 30]], comboW: 14,
      likes: { cream: 1.4, choc: .8 }, hates: { chaos: -2, savory: -2 },
      blurb: 'Velvet crumb, cream cheese swagger, suspiciously red. Nobody asks questions when it looks this good.' },

    { id: 6, name: 'Lemon Drizzle Loaf', emoji: '🍋', tier: 'classic',
      col: ['#fff8d6', '#ffe9a3', '#ffd000'], needs: [11],
      likes: { citrus: 3 }, hates: { choc: -2, chaos: -1.6, savory: -2 },
      blurb: 'Sharp, sticky and gone within four minutes of leaving the tin. A loaf with absolutely nothing to prove.' },

    { id: 7, name: 'Marshmallow S’mores Stack', emoji: '🔥', tier: 'classic',
      col: ['#f7e7cf', '#5b3a21', '#ffffff'], needs: [25],
      likes: { sweet: 1.6, choc: 1.4, cream: .8 }, hates: { savory: -2, chaos: -1.2 },
      blurb: 'Toasted, gooey and structurally optimistic. It tastes like a campfire that got a promotion.' },

    { id: 8, name: 'Cheesecake Cloud', emoji: '☁️', tier: 'classic',
      col: ['#fffaf0', '#f0d9a8', '#e8b4c8'], needs: [30],
      likes: { cream: 3 }, hates: { chaos: -2, savory: -2.2 },
      blurb: 'So light it files its own flight plan. The biscuit base is the only thing keeping it on the plate.' },

    { id: 9, name: 'Cinnamon Spice Stack', emoji: '🍂', tier: 'classic',
      col: ['#f5e0c0', '#a9702f', '#fff3e0'], needs: [15],
      likes: { spice: 1.8, sweet: .8, caramel: .6 }, hates: { chaos: -1.6, savory: -1.8 },
      blurb: 'Warm, autumnal and quietly smug about it. Smells like a candle shop with actual talent.' },

    { id: 10, name: 'Black Forest Gateau', emoji: '🍒', tier: 'classic',
      col: ['#3b2417', '#5b3a21', '#c2185b'], needs: [19], combo: [[8, 19]],
      likes: { choc: 1.8, berry: 1.8, cream: .8 }, hates: { chaos: -1.8, savory: -2 },
      blurb: 'Cherries, cocoa and enough cream to worry a cardiologist. Deeply 1974, and all the better for it.' },

    // ---------- Flavoured / gourmet ----------
    { id: 11, name: 'Matcha Green Tea Delight', emoji: '🍵', tier: 'gourmet',
      col: ['#d7ecc6', '#8fbf5e', '#ffffff'], needs: [10],
      likes: { green: 3.4 }, hates: { chaos: -1.6, savory: -1.4 },
      blurb: 'Elegant, earthy and faintly judgemental about your other choices. Serve with a very small cup of something.' },

    { id: 12, name: 'Tiramisu Tower', emoji: '☕', tier: 'gourmet',
      col: ['#e8d5b7', '#6f4e37', '#3e2723'], needs: [12],
      likes: { coffee: 3, cream: 1 }, hates: { chaos: -1.6, savory: -1.6 },
      blurb: 'Layered, boozy-adjacent and powered entirely by espresso. It will pick you up, then quietly put you down again.' },

    { id: 13, name: 'Blueberry Muffin Cake', emoji: '🫐', tier: 'gourmet',
      col: ['#f3e7d3', '#e6c88f', '#4a54a3'], needs: [18],
      likes: { berry: 2.6, fruit: .8 }, hates: { chaos: -1.8, savory: -1.8 },
      blurb: 'A muffin that went to night school and came back as a cake. Every bite is 40% fruit, 60% blue.' },

    { id: 14, name: 'Tropical Pineapple Surprise', emoji: '🍍', tier: 'gourmet',
      col: ['#fff3c4', '#ffd54f', '#43a047'], needs: [23],
      likes: { trop: 3 }, hates: { chaos: -1.2 },
      blurb: 'Upside down, inside out and wearing a tiny paper umbrella. The surprise is how much pineapple one cake can hold.' },

    { id: 15, name: 'Coconut Cloud Cake', emoji: '🥥', tier: 'gourmet',
      col: ['#ffffff', '#f0e2c8', '#8d6e63'], needs: [28],
      likes: { trop: 2, cream: 1.2, crunch: .6 }, hates: { chaos: -1.2, savory: -1.4 },
      blurb: 'Snowy, shaggy and shedding flakes onto everything within a metre. Worth the hoovering.' },

    { id: 16, name: 'Banoffee Banana Bomb', emoji: '🍌', tier: 'gourmet',
      col: ['#ffe9b8', '#e0b25f', '#5d4037'], needs: [29],
      likes: { fruit: 2.2, caramel: 1.6, cream: .6 }, hates: { chaos: -1.2, savory: -1.6 },
      blurb: 'Banana and toffee doing their unbeatable double act. It is technically a dessert, spiritually a hug.' },

    { id: 17, name: 'Peanut Butter Cup Cake', emoji: '🥜', tier: 'gourmet',
      col: ['#e6b877', '#7b4b22', '#3e2723'], needs: [27],
      likes: { nut: 3, choc: 1 }, hates: { chaos: -1.4, savory: -1.2 },
      blurb: 'Salty, sweet and glued to the roof of your mouth in the best possible way. Chew responsibly.' },

    { id: 18, name: 'Salted Caramel Cathedral', emoji: '🍯', tier: 'gourmet',
      col: ['#f6dfa8', '#c98a2b', '#6d4c1e'], needs: [26],
      likes: { caramel: 3 }, hates: { chaos: -1.4 },
      blurb: 'Golden, glossy and drizzled to within an inch of its life. Architecturally ambitious, nutritionally reckless.' },

    { id: 19, name: 'Citrus Burst Sunshine Cake', emoji: '🍊', tier: 'gourmet',
      col: ['#fff2cc', '#ffcc66', '#ff8f00'], needs: [13], combo: [[11, 13]],
      likes: { citrus: 2.4, floral: 1.2 }, hates: { choc: -1.6, chaos: -1.4 },
      blurb: 'Zesty enough to wake the neighbours and perfumed like a spring morning. Sunshine, but baked.' },

    { id: 20, name: 'Almond Marzipan Marvel', emoji: '🌰', tier: 'gourmet',
      col: ['#f7e6c4', '#e3c98f', '#c62828'], needs: [14],
      likes: { nut: 2.6, floral: 1.2 }, hates: { chaos: -1.4, savory: -1.4 },
      blurb: 'Sophisticated, faintly almondy and beloved by exactly half the people who try it. You are hopefully in that half.' },

    { id: 21, name: 'Maple Syrup Stack', emoji: '🍁', tier: 'gourmet',
      col: ['#f8e3bc', '#d99a3f', '#8d5524'], needs: [16],
      likes: { caramel: 1.6, sweet: 1.2 }, hates: { chaos: -1.4, savory: -1.4 },
      blurb: 'Breakfast and dessert locked in a syrupy stalemate. Nobody wins, everybody eats.' },

    { id: 22, name: 'Vanilla Bean Showpiece', emoji: '🌼', tier: 'gourmet',
      col: ['#fffdf5', '#f3dcae', '#d7b377'], needs: [7],
      likes: { floral: 1.6, sweet: 1.2, cream: 1.2 }, hates: { chaos: -2, savory: -2, choc: -1 },
      blurb: 'Speckled with real vanilla and quietly expensive-looking. Plain is not the same thing as boring, and this cake knows it.' },

    { id: 23, name: 'Fruit Salad Fantasia', emoji: '🍇', tier: 'gourmet',
      col: ['#fff0f5', '#ffd9a8', '#8e24aa'],
      combo: [[18, 29], [19, 23], [18, 23], [19, 29], [23, 29], [18, 19]], comboW: 4,
      likes: { fruit: 1.6, berry: 1, trop: .8 }, hates: { chaos: -1.4, savory: -1.6 },
      blurb: 'Five kinds of fruit in a shaky alliance, held together by hope and sponge. Counts as one of your five a day if you squint.' },

    // ---------- Unconventional / chaos ----------
    { id: 24, name: 'Spicy Chili Chocolate Crunch', emoji: '🌶️', tier: 'chaos',
      col: ['#3b1f14', '#5b2c1c', '#e53935'], needs: [21], combo: [[21, 8], [21, 17]],
      likes: { spice: 2, choc: 2, crunch: .6, chaos: .4 },
      blurb: 'Sweet for two seconds, then it comes for you. A cake with a grudge and excellent follow-through.' },

    { id: 25, name: 'Hot Sauce Volcano', emoji: '🌋', tier: 'chaos',
      col: ['#7f1d1d', '#b71c1c', '#ff6f00'], needs: [32],
      likes: { spice: 3, chaos: 1 },
      blurb: 'It erupts. Repeatedly. Guests are advised to sign something before the first slice is cut.' },

    { id: 26, name: 'Glittering Mermaid Cake', emoji: '🧜', tier: 'chaos',
      col: ['#6ee7e7', '#a78bfa', '#fde047'], needs: [31], combo: [[31, 24]],
      likes: { chaos: 1.1, sweet: 1, trop: .6 },
      blurb: 'Shimmering, iridescent and shedding edible glitter into every corner of the room. You will be finding it for weeks.' },

    { id: 27, name: 'Salty Seaweed Mystery', emoji: '🌊', tier: 'chaos',
      col: ['#2e5d4b', '#1b3b32', '#9ccc65'], needs: [24, 40],
      likes: { ocean: 2.4, savory: .5, chaos: .5 },
      blurb: 'Oceanic, umami and deeply unwilling to explain itself. Somewhere out there a seagull is applauding.' },

    { id: 28, name: 'Bubblegum Arcade Cake', emoji: '🕹️', tier: 'chaos',
      col: ['#ff7ac6', '#ffb3e6', '#00e5ff'], needs: [38],
      likes: { sweet: 2, chaos: .6, crunch: .4 },
      blurb: 'Neon pink, aggressively chewy and tastes like a 1991 quarter-eating machine. High score: your blood sugar.' },

    { id: 29, name: 'Stinky Cheese Nightmare', emoji: '🧀', tier: 'chaos',
      col: ['#e8d98a', '#c7b04a', '#6b7d3a'], needs: [33, 35],
      likes: { funk: 2.6, savory: .5, chaos: .5 },
      blurb: 'You can smell it from the next postcode. Legally a cake, emotionally a dare.' },

    { id: 30, name: 'The Disaster Loaf', emoji: '💀', tier: 'chaos',
      col: ['#4b3f3a', '#6d5a50', '#9e9e9e'], bias: .4,
      likes: { chaos: 1.5, savory: .7 },
      blurb: 'Something happened in that oven and nobody is prepared to say what. It is dense, it is grey, and it may be sentient.' }
  ];

  /* ---------------------------------------------------------
     4. MAPPING LOGIC
        picked[] -> flavour profile -> scored against all 30 cakes.
        Highest score wins; a cake ALWAYS comes out of the oven.
     --------------------------------------------------------- */

  const NEED_W = 5;    // ingredient the cake is named after
  const COMBO_W = 5.5; // full signature combo (a cake may override with comboW)
  const BASE_CAP = 12; // flour/eggs/butter shouldn't drown out the actual flavour

  function buildProfile(picked) {
    const p = Object.create(null);
    for (const item of picked) {
      for (const [axis, v] of Object.entries(item.a)) {
        p[axis] = (p[axis] || 0) + v;
      }
    }
    const has = new Set(picked.map(i => i.id));
    const counts = { core: 0, flavor: 0, mixin: 0, weird: 0 };
    picked.forEach(i => counts[i.cat]++);
    return { axes: p, has, counts, n: picked.length };
  }

  const axisVal = (prof, axis) => {
    const v = prof.axes[axis] || 0;
    return axis === 'base' ? Math.min(v, BASE_CAP) : v;
  };

  function scoreCake(cake, prof) {
    let score = cake.bias || 0;

    for (const [axis, w] of Object.entries(cake.likes || {})) score += w * axisVal(prof, axis);
    for (const [axis, w] of Object.entries(cake.hates || {})) score += w * axisVal(prof, axis);

    for (const id of cake.needs || []) if (prof.has.has(id)) score += NEED_W;
    for (const group of cake.combo || []) {
      if (group.every(id => prof.has.has(id))) score += (cake.comboW || COMBO_W);
    }
    return score;
  }

  function pickCake(prof) {
    if (prof.n === 0) return CAKES.find(c => c.id === 30);

    let best = CAKES[0];
    let bestScore = -Infinity;
    CAKES.forEach((cake, idx) => {
      // tiny deterministic nudge so identical scores don't always pick the first cake
      const tie = ((prof.n * 7 + idx * 13) % 5) * 0.001;
      const s = scoreCake(cake, prof) + tie;
      if (s > bestScore) { bestScore = s; best = cake; }
    });
    return best;
  }

  /** Coherence rating: did they actually build a cake, or a crime? */
  function rateBake(prof) {
    const coreIds = [1, 2, 3, 4, 5, 6];
    const coreHits = coreIds.filter(id => prof.has.has(id)).length;
    const chaos = prof.axes.chaos || 0;
    let stars = 1 + coreHits * 0.6 + Math.min(prof.counts.flavor, 3) * 0.4 - chaos * 0.22;
    if (prof.n >= 6) stars += 0.5;
    if (prof.n <= 2) stars -= 1;
    return Math.max(1, Math.min(5, Math.round(stars)));
  }

  /** One extra sentence tailored to what the player actually did. */
  function flavourText(prof, picked, rejected) {
    const lines = [];
    const missingCore = [1, 3].filter(id => !prof.has.has(id));

    if (prof.n === 0) lines.push('You picked absolutely nothing, so the oven improvised with ambient dust and spite.');
    if (prof.n === 1) lines.push(`A single ingredient — ${picked[0].name.toLowerCase()} — and the confidence of a much better baker.`);
    if (prof.n >= 2 && prof.n <= 3) lines.push(`Just ${prof.n} ingredients: either minimalist genius or a supply chain problem.`);
    if (prof.n >= CONFIG.maxPicks) lines.push('You filled the bowl to the brim and then some. Restraint was never on the menu.');
    if (missingCore.length === 2 && prof.n > 2) lines.push('No flour, no eggs, no regrets — structurally this thing is held together by vibes.');
    else if (missingCore.length === 1 && prof.n > 2) lines.push(`Notably absent: ${BY_ID.get(missingCore[0]).name.toLowerCase()}. The oven noticed.`);
    if (prof.counts.weird >= 4) lines.push(`${prof.counts.weird} genuinely alarming ingredients made it into the bowl. That was a choice, and you made it repeatedly.`);
    else if (prof.counts.weird >= 1) lines.push(`The ${picked.filter(i => i.cat === 'weird').map(i => i.name.toLowerCase()).join(' and ')} really tied it all together, in a legal sense.`);
    if (rejected >= 25) lines.push(`You hurled ${rejected} ingredients into the sea. Marine biologists have questions.`);
    if (prof.counts.core === 6) lines.push('Every core ingredient present and correct — somebody has read a recipe before.');

    if (!lines.length) lines.push('A balanced, sensible bake. Frankly the arcade expected more chaos from you.');
    return lines[0];
  }

  /* ---------------------------------------------------------
     5. SOUND — generated blips, so there are no audio files to ship.
     --------------------------------------------------------- */
  const Sound = (() => {
    let ctx = null, on = true;
    const ensure = () => {
      if (!on) return null;
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    };
    const tone = (freq, dur, type = 'square', vol = .06, slideTo = null) => {
      const c = ensure(); if (!c) return;
      const osc = c.createOscillator(), gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
      gain.gain.setValueAtTime(vol, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      osc.connect(gain).connect(c.destination);
      osc.start(); osc.stop(c.currentTime + dur);
    };
    return {
      set enabled(v) { on = v; },
      get enabled() { return on; },
      accept() { tone(660, .09); setTimeout(() => tone(990, .11), 70); },
      reject() { tone(300, .22, 'sawtooth', .05, 90); },   // sploosh — swap for sea-splash.mp3 later
      miss()   { tone(180, .12, 'triangle', .04); },
      start()  { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, .12), i * 90)); },
      bake()   { tone(220, .5, 'sine', .05, 660); },
      win()    { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, .18, 'square', .05), i * 110)); }
    };
  })();

  /* ---------------------------------------------------------
     6. SPRITES — <img src="assets/…"> on top of an emoji fallback.
        Drop a PNG in and it takes over automatically; if the file
        is missing the <img> hides itself and the emoji shows.
     --------------------------------------------------------- */
  document.addEventListener('error', e => {
    const el = e.target;
    if (el.tagName === 'IMG' && el.hasAttribute('data-fallback')) {
      el.hidden = true;
      el.closest('.sprite')?.classList.remove('sprite--art');
    }
  }, true);

  /* The kitchen scene is a CSS background, so it can't use the <img> fallback
     trick. Probe it instead: if it loads, `has-kitchen` swaps the drawn belt
     for the real bakery and drops the cards onto the painted conveyor. */
  const probeKitchen = () => {
    const probe = new Image();
    probe.onload = () => document.documentElement.classList.add('has-kitchen');
    probe.src = 'assets/kitchen-bg.png';
  };

  /* Reconcile one sprite with the state of its image:
       still loading -> show the emoji, keep the <img> in place
       loaded        -> mark the wrapper so the emoji is hidden behind it
                        (sprites have transparent areas — an un-hidden emoji
                        shows straight through them)
       failed        -> hide the <img> and leave the emoji showing */
  const syncSprite = img => {
    const loaded = img.complete && img.naturalWidth > 0;
    const failed = img.complete && img.naturalWidth === 0;
    img.hidden = failed;
    img.closest('.sprite')?.classList.toggle('sprite--art', loaded);
  };

  const isSpriteImg = el => el.tagName === 'IMG' && el.hasAttribute('data-fallback');

  document.addEventListener('load', e => { if (isSpriteImg(e.target)) syncSprite(e.target); }, true);

  // Markup images may have already settled before this script ran — sweep them.
  const sweepSprites = () => document.querySelectorAll('img[data-fallback]').forEach(syncSprite);

  function sprite(src, emoji, cls = '') {
    return `<span class="sprite ${cls}"><img src="${src}" alt="" data-fallback>` +
           `<span class="sprite__fallback" aria-hidden="true">${emoji}</span></span>`;
  }

  const ingredientArt = item => sprite(`assets/ingredient-${item.id}.png`, item.emoji, 'card__icon');

  /** Drawn cake used until assets/cake-<id>.png exists. */
  function cakeSVG(cake, birthday) {
    const [frost, sponge, accent] = cake.col;
    const candles = birthday ? `
      <g class="svg-candles">
        ${[34, 50, 66].map(x => `
          <rect x="${x - 2}" y="18" width="4" height="14" fill="#fff"/>
          <rect x="${x - 2}" y="22" width="4" height="4" fill="${accent}"/>
          <ellipse cx="${x}" cy="14" rx="3.4" ry="5" fill="#ffb300">
            <animate attributeName="ry" values="5;3.6;5" dur="0.5s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx="${x}" cy="15" rx="1.6" ry="2.6" fill="#fff9c4"/>`).join('')}
      </g>` : '';
    return `
    <svg viewBox="0 0 100 100" role="img" aria-label="${cake.name}">
      ${candles}
      <rect x="18" y="32" width="64" height="16" rx="3" fill="${frost}"/>
      <path d="M18 40 q8 8 16 0 q8 8 16 0 q8 8 16 0 q8 8 16 0 v6 H18z" fill="${accent}" opacity=".85"/>
      <rect x="18" y="46" width="64" height="14" fill="${sponge}"/>
      <rect x="18" y="60" width="64" height="6" fill="${frost}"/>
      <rect x="18" y="66" width="64" height="14" fill="${sponge}"/>
      <rect x="14" y="80" width="72" height="7" rx="3" fill="#d9d9e3"/>
      <rect x="10" y="86" width="80" height="4" rx="2" fill="#9e9eb0"/>
      <circle cx="30" cy="40" r="3" fill="${accent}"/>
      <circle cx="70" cy="40" r="3" fill="${accent}"/>
      ${birthday ? '' : `<text x="50" y="28" font-size="11" text-anchor="middle">${cake.emoji}</text>`}
    </svg>`;
  }

  /* ---------------------------------------------------------
     7. ENGINE
     --------------------------------------------------------- */
  const $ = sel => document.querySelector(sel);

  const els = {
    views:      { start: $('#view-start'), game: $('#view-game'), baking: $('#view-baking'), result: $('#view-result') },
    birthday:   $('#birthday-check'),
    playerName: $('#player-name'),
    chefPicker: $('#chef-picker'),
    chefLocked: $('#chef-locked'),
    chefPortrait: $('#chef-portrait'),
    chefNameEl: $('#chef-name'),
    chefRoleEl: $('#chef-role'),
    chefLineEl: $('#chef-line'),
    subtitle:   $('#subtitle'),
    bakedBy:    $('#baked-by'),
    unlock:     $('#unlock'),
    unlockName: $('#unlock-name'),
    btnStart:   $('#btn-start'),
    btnAgain:   $('#btn-again'),
    btnAccept:  $('#btn-accept'),
    btnReject:  $('#btn-reject'),
    btnSound:   $('#btn-sound'),
    track:      $('#track'),
    belt:       $('#belt'),
    timerFill:  $('#timer-fill'),
    flash:      $('#flash'),
    live:       $('#live'),
    hudPicked:  $('#hud-picked'),
    hudSeen:    $('#hud-seen'),
    hudMax:     $('#hud-max'),
    hudTotal:   $('#hud-total'),
    hudBar:     $('#hud-bar'),
    hudBarFill: $('#hud-bar-fill'),
    countSea:   $('#count-sea'),
    countBowl:  $('#count-bowl'),
    zoneSea:    $('#zone-sea'),
    zoneBowl:   $('#zone-bowl'),
    bowlStrip:  $('#bowl-strip'),
    chef:       $('#chef'),
    bakingStatus: $('#baking-status'),
    banner:     $('#bday-banner'),
    cakeArt:    $('#cake-art'),
    cakeName:   $('#cake-name'),
    cakeStars:  $('#cake-stars'),
    cakeVerdict:$('#cake-verdict'),
    recap:      $('#recap'),
    confetti:   $('#confetti')
  };

  const state = {
    deck: [], cursor: 0, picked: [], rejected: 0,
    birthday: false, running: false, current: null,
    travelMs: CONFIG.startTravelMs, timers: [],
    save: Save.load(),
    playerName: '',
    chef: DEFAULT_CHEF
  };

  const later = (fn, ms) => { const t = setTimeout(fn, ms); state.timers.push(t); return t; };
  const clearTimers = () => { state.timers.forEach(clearTimeout); state.timers = []; };

  function showView(name) {
    Object.entries(els.views).forEach(([key, el]) => el.classList.toggle('view--active', key === name));
    els.views[name].scrollTop = 0;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---------- chef selection ---------- */

  /** Portrait, nameplate and the sprite working the belt all follow the pick. */
  function applyChef(chef) {
    state.chef = chef;
    state.save.chef = chef.id;

    const portrait = els.chefPortrait.querySelector('img');
    portrait.hidden = false;                    // give the new file a fresh chance
    portrait.src = chef.sprite;
    portrait.alt = `${chef.name}, the ${chef.role.toLowerCase()}`;
    els.chefPortrait.style.aspectRatio = chef.aspect;
    els.chefPortrait.querySelector('.sprite__fallback').textContent = chef.emoji;
    syncSprite(portrait);                       // cached swaps settle synchronously

    els.chefNameEl.textContent = chef.name;
    els.chefRoleEl.textContent = chef.role;
    els.chefLineEl.textContent = chef.line;
    els.subtitle.textContent = `${chef.name} is working the checkout. Help them fill the bowl.`;

    const belt = els.chef.querySelector('img');
    belt.hidden = false;
    belt.src = chef.sprite;
    els.chef.style.aspectRatio = chef.aspect;
    els.chef.querySelector('.sprite__fallback').textContent = chef.emoji;
    syncSprite(belt);

    els.chefPicker.querySelectorAll('.chef-chip').forEach(chip => {
      const on = chip.dataset.chef === chef.id;
      chip.classList.toggle('chef-chip--on', on);
      chip.setAttribute('aria-checked', String(on));
      chip.tabIndex = on ? 0 : -1;
    });
  }

  function renderChefPicker() {
    const unlocked = chefsUnlocked(state.save);
    els.chefPicker.hidden = !unlocked;
    els.chefLocked.hidden = unlocked;
    if (!unlocked) {
      applyChef(DEFAULT_CHEF);
      return;
    }
    els.chefPicker.innerHTML = CHEFS.map(c => `
      <button type="button" class="chef-chip" role="radio" aria-checked="false" data-chef="${c.id}">
        <span class="sprite chef-chip__art" style="aspect-ratio:${c.aspect}">
          <img src="${c.sprite}" alt="" data-fallback>
          <span class="sprite__fallback" aria-hidden="true">${c.emoji}</span>
        </span>
        <span class="chef-chip__name">${c.name}</span>
      </button>`).join('');
    sweepSprites();   // cached chip art may already be complete
    applyChef(chefById(state.save.chef));
  }

  els.chefPicker.addEventListener('click', e => {
    const chip = e.target.closest('.chef-chip');
    if (!chip) return;
    applyChef(chefById(chip.dataset.chef));
    Save.write(state.save);
    Sound.accept();
  });

  // arrow keys move between the two chef chips, as a radiogroup should
  els.chefPicker.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const step = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
    const idx = CHEFS.findIndex(c => c.id === state.chef.id);
    const next = CHEFS[(idx + step + CHEFS.length) % CHEFS.length];
    applyChef(next);
    Save.write(state.save);
    els.chefPicker.querySelector('.chef-chip--on')?.focus();
  });

  /* ---------- conveyor ---------- */

  function spawnNext() {
    if (!state.running) return;
    if (state.cursor >= state.deck.length || state.picked.length >= CONFIG.maxPicks) return bake();

    const item = state.deck[state.cursor++];
    els.hudSeen.textContent = state.cursor;

    const travel = document.createElement('div');
    travel.className = 'card-travel';
    travel.innerHTML = `
      <div class="card card--${item.cat}">
        ${ingredientArt(item)}
        <span class="card__name">${item.name}</span>
        <span class="card__tag">${CAT_LABEL[item.cat]}</span>
        <span class="card__stamp card__stamp--yes">IN THE BOWL</span>
        <span class="card__stamp card__stamp--no">TO THE SEA</span>
      </div>`;
    els.track.appendChild(travel);

    const card = travel.firstElementChild;
    const beltW = els.belt.clientWidth;
    const cardW = travel.offsetWidth;
    travel.style.setProperty('--from', `${beltW}px`);
    travel.style.setProperty('--to', `${-cardW - 10}px`);
    travel.style.setProperty('--travel', `${state.travelMs}ms`);
    travel.style.transform = `translateX(${beltW}px)`;
    travel.style.animation = `travel ${state.travelMs}ms linear forwards`;

    // timer bar runs as an animation (not a transition) so it can be paused too
    els.timerFill.style.animation = 'none';
    void els.timerFill.offsetWidth;
    els.timerFill.style.setProperty('--travel', `${state.travelMs}ms`);
    els.timerFill.style.animation = `timerDrain ${state.travelMs}ms linear forwards`;

    state.current = { item, travel, card, settled: false };
    els.live.textContent = `${item.name} on the belt`;

    travel.addEventListener('animationend', () => decide('miss'), { once: true });
    attachDrag(state.current);

    state.travelMs = Math.max(CONFIG.minTravelMs, state.travelMs - CONFIG.speedUpMs);
  }

  function decide(action) {
    const cur = state.current;
    if (!cur || cur.settled || !state.running) return;
    cur.settled = true;
    state.current = null;

    // freeze the travelling wrapper where it currently sits
    const beltRect = els.belt.getBoundingClientRect();
    const rect = cur.travel.getBoundingClientRect();
    cur.travel.style.animation = 'none';
    cur.travel.style.transform = `translateX(${rect.left - beltRect.left}px)`;
    els.timerFill.style.animationPlayState = 'paused';

    if (action === 'accept') {
      state.picked.push(cur.item);
      cur.card.classList.add('fly-right');
      cur.card.querySelector('.card__stamp--yes').style.opacity = 1;
      bumpZone(els.zoneBowl);
      els.chef.classList.add('cheer');
      later(() => els.chef.classList.remove('cheer'), 400);
      addToBowlStrip(cur.item);
      Sound.accept();
      els.live.textContent = `${cur.item.name} added. ${state.picked.length} of ${CONFIG.maxPicks}.`;
    } else if (action === 'reject') {
      state.rejected++;
      cur.card.classList.add('fly-left');
      cur.card.querySelector('.card__stamp--no').style.opacity = 1;
      bumpZone(els.zoneSea);
      splash(rect.left - beltRect.left);
      Sound.reject();
      els.live.textContent = `${cur.item.name} thrown into the sea.`;
    } else {
      flash('MISSED!');
      cur.travel.style.opacity = '0';
      cur.travel.style.transition = 'opacity .2s';
      Sound.miss();
      els.live.textContent = `${cur.item.name} rolled past.`;
    }

    updateHUD();
    later(() => cur.travel.remove(), 400);

    if (state.picked.length >= CONFIG.maxPicks) {
      flash('BOWL FULL!');
      later(bake, 700);
    } else if (state.cursor >= state.deck.length) {
      flash('BELT EMPTY!');
      later(bake, 700);
    } else {
      later(spawnNext, CONFIG.gapMs);
    }
  }

  function bumpZone(zone) {
    zone.classList.add('hot');
    later(() => zone.classList.remove('hot'), 220);
  }

  function splash(x) {
    const s = document.createElement('span');
    s.className = 'splash';
    s.textContent = '💦';
    s.style.left = `${Math.max(0, x)}px`;
    s.style.bottom = '10%';
    els.belt.appendChild(s);
    later(() => s.remove(), 750);
  }

  function flash(text) {
    els.flash.textContent = text;
    els.flash.classList.remove('show');
    void els.flash.offsetWidth;
    els.flash.classList.add('show');
  }

  function addToBowlStrip(item) {
    const li = document.createElement('li');
    li.title = item.name;
    li.innerHTML = sprite(`assets/ingredient-${item.id}.png`, item.emoji);
    els.bowlStrip.appendChild(li);
  }

  function updateHUD() {
    els.hudPicked.textContent = state.picked.length;
    els.countBowl.textContent = state.picked.length;
    els.countSea.textContent = state.rejected;
    els.hudBarFill.style.width = `${(state.picked.length / CONFIG.maxPicks) * 100}%`;
    els.hudBar.setAttribute('aria-valuenow', state.picked.length);
    els.hudPicked.parentElement.classList.add('pop');
    later(() => els.hudPicked.parentElement.classList.remove('pop'), 300);
  }

  /* ---------- input: keys, buttons, drag/swipe ---------- */

  function attachDrag(cur) {
    const { card, travel } = cur;
    let startX = 0, startY = 0, dx = 0, dragging = false;

    const onDown = e => {
      if (cur.settled) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY; dx = 0;
      card.setPointerCapture?.(e.pointerId);
      travel.style.animationPlayState = 'paused';
      els.timerFill.style.animationPlayState = 'paused';
    };

    const onMove = e => {
      if (!dragging || cur.settled) return;
      dx = e.clientX - startX;
      const dy = e.clientY - startY;
      card.style.transform = `translate(${dx}px, ${dy * 0.25}px) rotate(${dx * 0.06}deg)`;
      const yes = card.querySelector('.card__stamp--yes');
      const no  = card.querySelector('.card__stamp--no');
      yes.style.opacity = dx > 20 ? Math.min(1, (dx - 20) / CONFIG.swipeThreshold) : 0;
      no.style.opacity  = dx < -20 ? Math.min(1, (-dx - 20) / CONFIG.swipeThreshold) : 0;
    };

    const onUp = () => {
      if (!dragging || cur.settled) return;
      dragging = false;
      if (dx > CONFIG.swipeThreshold) return decide('accept');
      if (dx < -CONFIG.swipeThreshold) return decide('reject');
      // snap back and carry on down the belt
      card.style.transition = 'transform .18s ease-out';
      card.style.transform = '';
      card.querySelectorAll('.card__stamp').forEach(s => (s.style.opacity = 0));
      later(() => (card.style.transition = ''), 200);
      travel.style.animationPlayState = 'running';
      els.timerFill.style.animationPlayState = 'running';
    };

    card.addEventListener('pointerdown', onDown);
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerup', onUp);
    card.addEventListener('pointercancel', onUp);
  }

  document.addEventListener('keydown', e => {
    if (!state.running) {
      if (e.key === 'Enter' && els.views.start.classList.contains('view--active')) els.btnStart.click();
      return;
    }
    if (e.key === 'ArrowRight') { e.preventDefault(); decide('accept'); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); decide('reject'); }
  });

  els.btnAccept.addEventListener('click', () => decide('accept'));
  els.btnReject.addEventListener('click', () => decide('reject'));

  /* ---------- baking + results ---------- */

  const BAKING_LINES = [
    'Preheating the arcade…',
    'Whisking with unnecessary force…',
    'Consulting the recipe. Ignoring the recipe…',
    'Something is bubbling. That may be fine…',
    'Applying frosting at maximum velocity…'
  ];

  function bake() {
    if (!state.running) return;
    state.running = false;
    clearTimers();
    els.track.innerHTML = '';
    showView('baking');
    Sound.bake();

    BAKING_LINES.forEach((line, i) => {
      later(() => (els.bakingStatus.textContent = line), (CONFIG.bakeMs / BAKING_LINES.length) * i);
    });
    later(showResult, CONFIG.bakeMs);
  }

  function showResult() {
    const prof = buildProfile(state.picked);
    const cake = pickCake(prof);
    const stars = rateBake(prof);

    els.cakeName.textContent = `${cake.emoji} ${cake.name}`;
    els.cakeStars.textContent = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    els.cakeStars.setAttribute('aria-label', `${stars} out of 5`);
    els.cakeVerdict.textContent = `${cake.blurb} ${flavourText(prof, state.picked, state.rejected)}`;

    // cake-<id>.png takes over the moment the file exists
    els.cakeArt.innerHTML =
      `<img src="assets/cake-${cake.id}.png" alt="${cake.name}" data-fallback>` +
      cakeSVG(cake, state.birthday);
    // if the PNG loads, hide the drawn fallback underneath it
    const img = els.cakeArt.querySelector('img');
    img.addEventListener('load', () => {
      const svg = els.cakeArt.querySelector('svg');
      if (svg) svg.style.display = 'none';
      if (state.birthday) els.cakeArt.insertAdjacentHTML('beforeend',
        '<div class="candles"><i class="candle"></i><i class="candle"></i><i class="candle"></i></div>');
    });

    els.recap.innerHTML = state.picked.length
      ? state.picked.map(i => `<li>${sprite(`assets/ingredient-${i.id}.png`, i.emoji)}<span>${i.name}</span></li>`).join('')
      : '<li class="recap--empty">An empty bowl. Bold.</li>';

    // Record the bake. The first one ever unlocks the second chef.
    const hadChefChoice = chefsUnlocked(state.save);
    state.save.bakes += 1;
    Save.write(state.save);
    const justUnlocked = !hadChefChoice && chefsUnlocked(state.save);

    const who = state.playerName;
    els.banner.textContent = who ? `HAPPY BIRTHDAY, ${who}!` : 'HAPPY BIRTHDAY!';
    els.banner.hidden = !state.birthday;

    els.bakedBy.textContent = who
      ? `Baked by ${who}, with ${state.chef.name}`
      : `Baked with ${state.chef.name}`;

    const locked = CHEFS.find(c => c.id !== DEFAULT_CHEF.id);
    els.unlockName.textContent = locked.name;
    els.unlock.hidden = !justUnlocked;

    showView('result');
    Sound.win();

    if (justUnlocked) later(Sound.win, 700);
    if (state.birthday) Confetti.burst(2600);
  }

  /* ---------- confetti ---------- */

  const Confetti = (() => {
    const canvas = els.confetti;
    const ctx = canvas.getContext('2d');
    const colors = ['#ff2e8b', '#00e5ff', '#ffe14d', '#6cff5c', '#ffffff'];
    let bits = [], raf = null, stopAt = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      bits.forEach(b => {
        b.y += b.vy; b.x += b.vx; b.rot += b.vr;
        if (b.y > canvas.height + 20 && performance.now() < stopAt) { b.y = -20; b.x = Math.random() * canvas.width; }
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.c;
        ctx.fillRect(-b.s / 2, -b.s / 2, b.s, b.s * 0.6);
        ctx.restore();
      });
      bits = bits.filter(b => b.y < canvas.height + 40 || performance.now() < stopAt);
      if (bits.length) raf = requestAnimationFrame(frame);
      else { canvas.classList.remove('on'); raf = null; }
    }

    return {
      burst(durationMs) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        resize();
        canvas.classList.add('on');
        stopAt = performance.now() + durationMs;
        bits = Array.from({ length: 140 }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * -canvas.height,
          vx: (Math.random() - .5) * 1.6,
          vy: 2 + Math.random() * 4,
          s: 6 + Math.random() * 8,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - .5) * .3,
          c: colors[Math.floor(Math.random() * colors.length)]
        }));
        if (!raf) raf = requestAnimationFrame(frame);
      },
      stop() {
        if (raf) cancelAnimationFrame(raf);
        raf = null; bits = []; stopAt = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.classList.remove('on');
      }
    };
  })();

  window.addEventListener('resize', () => {
    if (els.confetti.classList.contains('on')) {
      els.confetti.width = window.innerWidth;
      els.confetti.height = window.innerHeight;
    }
  });

  /* ---------- game flow ---------- */

  function startGame() {
    clearTimers();
    Confetti.stop();
    state.deck = shuffle(INGREDIENTS);
    state.cursor = 0;
    state.picked = [];
    state.rejected = 0;
    state.travelMs = CONFIG.startTravelMs;
    state.birthday = els.birthday.checked;
    state.running = true;
    state.current = null;

    state.playerName = els.playerName.value.trim().replace(/\s+/g, ' ');
    state.save.name = state.playerName;
    Save.write(state.save);

    els.track.innerHTML = '';
    els.bowlStrip.innerHTML = '';
    els.hudMax.textContent = CONFIG.maxPicks;
    els.hudTotal.textContent = INGREDIENTS.length;
    els.hudSeen.textContent = '0';
    els.hudBar.setAttribute('aria-valuemax', CONFIG.maxPicks);
    updateHUD();

    showView('game');
    Sound.start();
    later(spawnNext, 500);
  }

  function resetToStart() {
    clearTimers();
    Confetti.stop();
    state.running = false;
    els.bakingStatus.textContent = BAKING_LINES[0];
    renderChefPicker();   // a chef unlocked this round shows up now
    showView('start');
  }

  els.btnStart.addEventListener('click', startGame);
  els.btnAgain.addEventListener('click', resetToStart);

  els.btnSound.addEventListener('click', () => {
    Sound.enabled = !Sound.enabled;
    els.btnSound.textContent = Sound.enabled ? '🔊' : '🔇';
    els.btnSound.setAttribute('aria-pressed', String(Sound.enabled));
  });

  // pause the belt if the player tabs away mid-decision
  document.addEventListener('visibilitychange', () => {
    const cur = state.current;
    if (!cur) return;
    const play = document.hidden ? 'paused' : 'running';
    cur.travel.style.animationPlayState = play;
    els.timerFill.style.animationPlayState = play;
  });

  // boot
  els.hudMax.textContent = CONFIG.maxPicks;
  els.hudTotal.textContent = INGREDIENTS.length;
  sweepSprites();
  window.addEventListener('load', sweepSprites);
  probeKitchen();

  els.playerName.value = state.save.name;
  els.playerName.addEventListener('change', () => {
    state.save.name = els.playerName.value.trim().slice(0, 16);
    Save.write(state.save);
  });
  renderChefPicker();

  // handy for tinkering from the console
  window.BAKERY = { INGREDIENTS, CAKES, buildProfile, pickCake, CONFIG };
})();
