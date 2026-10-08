# City portfolio experiment — feature/living-world

Open `field.html` for the new explorable city. `index.html` preserves the existing illustrated fox trail. The two routes share the same verified career data, stories, résumé access, and text alternative.

The city has eleven distinct career buildings, an illustrated atlas drawn from the actual world coordinates, collision-aware guided walking, keyboard and touch controls, and sixteen procedural animals. Rabbits, chickens, foxes, and deer alternate between resting and wandering and move aside when approached. Reduced-motion preferences pause ambient wildlife, skip the camera transition, and remove head bob. The City life control explicitly resumes or pauses wildlife. The opening view presents the whole city; Walk the streets enters at ground level. Ten small cars and delivery vans follow smooth street circuits, while most wildlife stays in the central park. Opening a dialog pauses movement; hidden tabs stop the render loop.

Use WASD to walk, drag to look, E to open a nearby chapter, and M for the field map. Choose **City view** or press **V** for an elevated overview and creative-style free flight. WASD moves horizontally, Space rises, C descends, Shift flies faster, and the wheel moves closer or farther. **R** frames the entire world; **On foot** returns to the preserved ground position. Touch users have rise/descend buttons alongside the directional pad. Choose **Walk here** for a guided journey; WASD, Escape, or the stop button cancels it. **The index** and **Read the chapter** provide direct access without playing.

The 3D renderer uses WebGL with no runtime framework or asset download. Static geometry is batched; animated wildlife has a separate buffer. Buildings, roofs, trees, canal, streets, vehicles, and animals are original procedural geometry. The atlas is an SVG/HTML interface, not a geographic mapping service or a dependency on an unidentified “inked maps” product.

Validation: `node --test tests/field-core.test.cjs tests/field-wildlife.test.cjs tests/field-camera.test.cjs tests/field-city.test.cjs`. This covers all 121 landmark journeys, camera projection, deterministic geometry, collisions, a five-minute wildlife simulation, overview framing across screen shapes, camera transitions, flight bounds, exact return-to-walking behaviour, traffic path continuity, and building avoidance. JavaScript and local asset checks also pass. Browser visual and interaction QA remains unavailable for this managed static-site project; this is a candidate design for review, not a claim of visual parity with the reference games.

See [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md) for observed references and the choices taken from each.

---

# Siddhant Shankar — A Living Body of Work

A playable fox adventure through an illustrated tree: eighteen connected stops, eight professional chapters, five public projects, and ongoing research. HTML, CSS, and browser JavaScript; no build step or framework.

## Explore

Choose **Play the fox trail**. Use arrow keys, WASD, or the visible route buttons to hop between connected branches. A close camera follows the fox continuously through a tilted illustrated world. Select **Fox-eye view** for the closer viewpoint, or **Follow behind** to see the fox. This uses CSS perspective over the illustration, not a fully modeled 3D environment. Collect the research firefly at Parasol Lab, the systems firefly at The Boring Company, and the product firefly at Hyphenate, then bring them to the crown.

Five wind crossings alternate between GUST and CLEAR. A gust returns the fox to its last checkpoint without losing collected fireflies. **Calm mode** removes the timing challenge and is enabled automatically for reduced-motion visitors. The game pauses its wind clock when a dialog is open or the tab is hidden.

At a career stop, press E or select **Read this chapter**. Reading is optional during play. The index, original guided story tour, free exploration, and complete text portfolio remain available. There are no game accounts or remote progress tracking; a page reload starts a new run.

Three fictional demonstrations let visitors trace a telemetry signal, reconcile duplicate transactions, and explore parallel speedup. The full text-based portfolio remains in `field-notes.html`.

The tree illustration is generated artwork. Camera movement, labels, particles, and stories are implemented in code. This is an illustrated world, not a 3D simulation.

## Run locally

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. No dependencies are required. Optional Google Fonts have local fallbacks.

The public repository intentionally excludes `dist/resume.pdf`; the PDF remains on the owner-private Site. To enable local résumé links, supply an approved PDF at that path. Publishing that PDF to public GitHub requires the owner's explicit approval.

## Source map

| File | Purpose |
| --- | --- |
| `dist/index.html` | Scene, controls, and dialogs |
| `dist/world.css` | Styling and responsive layouts |
| `dist/world.js` | Camera, inputs, stories, and index |
| `dist/discoveries.js` | Guided trail, demonstrations, and ambient motes |
| `dist/trail-model.js` | Graph, movement rules, fireflies, wind timing, and checkpoints |
| `dist/trail-game.js`, `dist/trail-game.css` | Fox animation, camera following, game controls, and finale |
| `tests/trail-model.test.cjs` | Deterministic game-rule tests |
| `dist/career-data.js` | Experience, projects, and research |
| `dist/field-notes.html` | Complete text-based portfolio |
| `dist/app.js`, `dist/style.css` | Field-guide behavior and presentation |
| `dist/living-tree.webp` | Optimized illustrated artwork |

## Content

Career content was assembled in October 2026 from user-provided résumés, engineering accounts, and public GitHub history. Rare Billions dates were not supplied and are not invented. Parasol is shown at year precision because older documents differ. Employer code, live telemetry, and customer data are not included. Demonstrations use fictional records and simplified models. The AI learning-product exploration is customer discovery, not a launched product.

## Incremental workflow

Complete a meaningful feature or fix, validate it, commit with a descriptive message, and push before beginning the next milestone. Do not squash unrelated features into a final bulk commit or create unfinished commits simply to increase their number. Preserve concurrent remote changes.

Sites publishes this workspace using its existing identity and access settings. GitHub receives corresponding incremental snapshots through the connected API; Sites and GitHub commit hashes differ. Exclude the résumé PDF from GitHub snapshots.

## Motion

Hops use eased movement, a separate body-lift arc, and distance-based duration. The camera tracks ground position with frame-rate-independent damping, preventing jump height from shaking the view. One subsequent hop can be buffered during movement. Reduced-motion preferences disable the hop animation and camera easing.

## Validation

Run `node tests/trail-motion.test.cjs` for camera consistency across frame rates and exact hop endpoints.

Run `node tests/trail-model.test.cjs` to verify graph connectivity, legal moves, direction selection, reward deduplication, crown requirements, wind timing boundaries, and checkpoint recovery.


JavaScript syntax, DOM references, local assets, field-guide links, script loading order, and demo calculations were checked. Native dialogs, keyboard controls, visible focus, reduced-motion handling, and a text-based alternative are included. Browser visual and interaction QA was unavailable in the managed static-site preview environment. Responsive layouts and touch interactions still need a real-browser review.

## Design references

- https://eliotreads.substack.com/p/every-cs-student-has-the-same-portfolio
- https://www.wearedevelopers.com/magazine/161-top-23-web-developer-portfolio-examples-to-inspire-your-own
- https://bruno-simon.com/
- https://ciechanow.ski/
- https://www.joshwcomeau.com/
- https://brittanychiang.com/
- https://constancesouville.com/

The user-supplied AI Tool Pick checklist could not be retrieved; no claim is made that its content was reviewed.
