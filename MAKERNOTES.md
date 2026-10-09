# Apple MakerNotes and HDR

Full Apple MakerNotes are copied as a block using ExifTool, not reconstructed from a selected tag list. Templates carry only EXIF metadata from the hash-checked samples in templates/phones.json. Use scripts/source-templates.py then scripts/source-makernotes.py to reproduce them. Each template carrier has its own runtime integrity hash. Unknown Apple tags are retained, so a reference can contain private vendor data; standard GPS and editor/provenance groups remain excluded.

Shot identity comes from the edited input when present, not the cloned reference. Missing known shot identifiers are regenerated for every export. EXIF ImageUniqueID is a new 32-digit hex value only when missing from the input. Known Apple identifiers include ContentIdentifier, BurstUUID, ImageUniqueID, ImageCaptureRequestID and PhotoIdentifier. Unknown vendor fields cannot safely be classified as identity based on their names alone. Preservation is verified on readback; unsupported writes fail closed rather than silently dropping IDs.

## HDR decision

No HDR gain map is emitted. The installed elheif jsEncodeImage API takes RGBA, width and height only. Its C++ encode path encodes a single primary image; neither auxiliary item encoding nor gain-map item relationships/metadata is exposed to JavaScript. The libheif-js package is a decoder, not an auxiliary encoder. This is a limitation of the shipped browser bindings, not a claim that native libheif can never encode gain maps.

Apple's documented map is an 8-bit single-channel image at quarter resolution, identified by urn:com:apple:photo:2020:aux:hdrgainmap. Correct HDR rendering also requires HDRGainMapVersion and MakerNote keys 33 and 48 to compute luminance headroom. Merely adding an EXIF label is not an auxiliary image. Copied HDR-related MakerNote tags do not imply an actual map exists.

An all-zero map would apply no gain and provide no HDR detail; a highlight-derived map would be a creative SDR expansion, not recovered capture data. Adding a valid auxiliary image here would require a rebuilt browser encoder/binding plus item/metadata writing and validation on Apple devices. We did not hand-patch HEIF boxes or fake a gain map. Native Apple image fixtures and Safari/macOS validation remain necessary before promising that support.

Sources consulted

https://developer.apple.com/documentation/appkit/applying-apple-hdr-effect-to-your-photos
https://github.com/strukturag/libheif
https://github.com/strukturag/libheif/issues/1685
https://exiftool.org/faq.html

ExifTool normally forbids individual absent MakerNote slots. A trusted static config relaxes that rule only for the five documented Apple shot-ID string slots, so input IDs can survive even when absent from the selected template. Unknown tag definitions are never modified. No user-supplied Perl/config is executed. Readback verifies inserted strings and copied vendor payload.


## 512 × 512 HEIC grid decision

Native libheif supports real HEIF grid items: heif_context_add_grid_image creates a cropped primary grid, and heif_context_add_image_tile adds each encoded tile. Non-multiple dimensions use padded right/bottom tiles cropped to the declared full dimensions. This could be built into a new WASM wrapper, but the installed elheif binding exposes only single-image jsEncodeImage and calls heif_context_encode_image. It does not expose grid creation, tile insertion, item handles or context access. There is no Emscripten toolchain installed here to rebuild this encoder. Grid output was not added to this release. Encoding several standalone files is not a grid, and hand-patching HEIF item tables would introduce a new unvalidated container writer.

https://github.com/strukturag/libheif/wiki/Reading-and-Writing-Tiled-Images

A real grid would still retain the kvazaar codec characteristics and would not reproduce Apple's native capture pipeline. This app promises neither encoder equivalence nor detector evasion.
