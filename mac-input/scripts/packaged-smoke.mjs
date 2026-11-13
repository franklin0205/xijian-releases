import { _electron } from 'playwright-core';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),dataDir=path.join(root,'.test-data',`packaged-${Date.now()}`),out=path.join(root,'artifacts');
await mkdir(dataDir,{recursive:true});await mkdir(out,{recursive:true});
const executable=process.argv[2]??path.join(root,'release','win-unpacked','息间.exe');
const env={...process.env,XIJIAN_DATA_DIR:dataDir};delete env.ELECTRON_RUN_AS_NODE;delete env.XIJIAN_TEST;
const app=await _electron.launch({executablePath:executable,args:[],cwd:root,env,timeout:45000});
let nativeQuit=false,stderr='',timer;
app.process().stderr.on('data',d=>{stderr=(stderr+d.toString()).slice(-8000);if(stderr.includes('[packaged-smoke] quit'))nativeQuit=true;});
const errors=[];app.on('window',p=>p.on('pageerror',e=>errors.push(e.message)));
async function assertOpaque(page, selector) {
  const box=await page.locator(selector).boundingBox();
  const png=await page.screenshot({omitBackground:true});
  const viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
  const minAlpha=await app.evaluate(({nativeImage},{png,box,viewport})=>{
    const image=nativeImage.createFromBuffer(Buffer.from(png,'base64'));
    const {width,height}=image.getSize(),bitmap=image.toBitmap();
    const sx=width/viewport.width,sy=height/viewport.height;
    let minimum=255;
    // Skip rounded edges, sample the complete interior including empty areas.
    for(let y=Math.ceil((box.y+24)*sy);y<Math.min(height,(box.y+box.height-24)*sy);y+=11)
      for(let x=Math.ceil((box.x+24)*sx);x<Math.min(width,(box.x+box.width-24)*sx);x+=11)
        minimum=Math.min(minimum,bitmap[(y*width+x)*4+3]);
    return minimum;
  },{png:png.toString('base64'),box,viewport});
  assert.equal(minAlpha,255,`${selector}: desktop must be fully occluded`);
}
try{
  const widget=await app.firstWindow();await widget.locator('#focus-button').waitFor();
  const info=await app.evaluate(({app})=>({packaged:app.isPackaged,name:app.name,version:app.getVersion(),testHooks:!!app.__xijianTest,electron:process.versions.electron}));
  assert.equal(info.packaged,true);assert.equal(info.testHooks,false);assert.equal(info.name,'息间');
  assert.equal(await widget.evaluate(()=>typeof window.require),'undefined');
  assert.equal((await widget.evaluate(()=>window.xijian.getState())).settings.healthEnabled,false);
  await widget.screenshot({path:path.join(out,'app-widget.png')});
  await assertOpaque(widget,'.widget-card');
  const [plans] = await Promise.all([
    app.waitForEvent('window'),
    widget.getByRole('button', { name: '打开工作计划' }).click()
  ]);
  await plans.getByRole('button', { name: '新增工作计划', exact: true }).click();
  await plans.getByLabel('工作名称').fill('打包验证计划');
  await plans.getByLabel('计划日期').fill('2026-12-31');
  await plans.getByRole('button', { name: '新增计划', exact: true }).click();
  await plans.getByRole('heading', { name: '打包验证计划', exact: true }).waitFor();
  assert.equal(await plans.locator('#work-month').textContent(), '2026年12月 – 2027年1月');
  await plans.locator('.work-week-day[data-day="2027-01-01"]').click();
  await plans.locator('#work-day-2027-01-01').waitFor();
  assert.equal(await plans.getByRole('heading', { name: '打包验证计划', exact: true }).count(), 1, 'week keeps the prior year card in its date column');
  await plans.locator('[data-work-view="day"]').click();
  assert.equal(await plans.getByRole('heading', { name: '打包验证计划', exact: true }).count(), 0);
  await plans.locator('[data-work-view="month"]').click();
  await plans.locator('[data-month-day="2027-01-01"]').click();
  assert.equal(await plans.locator('[data-work-view="day"]').getAttribute('aria-pressed'), 'true');
  await plans.getByRole('button', { name: '新增工作计划', exact: true }).click();
  await plans.getByLabel('工作名称').fill('未定日期验证计划');
  await plans.getByLabel('计划日期').fill('');
  await plans.getByRole('button', { name: '新增计划', exact: true }).click();
  await plans.locator('section[aria-labelledby="work-day-undated"]')
    .getByRole('heading', { name: '未定日期验证计划', exact: true }).waitFor();
  await plans.evaluate(async()=>{
    const now=new Date(),day=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    for(let i=0;i<6;i++)await window.xijian.changeWorkPlan({type:'add',draft:{title:`滚动验证计划 ${i+1}`,plannedOn:day,note:'用于验证滚动内容不会穿过日期栏。'}});
  });
  await plans.reload();await plans.locator('.work-item').first().waitFor();
  const dateHeader=plans.locator('.work-week-grid'),records=plans.locator('.work-groups');
  const dateBox=await dateHeader.boundingBox(),recordBox=await records.boundingBox();
  await plans.mouse.move(recordBox.x+recordBox.width/2,recordBox.y+80);await plans.mouse.wheel(0,1000);
  await plans.waitForFunction(()=>document.querySelector('.work-groups').scrollTop>0);
  const afterScroll=await dateHeader.boundingBox();
  assert.equal(afterScroll.y,dateBox.y);
  assert.ok((await records.boundingBox()).y>=afterScroll.y+afterScroll.height,'task viewport cannot overlap translucent header');
  await plans.screenshot({path:path.join(out,'app-plan-scroll.png')});
  await assertOpaque(plans,'.work-shell');
  await plans.getByRole('button', { name: '关闭工作计划', exact: true }).click().catch(error => { if (!plans.isClosed()) throw error; });
  await widget.getByRole('button',{name:'打开设置',exact:true}).click();
  let settings;
  for(let n=0;n<100;n++){settings=app.windows().find(p=>p.url().includes('view=settings'));if(settings)break;await new Promise(r=>setTimeout(r,50));}
  assert.ok(settings);await settings.locator('#interval-eyes').waitFor();
  await settings.getByRole('button',{name:'桌面与通知',exact:true}).click();
  await settings.locator('[data-theme-choice="dark"]').click();
  await widget.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
  for(const theme of ['light','dark']) {
    await settings.locator(`[data-theme-choice="${theme}"]`).click();
    await widget.waitForFunction(theme=>document.documentElement.dataset.theme===theme,theme);
    await assertOpaque(widget,'.widget-card');await assertOpaque(settings,'.settings-shell');
  }
  await settings.screenshot({path:path.join(out,'app-settings.png')});
  const [darkPlans]=await Promise.all([app.waitForEvent('window'),widget.getByRole('button',{name:'打开工作计划'}).click()]);
  await darkPlans.getByRole('button',{name:'新增工作计划',exact:true}).click();
  assert.equal(await darkPlans.locator('.work-composer').evaluate(el=>getComputedStyle(el).color),'rgb(238, 238, 238)');
  await darkPlans.screenshot({path:path.join(out,'app-dark-editor.png')});
  await assertOpaque(darkPlans,'.work-composer');
  await darkPlans.keyboard.press('Escape');
  await darkPlans.getByRole('button',{name:'关闭工作计划',exact:true}).click().catch(error=>{if(!darkPlans.isClosed())throw error;});
  await settings.getByRole('button',{name:'健康提醒',exact:true}).click();
  await settings.getByRole('button',{name:'试一下远眺提醒',exact:true}).click();
  let reminder;
  for(let n=0;n<100;n++){reminder=app.windows().find(p=>p.url().includes('view=reminder'));if(reminder)break;await new Promise(r=>setTimeout(r,50));}
  assert.ok(reminder);await reminder.getByText('让视线去远处走走',{exact:true}).waitFor();await reminder.screenshot({path:path.join(out,'app-reminder.png')});
  await assertOpaque(reminder,'.reminder-shell');
  await reminder.getByRole('button',{name:'跳过体验',exact:true}).click();
  await settings.getByRole('button',{name:'关闭设置',exact:true}).click();
  await app.evaluate(({app})=>app.getAppMetrics());await new Promise(r=>setTimeout(r,1500));
  const metrics=await app.evaluate(({app})=>app.getAppMetrics().map(p=>({type:p.type,serviceName:p.serviceName,workingSetKB:p.memory.workingSetSize,privateBytesKB:p.memory.privateBytes,cpu:p.cpu.percentCPUUsage})));
  await app.evaluate(({app})=>app.on('quit',()=>console.error('[packaged-smoke] quit')));
  const closing=app.close();closing.catch(()=>{});
  const until=Date.now()+15000;while(!nativeQuit&&app.process().exitCode===null&&Date.now()<until)await new Promise(r=>setTimeout(r,50));
  assert.ok(nativeQuit||app.process().exitCode!==null,'native app quit');
  if(process.platform==='win32'&&nativeQuit&&app.process().exitCode===null)app.process().kill();
  await Promise.race([closing,new Promise(r=>setTimeout(r,1000))]);
  const persisted=JSON.parse(await readFile(path.join(dataDir,'state.json'),'utf8'));assert.equal(persisted.settings.focusPlan.workMinutes,25);assert.equal(persisted.stats&&Object.values(persisted.stats).reduce((n,s)=>n+s.healthCompleted,0),0);
  const workData = JSON.parse(await readFile(path.join(dataDir, 'work-plans.json'), 'utf8'));
  assert.equal(persisted.settings.theme,'dark');
  assert.equal(workData.items[0].title, '打包验证计划');
  assert.equal(workData.items[1].plannedOn, null);
  assert.deepEqual(errors,[]);
  await writeFile(path.join(out,'packaged-smoke-results.json'),JSON.stringify({status:'passed',date:new Date().toISOString(),executable,info,metrics,rendererErrors:errors},null,2));
  console.log('打包程序验收通过：离线界面、工作计划、设置、提醒、无测试后门、退出保存。');
}catch(error){console.error(error);console.error(stderr);app.process().kill();process.exitCode=1;}
