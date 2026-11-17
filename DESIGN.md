# Pulp design

## Direction
A compact music control interface on a true black background. White typography and fader handles lead; acid green marks the EQ response and active controls. No mango surfaces or serif headings. Space Grotesk is bundled locally under the SIL Open Font License.

## Layout and behavior
A 520px popup with three keyboard accessible tabs: Equalizer, Sound and Profiles. The complete active panel and connection footer fit within the browser's 600px popup limit. At narrow preview widths the layout contracts without horizontal overflow.

Custom faders retain native range input keyboard behavior. Profile curves reflect their actual band gains; the main graph shows EQ gain settings, not a live spectrum or measured frequency response. Decorative rotary indicators mirror the bass and treble sliders. They are not independent drag controls. Bypass dims the EQ and retains editable settings.

## States
The footer distinguishes connected, bypassed, no-media, unsupported-player and restricted-page states. Save errors remain visible. Preview mode allows local UI interaction without claiming audio processing or persistence. Reduced motion disables control transitions.

## Quality bar
True black, readable white and gray text, restrained accent color, no fabricated playback data, no page scrolling at 520×600, visible focus, complete keyboard tab and slider operation, and no remote asset requests.
