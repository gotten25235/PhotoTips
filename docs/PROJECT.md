# PROJECT.md — 光影筆記 / PhotoTips_0916

## 1. 專案定位

「光影筆記」是獨立的攝影技巧網站，目前包含：

- 101 招技巧
- 19 個原始來源
- 8 個整理後主題
- 手機系列疊卡
- 桌面系列分組
- 來源 / 主題雙模式
- 搜尋、篩選、收藏、隨機一招
- 同系列 Reader
- 系統預設 / 淺色 / 深色三段主題模式
- `file://` 直接開啟
- HTTP 模式 Service Worker 離線快取
- 離線準備面板（核心 / 縮圖 / 完整圖）
- Cache 完整性檢查、缺檔重試與清除離線資料

本專案只參考 `ChinaYunnan_0916_nav-refresh-weather` 的 UI 與檔案整理思想，內容與雲南旅遊無關。

---

## 2. 最重要的資料規則

### 2.1 實體圖片：只依「來源」分資料夾

硬碟檔案的主要管理單位是原始貼文 / Reel，而不是人像、夜景、建築等內容類型。

```text
images/
└─ sources/
   ├─ 01-facebook-reel-1427829092611870-portrait-composition/
   ├─ 02-facebook-share-v-1VuUSg26Gi-portrait-angles/
   ├─ 03-facebook-reel-1063888769453150-exposure-control/
   ├─ 04-facebook-share-v-19iqoiWdQN-shutter-speed/
   ├─ 05-facebook-share-r-18LejPaB6B-stair-portrait/
   ├─ 06-facebook-share-r-1BuoB6hboL-tree-panorama/
   ├─ 07-facebook-share-r-18C7iSfYmr-grassland-travel/
   ├─ 08-facebook-share-r-14rgeQcVA5M-autumn-portrait/
   ├─ 09-facebook-share-r-1BxfcJFnjP-grassland-creative/
   ├─ 10-facebook-share-r-1C2vPM5NRQ-exposure-triangle/
   ├─ 11-facebook-share-v-1c9SWQ8NdK-portrait-color/
   ├─ 12-facebook-reel-1755771195737398-full-body/
   ├─ 13-facebook-reel-1095871943388192-corridor/
   ├─ 14-facebook-reel-1589829399301145-night-flash/
   ├─ 15-facebook-reel-2936209176743812-male-hiking/
   ├─ 16-facebook-reel-1797829391228281-temple/
   └─ 17-threads-kaikaiveg-DTwZ23FkyM-railing-poses/
   └─ 18-threads-beauty-photo-01-DUu-eUVD2_c-girlfriend-guide/
   └─ 19-threads-healthcare-aaron680528-DZCZfbQme8w-male-poses/
```

### 2.2 內容分類：只放 metadata

以下分類仍存在，但 **不得拿來建立實體圖片資料夾**：

- 人像圖
- 風景圖
- 建築圖
- 夜景圖
- 動態圖
- 教學圖

也就是：

```text
實體檔案位置 = sourceFolder
網站內容篩選 = imageCategory / categories / tags / genders
```

這兩件事必須分開。

### 2.3 2026-09-17 新增 Threads 來源

第 17 個來源：

```text
17-threads-kaikaiveg-DTwZ23FkyM-railing-poses
```

- 來源：`https://www.threads.com/@kaikaiveg/post/DTwZ23FkyM_`
- 來源系列：`欄杆人像姿勢`
- 技巧：82–87
- 主題系列：`人像姿勢`
- 示範人物：女生


---

## 3. 來源資料夾命名規則

格式：

```text
{兩位數排序}-{平台}-{來源型態}-{來源ID}-{簡短英文描述}
```

例如：

```text
15-facebook-reel-2936209176743812-male-hiking
```

來源資料夾內，完整圖與縮圖放在一起：

```text
072-shoe-foreground-perspective.webp
072-shoe-foreground-perspective-thumb.webp
```

圖片檔名格式：

```text
{三位數技巧ID}-{semantic-kebab-case}.webp
{三位數技巧ID}-{semantic-kebab-case}-thumb.webp
```

規則：

