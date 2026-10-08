# Living world design references

The city began on `feature/living-world` and is now the home page. The original illustrated tree and fox trail were retired in favour of it.

## Factory Yard

https://github.com/Khalidabdi1/factory

Inspected the repository README, package metadata, file tree, screenshot, and camera implementation. The reference is an isometric town with fine outlines, restrained controls, place navigation, and contextual inspection cards. We translate its place-based discovery into a small first-person world and an illustrated overview atlas. The portfolio does not need the factory simulation's economy or full control surface. No license was found in the inspected Factory repository, so its implementation and assets were not copied into this project.

## Dilum Sanjaya's cozy village

https://x.com/DilumSanjaya/status/2089033113460727968
https://x.com/DilumSanjaya/status/2089179586911482146

Viewed the village video poster and read the creator's expanded aesthetic notes. The image uses grouped simple buildings, coloured roofs, greenery, warm interface panels, paths, and water. Full video playback was unavailable. The useful design principles are a coherent palette, readable silhouettes, a small interface, and intermittent ambient motion. Our scene uses pitched roofs, clustered trees, a meadow brook, warm paper controls, and resting intervals between animal movements.

## Farm Folks wildlife

https://www.reddit.com/r/animation/comments/1bjd6fi/some_animal_life_roaming_around_the_world_in_my/

Viewed the post and playing clip, which shows a character among roaming animals in a grassy landscape. The useful contribution is environmental life independent of the visitor's task. Our animals forage, rest, roam, and yield when approached. They do not become mandatory quests or obstruct access to career stories. The models and behavioural code are original and intentionally simpler than the reference.

## Inked maps

The exact product or X post meant by “inked maps” has not been identified. Search surfaced several unrelated tools and an RPG Maker survey-map plugin; none is assumed to be the intended reference. The atlas currently implements the visual idea directly: cream paper, ink-like outlines, numbered landmark sketches, a north marker, route preview, and a live position indicator. Its geometry is derived from the same landmark coordinates and collision-safe route planner as the 3D world.

## Personal content

Eight professional chapters and the existing public-project, research, and about material are preserved. Landmark names are an artistic navigation device, not claims about the employers' buildings or products. All demonstration records remain fictional and clearly labelled.

## City revision

The user's later direction replaces the scattered meadow settlement with a compact city. The initial scene now opens from above. Eleven career buildings form a connected four-by-four block layout with four infill buildings, an urban park, street crossings, a canal, and a distant skyline. Ten procedural vehicles travel on rounded street circuits. The illustrated map reflects these same streets. First-person walking and free flight remain available, with original career content preserved.

## Living-city revision

Factory Yard (https://github.com/Khalidabdi1/factory) was revisited for its simulation ideas. Three were adopted, with original code. First, a six-minute day in which the city's materials shift into a night palette and windows and lamps light up. Second, independent residents and vehicles going about their day. Third, clicking a moving object to open a contextual card, with the option to follow it. Its economy, scenario system, isometric line-drawing renderer, and section views were not adopted. No Factory code or assets were copied.

The newer Dilum Sanjaya post (https://x.com/dilumsanjaya/status/2106426962738880879) could not be retrieved. X returned HTTP 402 to automated access, so no claim is made about its contents. The revision continues the earlier cozy-village direction: warm lit windows against a cool dusk, small figures and boats for scale, and ambient motion that never blocks access to career stories.

## three.js renderer

The city moved from a hand-written WebGL renderer to three.js. The rendering approach follows Factory Yard's: fills are pushed back with polygon offset, so 1 px hairline outlines always draw over them, and outlines trace every building, roof, and dome. Factory Yard renders flat and unlit, with no shadow maps, which keeps it fast. The city keeps directional sun and moon light and adds real shadows where the hardware can afford them. Phones start without shadows, and adaptive quality removes them, then reduces resolution, if frames stay below 24 fps. Haze follows camera height, so street-to-sky transitions don't flash. Only the rendering approach was referenced; no Factory code was copied.
