# Monstellar
Solo Project for NASA Space Apps 2026: *Planet X and SPHEREx*. A browser viewer for NASA SPHEREx spectral images (NASA/IPAC IRSA, QR3).
Enter an RA/Dec (or an object name), get a "video" of cutouts through time, a spectrum, an ice-band readout and a sky map.

## Use it
- **Coordinates:** the GO TO box accepts degrees (`133.795, -7.245`), sexagesimal (`08h55m10.831s -7d14m42.53s`, `08 55 10.8 -07 14 42.5`) or a name (`Barnard's Star`, via CDS Sesame).
- **Modes:** pick (5 frames over time) · **Blink** `B` (same wavelength, different dates) · **Spectrum** `M`/`2` (wavelength ladder around the H2O/CO2/CO ice bands).
- **Diff** `X`: current frame minus the nearest-wavelength frame (real wavelength at the crosshair, within 0.05 µm; ties go to the nearest in time) (or minus a pinned reference); frames with no such partner show NO REF; resampled through both WCSs. Moving objects show as a bright/dark pair. Only meaningful for same-band frames (use with Blink). **Ref** `R` pins the current frame as the reference, so every other frame is shown minus it (A minus B: go to B, press `R`, step to A); press `R` again on the pinned frame to unpin. The pin is kept when you pan or zoom (`&ref=<MJD>` in the URL).
- **Stack** `Y`: combines the other frames in the same band, resampled through the WCSs. `U` cycles the method: median (default, rejects movers), mean, or sum (more signal for faint sources; each frame's background median is removed first). Same band means the wavelength at the crosshair agrees within 0.05 um (wavelength varies across each detector, so frames from one detector are not automatically same-band; the frame counter shows `D1`-`D6`). With Diff on, you get this frame minus the stack of the others (sum falls back to mean there), so movers and transients stand out. Turning it on switches to Blink, since pick mode rarely has same-band frames.
- **Gaia / WISE** `G` / `I`: Gaia DR3 (circles) and AllWISE (diamonds) from VizieR TAP, moved by their proper motion to each frame's date (Gaia epoch 2016.0, AllWISE about 2010.6). Sources moving 0.2 arcsec/yr or more get a 10-year track (at least 18 px long so the direction is visible) and a label with the magnitude and rate.
- **Flags** (Frame info tab): SPHEREx quality bits OR-ed over the 3x3 pixels at the crosshair.
- **Wavelength** is read per pixel from the cutout's `WCS-WAVE` lookup table; noise comes from the `VARIANCE` plane.
- Move `WASD`, zoom `+`/`-`/wheel, field of view changes with zoom. `H` hides the UI, `F` fullscreen, `Z` fit.

## URL parameters (embeddable)
`?ra=133.795&dec=-7.245&fov=0.25&mode=blink&diff=1&stack=1&sm=mean&ref=61000.5&gaia=1&wise=1&embed=1` (ra/dec may be sexagesimal) or `?q=WISE 0855`.
`mode` = `blink` | `spec`, `fov` in degrees (0.03 to 1), `embed=1` hides the interface. The address bar follows the current view.

## Files
- `index.html` the app · `targets.js` + `catalog.js` searchable target list
- `worker.js` Cloudflare Worker: CORS proxy for IRSA + CDS only; trims cutouts to IMAGE, FLAGS, VARIANCE, WCS-WAVE (about 300 KB instead of about 4 MB)
- `bake.mjs` pre-downloads cutouts for the built-in targets into `cut/` (`node bake.mjs`). Delete `cut/` first to re-bake with FLAGS/VARIANCE/WCS-WAVE

## Deploy / update data
`npx wrangler deploy` (the Worker must be redeployed after changing `worker.js`). To point at a new data release, change the collection in `SIA()` in `index.html` and in `bake.mjs`.

## Known limits
Exploration tool, not a detection pipeline. Frames are registered through the TAN-SIP WCS when the cutout header carries SIP terms (diff, stack, flags, spectrum probe, overlays); the HUD tapes still use the linear part only. Overlays are capped at the 300 brightest sources per catalogue, and the AllWISE proper-motion convention (RA term including cos dec) is assumed to match Gaia's. Ice readout is a quick look, not a calibrated product. Not implemented: stacking across different bands, and anything beyond nearest-pixel resampling.
