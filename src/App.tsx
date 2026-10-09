import {useEffect,useRef,useState} from 'react';
import {timezoneOptions,zoneForCoordinates,withLocationTimezone} from './timezones';
import templates from '../templates/phones.json';
import {importPhoto,type Profile} from './import-photo';
const phones=templates;
import {defaultSoftware,iosOptions} from './software';
import {localDate,randomFilename,type Settings,type Tags} from './settings';
type Output={blob:Blob;preview:Blob;before:Tags;after:Tags;width:number;height:number;tags:Tags};
const initial:Settings={date:localDate(),timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,software:defaultSoftware(phones[0].name,localDate(),String(phones[0].lenses[0].tags['EXIF:Software'])),filename:randomFilename(),format:'heic',location:false,latitude:'',longitude:'',altitude:''};
const timezones=timezoneOptions(initial.timezone);
export default function App(){
 const [phones,setPhones]=useState<Profile[]>(templates);const [importedName,setImportedName]=useState('');const [missing,setMissing]=useState<string[]>([]);const importInput=useRef<HTMLInputElement|null>(null);
 const [file,setFile]=useState<File>();const [reference,setReference]=useState<File>();const [phone,setPhone]=useState(0);const [lens,setLens]=useState(0);const [settings,setSettings]=useState(initial);
 const [before,setBefore]=useState<Tags>();const [output,setOutput]=useState<Output>();const [preview,setPreview]=useState('');const [busy,setBusy]=useState(false);const [status,setStatus]=useState('');const [error,setError]=useState('');const [drag,setDrag]=useState(false);const [importDrag,setImportDrag]=useState(false);
 const softwareManual=useRef(false);
 const worker=useRef<Worker|null>(null);const request=useRef(0);const objectUrl=useRef('');
 function resetOutput(){setOutput(undefined);setError('');}
 function update<K extends keyof Settings>(key:K,value:Settings[K]){resetOutput();setSettings(s=>{const next={...s,[key]:value};if(key==='software')softwareManual.current=true;if(key==='date'&&!softwareManual.current)next.software=defaultSoftware(phones[phone].name,String(value),String(phones[phone].lenses[lens].tags['EXIF:Software']));return ['latitude','longitude','location'].includes(key)?withLocationTimezone(next):next;});}
 useEffect(()=>{return()=>{worker.current?.terminate();if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);};},[]);
 function showPreview(blob:Blob){if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);objectUrl.current=URL.createObjectURL(blob);setPreview(objectUrl.current);}
 function run(action:'inspect'|'import'|'export',input:File){
  if(busy)return;resetOutput();setBusy(true);setStatus('Starting local engine…');
  if(!worker.current){worker.current=new Worker(new URL('./engine.worker.ts',import.meta.url),{type:'module'});worker.current.onerror=()=>{setBusy(false);setError('The local engine could not start. Reload and try again.');worker.current?.terminate();worker.current=null;};}
  const id=++request.current;
  worker.current.onmessage=(event:MessageEvent<{id:number;status?:string;error?:string;result?:Output & {before:Tags}}>)=>{
   if(event.data.id!==request.current)return;
   if(event.data.status){setStatus(event.data.status);return;}
   setBusy(false);setStatus('');if(event.data.error){setError(event.data.error);return;}
   const result=event.data.result!;if(action==='import'){const imported=importPhoto(result.before,input.name,templates,initial);setPhones(imported.catalog);setPhone(imported.phone);setLens(imported.lens);setSettings(imported.settings);setReference(imported.hasMakerNotes?input:undefined);setImportedName(input.name);setMissing(imported.missing);softwareManual.current=true;return;}setBefore(result.before);if(result.preview)showPreview(result.preview);
   if(action==='export'){setOutput(result);showPreview(result.preview);}
  };
  worker.current.postMessage({id,action,file:input,reference,makerNotes:'makerNotes' in phones[phone].lenses[lens]?(phones[phone].lenses[lens] as {makerNotes:{path:string;sha256:string}}).makerNotes:undefined,base:phones[phone].lenses[lens].tags,settings});
 }
 function chooseFile(input?:File){if(!input||busy)return;setFile(input);setBefore(undefined);resetOutput();showPreview(input);run('inspect',input);}
 function selectPhone(value:number){setReference(undefined);softwareManual.current=false;setPhone(value);setLens(0);const p=phones[value];setSettings(s=>({...s,software:defaultSoftware(p.name,s.date,String(p.lenses[0].tags['EXIF:Software']??'')),format:p.platform==='ios'?'heic':'jpeg'}));resetOutput();}
 function deriveZone(){try{const lat=Number(settings.latitude),lon=Number(settings.longitude);if(!settings.latitude.trim()||!settings.longitude.trim()||Math.abs(lat)>90||Math.abs(lon)>180||!Number.isFinite(lat)||!Number.isFinite(lon))throw Error();update('timezone',zoneForCoordinates(settings.latitude,settings.longitude)!);}catch{setError('Enter valid coordinates first.');}}
 function download(){if(!output)return;const link=document.createElement('a');const url=URL.createObjectURL(output.blob);link.href=url;link.download=settings.filename+'.'+(settings.format==='heic'?'heic':'jpg');link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
 const current=phones[phone].lenses[lens];const diffKeys=[...new Set([...Object.keys(before??{}),...Object.keys(output?.after??{})])].filter(k=>!['SourceFile','System:FileName','System:Directory','System:FileModifyDate','System:FileAccessDate','System:FileInodeChangeDate','ExifTool:ExifToolVersion'].includes(k)).sort();
 return <main>
  <header><a className="wordmark" href="/" aria-label="editexif home">editexif<span className="mark">*</span></a><span className="local"><span className="dot"/> LOCAL ONLY</span></header>
  <section className="intro"><h1>Same photo.<br/>New metadata.</h1><p className="lede">Choose a camera, a moment, a place.<br/>Everything stays in your browser.</p></section>
  <div className="workspace">
   <section className="image-panel" aria-label="Photo">
    <div className="section-label"><span>01 / PHOTO</span>{file&&<span>{(file.size/1048576).toFixed(1)} MB</span>}</div>
    <label className={'dropzone '+(drag?'drag ':'')+(file?'loaded':'')} onDragOver={e=>{e.preventDefault();if(!busy)setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);chooseFile(e.dataTransfer.files[0]);}}>
     <input aria-label="Choose photo" type="file" accept="image/*,.heic,.heif" disabled={busy} onChange={e=>chooseFile(e.target.files?.[0])}/>
     {preview&&<img src={preview} alt="Your selected photo" onError={e=>{e.currentTarget.style.display='none';}} onLoad={e=>{e.currentTarget.style.display='block';}}/>}
     {!file?<div className="drop-copy"><span className="upload-icon" aria-hidden="true">＋</span><strong>Drop a photo here</strong><span>or click to choose a file</span><small>JPEG · PNG · HEIC · WEBP<br/>up to 60 MB / 50 megapixels</small></div>:<div className="image-caption">{file.name}<span>{busy?'Working locally': 'Click to replace'}</span></div>}
    </label>
    {file&&<p className="note">{output?output.width+' × '+output.height+' pixels. Clean export ready.':'Original metadata read locally. Click the image to replace it.'}</p>}
    <div className="import-photo">
      <div className="section-label">02 / IMPORT FROM A REAL PHOTO</div>
      <label className={'dropzone import-dropzone '+(importDrag?'drag':'')} onDragOver={e=>{e.preventDefault();if(!busy)setImportDrag(true);}} onDragLeave={()=>setImportDrag(false)} onDrop={e=>{e.preventDefault();setImportDrag(false);const input=e.dataTransfer.files[0];if(input&&!busy)run('import',input);}}>
       <input ref={importInput} aria-label="Import from a real photo" type="file" accept="image/*,.heic,.heif" disabled={busy} onChange={e=>{const input=e.target.files?.[0];if(input)run('import',input);}}/>
       <div className="drop-copy"><span className="upload-icon" aria-hidden="true">＋</span><strong>Drop a reference photo</strong><span>or tap to choose or take one</span><small>Auto-fill every available setting.<br/>Edit anything afterward.</small></div>
      </label>
      {importedName&&<p className="note imported-note">Imported from {importedName} <button className="text-button" type="button" onClick={()=>{setReference(undefined);setImportedName('');setMissing([]);setPhones(templates);setPhone(0);setLens(0);setSettings(initial);softwareManual.current=false;if(importInput.current)importInput.current.value='';resetOutput();}}>Clear</button></p>}
      {missing.length>0&&<p className="note" role="status">Not available in this file{': '}{missing.join(', ')}. Camera/software use template defaults where available; missing location stays off and date/time uses the current default. Photo pickers may convert HEIC to JPEG or remove metadata. Choose File with an original can retain more. Full Apple MakerNotes may contain private vendor data.</p>}
     </div>

    <div className="privacy-note"><span className="privacy-symbol" aria-hidden="true">[✓]</span><p>No uploads. No account. No tracking.<br/>Your photo never leaves this tab.</p></div>
    <details className="how"><summary>What this changes</summary><p>The image is re-encoded, removing existing metadata, then standard EXIF tags are added. Pixels keep their appearance, but compression may change them.</p><p>This is not a native camera capture. Apple MakerNotes are copied from a real sample or reference, preserving known input shot IDs and generating missing ones. They describe that sample, not your scene. Depth, Live Photo data, HDR gain maps and valid provenance signatures are not recreated. It does not guarantee a detector result.</p></details>
   </section>
   <section className="controls" aria-label="Export settings"><div className="section-label">03 / METADATA</div>
    <fieldset disabled={busy}>
     <div className="form-row"><label>Phone<select aria-label="Phone" value={phone} onChange={e=>selectPhone(Number(e.target.value))}>{phones.map((p,i)=><option key={p.id} value={i}>{p.name}</option>)}</select></label><label>Lens<select aria-label="Lens" value={lens} onChange={e=>{const i=Number(e.target.value);setReference(undefined);setLens(i);setSettings(s=>({...s,software:softwareManual.current?s.software:defaultSoftware(phones[phone].name,s.date,String(phones[phone].lenses[i].tags['EXIF:Software']??''))}));resetOutput();}}>{phones[phone].lenses.map((l,i)=><option value={i} key={l.id}>{l.name}</option>)}</select></label></div>
     <p className="note source-note">{importedName?'Imported camera values. All fields stay editable.':<>Sourced from a real sample. <a target="_blank" rel="noreferrer" href={current.source}>Source ↗</a><br/>Only verified lens profiles are offered.</>}</p>
     <div className="form-row capture-row"><label>Capture date<input type="datetime-local" step="1" value={settings.date} onChange={e=>update('date',e.target.value)}/></label><label>Timezone<input list="timezones" value={settings.timezone} onChange={e=>update('timezone',e.target.value)} placeholder="America/New_York"/><datalist id="timezones">{timezones.map(z=><option key={z} value={z}/>)}</datalist></label></div>
     <div className="rule"/>
     <div className="location-label"><span>Location</span><label className="toggle"><input type="checkbox" checked={settings.location} onChange={e=>update('location',e.target.checked)}/>Include GPS</label></div>
     {settings.location?<><div className="form-row coordinates"><label>Latitude<input inputMode="decimal" placeholder="40.7128" value={settings.latitude} onChange={e=>update('latitude',e.target.value)}/></label><label>Longitude<input inputMode="decimal" placeholder="-74.0060" value={settings.longitude} onChange={e=>update('longitude',e.target.value)}/></label><label>Altitude / m<input inputMode="decimal" placeholder="Optional" value={settings.altitude} onChange={e=>update('altitude',e.target.value)}/></label></div><p className="note">Timezone updates automatically from valid GPS coordinates.</p><button className="text-button" type="button" onClick={deriveZone}>Use location's timezone ↗</button></>:<p className="note">No GPS tags will be included.</p>}
     <div className="rule"/>
     <div className="form-row"><label>{phones[phone].platform==='ios'?'iOS version':'Camera software'}<input aria-label={phones[phone].platform==='ios'?'iOS version':'Camera software'} list={phones[phone].platform==='ios'?'ios-versions':undefined} value={settings.software} onChange={e=>update('software',e.target.value)} maxLength={80}/>{phones[phone].platform==='ios'&&<datalist id="ios-versions">{iosOptions(phones[phone].name,settings.date).map(v=><option key={v} value={v}>iOS {v}</option>)}</datalist>}</label><label>Output format<select value={settings.format} onChange={e=>update('format',e.target.value as Settings['format'])}><option value="heic">HEIC</option><option value="jpeg">JPEG</option></select></label></div>
     <label className="filename">Filename<div className="input-suffix"><input value={settings.filename} onChange={e=>update('filename',e.target.value)} maxLength={80}/><span>.{settings.format==='heic'?'heic':'jpg'}</span><button type="button" aria-label="Randomize filename" onClick={()=>update('filename',randomFilename())}>↻</button></div></label>
    </fieldset>
    <div className="actions"><button className="primary" disabled={!file||busy} onClick={()=>file&&run('export',file)}>{busy?'Working…':output?'Regenerate photo':'Create photo'}<span aria-hidden="true">↗</span></button>{output&&<button className="download" onClick={download}>Download .{settings.format==='heic'?'heic':'jpg'}<span>{(output.blob.size/1048576).toFixed(2)} MB</span></button>}</div>
    <p className="status" role="status" aria-live="polite">{status||(!file?'Choose a photo to begin.':output?'Ready. Metadata checked locally.':'First export loads the local WASM engine.')}</p>{error&&<p className="error" role="alert">{error}</p>}
   </section>
  </div>
  {before&&<details className="metadata"><summary>04 / TAG DETAILS <span>{output?'Before / after':'Original photo'}</span></summary><div className="table-scroll"><table><thead><tr><th>Tag</th><th>Before</th><th>After</th></tr></thead><tbody>{diffKeys.map(k=><tr key={k} className={output&&String(before[k])!==String(output.after[k])?'changed':''}><th scope="row">{k}</th><td>{String(before[k]??'—')}</td><td>{String(output?.after[k]??'—')}</td></tr>)}</tbody></table></div></details>}
  <footer><span>editexif / made to stay local</span><a href="https://github.com/alissawu/editexif" target="_blank" rel="noreferrer">Source code ↗</a></footer>
 </main>;
}