1. 保留三位數 ID。
2. 英文 semantic kebab-case。
3. 不使用空白。
4. 縮圖固定加 `-thumb`。
5. 同一技巧的完整圖與縮圖必須在同一 `sourceFolder`。

---

## 4. 網站兩種分組模式

實體檔案只有一套，但網頁可以用兩種邏輯瀏覽。

### 4.1 依來源（source mode）

使用：

```text
sourceId
sourceSeries
```

例如：

```text
來源系列：男生登山拍照姿勢
來源：Facebook Reel 2936209176743812
技巧：72–75
```

行為：

- 手機：同來源疊成一疊卡片。
- 桌面：同來源一個 section。
- Reader：只在同 `sourceId` 中左右切換。
- 系列下拉：顯示 17 個來源系列。

### 4.2 依主題（topic mode）

使用：

```text
topicSeries
```

目前 8 個主題：

| topicSeries | 說明 |
|---|---|
| 人像構圖與機位 | 人物位置、留白、三分線、高低機位等 |
| 曝光與基礎 | 曝光、直方圖、ISO、光圈等 |
| 快門與動態 | 飛鳥、賽車、流水、車軌等 |
| 人像姿勢 | 樓梯、全身、登山姿勢等 |
| 戶外旅拍 | 草原、秋葉、大樹、戶外創意構圖 |
| 人像調色 | 膚色、曝光、對比、飽和、褪色等 |
| 建築人像 | 長廊、柱子、古建築、天壇等 |
| 夜景人像 | 夜景曝光、反差色、閃光燈等 |

行為：

- 手機：同主題疊成一疊卡片。
- 桌面：同主題一個 section。
- Reader：只在同 `topicSeries` 中左右切換。
- 系列下拉：顯示 8 個主題系列。

### 4.3 篩選與分組的順序

```text
101 筆資料
  ↓
主分類 / 拍法 / 圖片分類 / 搜尋 / 收藏
  ↓
filteredTips
  ↓
依來源 → group by sourceId
或
依主題 → group by topicSeries
```

Reader 不受目前篩選結果截斷；點進一張後會載入該來源或該主題的完整系列。

---

## 5. 性別標籤規則

### 5.1 `genders` 表示「畫面人物」，不是「理論適用性」

錯誤做法：

```json
"genders": ["男生", "女生"]
```

只因為這個拍照技巧男女都可以用。

正確做法：

- 圖中主要示範人物是女生 → `['女生']`
- 圖中主要示範人物是男生 → `['男生']`
- 教學圖、純風景、動態題材、無清楚人像主體 → `[]`

這樣「男生 / 女生」篩選代表使用者實際會看到什麼參考人物。

### 5.2 目前重新檢查結果

87 招中：

- 女生示範：52 招
- 男生示範：13 招
- 無性別標籤：22 招

主要修正：

- 1–13：女生
- 32–35：女生
- 37–40：男生
- 41–44：女生
- 45–49：男生
- 53–71：女生
- 72–75：男生
- 76–87：女生

其餘沒有明確人像示範的技巧保持 `[]`。

---

## 6. 技巧資料格式

目前每筆資料的核心欄位：

```json
{
  "id": 72,
  "title": "鞋底前景壓迫感",
  "text": "用 0.5× 從樓梯下方仰拍，讓前腳鞋底貼近鏡頭製造壓迫感。",

  "sourceId": "facebook-reel-2936209176743812",
  "sourceSeries": "男生登山拍照姿勢",
  "sourceTitle": "男生登山拍照姿勢",
  "sourceFolder": "15-facebook-reel-2936209176743812-male-hiking",
  "source": "https://www.facebook.com/reel/2936209176743812/",

  "topicSeries": "人像姿勢",

  "categories": ["人像"],
  "genders": ["男生"],
  "tags": ["低機位", "廣角", "構圖", "人像"],
  "scenes": ["登山／戶外"],
  "imageCategory": "portrait",

  "image": "images/sources/15-facebook-reel-2936209176743812-male-hiking/072-shoe-foreground-perspective.webp",
  "thumb": "images/sources/15-facebook-reel-2936209176743812-male-hiking/072-shoe-foreground-perspective-thumb.webp"
}
```

### 欄位角色

