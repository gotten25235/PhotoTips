#!/usr/bin/env python3
"""Generate PhotoTips offline-manifest.json using the ChinaYunnan release model."""
from __future__ import annotations
import hashlib, json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'offline-manifest.json'
CONFIG=ROOT/'tools'/'release.json'
TIPS=ROOT/'data'/'tips.json'

def release_info():
    config=json.loads(CONFIG.read_text(encoding='utf-8'))
    version=str(config.get('version') or '') if isinstance(config,dict) else ''
    build=str(config.get('build') or '') if isinstance(config,dict) else ''
    if not re.fullmatch(r'\d+\.\d+\.\d+',version): raise SystemExit('tools/release.json version must be N.N.N')
    if not re.fullmatch(r'\d{8}-\d{6}',build): raise SystemExit('tools/release.json build must be YYYYMMDD-HHMMSS')
    return version,build

def sha256(path:Path)->str:
    h=hashlib.sha256()
    with path.open('rb') as fh:
        for chunk in iter(lambda:fh.read(1024*1024),b''): h.update(chunk)
    return h.hexdigest()

def core_assets(build:str):
    return [
        './','./index.html','./manifest.webmanifest','./offline-manifest.json',
        f'./css/style.css?b={build}',f'./js/settings.js?b={build}',f'./js/app.js?b={build}',f'./js/offline.js?b={build}',
        f'./data/tips.js?b={build}','./data/tips.json'
    ]

def record(url:str):
    path=ROOT/url.lstrip('./')
    if not path.is_file(): raise SystemExit(f'Image missing: {url}')
    return {'url':'./'+url.lstrip('./'),'bytes':path.stat().st_size,'sha256':sha256(path)}

def generated():
    version,build=release_info()
    tips=json.loads(TIPS.read_text(encoding='utf-8'))
    thumbs=[];full=[];seen_t=set();seen_f=set()
    for tip in tips:
        t=str(tip.get('thumb') or '')
        f=str(tip.get('image') or '')
        if t and t not in seen_t: thumbs.append(record(t));seen_t.add(t)
        if f and f not in seen_f: full.append(record(f));seen_f.add(f)
    image_assets=[x['url'] for x in thumbs+full]
    image_hashes={x['url']:x['sha256'] for x in thumbs+full}
    core=core_assets(build)
    return {
        'schemaVersion':'v2','version':f'{version}+{build}',
        'coreAssets':core,'imageAssets':image_assets,'imageHashes':image_hashes,'remoteImages':[],'optionalRuntime':[],
        # Compatibility fields used by the PhotoTips offline UI.
        'core':[{'url':u} for u in core],'thumbs':thumbs,'full':full
    }

def main():
    data=generated();OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"Generated {OUT.name}: {len(data['coreAssets'])} core assets, {len(data['thumbs'])} thumbs, {len(data['full'])} full images")
    return 0
if __name__=='__main__': raise SystemExit(main())
