# Siddhant Shankar — The City

An explorable, living city where each building holds a chapter of my work. Eleven landmarks hold eight professional chapters, public projects, research, and an about page. It is drawn with three.js (r160, vendored in `dist/vendor`) and plain browser JavaScript, with no framework, build step, or downloaded 3D assets. All geometry is procedural.

## First screen

A static panel paints before any JavaScript or WebGL runs. It shows role and school, what I'm doing now, and three verified results: 3 enterprise customers in three months and 99% line-item correctness at Hyphenate, plus 50 beta users for Zaap AI. It links to the case studies, email, GitHub, and LinkedIn. If WebGL is unavailable, the panel stays and its button opens the index.

The three case studies live in `notes.html` and can be linked directly: `#case-flux`, `#case-data`, `#case-signal`. The index dialog leads with them as **Selected work**.

## Explore

The site opens on an overview of the city. Choose **Walk the streets** to go to ground level, or **City view** (**V**) to fly freely.

| Action | Controls |
| --- | --- |
| Walk / fly | WASD or arrows. Shift goes faster. In City view, Space rises and C descends. |
| Look | Drag the scene, or choose **Mouse look** |
| Read a chapter | Walk up to a building and press **E**, or use **The index** |
| City map | **M**. Pick a place, then **Walk here** for a guided walk |
| Frame the whole city | **R** in City view |
| Skip an hour | **T** or **+1h**. `?hour=19.5` opens at a chosen time |
| Inspect | Click any car, bus, boat, person, or animal |

**The index** lists every chapter and starts a guided story tour. The complete text-based portfolio is in `notes.html` and needs no JavaScript or WebGL. Old links to `field.html` and `field-notes.html` redirect to their new homes.

### A living city

- **Day and night.** A full day lasts six minutes and starts at the visitor's local hour. The sun crosses the sky, then a cool moonlight takes over. After dusk, about half the windows, plus shopfronts, plaques, street lamps, and vehicle lights, glow under stars. The clock can be paused, and **T** or **+1h** skips ahead. `?hour=19.5` opens at a chosen time.
- **Street life.** Thirty-two pedestrians walk the pavements. Sixteen vehicles, including a city bus and delivery vans, drive two-way street circuits. A ferry, a barge, and a rowing boat travel the canal under raised bridges. A flock circles the park, and the makers' warehouse chimney smokes.
- **Buildings that tell their story.** A tunnel boring machine's cutter head turns at The Boring Company yard. Hyphenate shows a live ledger. Parasol Lab's telescope sweeps the sky above a panel that lights up a parallel reduction. A conversation scrolls on Zaap AI's rooftop phone, and a ticker circles the APAC exchange. The five public projects are on show around the makers' warehouse: an RL drone, a rooftop F1 circuit, a sketch-classifier easel, an attention grid, and a chat wall. Clicking any of them opens a card of verified facts with links to the chapter, case study, or GitHub repo.
- **Solid objects.** Trees, lamp posts, sign posts, benches, and the canal block walking, and you slide along them. The bridges are walkable: you climb the steps and cross the raised deck. Cars, the bus, pedestrians, and animals are solid as well. Cars brake for a visitor in front of the bumper and queue behind the car ahead, and pedestrians wait for you to step aside. Guided walks plan around everything on a half-metre grid (A*, then straightened into a few legs). If a guide is blocked by traffic for more than a moment, it steps through rather than deadlocking.
- **Inspect anything that moves.** Click a car, bus, person, boat, or animal to open a live card with its route, heading, nearby landmark, and errand. In City view, **Follow** glides to a chase camera. All city-life details are fictional.

Run `npm test` to run every suite. The new tests cover sky continuity across midnight, pavement and canal bounds, forward-only pedestrian movement, bird clearance over rooftops, and all sixteen vehicle circuits. The day cycle, street life, and inspection cards were also checked in headless Chrome at desktop and phone sizes, with no console errors. This was automated QA, not hands-on testing on a phone.

## Run locally

```sh
npm start            # or: python -m http.server 8000 --directory dist
```

Open http://localhost:8000. No dependencies are required. The live site is https://siddhant-shankar.github.io/siddhant-city/, deployed from `dist/` by `.github/workflows/pages.yml` on every push to `main`. Link previews (`og:image`, `og:url`) use that address; update them if you move to a custom domain. Run the tests with `npm test`.

The public repository intentionally excludes `dist/resume.pdf`. To enable local résumé links, supply an approved PDF at that path.

## How the code is organised

```
dist/                     everything the site serves (no build step)
├── index.html            the city page: first screen, dialogs, script order
├── notes.html            the text-only portfolio and three case studies
├── css/                  base.css (shared), city.css (city UI), notes.css
├── images/og-image.png   social preview
└── js/
    ├── content/          what the site says
    │   ├── career-data.js    every role, project, and research note (edit this to change content)
    │   ├── stories.js        chapter panels, the index, contact and help dialogs
    │   ├── tour.js           guided story tour and the three hands-on demos
    │   └── resume-check.js   hides résumé links if resume.pdf isn't deployed
    ├── city/             the 3D city, in load order
    │   ├── sky.js            time of day → sun, sky colours, how many lights are on
    │   ├── layout.js         where everything is: buildings, streets, props, bridges, traffic loops
    │   ├── core.js           maths, the geometry builder, collision, and route finding
    │   ├── renderer.js       three.js drawing: light, shadows, outlines, glowing windows
    │   ├── landmarks.js      animated set pieces and project exhibits, plus their facts
    │   ├── life.js           pedestrians, braking traffic, boats, birds, smoke
    │   ├── wildlife.js       park animals; assembles everything that moves each frame
    │   ├── camera.js         overview framing and free flight
    │   ├── main.js           walking, input, labels, the clock, and the main loop
    │   ├── map.js            the illustrated city map and guided walks
    │   └── inspector.js      click-to-inspect cards and the follow camera
    ├── notes/notes.js    interactive case studies on notes.html
    └── vendor/           three.js r160 (MIT)
tests/                    node:test suites, one per city module
```

Each city module is a plain script that adds one global (`CityLayout`, `CityCore`, `CitySky`, and so on), so the files read top to bottom without a bundler. In Node they also export the same object, which is how the tests load them. To change what the site says, edit `career-data.js`. To move things around the city, start with `layout.js`.

| Command | What it does |
| --- | --- |
| `npm start` | Serves `dist/` at http://localhost:8000 |
| `npm test` | Runs every test suite |
| `npm run format` | Formats the code with Prettier |

See [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md) for the references and what was taken from each.

## Content

Career content was assembled in October 2026 from user-provided résumés, engineering accounts, and public GitHub history. Rare Billions dates were not supplied and are not invented. Parasol is shown at year precision because older documents differ. Employer code, live telemetry, and customer data are not included. Demonstrations use fictional records and simplified models. The AI learning-product exploration is customer discovery, not a launched product.

## Incremental workflow

Complete a meaningful feature or fix, validate it, commit with a descriptive message, and push before beginning the next milestone. Do not squash unrelated features into a final bulk commit or create unfinished commits simply to increase their number. Preserve concurrent remote changes.

Sites publishes this workspace using its existing identity and access settings. GitHub receives corresponding incremental snapshots through the connected API; Sites and GitHub commit hashes differ. Exclude the résumé PDF from GitHub snapshots.