| 欄位 | 用途 |
|---|---|
| `sourceId` | 穩定的原始來源識別 |
| `sourceSeries` | 網頁「依來源」的顯示系列名稱 |
| `sourceTitle` | 原始影片 / 貼文標題 |
| `sourceFolder` | 實體圖片資料夾 |
| `topicSeries` | 網頁「依主題」的分組 |
| `imageCategory` | 圖片類型 metadata，不對應實體資料夾 |
| `genders` | 畫面主要人物性別 |

舊欄位 `series` / `sourceLabel` 暫時保留供相容與查核，新程式不應依賴它們。

---

## 7. 專案檔案結構

```text
PhotoTips_0916/
├─ index.html
├─ README.md
├─ BUILD.txt
├─ START.bat
├─ START_SERVER.bat
├─ manifest.webmanifest
├─ build.json                 # 日常更新探針
├─ asset-manifest.json        # App Shell SHA-256
├─ offline-manifest.json      # 離線素材與圖片 SHA-256
├─ sw.js
├─ css/
│  └─ style.css
├─ js/
│  ├─ app.js
│  ├─ offline.js
│  └─ settings.js
├─ data/
│  ├─ tips.json
│  └─ tips.js
├─ tools/
│  ├─ release.json
│  ├─ generate_offline_manifest.py
│  └─ generate_build_manifest.py
├─ images/
│  └─ sources/
│     ├─ 01-facebook-reel-.../
│     ├─ 02-facebook-share-v-.../
│     └─ ... 17 個來源資料夾
└─ docs/
   ├─ PROJECT.md
   └─ 原始攝影技巧整理.md
```

---

## 8. 新增來源的標準流程

新增一支 FB / IG / Threads 內容時：

1. 建立新的來源資料夾：

```text
images/sources/18-facebook-reel-xxxxxxxx-new-topic/
```

2. 將這支來源擷取的完整圖與縮圖全部放進該資料夾。
3. 在每筆技巧資料加入：
   - `sourceId`
   - `sourceSeries`
   - `sourceTitle`
   - `sourceFolder`
   - `topicSeries`
4. 依畫面實際人物設定 `genders`。
5. 依內容設定 `imageCategory`、`categories`、`tags`、`scenes`。
6. 同步更新：

```text
data/tips.json
data/tips.js
```

7. 確認 `image` / `thumb` 路徑存在。

---

## 9. 不可再做的事

### 不要按內容類型建立圖片實體資料夾

以下結構已淘汰：

```text
images/portrait/
images/landscape/
images/architecture/
images/night/
images/action/
images/tutorial/
```

### 不要再用一個模糊的 `series` 當唯一分組概念

必須明確區分：

```text
sourceSeries  = 原始來源系列
topicSeries   = 整理後相同主題系列
```

### 不要因技巧「男女皆可」就同時貼男女標籤

`genders` 只描述示意圖片的實際人物。


---

## 啟動規則

### `START.bat`
正式啟動器，架構以可用的 Yunnan 內嵌 PowerShell HTTP Server 為基礎。

規則：
1. **不可依賴 Python / Anaconda / Node.js**。
2. 使用 Windows PowerShell 在 `127.0.0.1` 建立靜態 HTTP Server。
3. 從 port `8765` 開始，自動嘗試到 `8785`，避免固定 port 被占用造成啟動失敗。
4. 正常情況下，`START.bat` 與 `index.html` 放在同一專案根目錄。
5. 若啟動器被放在上一層，會嘗試尋找第一個包含 `index.html` 的 `PhotoTips*` 子資料夾。
6. 非圖片檔回應使用 `no-cache, no-store, must-revalidate`，降低舊 JS / HTML 快取造成「更新後仍不能用」的問題。
7. 圖片可長期快取，因圖片採來源資料夾＋固定語意檔名管理。
8. 啟動 URL 帶版本 query，協助避開舊入口快取；實際程式更新判斷以 `build.json` 為準。

### `START_SERVER.bat`
僅作相容入口，直接呼叫 `START.bat`，避免專案出現兩套不同 Server 行為。

### Service Worker 更新規則
更新架構直接沿用 `ChinaYunnan_0916`：

