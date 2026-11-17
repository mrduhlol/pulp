# Pulp — music equalizer
A TypeScript extension for Chrome and Firefox. True black background, custom faders, locally bundled Space Grotesk typography and ten-band audio controls. No account, network service or analytics.

## Build
```
npm ci
npm run check
npm run build
npm test
```

## Install
Chrome: open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the `dist` folder.

Firefox: open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `dist/manifest.json`. Temporary add-ons disappear on restart; permanent Firefox installation requires Mozilla signing.

Start music, then open Pulp from the toolbar. Choose a preset or move the frequency sliders. Controls apply to the current tab; saved settings are reused when opening another tab. Use Remember this site to restore its configuration automatically after navigation. Without that opt-in, reopen Pulp after reloading. Embedded players in child frames are not processed.

## Limits
Uses Web Audio on accessible HTML audio/video elements. Protected/DRM media, stream objects and cross-origin media without a CORS-enabled media element are skipped to prevent silence. CORS-enabled CDN audio, same-origin media and blob-based players are eligible. Spotify and other protected players may be unsupported. A site that already owns its audio source may also be unsupported. This is not a system-wide equalizer. Peak protection softens peaks but is not a guarantee against all clipping.

Settings and up to 50 custom profiles are saved locally. Import and export use local JSON files. Existing single-slot profiles migrate into the library.

Permissions: activeTab and scripting connect after opening the popup; storage keeps preferences. Remember this site requests optional access to that site's hostname and registers a content script to restore the saved configuration. Turning it off deletes that site's settings and unregisters the script; you can revoke its optional host access in the browser's extension settings. Browser host permissions can cover all ports on that hostname, while settings are keyed by exact origin. No persistent access is granted for other sites.

## Controls
Equalizer has ten bands, an EQ gain curve and quick presets. Sound has draggable bass and treble knobs, output, stereo balance, automatic headroom and peak protection. Drag a knob up or down, use arrow keys, or double-click to reset. Faders show their frequency and gain while adjusting; double-click a fader to reset it.

Automatic headroom is on by default. It samples the combined EQ and shelf-filter response and applies pre-EQ attenuation to offset estimated boost. It can make boosted presets quieter, and does not guarantee protection from every transient or input overload.

Profiles has eight built-in presets and a named custom library. Scroll within Profiles to save, rename, delete, import or export. Select a saved profile before renaming or deleting it. Imports accept version 1 Pulp JSON, up to 256 KB and 50 total presets. The bookmark saves a new complete configuration using the entered name.

Spatial sound is off by default. Stereo width ranges from mono at 0%, through original width at 50%, to wide at 100%. Headphone space adds filtered crossfeed with a 0.3 ms delay. The effect is not Dolby Atmos and does not decode surround formats. Disabling it or bypassing Pulp restores the dry stereo path. Reset restores all defaults, including spatial off.

## Verification
`npm test` runs a mocked audio graph test and Chromium UI tests covering settings, presets, persistence, malformed saved values, keyboard tab navigation and layout at 520px and 360px. Extension API tests use mocks. A separate generated-WAV playback test exercises real Chromium Web Audio, and an OfflineAudioContext test checks spatial bypass, original width, mono compatibility and headphone crossfeed. Playwright is configured for `/usr/bin/chromium`; change the executable path for other machines. Named music-service compatibility, real browser permission prompts, Firefox installation and listening quality still require manual verification.

Space Grotesk and its SIL Open Font License are bundled in `extension/fonts`. No runtime font CDN is used.
