// Release dates checked against https://support.apple.com/en-us/100100 (2026-10-08).
// Historical major releases from Apple Newsroom. This is a curated, not exhaustive catalog.
export const iosReleases=[
 ['15.0','2021-09-20'],['16.0','2022-09-12'],['17.0','2023-09-18'],['18.0','2024-09-16'],
 ['26.0','2025-09-15'],['26.0.1','2025-09-29'],['26.1','2025-11-03'],['26.2','2025-12-12'],
 ['26.2.1','2026-01-26'],['26.3','2026-02-11'],['26.3.1','2026-03-04'],['26.4','2026-03-24'],
 ['26.4.1','2026-04-08'],['26.4.2','2026-04-22'],['26.5','2026-05-11'],['26.5.1','2026-06-01'],
 ['26.5.2','2026-06-29'],['26.6','2026-07-27'],['26.6.1','2026-08-17'],['26.6.2','2026-09-08'],
 ['26.7','2026-09-14'],['26.7.1','2026-09-28']
];
export function iosOptions(model:string,date:string){
 const generation=Number(model.match(/iPhone ([0-9]+)/)?.[1]);
 const minimum=generation===16?18:generation===15?17:generation===14?16:15;
 return iosReleases.filter(([v,release])=>Number(v.split('.')[0])>=minimum&&release<=date.slice(0,10)).map(([v])=>v).reverse();
}
export function defaultSoftware(model:string,date:string,fallback:string){return model.startsWith('iPhone')?(iosOptions(model,date)[0]??''):fallback;}
