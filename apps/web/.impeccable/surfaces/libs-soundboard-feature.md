---
version: 1
slug: "libs-soundboard-feature"
primary_target: "libs/soundboard/feature"
related_targets: []
---

# Soundboard screen

Mode: Operate. The operator taps a Player's cell to run the Announcement, then the Song Choice for the Play Duration. Dutch copy. Phone and tablet first, desktop works. Two columns at every width, cells grow with width.

Task: tap a cue, see what is live, stop it. States: ready, live (announcing, playing), no song, just saved, Spotify not connected, not Premium. 13 to 30 Players, the grid scrolls under a fixed header and a fixed Stop bar.

Unresolved: tablet breakpoint where cells grow; wording of the not-connected and not-Premium notices; optional dark variant for dim rooms.

## Direction contract

THESIS: A stage manager's call sheet, not a music player. Each Player is a numbered cue cell on a ruled two-column sheet, and exactly one thing on screen is ever red: the live cue. It refuses the rounded button grid with a player bar.

OWN-WORLD: White sheet, black 2px rules, black type. Names in Archivo Narrow bold caps, cue numbers and statuses in JetBrains Mono. Single signal red (#d7160f) reserved for the live cue and STOP. No-song cells are hatched with a greyed name. A black Stop bar with 80% white text docks at the bottom. No radius, no shadows, no gradients.

STORY: The operator sees at a glance which cue is live and how many seconds remain, trusts that Spotify is ready, and taps the next name without hesitation.

FIRST VIEWPORT: Header with the title left and Spotify status right over a 2px rule. Below it the two-column grid of cue cells (84px tall at phone width, Q01 onward, name large, status small), the live cell filled red with white type reading "GO · speelt nu". Pinned at the bottom a black bar with "Nu aan de beurt · nog 7 s", the live name, and a red STOP button of at least 48px.

FORM: Cue Sheet, a grounded candidate from the safer-register hand. seed:7963790bee3d1b5b

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