- `build.json` 是唯一的日常更新探針。
- `index.html` 帶 `data-app-version` 與 `data-app-build`。
- App Cache 名稱為 `photo-tips-app-<version>-<build>`。
- HTML navigation 採 **Network First**；離線才回退目前 App Cache。
- CSS / JS / JSON 等 App Shell 採 **Cache First**；只有新 Build 安裝、手動強制更新或首次缺檔時才重新抓取。
- `asset-manifest.json` 保存 App Shell SHA-256；新 Build 安裝時，內容未變的核心檔直接從上一個 App Cache 複製。
- 圖片採穩定的 `photo-tips-images-v1` Cache，不因 Build 改變整包刪除。
- `offline-manifest.json` 保存所有本地圖片 SHA-256；只更新內容真的變更、刪除或雜湊不一致的已快取圖片。
- 設定視窗提供「檢查更新」與「強制重新載入」，行為與雲南版一致。

目前版本：`1.1.0`，Build：`20260917-021920`。


## 9. 離線準備（2026-09-17）

本版參考 ChinaYunnan 的離線準備流程，PhotoTips 採用三層離線內容：

1. **網頁核心（必要）**
   - `index.html`
   - `css/style.css`
   - `js/app.js`
   - `js/offline.js`
   - `data/tips.js`
   - `manifest.webmanifest`
   - `offline-manifest.json`
2. **預覽圖片（可選）**
   - 101 張 `-thumb.webp`
   - 約 4.2 MB
3. **完整圖片（可選）**
   - 101 張完整 WebP
   - 約 6.7 MB

全部圖片約 10.9 MB，另加少量核心檔。

### 9.1 Cache 分層

```text
photo-tips-app-1.1.0-20260917-021920 # 目前 Build 的 App Shell
photo-tips-images-v1                  # 202 張圖片，跨 Build 穩定保留
photo-tips-offline-v1                 # 離線檢查 / reconcile metadata
```

程式版本更新時只替換 App Cache；圖片 Cache 不因 JS / CSS 更新而整包刪除。

### 9.2 真實完整性檢查

`offline-manifest.json` 記錄 101 張縮圖與 101 張完整圖的：

- 相對 URL
- bytes
- SHA-256

「離線已備妥」不是單純 localStorage flag。Service Worker 會實際檢查 Cache 是否存在，並比對圖片 SHA-256。只有已選內容全部通過才顯示完成。

### 9.3 UI 狀態

頂部按鈕會依狀態顯示：

```text
⇩ 離線準備
… 準備中
✓ 離線已備妥
✓ 離線可用
! 離線未備妥
```

面板支援：

- 全選 / 只留核心
- 下載已選內容
- 即時下載進度
- 重新檢查
- 只重試缺少項目
- 查看缺少檔案
- 清除圖片快取
- 清除全部離線下載
- PWA 安裝提示

### 9.4 執行環境

Service Worker 需要 `http://localhost` / `http://127.0.0.1` 或 HTTPS。正式使用請用 `START.bat`。直接以 `file://` 雙擊 `index.html` 仍可瀏覽基本內容，但離線準備會提示改用 `START.bat`。

### 9.5 外部來源限制

Facebook / IG / Threads 等來源貼文不屬於本站離線素材。離線時可完整查看本站 87 招文字與已下載圖片，但「查看來源」仍需網路。

## 10. 介面、主題與彈跳視窗（2026-09-17）

本版參考 ChinaYunnan 的介面版面邏輯，新增可持久化的「手機版 / 電腦版」選擇。

### 10.1 介面版面

設定鍵：

```text
photo-tips-ui-layout-v1
```

可選：

- `mobile`：預設。手機使用窄版系列疊卡；一般桌面裝置仍依螢幕寬度顯示桌面系列。
- `desktop`：手機重新載入時使用約 1280px 桌面 viewport，完整保留桌面系列分組與比例並縮放到實體螢幕。

設定儲存在 localStorage，線上、離線與安裝成 PWA 後共用。

實作：

- `index.html` 開頁前先讀取版面設定，避免先渲染手機版再跳桌面版。
- `js/settings.js` 管理設定視窗、版面切換、重新載入與偏好同步。
- `html[data-ui-layout="desktop"] body` 設定桌面最小寬度，與數值 viewport 配合。


### 10.2 顯示主題

