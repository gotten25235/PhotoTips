# 光影筆記 · 81 招拍攝技巧

獨立攝影技巧網站，整理 81 招技巧、16 個原始來源與 8 個主題系列。

## 使用方式

### 建議啟動方式
- 雙擊 `START.bat`。
- `START.bat` 採用內嵌 Windows PowerShell 的 localhost HTTP Server，不需要安裝 Python。
- 預設從 `8765` 開始，自動尋找 `8765～8785` 之間可用的連接埠。
- 啟動後會自動開啟瀏覽器；使用期間請保持命令視窗開啟。
- 若 `START.bat` 被放在 PhotoTips 資料夾上一層，也會嘗試自動尋找 `PhotoTips*` 專案資料夾。
- `START_SERVER.bat` 只是相容入口，實際會呼叫同一個 `START.bat`。

### 備用方式
- 仍可直接雙擊 `index.html` 檢查基本內容。
- 但正式使用建議透過 `START.bat`，這樣 Service Worker、PWA 與 localhost 行為最一致。

> 啟動器不依賴 Anaconda 或 Python；只需要 Windows 內建 Windows PowerShell。


## 離線準備

使用 `START.bat` 開啟後，頂部會出現 **「⇩ 離線準備」**。

可分開下載：

- 網頁核心（必要）
- 81 張預覽縮圖（約 3.7 MB）
- 81 張完整圖片（約 5.9 MB）

下載完成後網站會實際檢查 Cache 與圖片 SHA-256；若有缺檔，可按「只重試缺少項目」。也能重新檢查、查看缺少檔案、清除圖片快取或全部離線下載。

離線準備完成後，即使斷網也可查看本站的技巧文字與已下載圖片。Facebook / IG 原始影片仍需要網路。

> 直接雙擊 `index.html` 可以瀏覽，但 `file://` 不支援 Service Worker；要使用離線準備請透過 `START.bat`。

## 兩種瀏覽模式

網站上方可切換：

- **依來源**：同一支 Facebook Reel / Share 的技巧放在一起。Reader 左右滑動時也只切換同一來源。
- **依主題**：把不同來源中性質相近的技巧重新整理在一起。Reader 左右滑動時只切換同一主題。

目前 8 個主題：

1. 人像構圖與機位
2. 曝光與基礎
3. 快門與動態
4. 人像姿勢
5. 戶外旅拍
6. 人像調色
7. 建築人像
8. 夜景人像

## 圖片資料夾規則

實體檔案 **只依來源管理**：

```text
images/
└─ sources/
   ├─ 01-facebook-reel-1427829092611870-portrait-composition/
   ├─ 02-facebook-share-v-1VuUSg26Gi-portrait-angles/
   ├─ ...
   └─ 16-facebook-reel-1797829391228281-temple/
```

每個來源資料夾內放該來源產生的完整圖與縮圖，例如：

```text
images/sources/15-facebook-reel-2936209176743812-male-hiking/
├─ 072-shoe-foreground-perspective.webp
├─ 072-shoe-foreground-perspective-thumb.webp
├─ 073-relaxed-sitting-pose.webp
└─ 073-relaxed-sitting-pose-thumb.webp
```

> `人像圖 / 風景圖 / 建築圖 / 夜景圖 / 動態圖 / 教學圖` 仍可在網頁上篩選，但只存在 metadata，不用來建立實體資料夾。

## 性別標籤規則

`genders` 現在代表 **示意圖片中實際出現的主要人物性別**，不是「這個技巧理論上適合誰」。

因此：

- 女生示範圖只標 `女生`
- 男生示範圖只標 `男生`
- 無明確人像主體的教學 / 風景 / 動態圖片不標性別

這可避免「女生示意圖被男生篩選出來」的錯誤。

詳細維護規則請看 `PROJECT.md`。
