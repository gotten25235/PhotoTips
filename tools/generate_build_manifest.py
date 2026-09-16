#!/usr/bin/env python3
"""Generate build.json and asset-manifest.json using the ChinaYunnan update model."""
from __future__ import annotations
import argparse,hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CONFIG=ROOT/'tools'/'release.json';OFFLINE=ROOT/'offline-manifest.json';BUILD_OUT=ROOT/'build.json';ASSET_OUT=ROOT/'asset-manifest.json'
VERSION_RE=re.compile(r'^\d+\.\d+\.\d+$');BUILD_RE=re.compile(r'^\d{8}-\d{6}$')
def release_info():
    c=json.loads(CONFIG.read_text(encoding='utf-8'));v=str(c.get('version') or '');b=str(c.get('build') or '')
    if not VERSION_RE.fullmatch(v):raise SystemExit('tools/release.json version must be N.N.N')
    if not BUILD_RE.fullmatch(b):raise SystemExit('tools/release.json build must be YYYYMMDD-HHMMSS')
    return v,b
def asset_file(asset):
    clean=asset.split('?',1)[0].split('#',1)[0]
    if clean in ('.','./',''):clean='./index.html'
    return ROOT/clean.lstrip('./')
def sha256(path):
    h=hashlib.sha256()
    with path.open('rb') as fh:
        for chunk in iter(lambda:fh.read(1024*1024),b''):h.update(chunk)
    return h.hexdigest()
def generated():
    v,b=release_info();o=json.loads(OFFLINE.read_text(encoding='utf-8'));assets=o.get('coreAssets')
    if not isinstance(assets,list) or not assets:raise SystemExit('offline-manifest.json coreAssets is missing')
    hashes={}
    for asset in assets:
        p=asset_file(asset)
        if not p.is_file():raise SystemExit(f'Core asset file missing: {asset}')
        hashes[asset]=sha256(p)
    return {'version':v,'build':b},{'version':v,'build':b,'assets':hashes}
def text(d):return json.dumps(d,ensure_ascii=False,indent=2)+'\n'
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');args=ap.parse_args();bd,ad=generated();expected={BUILD_OUT:text(bd),ASSET_OUT:text(ad)}
    if args.check:
        stale=[p.name for p,v in expected.items() if not p.is_file() or p.read_text(encoding='utf-8')!=v]
        if stale:print('Stale generated build metadata: '+', '.join(stale));return 1
        print('build.json and asset-manifest.json are current');return 0
    for p,v in expected.items():p.write_text(v,encoding='utf-8',newline='\n')
    print(f"Generated build metadata: {bd['version']} / {bd['build']} ({len(ad['assets'])} core assets)")
    return 0
if __name__=='__main__':raise SystemExit(main())
