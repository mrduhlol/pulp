import {test,expect} from '@playwright/test';
import {resolve} from 'node:path';
const pageUrl='file://'+resolve('dist/popup.html');
test('profiles, sound controls, bypass and keyboard tabs work and persist',async({page})=>{
 await page.addInitScript(()=>{
  const local={get:async()=>JSON.parse(localStorage.getItem('pulp-test')||'{}'),set:async(value:object)=>localStorage.setItem('pulp-test',JSON.stringify({...JSON.parse(localStorage.getItem('pulp-test')||'{}'),...value}))};
  (window as any).chrome={storage:{local},tabs:{query:async()=>[{id:1}]},scripting:{executeScript:async()=>[{result:{connected:1,media:1,title:'Test music'}}]}};
 });
 await page.goto(pageUrl);
 await expect(page.locator('#status')).toHaveText('Connected to this tab');
 await page.getByRole('button',{name:'Bass boost',exact:true}).click();
 await expect(page.locator('#frequency-0')).toHaveValue('7');
 await expect(page.locator('#preset')).toHaveValue('Bass boost');
 await page.getByRole('tab',{name:'Sound',exact:true}).click();
 await page.locator('#bass').fill('8');
 await expect(page.locator('#bass-value')).toHaveText('8 dB');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pulp-test')||'{}').settings?.bass)).toBe(8);
 await page.getByRole('button',{name:'Save custom profile',exact:true}).click();
 await expect(page.locator('#message')).toHaveText('Custom profile saved.');
 await page.reload();
 await page.getByRole('tab',{name:'Sound',exact:true}).click();
 await expect(page.locator('#bass')).toHaveValue('8');
 await page.getByRole('button',{name:'Bypass equalizer',exact:true}).click();
 await expect(page.locator('#power')).toHaveAttribute('aria-pressed','false');
 await page.getByRole('tab',{name:'Sound',exact:true}).focus();
 await page.keyboard.press('ArrowRight');
 await expect(page.getByRole('tab',{name:'Profiles',exact:true})).toBeFocused();
 await page.getByRole('button',{name:'Rock',exact:true}).click();
 await expect(page.getByRole('button',{name:'Rock',exact:true})).toHaveAttribute('aria-pressed','true');
});
test('malformed stored settings are bounded before reaching audio controls',async({page})=>{
 await page.addInitScript(()=>{(window as any).chrome={storage:{local:{get:async()=>({settings:{bands:[999,-999],volume:-20,bass:'bad',preset:'invalid'}}),set:async()=>{}}},tabs:{query:async()=>[]}};});
 await page.goto(pageUrl);
 await expect(page.locator('#frequency-0')).toHaveValue('12');
 await expect(page.locator('#frequency-1')).toHaveValue('-12');
 await page.getByRole('tab',{name:'Sound',exact:true}).click();
 await expect(page.locator('#volume')).toHaveValue('0');
 await expect(page.locator('#bass')).toHaveValue('0');
});
for(const width of [520,360])test(`all panels fit at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:600});await page.goto(pageUrl);await page.evaluate(()=>document.fonts.ready);
 for(const name of ['Equalizer','Sound','Profiles']){
  await page.getByRole('tab',{name,exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  const panel=await page.getByRole('tabpanel').boundingBox();const footer=await page.locator('footer').boundingBox();
  expect(panel!.y+panel!.height).toBeLessThanOrEqual(footer!.y);
  if(name==='Equalizer'){const quick=await page.locator('.quick-profiles').boundingBox();expect(quick!.y+quick!.height).toBeLessThanOrEqual(footer!.y);}
  await page.screenshot({path:`artifacts/review/${width}-${name.toLowerCase()}.png`});
 }
});
