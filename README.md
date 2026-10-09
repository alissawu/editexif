# editexif

A browser-only photo metadata editor. React + TypeScript + Vite, suitable for static Vercel hosting. No image-processing server, accounts, analytics, remote maps or uploads.

## Development

Run npm ci, then npm run dev. Build with npm run build and run unit tests with npm test. Vercel can use the Vite preset, build command npm run build, output directory dist. Do not add a server function for images. No cross-origin isolation headers are needed for the current single-threaded WASM builds.

## Local engine

Metadata uses @uswriting/exiftool, an ExifTool distribution running on ZeroPerl WASM. JPEG/PNG/WebP decode and JPEG re-encoding use browser bitmap/canvas APIs. HEIC encoding uses elheif, bundling libheif, libde265 and kvazaar. HEIC decoding uses libheif-js, since elheif's decode wrapper has a duplicated-buffer bug and unsafe top-level item enumeration. Review their bundled licenses (including LGPL components) and HEVC patent considerations before commercial distribution. tz-lookup derives a timezone from coordinates without network calls. Heavy work runs in a dedicated worker. The 25 MB ZeroPerl binary is served locally, not from a CDN.

The exact pinned ZeroPerl 1.0.10 build misidentifies browser workers as Node. A guarded Vite compatibility transform extends its browser check to WorkerGlobalScope. Build fails if that upstream expression changes. The browser externalization warning about node:fs/promises is expected; that unreachable Node branch is not used. Browser smoke tests exercise this explicitly.

## Behavior and limits

Choose a phone and a verified lens, local capture date/time and timezone, optional GPS/altitude, software, filename and HEIC/JPEG output. Default names are IMG_ followed by four random digits. The searchable timezone field includes all browser-supported IANA zones, UTC and the browser default, with five common zones first. Valid GPS coordinates automatically select the local IANA zone; it remains editable. All three OffsetTime tags use the capture date's timezone offset, including DST. GPS timestamps are UTC. Text coordinates are optional; no location request or map service is used.

Templates are extracted from actual camera sample files. See templates/README.md for URLs and hashes. Only verified lenses are exposed. References copy standard camera capture tags plus the complete Apple MakerNotes block. Known input shot identifiers are preserved; missing IDs from the reference are regenerated. Unknown vendor fields are preserved and may contain private data. Date, GPS and software controls override the reference. Blank software omits that tag.

Inputs are limited to 60 MB and 50 megapixels. Standard HEIC/HEIF, JPEG, PNG and WebP are supported when the browser/codec can decode them. RAW formats, AVIF, unusual HEIF variants and arbitrary formats are not promised. Alpha is flattened onto white. Export re-encodes pixels rather than merely editing a container, so original XMP/IPTC/C2PA/Photoshop/editor history are not carried forward.

This does not recreate a native camera original. Copied Apple MakerNotes describe the sample/reference, not the uploaded scene. Depth, Live Photo companions, HDR gain maps, computational camera processing, native HEVC/JPEG encoder characteristics and signed provenance are not reconstructed. See MAKERNOTES.md for the HDR investigation and identity rules. Existing signatures cannot remain valid after modification. EXIF settings do not prove capture provenance or guarantee any AI-detector score. Exposure and ISO come from the selected sample/reference and may not match the uploaded scene. Browser color conversion and lossy compression may alter appearance. HEIF container rotation is handled by libheif; unusual additional EXIF-only rotations may need pre-rotation before upload. Safari's download-origin attributes are OS filesystem metadata, outside the image and this site's control.

## Verification

Unit tests cover DST offsets and invalid local times, GPS hemispheres/altitude/UTC timestamps, metadata allowlist and invalid settings. Browser integration checks are in scripts/verify-browser.mjs and require Playwright Chromium, local source fixtures and the preview on port 48371. Outputs and native exiftool reports are intentionally ignored under artifacts/. See VERIFICATION.md for actual tested behavior.

## Real-photo import

The box below the form uses a plain image file input with no capture attribute. The operating system decides which Photo Library, camera and file-picker choices appear. It fills available model/lens, capture date/time, software, GPS/altitude, timezone, format and filename immediately without a selection prompt. Unsupported models/lenses get editable imported profiles. Subsequent form edits control export; changing model or lens disconnects the imported MakerNotes. Clear removes the reference and restores default settings.

GPS determines IANA timezone where available. Offset-only EXIF is retained as a fixed UTC offset, not falsely attributed to a city; fixed offsets do not have DST transitions. Missing date/time falls back to the current default, missing location is disabled, and missing camera/lens/software use the selected template where possible. A field-specific note reports missing metadata. Safari and other photo pickers may supply a JPEG conversion or remove fields; missing metadata is detectable, but the app cannot prove that a picker caused it. Use Choose File with the original when possible. Native picker choices and HEIC conversion vary by device and have not been tested on iOS/Android here.

The original imported file is used locally for complete Apple MakerNotes if intact. If stripped, template MakerNotes are used instead. Known input shot IDs still win; IDs from a different imported reference are regenerated. No imported file or metadata is uploaded or added to the template catalog on disk.

The iOS suggestion catalog includes 26.x, including 26.6.2, checked against Apple's security-release dates. Defaults choose the latest listed compatible version available by the selected capture date, not a promise of the actual installed OS. Older major releases are included but the catalog is not exhaustive. Manual software edits are retained across date and lens edits. HostComputer is written as the selected Apple model. Release-date source https://support.apple.com/en-us/100100.
