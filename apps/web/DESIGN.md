---
name: Soundboard
description: A stage manager's call sheet for running live walk-up cues from a phone.
colors:
  paper: 'hsl(0 0% 100%)'
  ink: 'hsl(0 0% 0%)'
  ink-muted: 'hsl(0 0% 33%)'
  hatch: 'hsl(0 0% 90%)'
  on-ink: 'hsl(0 0% 100% / 0.8)'
  signal-red: 'hsl(3 87% 44%)'
  on-signal: 'hsl(0 0% 100%)'
typography:
  cue-name:
    fontFamily: 'Archivo Narrow, Arial Narrow, sans-serif'
    fontSize: 'clamp(1.75rem, 22cqi, 3.5rem)'
    fontWeight: 700
    lineHeight: 1
    letterSpacing: '0em'
  cue-name-long:
    fontFamily: 'Archivo Narrow, Arial Narrow, sans-serif'
    fontSize: 'clamp(1.25rem, 14cqi, 2.5rem)'
    fontWeight: 700
    lineHeight: 1
  stop-name:
    fontFamily: 'Archivo Narrow, Arial Narrow, sans-serif'
    fontSize: '1.875rem'
    fontWeight: 700
    lineHeight: 1
  title:
    fontFamily: 'Archivo Narrow, Arial Narrow, sans-serif'
    fontSize: '1.5rem'
    fontWeight: 700
    letterSpacing: '0.08em'
  button:
    fontFamily: 'Archivo Narrow, Arial Narrow, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 700
    letterSpacing: '0.08em'
  status:
    fontFamily: 'JetBrains Mono, ui-monospace, monospace'
    fontSize: '0.75rem'
    fontWeight: 500
  status-live:
    fontFamily: 'JetBrains Mono, ui-monospace, monospace'
    fontSize: '0.875rem'
    fontWeight: 700
  body:
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 500
rounded:
  none: '0px'
spacing:
  xs: '0.25rem'
  sm: '0.5rem'
  md: '0.75rem'
  lg: '1rem'
  xl: '2rem'
  tap-target: '3rem'
components:
  cue-cell:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
    rounded: '{rounded.none}'
    padding: '0.5rem 0.625rem'
    height: '5.25rem'
  cue-cell-no-song:
    backgroundColor: '{colors.hatch}'
    textColor: '{colors.ink-muted}'
  cue-cell-hover:
    backgroundColor: '{colors.hatch}'
  cue-cell-live:
    backgroundColor: '{colors.signal-red}'
    textColor: '{colors.on-signal}'
  stop-bar:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.on-ink}'
    padding: '0.875rem 1rem'
    height: '5.75rem'
  button-stop:
    backgroundColor: '{colors.signal-red}'
    textColor: '{colors.on-signal}'
    typography: '{typography.button}'
    rounded: '{rounded.none}'
    height: '3rem'
    width: '7rem'
  button-primary:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
    typography: '{typography.button}'
    rounded: '{rounded.none}'
    height: '3rem'
  input-field:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
    rounded: '{rounded.none}'
    height: '3rem'
    padding: '0 0.75rem'
---

# Design System: Soundboard

## Overview

**Creative North Star: "The Cue Sheet"**

A stage manager's call sheet, not a music player. Every Player is a numbered cue cell on a ruled two-column sheet. The surface is white paper, black type and 2px black rules; nothing is rounded, shadowed or gradient-filled. The operator reads it in a dim room, at arm's length, in a hurry, so contrast and state legibility outrank ornament.

Exactly one thing on screen is ever red: the live cue (and the STOP button that ends it). Everything else is black, white or grey. Hierarchy comes from type scale, caps and the ruled grid, not from color or depth.

**Key Characteristics:**

- White sheet, 2px black rules, zero radius, zero shadow.
- One signal red, reserved for live and STOP.
- Condensed bold caps for names and buttons; monospace for cue numbers, statuses and the Spotify label.
- Hatched cells mean "no song yet".
- A black Stop bar with 80% white text is docked at the bottom.

## Colors

A strict monochrome sheet with a single alarm color. Values are hsl in `apps/web/src/styles.scss` as `--color-*` custom properties.

### Primary

- **Signal Red** (hsl 3 87% 44%): the live cue cell fill and the STOP button. Nothing else.

### Neutral

- **Paper White** (hsl 0 0% 100%): the sheet, cell backgrounds, input fields, and text on ink or red.
- **Ink Black** (hsl 0 0% 0%): body text, every 2px rule, the Stop bar, the primary button fill, focus outlines.
- **Muted Ink** (hsl 0 0% 33%): text of disabled / no-song cells.
- **Hatch Grey** (hsl 0 0% 90%): hatch stripes of no-song cells and the hover fill on cells.
- **Ink Whisper** (hsl 0 0% 100% / 0.8): secondary text on the black Stop bar and toast.
- **On Signal** (hsl 0 0% 100%): text on red.

### Named Rules

**The One Red Rule.** Signal red appears only on the live cue cell and on STOP. It is never used for errors, warnings, links or decoration; its rarity is how the operator finds the live cue at a glance.

**The Black And White Rule.** Notices, errors and toasts are told apart by position and rule weight (paper with a top rule, or inverted black), never by a new hue.

## Typography

**Display Font:** Archivo Narrow (with Arial Narrow, sans-serif), self-hosted, weights 600 to 700
**Body Font:** system-ui stack (system-ui, -apple-system, Segoe UI, sans-serif)
**Label/Mono Font:** JetBrains Mono (with ui-monospace), self-hosted, weights 500 to 700

