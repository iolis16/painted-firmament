# The Painted Firmament

An interactive constellation mythology explorer: a live star map of the sky above
your location right now, where each constellation can be viewed as its real stars
or as a hand-drawn mythological engraving pinned to those stars.

Live: https://firmament-ashy.vercel.app
Published artifact: https://claude.ai/artifact/1kzk8V1p4V4QCRq74offDq

Everything runs client-side in one HTML file. No framework, no backend, no
external data: the star catalog and the 47 engravings are embedded.

## Deploy

The build writes a static site to `dist/`. `vercel.json` already points Vercel at
it, so either of these works:

```sh
npx vercel            # from this folder; follow the prompts, then `npx vercel --prod`
```

or push the repo to GitHub and import it at vercel.com/new (framework preset:
Other). Any static host works the same way: run `node build.js` and serve `dist/`.
Geolocation needs HTTPS, which Vercel provides.

To try it locally: `npm start` (builds, then serves `dist/` on a local port).

## Layout

| Path | Purpose |
|---|---|
| `src/catalog.js` | 502 bright stars (J2000 RA/Dec, magnitude, distance, tint) and 47 constellations with line figures and myth text |
| `src/art.js` | the 47 SVG engravings, each drawn in its constellation's local sky frame |
| `src/app.js` | astronomy (sidereal time, alt/az, stereographic projection), canvas renderer, SVG figure fitting, UI |
| `src/template.html` | markup and CSS |
| `build.js` | inlines everything into `dist/index.html` (deployable page) and `dist/firmament.artifact.html` (the fragment the claude.ai artifact host wraps) |
| `tools/frames.js` | computes each constellation's local drawing frame (gnomonic, north up, east left, 10 units per degree) and writes `tools/frames.json` |
| `tools/preview.js` | renders one constellation's stars plus its engraving to a PNG with headless Chrome, for checking art alignment |
| `tools/montage.py` | tiles several previews into one image |

## Build

```sh
cd tools && node frames.js && cd ..   # regenerate frames.json (only needed if catalog.js changes)
node build.js                          # writes dist/index.html
open dist/index.html
```

## Checking an engraving

```sh
cd tools
node preview.js Ori        # writes pv_Ori.png (needs Google Chrome installed)
python3 montage.py Ori UMa Cyg
```

Star coordinates in each frame are printed by `node frames.js Ori`. Draw paths in
those units; at runtime a least-squares similarity fit maps the frame onto the
projected stars, so the figure follows the real sky.

## Deep links

`dist/index.html#lat=40.71&lon=-74.01&label=New%20York&con=Ori&myth=1&h=9`
sets location, opens a constellation, switches to the mythic view and offsets the
time by nine hours.
