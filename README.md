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

Start music, then open Pulp from the toolbar. Choose a preset or move the frequency sliders. Controls apply to the current tab; saved settings are reused when opening another tab. Reloading a tab resets its audio graph until Pulp is opened again. Embedded players in child frames are not processed.

## Limits
Uses Web Audio on accessible HTML audio/video elements. Protected/DRM media, stream objects, and cross-origin media URLs are skipped to prevent silence. Spotify and other protected players may be unsupported. A site that already owns its audio source may also be unsupported. This is not a system-wide equalizer. Peak protection softens peaks but is not a guarantee against all clipping.

Settings and one custom profile are saved locally. Permissions: activeTab and scripting connect only after opening the popup; storage keeps preferences. The extension does not request persistent access to every website.

## Controls
Equalizer has ten bands, an EQ gain curve and quick presets. Sound has bass, treble, output, stereo balance and peak protection. Profiles shows all eight presets and a saved custom profile. The bookmark button saves the complete current configuration. Reset restores the default settings.

## Verification
`npm test` runs a mocked audio graph test and Chromium UI tests covering settings, presets, persistence, malformed saved values, keyboard tab navigation and layout at 520px and 360px. The UI tests use a mocked extension API, not real tab audio. Playwright is configured for `/usr/bin/chromium`; change the executable path for other machines. Real music playback and Firefox installation still require manual verification.

Space Grotesk and its SIL Open Font License are bundled in `extension/fonts`. No runtime font CDN is used.
