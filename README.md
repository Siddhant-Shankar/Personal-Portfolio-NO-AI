# Siddhant Shankar — The City

An explorable, living city where each building holds a chapter of my work. Eleven landmarks hold eight professional chapters, public projects, research, and an about page. It is built with hand-written WebGL and plain browser JavaScript, with no framework, build step, or downloaded 3D assets.

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

**The index** lists every chapter and starts a guided story tour. The complete text-based portfolio is in `field-notes.html` and needs no JavaScript or WebGL. Old links to `field.html` redirect to the home page.

### A living city

- **Day and night.** A full day lasts six minutes and starts at the visitor's local hour. The sun crosses the sky, then a cool moonlight takes over. After dusk, about half the windows, plus shopfronts, plaques, street lamps, and vehicle lights, glow under stars. The clock can be paused, and **T** or **+1h** skips ahead. `?hour=19.5` opens at a chosen time.
- **Street life.** Thirty-two pedestrians walk the pavements. Sixteen vehicles, including a city bus and delivery vans, drive two-way street circuits. A ferry, a barge, and a rowing boat travel the canal under raised bridges. A flock circles the park, and the makers' warehouse chimney smokes.
- **Solid objects.** Trees, lamp posts, sign posts, benches, and the canal block walking, and you slide along them. The bridges are walkable: you climb the steps and cross the raised deck. Cars, the bus, pedestrians, and animals are solid as well. Cars brake for a visitor in front of the bumper and queue behind the car ahead, and pedestrians wait for you to step aside. Guided walks plan around everything on a half-metre grid (A*, then straightened into a few legs). If a guide is blocked by traffic for more than a moment, it steps through rather than deadlocking.
- **Inspect anything that moves.** Click a car, bus, person, boat, or animal to open a live card with its route, heading, nearby landmark, and errand. In City view, **Follow** glides to a chase camera. All city-life details are fictional.

Run `node --test tests/*.cjs` to run every suite. The new tests cover sky continuity across midnight, pavement and canal bounds, forward-only pedestrian movement, bird clearance over rooftops, and all sixteen vehicle circuits. The day cycle, street life, and inspection cards were also checked in headless Chrome at desktop and phone sizes, with no console errors. This was automated QA, not hands-on testing on a phone.

## Run locally

```sh
python -m http.server 8000 --directory dist
```

Open http://localhost:8000. No dependencies are required. Run the tests with `node --test tests/*.cjs`.

The public repository intentionally excludes `dist/resume.pdf`. To enable local résumé links, supply an approved PDF at that path.

## Source map

| File | Purpose |
| --- | --- |
| `dist/index.html` | Page shell, story / index / contact / help dialogs |
| `dist/stories.js` | Career chapters, the index, and dialogs (`window.Portfolio`) |
| `dist/discoveries.js` | Guided story tour and three fictional, hands-on engineering demos |
| `dist/career-data.js` | Experience, projects, and research content |
| `dist/field-city.js` | City layout, landmarks, props, bridges, and traffic circuits |
| `dist/field-core.js` | Geometry builder, matrices, collision, and A* route planning |
| `dist/field-renderer.js` | WebGL renderer: sun and moon lighting, glowing windows, haze |
| `dist/field-sky.js` | Six-minute day/night cycle |
| `dist/field-life.js` | Pedestrians, braking traffic, boats, birds, and smoke |
| `dist/field-wildlife.js` | Park animals, plus assembling the moving-object mesh |
| `dist/field-camera.js` | Overview framing and free flight |
| `dist/field.js` | Walking, input, labels, clock, and the main loop |
| `dist/field-navigation.js` | Illustrated city map, guided walking, and touch pad |
| `dist/field-inspect.js` | Click-to-inspect cards and follow camera |
| `dist/world.css`, `dist/field.css` | Base styles and city interface |
| `dist/field-notes.html`, `app.js`, `style.css` | Text-based portfolio |

See [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md) for the references and what was taken from each.

## Content

Career content was assembled in October 2026 from user-provided résumés, engineering accounts, and public GitHub history. Rare Billions dates were not supplied and are not invented. Parasol is shown at year precision because older documents differ. Employer code, live telemetry, and customer data are not included. Demonstrations use fictional records and simplified models. The AI learning-product exploration is customer discovery, not a launched product.

## Incremental workflow

Complete a meaningful feature or fix, validate it, commit with a descriptive message, and push before beginning the next milestone. Do not squash unrelated features into a final bulk commit or create unfinished commits simply to increase their number. Preserve concurrent remote changes.

Sites publishes this workspace using its existing identity and access settings. GitHub receives corresponding incremental snapshots through the connected API; Sites and GitHub commit hashes differ. Exclude the résumé PDF from GitHub snapshots.
