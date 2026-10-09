import json,subprocess
from pathlib import Path
root=Path('artifacts/native-makernotes');root.mkdir(parents=True,exist_ok=True)
for source in Path('public/makernotes').glob('*.exif'):
 report=subprocess.check_output(['exiftool','-a','-G','-u',str(source)],text=True,errors='replace')
 (root/(source.stem+'.txt')).write_text(report)
 problems=subprocess.check_output(['exiftool','-validate','-warning','-error',str(source)],text=True,errors='replace')
 if 'Warning' in problems or 'Error' in problems: raise RuntimeError(str(source)+problems)
print('All Apple carriers validated without warning/error')
