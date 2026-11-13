import { readFile, readdir, mkdir, writeFile, access } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const root=process.cwd(), base=path.join(root,'node_modules','electron');
const {version}=JSON.parse(await readFile(path.join(base,'package.json'),'utf8'));
const executable=process.platform==='win32'?'electron.exe':process.platform==='darwin'?'Electron.app/Contents/MacOS/Electron':'electron';
const dist=path.join(base,'dist');
try { await access(path.join(dist,executable)); if((await readFile(path.join(dist,'version'),'utf8')).trim().replace(/^v/,'')===version){await writeFile(path.join(base,'path.txt'),executable);console.log(`Electron ${version} 已就绪`);process.exit(0);} } catch {}
const filename=`electron-v${version}-${process.platform}-${process.arch}.zip`;
const checksums=JSON.parse(await readFile(path.join(base,'checksums.json'),'utf8'));
const cache=process.env.electron_config_cache??(process.platform==='win32'?path.join(process.env.LOCALAPPDATA??path.join(os.homedir(),'AppData','Local'),'electron','Cache'):process.platform==='darwin'?path.join(os.homedir(),'Library','Caches','electron'):path.join(os.homedir(),'.cache','electron'));
let candidates=[];
try { for(const entry of await readdir(cache,{withFileTypes:true}))candidates.push(entry.isDirectory()?path.join(cache,entry.name,filename):entry.name===filename?path.join(cache,filename):''); } catch {}
for(const candidate of candidates.filter(Boolean)){
  try{
    const hash=createHash('sha256');for await(const chunk of createReadStream(candidate))hash.update(chunk);
    if(hash.digest('hex')!==checksums[filename])continue;
    await mkdir(dist,{recursive:true});
    let result;
    if(process.platform==='win32'){
      const quote=s=>`'${s.replaceAll("'","''")}'`;
      const shell=path.join(process.env.SystemRoot??'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
      result=spawnSync(shell,['-NoProfile','-NonInteractive','-Command',`Expand-Archive -LiteralPath ${quote(candidate)} -DestinationPath ${quote(dist)} -Force`],{stdio:'inherit',windowsHide:true});
    }else result=spawnSync('unzip',['-q','-o',candidate,'-d',dist],{stdio:'inherit'});
    if(result.status!==0)throw new Error('运行时解压失败');
    await writeFile(path.join(base,'path.txt'),executable);
    console.log(`Electron ${version} 已从 SHA256 校验通过的缓存安装`);process.exit(0);
  }catch{}
}
const flags=Number(process.versions.node.split('.')[0])>=24?['--use-env-proxy']:[];
const result=spawnSync(process.execPath,[...flags,path.join(base,'install.js')],{stdio:'inherit',env:process.env,timeout:180000,windowsHide:true});
if(result.status!==0){console.error('Electron 运行时下载没有完成。请在网络可用时重新运行 npm run setup。');process.exit(1);}
