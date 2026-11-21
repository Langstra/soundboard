# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing codebase: Angular (zoneless, SCSS, Vitest) in an Nx monorepo, Supabase backend. See `AGENTS.md` and `style-guide/`.

## Users

- **Operator** (exactly one): runs the soundboard live at an event, most likely from a phone or tablet (a laptop is possible), clicking player names quickly while an audience listens. Needs a Spotify Premium account.
- **Players**: people on the soundboard, each a Supabase user. They open a personal link once or many times (often on a phone) to choose their own song. They have no Spotify login.

## Product Purpose

A soundboard where the operator taps a player's name, the name is announced by text-to-speech, and then that player's chosen Spotify song plays for a set number of seconds. Players choose their own song and start moment through a personal link. Success is a fast, glitch-free live moment per player.

## Positioning

Each player's walk-up moment is announced by name and plays a song they chose themselves, starting at the exact point in the track they picked, with no manual cueing by the operator.

## Operating Context

- Live event. Taps happen in quick succession, and the latest tap always wins.
- Audio comes from the operator's browser tab through the Spotify Web Playback SDK (Premium required; mobile-only Premium plans are excluded). The SDK supports desktop and mobile (Android, iOS) browsers; on iOS playback does not start automatically after a transfer, the user must interact with the SDK events, and volume is controlled physically on the device.
- Browsers block audio until the user interacts, so the soundboard needs an explicit "start" activation step after the Spotify session is restored.
- Spotify login is remembered in the browser (PKCE); the operator can log in and out in Settings.
- The operator logs in to the soundboard with Supabase auth (operator role in `app_metadata`). Players are signed in by their Personal Link.
- Players and the operator account are created manually in the database for now.

## Capabilities and Constraints

- **Soundboard**: list of player names; tapping one plays the Announcement, then the song for the Play Duration, ending with a fade-out of about one second. A Stop control is always visible. A player with no Song Choice is still tappable and gets the Announcement only, marked as "no song yet". Playback failures show a toast. The list updates live when a player saves a song.
- **Settings**: Spotify log in / log out; Play Duration (default 10 s, range 3 to 30 s, stored in the browser); Players section where the operator generates a Personal Link per player. The link is shown once, with a Copy button.
- **Player page**: reached through a Personal Link. The player pastes a Spotify track share URL (short links are rejected), sees the verified title and artist, enters the start time as `m:ss` (validated against the track length), and edits their Spoken Name. No audio preview. One Song Choice per player; saving replaces it.
- **Notices**: the operator is told when Spotify is not connected, or when the account is not Premium.
- **Scope**: one group of players, one song each, no self-registration, no player removal in the app.
- **Language**: Dutch (UI copy and text-to-speech voice).
- **Terminology**: see `/CONTEXT.md` (Player, Operator, Soundboard, Personal Link, Song Choice, Announcement, Spoken Name, Play Duration). Use those words in the UI and avoid the listed alternatives.
- **Open**: SDK use must stay non-commercial under Spotify's terms.

## Brand Commitments

None confirmed. The product has no name, logo or voice yet.

## Evidence on Hand

No real content, testimonials or assets. Player names come from the database; do not fabricate sample customers or claims.

## Product Principles

- The live moment comes first: a tap must feel instant, and a mis-tap must be cheap to correct.
- Say plainly what state the system is in (connected, Premium, no song yet, playing) so the operator never has to guess mid-event.
- Players do one small job on their own phone, and the page makes the right input obvious and hard to get wrong.
- Personal data stays personal: players see and edit only themselves.

## Accessibility & Inclusion

Players on phones need large touch targets and readable text. The operator may work in dim light and in a noisy room, so state must be visible and not conveyed by sound or colour alone. Follow `style-guide/style-guide.a11y.md`.
