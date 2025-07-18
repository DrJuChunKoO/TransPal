#!/usr/bin/env node

import { promises as fs } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, "..");
const speechesDir = join(projectRoot, "public", "speeches");
const outputPath = join(projectRoot, "public", "search-data.json");

/**
 * 產生搜尋資料的腳本
 * 從所有演講 JSON 檔案中提取搜尋所需的資訊
 */
async function generateSearchData() {
  console.log("🔍 開始產生搜尋資料...");

  try {
    // 確保 speeches 目錄存在
    await fs.access(speechesDir);

    // 讀取所有 JSON 檔案
    const files = await fs.readdir(speechesDir);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    console.log(`📁 找到 ${jsonFiles.length} 個演講檔案`);

    const searchData = [];

    for (const file of jsonFiles) {
      try {
        const filePath = join(speechesDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        const speechData = JSON.parse(content);

        // 提取搜尋所需的資訊
        const filename = file.replace(".json", "");
        const name = speechData.info?.name || filename;
        const date = speechData.info?.date || "";

        // 提取內容摘要（只包含 speech 類型的訊息）
        const contentSummary = [];

        if (speechData.content && Array.isArray(speechData.content)) {
          for (const item of speechData.content) {
            if (item.type === "speech" && item.text && item.speaker) {
              contentSummary.push({
                id: item.id || "",
                text: item.text,
                speaker: item.speaker,
              });
            }
          }
        }

        searchData.push({
          name,
          date,
          filename,
          contentSummary,
        });

        console.log(`✅ 處理完成: ${name}`);
      } catch (error) {
        console.error(`❌ 處理檔案 ${file} 時發生錯誤:`, error.message);
      }
    }

    // 按日期排序（最新的在前）
    searchData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 寫入搜尋資料檔案
    await fs.writeFile(
      outputPath,
      JSON.stringify(searchData, null, 2),
      "utf-8"
    );

    console.log(`🎉 搜尋資料產生完成！共 ${searchData.length} 筆資料`);
    console.log(`📄 檔案已儲存至: ${outputPath}`);

    // 顯示檔案大小
    const stats = await fs.stat(outputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    console.log(`📊 檔案大小: ${fileSizeKB} KB`);
  } catch (error) {
    console.error("❌ 產生搜尋資料時發生錯誤:", error.message);
    process.exit(1);
  }
}

// 執行腳本
generateSearchData();
