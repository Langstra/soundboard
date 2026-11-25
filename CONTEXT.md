# Soundboard

A web app where an operator clicks a player's name to announce them and play their chosen song, and where each player picks that song themselves.

## Language

**Player**:
A person who has a name on the soundboard and chooses their own song.
_Avoid_: User, participant, Spotify player

**Operator**:
The person who runs the soundboard, logs in to Spotify and triggers players' songs.
_Avoid_: Host, admin, DJ

**Soundboard**:
The operator's page listing every player's name; clicking a name triggers that player's announcement and song.
_Avoid_: Dashboard

**Personal Link**:
A long-lived signed URL that signs one player in and lets them set their own song. The operator can regenerate it, which invalidates the old one.
_Avoid_: Invite, magic link, signed URL

**Song Choice**:
A player's selected Spotify track plus the moment in it where playback starts.
_Avoid_: Sound, preview, track setting

**Announcement**:
The player's name spoken aloud immediately before their song plays.
_Avoid_: Callout, intro

**Spoken Name**:
An optional phonetic spelling of a player's name used for the announcement instead of the written name.
_Avoid_: Pronunciation, nickname

**Play Duration**:
The number of seconds a song plays after a player is triggered, set by the operator in settings.
_Avoid_: Clip length, timeout

**Email Claim**:
A player's first-time registration of their own email address, confirmed with a Login Code. Until it happens the player is unclaimed and can only sign in with their Personal Link.
_Avoid_: Sign-up, email verification

**Login Code**:
A short code emailed to a player's claimed address that signs them in without their Personal Link.
_Avoid_: OTP, password, magic link
