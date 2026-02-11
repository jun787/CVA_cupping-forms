# CVA Cupping Forms PWA

使用 Vite + React + TypeScript 建立，採「PDF 背景（pdf.js）+ 透明表單層」策略，支援 `text / checkbox / slider` 三種欄位，並可在 iPhone 優先使用。

## 重要：資產需自行放置（本 repo 不提交 PDF/字型）

因 PR 不提交二進位檔，請自行準備並放入：

- `public/forms/cva.pdf`
- `public/fonts/msjh.ttf`

若資產不存在（404），App 會顯示錯誤提示並停止渲染。

## 安裝與啟動

```bash
npm i
npm run dev
```

## 功能摘要

- `/` 表單頁
  - PDF 每頁由 `pdfjs-dist` 渲染到 canvas 當背景。
  - 透明 overlay 疊加欄位（text / checkbox / slider）。
  - 預設頁面為第 2 頁（描述性）。
  - Sessions 存 IndexedDB（可新建、開啟、複製、刪除，離線優先）。

- `/mapper` 標註頁
  - 同樣使用 pdf.js 背景。
  - 可拖拉建立、移動、縮放欄位 rect。
  - 欄位型別：text / checkbox / slider。
  - 自動 ID：`p{page}_{type}_{index}`（3 位數連號）。
  - checkbox Grid 批量生成（rows / cols / spacingX / spacingY）。
  - slider 點一下設定 `valueAnchor`（0..1 比例）。
  - `fields.json` 匯入/匯出 + preview。

## 匯出 PDF

- 不直接讀取或修改原始 PDF（避免 SECURED PDF 問題）。
- 先用 pdf.js 將「有填內容頁」渲染為高解析 PNG bytes。
- 再用 `pdf-lib` 新建 PDF，將 PNG 當底圖，並疊印：
  - checkbox：`✓`
  - slider：只印數字
  - text：依欄寬換行，超過 `maxLines` 截斷 + `…`
- 匯出時嵌入 `public/fonts/msjh.ttf`（`@pdf-lib/fontkit` + subset）。

## fields.json 流程

1. 進入 `/mapper`
2. 對齊欄位
3. 匯出 `fields.json`
4. 放到 `public/fields/fields.json`
