# Assets

Drop PNGs in this folder and they take over automatically — no code changes
needed. Every image is rendered as an `<img>` sitting on top of an emoji
fallback; if the file is missing the `<img>` hides itself and the emoji shows
through. If the file exists, it wins.

Transparent PNGs, square, ~256×256 (cakes ~512×512) work best. Pixel art is
rendered with `image-rendering: pixelated`.

## Scene art (shipped)

| File | Size | Used for |
| --- | --- | --- |
| `kitchen-bg.png` | 1376×768 | The bakery — backdrop for the belt, dimmed behind the other screens |
| `chef-tara.png` | 203×420 | Tara Tapir, Checkout Chef (available from the start) |
| `chef-garrington.png` | 280×420 | Garrington Gecko, Sous Lizard (first bake) |
| `chef-bernie.png` | 218×420 | Bernie Banana, Head of Batter (3-star cake) |
| `chef-bronte.png` | 256×420 | Brontë Bottlenose, Executive Chef (5-star cake) |
| `bowl.png` | 200×189 | Mixing bowl zone — cropped from the kitchen scene |
| `sea-splash.png` | 160×358 | Sea zone — cropped from the kitchen scene |

Every chef sprite is the source art cut out, trimmed to the character's
bounding box and scaled to a shared **420px height**, so they all stand the
same size — the differing widths are just tails, stalks and fins. Each chef's
`aspect` in the `CHEFS` array in `game.js` must match its PNG, since sprites
are sized by height and the aspect ratio supplies the width.

Source art arrives in two shapes, and the cutout has to match:

- **Real alpha** (Tara, Brontë) — only the soft glow halo needs stripping.
  This path is colour-agnostic, which matters for Brontë: she is grey, and a
  colour-keyed fill would eat her.
- **Checkerboard baked into RGB** (Garrington, Bernie) — flood fill the
  checker from the borders, loose enough to catch the anti-aliased blends
  between squares (they form a connected mesh across the whole image), then
  clear enclosed pockets and keep only the largest blob, which drops the
  stray sparkle artefacts these files carry.

`bowl.png` and `sea-splash.png` are crops of `kitchen-bg.png` so the side
panels match the room.

### Adding another chef

Add an entry to `CHEFS` in `game.js` (`id`, `name`, `role`, `emoji`, `sprite`,
`aspect`, `line`) and drop the PNG in here. Give it an `unlock` of
`{ hint, test }` where `test` reads the save (`bakes`, `bestStars`), or omit
`unlock` to make the chef available from the start. The picker, the lock
states and the result-screen announcement all render from that array, so
nothing else needs changing.

### How the kitchen lines up with the belt

`kitchen-bg.png` is a CSS background on `.belt`, sized `auto 100%` — scaled by
**height**, cropped horizontally from the centre. That makes the vertical
mapping exact at any screen width, so the conveyor's top rail always lands at
the same fraction of the container: **y = 465/768 = 60.5%**.

Cards are parked on that line by the `--card-bottom` custom property in
`style.css` (37% from the bottom, which puts a card's base in the middle of the
belt's top surface). **If you replace the kitchen art, re-measure the rail and
update `--card-bottom` to `100% − railFraction − a few %`.**

Because it's a CSS background it can't use the `<img>` fallback trick, so
`game.js` probes the file on boot and adds `has-kitchen` to `<html>` only if it
loads. Delete the file and the game falls back to the CSS-drawn belt and wall.

## Ingredients

`ingredient-1.png` … `ingredient-40.png` — the id matches the `id` field in the
`INGREDIENTS` array in `game.js`:

| # | Ingredient | # | Ingredient | # | Ingredient | # | Ingredient |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Flour | 11 | Lemon Zest | 21 | Chili Flakes | 31 | Edible Glitter |
| 2 | Sugar | 12 | Espresso Shot | 22 | Gummy Bears | 32 | Hot Sauce |
| 3 | Eggs | 13 | Orange Blossom | 23 | Pineapple | 33 | Stinky Cheese |
| 4 | Butter | 14 | Almond Extract | 24 | Seaweed | 34 | Pickles |
| 5 | Milk | 15 | Cinnamon | 25 | Marshmallows | 35 | Garlic |
| 6 | Baking Powder | 16 | Maple Syrup | 26 | Caramel Sauce | 36 | Energy Drink |
| 7 | Vanilla | 17 | Chocolate Chips | 27 | Peanut Butter | 37 | Popcorn |
| 8 | Cocoa Powder | 18 | Blueberries | 28 | Coconut Flakes | 38 | Bubblegum |
| 9 | Strawberry Extract | 19 | Cherries | 29 | Banana | 39 | Ketchup |
| 10 | Matcha Powder | 20 | Sprinkles | 30 | Cream Cheese | 40 | Sardines |

## Cakes

`cake-1.png` … `cake-30.png` — ids match the `CAKES` array in `game.js`:

| # | Cake | # | Cake | # | Cake |
| --- | --- | --- | --- | --- | --- |
| 1 | Classic Victoria Sponge | 11 | Matcha Green Tea Delight | 21 | Maple Syrup Stack |
| 2 | Decadent Chocolate Fudge | 12 | Tiramisu Tower | 22 | Vanilla Bean Showpiece |
| 3 | Strawberry Shortcake | 13 | Blueberry Muffin Cake | 23 | Fruit Salad Fantasia |
| 4 | Funfetti Party Bomb | 14 | Tropical Pineapple Surprise | 24 | Spicy Chili Chocolate Crunch |
| 5 | Red Velvet Dream | 15 | Coconut Cloud Cake | 25 | Hot Sauce Volcano |
| 6 | Lemon Drizzle Loaf | 16 | Banoffee Banana Bomb | 26 | Glittering Mermaid Cake |
| 7 | Marshmallow S'mores Stack | 17 | Peanut Butter Cup Cake | 27 | Salty Seaweed Mystery |
| 8 | Cheesecake Cloud | 18 | Salted Caramel Cathedral | 28 | Bubblegum Arcade Cake |
| 9 | Cinnamon Spice Stack | 19 | Citrus Burst Sunshine Cake | 29 | Stinky Cheese Nightmare |
| 10 | Black Forest Gateau | 20 | Almond Marzipan Marvel | 30 | The Disaster Loaf |

Until `cake-<id>.png` exists, the result screen draws the cake as an inline SVG
using that cake's `col` palette (and adds candles in birthday mode).
