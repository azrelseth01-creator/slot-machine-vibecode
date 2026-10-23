# vibecode-rng

A 1971 wooden slot machine that picks something for you to vibecode: a game, a lesson, or a dash of rainbow.
Pull the lever, watch the 3D reel spin, and get a ticket with a ready-to-paste starter prompt. A jazz
band plays from a looping phonograph in the corner.

It is a plain static site: **no build step, no dependencies, no framework.**

```
vibecode-rng/
├── index.html            page markup + the inline phonograph SVG
├── vercel.json           clean URLs + a couple of security headers
├── css/
│   ├── style.css         page, 3D cabinet, reel drum, lever, ticket
│   └── phonograph.css    every phonograph animation (one 28s play cycle, loops forever)
├── js/
│   ├── data.js           the idea list (edit this to add your own)
│   ├── audio.js          sound effects + the procedural jazz band (Web Audio, no audio files)
│   ├── tilt.js           mouse-follow 3D tilt, freezes while you use the lever
│   ├── machine.js        3D reel drum, spin, result ticket, history
│   ├── lever.js          the draggable lever
│   └── ui.js             copy button, sound/music toggles, audio unlock
└── assets/
    ├── favicon.svg       slot-machine icon (also .ico, 32px png, apple-touch, 192/512 + maskable pngs)
    ├── manifest.webmanifest
    └── og.png            1200x630 social preview
```

## Run it locally

Open `index.html` directly, or serve the folder:

```sh
npx serve .          # or: python3 -m http.server 8000
```

## Deploy to Vercel

Any of these works. Use the project name `vibecode-rng` to get `vibecode-rng.vercel.app`.

- **Dashboard:** vercel.com/new, then drag the unzipped `vibecode-rng` folder in (or import a Git repo containing it).
  Framework preset: **Other**. Leave build command and output directory empty.
- **CLI:** from inside the folder run `npx vercel` (preview) or `npx vercel --prod`.

## Controls

| Action | How |
| --- | --- |
| Pull | drag the red knob down, or tap it, or press the **PULL THE LEVER** button, or Space |
| Partial pull | past about two thirds the lever finishes the pull for you; less and it springs back |
| Music | starts on your first click or tap (browsers block autoplay); click the phonograph or **MUSIC** to toggle |
| Sound effects | **SFX** button |

## Add your own ideas

Open `js/data.js` and add a row to any list in `IDEAS`:

```js
['Title', 'One-line pitch shown on the ticket.', 'The starter prompt body.'],
```

Categories are `game`, `edu` and `rainbow`. Each category is picked with equal odds, then a random idea inside it.

## Notes

- Fonts (Rye, Alfa Slab One, Special Elite) load from Google Fonts; the page falls back to serif/monospace offline.
- The jazz is generated live in the browser: a swung ii-V-I loop at 112 BPM with walking bass, piano, a wandering
  melody, brushes, and vinyl crackle. It never repeats exactly.
- Respects `prefers-reduced-motion` (idle sway and decorative loops are switched off).
