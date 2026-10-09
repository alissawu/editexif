import test from 'node:test';import assert from 'node:assert/strict';
import {iosOptions,defaultSoftware} from './software';
test('date and model constrain software defaults without imaginary iOS19-25',()=>{
 assert.equal(defaultSoftware('iPhone 16 Pro','2026-10-08','18.0'),'26.7.1');
 assert(iosOptions('iPhone 16 Pro','2026-10-08').includes('26.6.2'));
 assert.equal(defaultSoftware('iPhone 16 Pro','2025-09-14','18.0'),'18.0');
 assert.equal(defaultSoftware('iPhone 16 Pro','2024-08-01','18.0'),'');
 assert.equal(defaultSoftware('iPhone 15 Pro','2023-10-01','18.0'),'17.0');
 assert.equal(defaultSoftware('Pixel 9','2026-10-08','camera123'),'camera123');
 assert(!iosOptions('iPhone 16 Pro','2026-09-07').includes('26.6.2'));
});
