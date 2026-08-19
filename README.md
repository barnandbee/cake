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

## Name, birthday and chefs

Enter your name on the start screen and it's remembered between visits. Tick
**It's my birthday!** for candles, confetti and a banner that reads *HAPPY
BIRTHDAY, &lt;name&gt;!*

You start with **Tara Tapir** on the checkout; the other three are earned. The
picker shows all four from the beginning, with locked chefs as silhouettes and
the condition to unlock them, and whoever you pick works the belt that round.

| Chef | Role | Unlocked by |
| --- | --- | --- |
| Tara Tapir | Checkout Chef | available from the start |
| Garrington Gecko | Sous Lizard | baking your first cake |
| Bernie Banana | Head of Batter | baking a 3-star cake |
| Brontë Bottlenose | Executive Chef | baking a 5-star cake |
| Mr. Finn Boffington | Pâtisserie Monster | baking 5 *different* cakes |
| Kyra Koala ft. Ernie Eagle | Airborne Grill Chief | a secret — the chip only hints at "a popular name" |

Finn's chip shows a running count (`3 / 5`) since collecting takes several
rounds. Repeats don't count — the save keeps the set of distinct cake ids, so
five Disaster Loaves still leaves you on 1 of 5.

Kyra is a hidden one: bake a cake with a particular name in the box (case and
surrounding spaces don't matter) and he turns up. The condition is `SECRET_NAME`
at the top of `game.js` if you need to look it up, and the wording on the locked
chip is deliberately vague.

Stars come from `rateBake()` — core ingredients and distinct flavours push the
rating up, chaos drags it down, and a bowl of two or fewer is capped low. Across
20,000 random bowls, 15% reach 3 stars and only 0.4% reach 5, so Brontë is a
real goal; play deliberately (keep the core six, skip the hot sauce) and 5 stars
is reliable. One good cake can unlock several chefs at once.

Name, chosen chef, bake count, best star rating and the set of cakes you've
baked live in `localStorage` under `cbbb.save.v1`.
Every read and write is wrapped in `try`/`catch`, so private mode or a browser
that refuses storage just means nothing is remembered — the game plays fine.
To replay the unlock, clear that key (or use a private window).

## Files

```
index.html   markup for all four screens (start / belt / baking / result)
style.css    arcade cabinet theme, belt + swipe animations
game.js      ingredient data, cake mapping, game engine
assets/      drop-in PNGs (see assets/README.md)
```

### Deploying: bump the cache buster

`index.html` loads `style.css?v=…` and `game.js?v=…`. **Change that version
whenever you edit the CSS or JS.**

The three files are coupled — `game.js` looks up specific element ids — so a
browser holding a cached older `game.js` against a freshly deployed
`index.html` can hit a missing element and break mid-round. The query string
forces browsers to fetch the matching files together.

As a backstop, the result screen renders inside a `try`/`catch` and always
switches views, so a mismatch degrades into a plain-looking cake instead of
stranding the player on the baking screen, and `game.js` logs a
`markup/script mismatch` warning at boot listing any elements it can't find.

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
