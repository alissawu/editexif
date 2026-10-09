import subprocess,json
from pathlib import Path
source=Path('/files/IMG_9145_01a11d19-5534-7095-86a0-f120df9d263a.heic')
root=Path('artifacts/native-import');root.mkdir(parents=True,exist_ok=True)
def read(path):return json.loads(subprocess.check_output(['exiftool','-j','-n','-G1','-u',str(path)]))[0]
original=read(source)
for path in map(Path,['artifacts/imported.jpg','artifacts/imported.heic']):
 (root/(path.name+'.txt')).write_text(subprocess.check_output(['exiftool','-a','-G','-u',str(path)],text=True,errors='replace'))
 problems=subprocess.check_output(['exiftool','-validate','-warning','-error',str(path)],text=True,errors='replace');assert 'Warning' not in problems and 'Error' not in problems,problems
 after=read(path)
 for k,v in original.items():
  if k.startswith('Apple:') and k.split(':')[1] not in {'ContentIdentifier','BurstUUID','PhotoIdentifier','ImageUniqueID','ImageCaptureRequestID'}:assert after.get(k)==v,k
print('Current imported JPEG and HEIC validate without warnings; opaque Apple fields match native original')