顯示主題邏輯直接對齊 `ChinaYunnan_0917_sunwish-persist`：

設定鍵：

```text
photo-tips-color-theme-v1
```

有效值：

- `system`：預設。透過 `matchMedia('(prefers-color-scheme: dark)')` 跟隨作業系統；系統外觀變更時立即同步。
- `light`：固定淺色，`color-scheme` 使用 `only light`，避免 Android / Samsung 自動暗色化。
- `dark`：固定深色，`color-scheme` 使用 `dark`。

啟動時 `index.html` 會在 CSS 載入前先解析偏好並設定：

- `data-theme-preference`：使用者偏好 (`system / light / dark`)。
- `data-theme`：實際解析結果 (`light / dark`)。
- `<meta name="color-scheme">`。
- `<meta name="theme-color">`。
- `document.documentElement.style.colorScheme`。

`js/settings.js` 負責後續同步、儲存、系統主題監聽與設定頁下拉選單。右上角舊的 `◐` 二段切換已移除，所有主題變更統一從 `⚙` →「顯示主題」管理。

### 10.3 彈跳視窗規則

Reader、離線準備、介面設定皆採 **inset dialog**：

- 不可在手機上貼滿整個 viewport。
- 四周保留可見 backdrop 縫隙。
- 四角保留圓角。
- 點擊外部 backdrop 可關閉。
- `×` / 返回 / 完成 / `Esc` 皆可離開。
- 內容過長時，只讓 dialog 內部區域捲動。

彈窗幾何直接依照雲南版最終 override：手機 Reader / 離線準備採 `width:min(90vw, ...)` 與 `height:80dvh`，因此左右各保留約 5vw 的可點擊 backdrop；設定視窗同樣採 90vw、最高 80dvh。幾何規則使用最終 `!important` override，避免早期 bottom-sheet / full-screen CSS 再覆蓋。

### 10.4 離線與更新同步

介面設定、離線準備與更新系統共用同一套 Build：

- `tools/release.json`：軟體版本與 Build ID。
- `tools/generate_offline_manifest.py`：依 `tips.json` 重建 87 張縮圖、87 張完整圖、核心清單與圖片 SHA-256。
- `tools/generate_build_manifest.py`：依核心清單產生 `build.json` 與 `asset-manifest.json`。
- `sw.js`：讀取上述 manifest，執行 App Shell reuse、圖片 reconcile、強制核心重抓與離線準備。
- `START.bat`：只負責本機 HTTP 服務，不再用自己的版本字串作為更新真相來源。

每次發布流程必須先更新 `tools/release.json` 的 Build，再依序執行：

```text
python tools/generate_offline_manifest.py
python tools/generate_build_manifest.py
python tools/generate_build_manifest.py --check
```

然後同步 `index.html` / `sw.js` 內的 version/build 常數。


---

## 11. 雲南版更新邏輯對齊（1.1.0）

本版的更新流程以 `ChinaYunnan_0916` 為直接參考，執行順序如下：

1. 開頁或回到前景時，讀取遠端 `build.json`（`cache:no-store`）。
2. 比對 HTML 的 `version|build` 與目前 Service Worker 回報的 `version|build`。
3. 發現新 Build 時呼叫 `registration.update()`，讓新 SW 安裝；新 SW 會用 `asset-manifest.json` 比較 SHA-256，未變的核心檔直接複製舊 Cache。
4. 新 SW `skipWaiting` 並接管後才重新載入頁面。
5. Build 相同但使用者按「檢查更新」時，執行 `RECONCILE_IMAGES`：只檢查目前已快取的圖片，雜湊不符才重新抓取。
6. 使用者按「強制重新載入」時，先執行 `FORCE_REFRESH_APP_SHELL` 重新抓核心，再 reconcile 圖片，最後帶 cache-busting query 重載。
7. 網路失敗時保留目前可離線版本，不會因更新檢查失敗破壞既有 Cache。

### 彈窗對齊

Reader 的 dialog、header、16:10 圖片框、內容寬度、資訊格、footer 與 mobile 90vw / 80dvh 幾何直接比照雲南 Detail Reader。手機 Reader footer 隱藏左右按鈕，只保留位置文字，主要以左右滑動切換內容。
