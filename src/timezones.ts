import tzLookup from 'tz-lookup';
import type {Settings} from './settings';
export const commonZones=['America/Los_Angeles','America/New_York','America/Chicago','Europe/London','Asia/Tokyo'];
export function timezoneOptions(browserZone=Intl.DateTimeFormat().resolvedOptions().timeZone){
 return [...new Set([...commonZones,browserZone,'UTC',...Intl.supportedValuesOf('timeZone')])];
}
export function zoneForCoordinates(latitude:string,longitude:string){
 if(!latitude.trim()||!longitude.trim())return undefined;
 const lat=Number(latitude),lon=Number(longitude);
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return undefined;
 return tzLookup(lat,lon);
}
export function withLocationTimezone(settings:Settings):Settings{
 if(!settings.location)return settings;
 const timezone=zoneForCoordinates(settings.latitude,settings.longitude);
 return timezone?{...settings,timezone}:settings;
}

