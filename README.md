# Pulp — music equalizer
A TypeScript extension for Chrome and Firefox. Dark panels, pulp accents, serif headings and ten-band audio controls. No account, network service or analytics.

## Build
```
npm ci
npm run check
npm run build
```

## Install
Chrome: open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the `dist` folder.

Firefox: open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `dist/manifest.json`. Temporary add-ons disappear on restart; permanent Firefox installation requires Mozilla signing.

Start music, then open Pulp from the toolbar. Choose a preset or move the frequency sliders. Controls apply to the current tab; saved settings are reused when opening another tab. Reloading a tab resets its audio graph until Pulp is opened again. Embedded players in child frames are not processed.

## Limits
Uses Web Audio on accessible HTML audio/video elements. Protected/DRM media, stream objects, and cross-origin media URLs are skipped to prevent silence. Spotify and other protected players may be unsupported. A site that already owns its audio source may also be unsupported. This is not a system-wide equalizer. Peak protection softens peaks but is not a guarantee against all clipping.

Settings and one custom profile are saved locally. Permissions: activeTab and scripting connect only after opening the popup; storage keeps preferences. The extension does not request persistent access to every website.

## Verification
TypeScript checks, production build, and a mocked audio graph test are available. Real music playback and Firefox installation still require manual verification.
