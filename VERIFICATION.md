# Verification

Production build/typecheck and seven unit tests pass. Headless Chromium browser tests exported a real 4032 × 3024 GSMArena iPhone 16 Pro JPEG as HEIC, reimported that HEIC and exported JPEG, then exported a reference-lens JPEG and a PNG carrying Picsart Software/Artist/XMP tags. Native ExifTool 12.76 -a -G and -validate inspections were run on all four final files. All four validate OK with no warnings after explicitly writing ExifVersion and FlashpixVersion.

Verified capture date 2026:07:07 09:12:00, New York -04:00 offset, Sydney +10:00 offset, matching OffsetTime fields, GPS southern hemisphere and negative altitude reference. HEIC/JPEG pixel and EXIF dimensions agree at 4032 × 3024. Reference iPhone 15 Pro telephoto tags read back as 9 mm, 77 mm equivalent, f/2.8 and the original LensModel. All copied capture fields come from a documented source file; dimensions, orientation, date, software and GPS are override fields.

Native output reports show ordinary EXIF and format/codec tags, no original Apple MakerNotes, XMP, IPTC, Photoshop or C2PA/JUMBF. The dirty PNG output contains no Picsart value. No C2PA-bearing real fixture was available; removing its original container by pixel re-encoding is architectural, not a specifically tested signed-manifest case. No full MakerNote or native-camera fidelity claim is made.

Chromium recorded zero page errors. Network requests were only same-origin GET requests for app/WASM assets plus in-memory blob URLs. No POST or external network request occurred while importing/exporting. A 390 px viewport had no horizontal overflow. Layout screenshots were reviewed; date and GPS inputs were widened on narrow screens afterward.

Remaining tells include browser JPEG JFIF/quantization layout, HEIC encoder/container characteristics, missing camera-private tags, missing native HDR/depth/Live Photo data, resampled/recompressed pixels and sample exposure settings unrelated to the scene. Color space is sRGB, not reconstructed native camera color/HDR. Safari download-origin filesystem attributes cannot be removed from within a downloaded image. No AI detector evaluation or guarantee.

Only Chromium tested here, not Safari/iOS/WebKit. Real original Apple HEIC, unusual orientations, HDR variants and very large mobile-memory cases need device testing. HEIC round trip uses a real-photo export from this app, not a native Apple HEIC fixture. The initial 8×8 ExifTool test fixture was only a smoke test and is not the basis for the full-size checks.

Source fixtures and generated artifacts remain local/ignored. scripts/source-templates.py reproduces profiles from cited source URLs/hashes. scripts/verify-browser.mjs documents the integration assertions, with fixture paths supplied by the development environment.
