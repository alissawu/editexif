"""Native readback of browser-produced exports, including opaque Apple payload."""
import json,subprocess
from pathlib import Path
root=Path('artifacts/native-exports');root.mkdir(parents=True,exist_ok=True)
def read(path):
 return json.loads(subprocess.check_output(['exiftool','-j','-n','-G1','-u',str(path)]))[0]
ids={'ContentIdentifier','BurstUUID','ImageUniqueID','ImageCaptureRequestID','PhotoIdentifier'}
source=read('public/makernotes/16pro_main.exif')
reference=read('/tmp/editexif-full/15pro_tele.jpg')
for path in map(Path,['artifacts/real.heic','artifacts/second.jpg','artifacts/heic-roundtrip.jpg','artifacts/reference.jpg','artifacts/png-clean.jpg','artifacts/png-clean-second.jpg','artifacts/ids-preserved.jpg','artifacts/ids-preserved.heic']):
 (root/(path.name+'.txt')).write_text(subprocess.check_output(['exiftool','-a','-G','-u',str(path)],text=True,errors='replace'))
 problems=subprocess.check_output(['exiftool','-validate','-warning','-error',str(path)],text=True,errors='replace')
 if 'Warning' in problems or 'Error' in problems:raise RuntimeError(str(path)+problems)
 meta=read(path);expected=reference if path.name in {'reference.jpg','png-clean.jpg','png-clean-second.jpg'} else source
 for k,v in expected.items():
  if k.startswith('Apple:') and k.split(':',1)[1] not in ids:assert meta.get(k)==v,(path,k,meta.get(k),v)
 assert not any(k.startswith(('XMP','IPTC:','Photoshop:','JUMBF:','C2PA:')) for k in meta),path
print('8 JPEG/HEIC exports validate without warnings; known/unknown Apple non-ID payload matches native source readback')
