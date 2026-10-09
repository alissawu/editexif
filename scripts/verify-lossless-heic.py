"""Compare HEIF item extents, ignoring only metadata items rewritten by ExifTool."""
import struct,hashlib,sys
from pathlib import Path

def items(path):
 data=Path(path).read_bytes()
 def boxes(start,end):
  while start<end:
   size,kind=struct.unpack_from('>I4s',data,start);head=8
   if size==1:size=struct.unpack_from('>Q',data,start+8)[0];head=16
   if size==0:size=end-start
   assert size>=head and start+size<=end
   yield kind,start+head,start+size
   start+=size
 meta=next((s,e) for t,s,e in boxes(0,len(data)) if t==b'meta')
 children=list(boxes(meta[0]+4,meta[1]));types={};locations={};idat=b''
 for t,s,e in children:
  if t==b'idat':idat=data[s:e]
  if t==b'iinf':
   version=data[s];start=s+4+(2 if version==0 else 4)
   for kind,a,b in boxes(start,e):
    if kind==b'infe' and data[a] in (2,3):
     n=2 if data[a]==2 else 4;key=int.from_bytes(data[a+4:a+4+n],'big');types[key]=data[a+4+n+2:a+4+n+6]
  if t==b'iloc':
   version=data[s];offset_size=data[s+4]>>4;length_size=data[s+4]&15;base_size=data[s+5]>>4;index_size=data[s+5]&15 if version in (1,2) else 0;pos=s+6
   def read(n):
    nonlocal pos
    v=int.from_bytes(data[pos:pos+n],'big');pos+=n;return v
   count=read(2 if version<2 else 4)
   for _ in range(count):
    key=read(2 if version<2 else 4);method=read(2)&15 if version in (1,2) else 0;ref=read(2);assert ref==0
    base=read(base_size);extents=[]
    for _ in range(read(2)):
     if index_size:read(index_size)
     offset=read(offset_size);length=read(length_size);extents.append((base+offset,length))
    locations[key]=(method,extents)
 result={}
 for key,kind in types.items():
  if kind in (b'Exif',b'mime'):continue
  method,extents=locations[key];assert method in (0,1)
  source=data if method==0 else idat
  payload=b''.join(source[a:a+n] for a,n in extents)
  result[key]=(kind,hashlib.sha256(payload).hexdigest())
 return result
left,right=map(items,sys.argv[1:]);assert left and left==right,(left.keys(),right.keys())
print('HEIF non-metadata item payloads unchanged, including encoded images, grid and auxiliary items')
