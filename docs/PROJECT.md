# PROJECT.md — 光影筆記 / PhotoTips_0916

## 1. 專案定位

「光影筆記」是獨立的攝影技巧網站，目前包含：

- 81 招技巧
- 16 個原始來源
- 8 個整理後主題
- 手機系列疊卡
- 桌面系列分組
- 來源 / 主題雙模式
- 搜尋、篩選、收藏、隨機一招
- 同系列 Reader
- 深色 / 淺色模式
- `file://` 直接開啟
- HTTP 模式 Service Worker 離線快取

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
   └─ 16-facebook-reel-1797829391228281-temple/
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
- 系列下拉：顯示 16 個來源系列。

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
81 筆資料
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

81 招中：

- 女生示範：46 招
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
- 76–81：女生

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
├─ PROJECT.md
├─ README.md
├─ BUILD.txt
├─ START.bat
├─ manifest.webmanifest
├─ sw.js
├─ css/
│  └─ style.css
├─ js/
│  └─ app.js
├─ data/
│  ├─ tips.json
│  └─ tips.js
├─ images/
│  └─ sources/
│     ├─ 01-facebook-reel-.../
│     ├─ 02-facebook-share-v-.../
│     └─ ... 16 個來源資料夾
└─ docs/
   └─ 原始攝影技巧整理.md
```

---

## 8. 新增來源的標準流程

新增一支 FB / IG / Threads 內容時：

1. 建立新的來源資料夾：

```text
images/sources/17-facebook-reel-xxxxxxxx-new-topic/
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
