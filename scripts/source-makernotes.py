"""Extract complete Apple MakerNotes carriers from hash-checked cited samples.
No pixels, GPS, XMP, IPTC or author data are stored. Unknown Apple tags survive.
Run source-templates.py first if artifacts/sources is missing.
"""
import hashlib,json,subprocess
from pathlib import Path
p=Path('templates/phones.json'); phones=json.loads(p.read_text())
for phone in phones:
 if phone['platform']!='ios': continue
 for lens in phone['lenses']:
  source=Path('artifacts/sources')/(phone['id']+'_'+lens['id']+'.jpg')
  if hashlib.sha256(source.read_bytes()).hexdigest()!=lens['sha256']: raise ValueError('Source hash mismatch: '+str(source))
  carrier=Path('public/makernotes')/(phone['id']+'_'+lens['id']+'.exif');carrier.parent.mkdir(parents=True,exist_ok=True)
  carrier.unlink(missing_ok=True)
  subprocess.check_call(['exiftool','-q','-o',str(carrier),'-tagsFromFile',str(source),'-MakerNotes','-Make','-Model'])
  check=json.loads(subprocess.check_output(['exiftool','-j','-G1',str(carrier)]))[0]
  if check.get('IFD0:Model')!=phone['name'] or 'Apple:MakerNoteVersion' not in check: raise ValueError('Missing/mismatched MakerNotes')
  lens['makerNotes']={'path':'/makernotes/'+carrier.name,'sha256':hashlib.sha256(carrier.read_bytes()).hexdigest()}
p.write_text(json.dumps(phones,indent=2)+'\n')

