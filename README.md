# 🎂 Conveyor Belt Birthday Bakery

A classic-arcade web game set in a seaside pixel-art bakery. Ingredients ride
the conveyor belt past **Tara Tapir**, the Checkout Chef, and you decide: **into
the mixing bowl**, or **into the sea** (which is right there, through the
window). Whatever ends up in the bowl gets baked into one of 30 cakes — no
matter how ill-advised your choices were.

Vanilla HTML/CSS/JS. No build step, no dependencies, no npm install.

## Play

Open `index.html` in a browser. That's it.

To host on GitHub Pages: push to your repo, then **Settings → Pages → Source:
Deploy from a branch**, pick the branch and the `/ (root)` folder. The game
will be live at `https://<user>.github.io/<repo>/`.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Add to bowl | `→` or the **Add** button | swipe the card right |
| Throw in the sea | `←` or the **Discard** button | swipe the card left |

Items you don't decide on roll off the end of the belt. 40 ingredients pass by;
the bowl holds 15. The round ends when the bowl is full or the belt runs dry.

Tick **It's my birthday!** on the start screen for candles, a floating banner
and confetti on the result.

## Files

```
index.html   markup for all four screens (start / belt / baking / result)
style.css    arcade cabinet theme, belt + swipe animations
game.js      ingredient data, cake mapping, game engine
assets/      drop-in PNGs (see assets/README.md)
```

## How the cake is chosen

Every ingredient carries a set of flavour axes (`choc`, `citrus`, `chaos`,
`ocean`, `funk`, …). Your bowl is summed into a **profile**, and each of the 30
cakes scores that profile:

- **needs** — the ingredient a cake is named after, worth a big flat bonus
- **combo** — signature pairs (cocoa + cream cheese → Red Velvet)
- **likes / hates** — weights over the flavour axes, so classic cakes actively
  repel chaos and savoury notes
- the `base` axis (flour, eggs, butter) is **capped**, so staples can't drown
  out the flavour you actually chose

Highest score wins, and something always comes out of the oven — an empty bowl
or a pile of sardines both resolve to The Disaster Loaf. All 30 cakes are
reachable (verified across 20,000 randomised bakes).

Poke at it from the browser console:

```js
BAKERY.pickCake(BAKERY.buildProfile([8, 30].map(id =>
  BAKERY.INGREDIENTS.find(i => i.id === id)
))).name  // "Red Velvet Dream"
```

## Art

The bakery and Tara Tapir ship in `assets/`. Ingredient and cake art doesn't —
those still render as emoji until you add them.

Every sprite is an `<img>` layered over an emoji fallback. Drop a PNG into
`assets/` with the right filename and it takes over automatically — no code
changes. Missing files silently fall back to emoji, which is why the game still
runs with an empty `assets/` folder (you get the CSS-drawn belt instead of the
kitchen). See [`assets/README.md`](assets/README.md) for the full filename map
and for how the kitchen backdrop is aligned to the conveyor.

## Tuning

The knobs live at the top of `game.js`:

```js
const CONFIG = {
  maxPicks: 15,        // bowl capacity
  startTravelMs: 4200, // belt speed at the start
  speedUpMs: 85,       // how much faster each item gets
  minTravelMs: 1900,   // speed cap
  swipeThreshold: 70,  // px of drag before a swipe registers
  bakeMs: 3200
};
```

## Accessibility notes

Keyboard playable, live-region announcements for each item and decision, and
`prefers-reduced-motion` is respected for decoration (the belt keeps moving —
it's the gameplay). Sound is generated with the Web Audio API and can be muted
with the 🔊 button.
