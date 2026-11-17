import {test,expect} from '@playwright/test';
import {resolve} from 'node:path';
const url='file://'+resolve('dist/popup.html');
async function mock(page:any){await page.addInitScript(()=>{
 const local={get:async()=>JSON.parse(localStorage.getItem('features')||'{}'),set:async(value:object)=>localStorage.setItem('features',JSON.stringify({...JSON.parse(localStorage.getItem('features')||'{}'),...value})),remove:async(key:string)=>{const data=JSON.parse(localStorage.getItem('features')||'{}');delete data[key];localStorage.setItem('features',JSON.stringify(data));}};
 (window as any).chrome={storage:{local},permissions:{request:async()=>true},tabs:{query:async()=>[{id:1,url:localStorage.getItem('site-url')||'https://music.test/'}]},scripting:{executeScript:async()=>[{result:{connected:1,media:1,title:'Music'}}],getRegisteredContentScripts:async()=>[],registerContentScripts:async()=>{localStorage.setItem('registered','true');},unregisterContentScripts:async()=>{localStorage.removeItem('registered');}}};
});}
test('site profiles restore independently and can be disabled',async({page})=>{
 await mock(page);await page.goto(url);await expect(page.locator('#status')).toHaveText('Connected to this tab');
 await page.locator('#frequency-0').fill('5');await page.getByRole('tab',{name:'Profiles',exact:true}).click();await page.locator('#remember-site').click();
 await expect(page.locator('#remember-site')).toHaveAttribute('aria-pressed','true');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('features')||'{}')['site:https://music.test']?.bands[0])).toBe(5);
 await page.evaluate(()=>localStorage.setItem('site-url','https://second.test/'));await page.reload();await expect(page.locator('#status')).toHaveText('Connected to this tab');
 await page.locator('#frequency-0').fill('-4');await page.getByRole('tab',{name:'Profiles',exact:true}).click();await page.locator('#remember-site').click();await expect(page.locator('#remember-site')).toHaveAttribute('aria-pressed','true');
 await page.evaluate(()=>localStorage.setItem('site-url','https://music.test/'));await page.reload();await expect(page.locator('#frequency-0')).toHaveValue('5');
 await page.getByRole('tab',{name:'Profiles',exact:true}).click();await page.locator('#remember-site').click();await expect(page.locator('#remember-site')).toHaveAttribute('aria-pressed','false');
});
test('named profiles can be saved, renamed, loaded, exported, imported and deleted',async({page})=>{
 await mock(page);await page.goto(url);await expect(page.locator('#status')).toHaveText('Connected to this tab');
 await page.locator('#frequency-0').fill('4');await page.getByRole('tab',{name:'Profiles',exact:true}).click();
 await page.locator('.preset-library summary').click();await page.locator('#preset-name').fill('Night listening');await page.locator('#save-new').click();await expect(page.locator('#custom-presets option')).toHaveCount(2);
 await page.locator('#preset-name').fill('Night mix');await page.locator('#rename-preset').click();await expect(page.locator('#custom-presets option').last()).toHaveText('Night mix');
 const download=page.waitForEvent('download');await page.locator('#export-presets').click();expect((await download).suggestedFilename()).toBe('pulp-presets.json');
 await page.locator('#preset-file').setInputFiles({name:'pulp-presets.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,presets:[{name:'Imported',settings:{bands:Array(10).fill(-2)}}]}))});
 await expect(page.locator('#custom-presets option')).toHaveCount(3);await page.locator('#custom-presets').selectOption({label:'Imported'});await page.getByRole('tab',{name:'Equalizer',exact:true}).click();await expect(page.locator('#frequency-0')).toHaveValue('-2');
 await page.getByRole('tab',{name:'Profiles',exact:true}).click();await page.locator('#delete-preset').click();await expect(page.locator('#custom-presets option')).toHaveCount(2);
 await page.locator('#preset-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":1,"presets":[{"name":"Bad","settings":{"bands":[999]}}]}')});await expect(page.locator('#message')).toContainText('Import failed');
});
test('knobs support pointer dragging and keyboard; spatial is initially off',async({page})=>{
 await page.goto(url);await page.getByRole('tab',{name:'Sound',exact:true}).click();const knob=page.getByRole('slider',{name:'Bass boost knob'});await knob.focus();await page.keyboard.press('ArrowUp');await expect(page.locator('#bass')).toHaveValue('1');
 const box=(await knob.boundingBox())!;await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2,box.y-25);await page.mouse.up();expect(Number(await page.locator('#bass').inputValue())).toBeGreaterThan(1);
 await knob.dblclick();await expect(page.locator('#bass')).toHaveValue('0');await page.getByRole('tab',{name:'Spatial',exact:true}).click();await expect(page.locator('#spatial')).toHaveAttribute('aria-checked','false');await expect(page.locator('#spatial-width')).toBeDisabled();await page.locator('#spatial').click();await page.locator('#spatial-width').fill('85');await page.locator('#spatial-mode').selectOption('headphones');await expect(page.locator('#width-value')).toHaveText('85%');
});
