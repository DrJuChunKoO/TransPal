import type { Speech, Avatar } from '../types/speech';

// 載入演講資料的工具函數
export async function loadSpeech(filename: string): Promise<Speech | null> {
  try {
    const response = await fetch(`/speeches/${filename}.json`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to load speech: ${filename}`, error);
    return null;
  }
}

// 載入所有演講列表
export async function loadAllSpeeches(): Promise<Speech[]> {
  try {
    // 這裡需要實作載入所有演講檔案的邏輯
    // 暫時返回空陣列，後續會在資料載入任務中實作
    return [];
  } catch (error) {
    console.error('Failed to load speeches', error);
    return [];
  }
}

// 載入頭像資料
export async function loadAvatars(): Promise<Avatar[]> {
  try {
    const response = await fetch('/avatars.json');
    if (!response.ok) {
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load avatars', error);
    return [];
  }
}

// 根據講者名稱取得頭像
export function getAvatarForSpeaker(speaker: string, avatars: Avatar[]): string | null {
  const avatar = avatars.find(a => a.name === speaker);
  return avatar ? avatar.image : null;
}