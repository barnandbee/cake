# Assets

Drop PNGs in this folder and they take over automatically — no code changes
needed. Every image is rendered as an `<img>` sitting on top of an emoji
fallback; if the file is missing the `<img>` hides itself and the emoji shows
through. If the file exists, it wins.

Transparent PNGs, square, ~256×256 (cakes ~512×512) work best. Pixel art is
rendered with `image-rendering: pixelated`.

## Scene art

| File | Used for |
| --- | --- |
| `chef-character.png` | Checkout Chef sprite (start screen + belt) |
| `conveyor-belt-bg.png` | Belt surface — see note below |
| `bowl.png` | Mixing bowl (accept zone) |
| `sea-splash.png` | The sea (discard zone) |

The belt surface is currently drawn in CSS. To use your own art, add this to
`style.css`:

```css
.belt__surface {
  background-image: url("assets/conveyor-belt-bg.png");
  background-size: auto 100%;
  background-repeat: repeat-x;
}
```

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
