# Pulp design

## Direction
A chart-first equalizer with a coral gain curve on a deep blue plot. Two rows of blue-tinted control tiles show each frequency, its gain, and a compact horizontal slider. Each slider highlights gain relative to zero. Space Grotesk is bundled locally under the SIL Open Font License.

## Layout and behavior
A 520px popup with four keyboard accessible tabs: Equalizer, Sound, Profiles and Spatial. The complete active panel and connection footer fit within the browser's 600px popup limit. At narrow preview widths the layout contracts without horizontal overflow.

Custom faders retain native range input keyboard behavior. Profile curves reflect their actual band gains; the main graph shows EQ gain settings, not a live spectrum or measured frequency response. Rotary controls support vertical dragging, arrow keys and double-click reset while mirroring their sliders. Bypass dims the EQ and retains editable settings.

## States
The footer distinguishes connected, bypassed, no-media, unsupported-player and restricted-page states. Save errors remain visible. Preview mode allows local UI interaction without claiming audio processing or persistence. Reduced motion disables control transitions.

## Quality bar
Readable text and a clear dB scale, no fabricated playback data, no page scrolling at 520×600, visible focus, complete keyboard tab and slider operation, and no remote asset requests.

Profiles scrolls inside its panel to accommodate the named library and import/export controls. Spatial has its own panel so the audio controls stay readable. Feedback has a reserved area below the connection footer. Automatic headroom defaults on; spatial defaults off. Site memory is opt-in.