**Character:** Condensed industrial caps for what the operator taps, typewriter monospace for what the system reports, plain system sans for the occasional sentence.

### Hierarchy

- **Cue name** (700, clamp(1.75rem, 22cqi, 3.5rem), line-height 1, uppercase): the Player name in each cell; scales with the cell's container width. Long names step down to clamp(1.25rem, 14cqi, 2.5rem).
- **Stop name** (700, 1.875rem, 1, uppercase): the live name in the Stop bar.
- **Title** (700, 1.5rem, letter-spacing 0.08em, uppercase): page header; sign-in title is 2rem.
- **Button** (700, 1.25rem, letter-spacing 0.08em, uppercase): every button label.
- **Status** (JetBrains Mono 500, 0.75rem): cue number (700), cell status, phase line, Spotify label. The live cell's status rises to 0.875rem bold.
- **Body** (system sans 500, 0.875rem): notices, form labels (700), errors, empty message.

### Named Rules

**The Two Voices Rule.** Narrow caps are for things you tap or name; mono is for things the system reports (numbers, seconds, status). Prose never takes either face.

## Layout

Two equal columns at every width (`grid-template-columns: 1fr 1fr`); cells grow with width and the grid scrolls under a sticky header and a sticky Stop bar. Content is centered with a gutter of `max(1rem, (100vw - 64rem) / 2)`, so the sheet stops at 64rem on wide screens. Cells have a 5.25rem minimum height (84px) and 0.5rem 0.625rem padding. The sheet has 9rem bottom padding so the last row clears the fixed notice and toast. Sign-in is a single 28rem column. Spacing steps in use: 0.25, 0.5, 0.75, 1, 2rem; tap targets are 3rem minimum.

## Elevation & Depth

Flat by construction: no shadows, no gradients except the hatch pattern. Depth is conveyed by 2px black rules between cells, and by inversion (black Stop bar, black toast) for things pinned above the sheet. Sticky header, notice and toast layer by z-index only.

### Named Rules

**The Rule Is The Edge Rule.** Boundaries are 2px solid ink rules (`--rule`), never shadow, tint or radius.

## Shapes

Hard rectangles, radius 0 everywhere. Cells share borders (bottom and right rules, with the grid supplying the top and left). The only pattern is the 135-degree hatch (7px paper, 1px grey stripes) on no-song cells. Focus is a 3px ink outline offset 2px (inset 0.375rem on cells; paper-colored on black surfaces).

## Components

### Cue Cell

A numbered row on the sheet: cue number (mono, top), name (narrow caps, middle), status (mono, bottom).

- **Default:** paper, ink text, 2px bottom and right rules.
- **Hover (pointer devices only):** hatch grey fill.
- **No song:** hatch stripes, muted ink text; still tappable (Announcement only).
- **Live:** signal red fill, white text, `aria-current`; status reads in bold 0.875rem.
- **Fading:** the red eases to paper over 1s (cubic-bezier(0.16, 1, 0.3, 1)); no transition under reduced motion.

### Stop Bar

Sticky bottom bar, black with Ink Whisper text, 5.75rem tall plus safe-area inset. Left: mono phase line ("... · nog 7 s") over the live name in paper-white narrow caps. Right: STOP button.

- **Stop button:** signal red, white narrow caps, 3rem tall, 7rem wide minimum. Disabled (nothing live): transparent with 2px Ink Whisper border and text.

### Buttons

Rectangular, borderless, narrow bold caps at 1.25rem with 0.08em tracking, 3rem tall. Primary is ink on paper text (sign-in submit, notice action). Inside the black toast the button inverts to paper with ink text. Red is never used for a button other than STOP.

### Inputs / Fields

Paper fill, 2px ink border, no radius, 3rem tall, 0.75rem side padding; labels are 0.875rem bold above. Errors are a 2px-ruled box with bold 0.875rem text, no color.

### Notices and Toast

Full-width bands docked above the Stop bar with a 2px top rule. Notice: paper with ink text. Toast: black with Ink Whisper text and an inverted action button.

### Header

Sticky, paper, 2px bottom rule: title left in narrow caps, Spotify status right in mono.

## Do's and Don'ts

### Do:

- **Do** draw every boundary as a 2px solid ink rule.
- **Do** reserve signal red (hsl 3 87% 44%) for the live cue and STOP.
- **Do** set names and buttons in Archivo Narrow bold uppercase, and numbers, seconds and statuses in JetBrains Mono.
- **Do** keep tap targets at least 3rem and cells at least 5.25rem tall.
- **Do** mark no-song cells with the hatch and muted ink, and keep them tappable.
- **Do** keep copy in Dutch.

### Don't:

- **Don't** add radius, shadows or gradients (the hatch is the only pattern).
- **Don't** use red for errors, warnings, links or hover.
- **Don't** introduce a second accent hue; use inversion (black fill) for emphasis instead.
- **Don't** set prose in the display or mono faces.
- **Don't** build a rounded button grid with a player bar; the screen is a sheet, not a music player.

<!-- Not canonized: the Stop bar top border is 0.1875rem (3px) while every other rule is 2px (--rule); it is hidden against the black bar fill and is drift, not a rule. The contract names red as #d7160f; the build ships hsl(3 87% 44%) and that is recorded. -->
