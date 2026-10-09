"""Refresh capture tags from the exact cited sample URLs. Requires Python and ExifTool.
Downloaded photos stay in ignored artifacts; only metadata enters the repository.
Run from repository root. Updates fail closed if a sample changes camera model.
"""
import hashlib, json, subprocess, urllib.request
from pathlib import Path
p = Path('templates/phones.json')
phones = json.loads(p.read_text())
root = Path('artifacts/sources'); root.mkdir(parents=True, exist_ok=True)
keys = set('Make Model Software LensModel LensMake FocalLength FocalLengthIn35mmFormat FNumber ExposureTime ISO ExposureProgram MeteringMode Flash WhiteBalance ExposureCompensation SceneCaptureType SensingMethod XResolution YResolution ResolutionUnit'.split())
for phone in phones:
 for lens in phone['lenses']:
  req=urllib.request.Request(lens['sample'],headers={'User-Agent':'Mozilla/5.0'})
  data=urllib.request.urlopen(req,timeout=90).read()
  if hashlib.sha256(data).hexdigest()!=lens['sha256']: raise ValueError('Source changed: '+lens['sample'])
  f=root/(phone['id']+'_'+lens['id']+'.jpg'); f.write_bytes(data)
  meta=json.loads(subprocess.check_output(['exiftool','-j','-n','-G1',str(f)]))[0]
  if meta.get('IFD0:Model')!=lens['tags']['EXIF:Model']: raise ValueError('Camera model mismatch')
  lens['tags']={'EXIF:'+k.split(':')[1]:v for k,v in meta.items() if k.split(':')[0] in ['IFD0','ExifIFD'] and k.split(':')[1] in keys}
  lens['tags']['EXIF:Software']=subprocess.check_output(['exiftool','-s3','-Software',str(f)],text=True).strip()
p.write_text(json.dumps(phones,indent=2)+'\n')
