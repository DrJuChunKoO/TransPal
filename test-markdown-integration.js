// Simple test to verify markdown integration is working
import { detectContentType, validateContent, analyzeContent } from './src/utils/contentTypeDetection.js';

console.log('Testing content type detection...');

// Test cases
const testCases = [
  {
    name: 'Simple text',
    content: 'This is just simple text with no special formatting.',
    expected: 'text'
  },
  {
    name: 'Text with basic formatting',
    content: 'This has **bold** and *italic* text.',
    expected: 'text'
  },
  {
    name: 'Markdown with headers',
    content: '# This is a header\n\nThis is some content.',
    expected: 'markdown'
  },
  {
    name: 'Markdown with lists',
    content: 'Here is a list:\n\n- Item 1\n- Item 2\n- Item 3',
    expected: 'markdown'
  },
  {
    name: 'Markdown with code blocks',
    content: 'Here is some code:\n\n```javascript\nconst x = 1;\n```',
    expected: 'markdown'
  },
  {
    name: 'Markdown with links',
    content: 'Check out [this link](https://example.com) for more info.',
    expected: 'markdown'
  },
  {
    name: 'Complex markdown',
    content: '# Meeting Summary\n\nThis meeting covered several **important topics**:\n\n1. Budget allocation\n2. Project timeline\n\n```javascript\nconst example = "code block";\n```\n\n[More info](https://example.com)',
    expected: 'markdown'
  }
];

// Run tests
let passed = 0;
let failed = 0;

testCases.forEach(testCase => {
  const result = detectContentType(testCase.content);
  const isValid = validateContent(testCase.content, result);
  const analysis = analyzeContent(testCase.content);
  
  if (result === testCase.expected) {
    console.log(`✅ ${testCase.name}: ${result} (valid: ${isValid})`);
    passed++;
  } else {
    console.log(`❌ ${testCase.name}: expected ${testCase.expected}, got ${result}`);
    failed++;
  }
  
  console.log(`   Analysis: type=${analysis.type}, complexity=${analysis.complexity}, shouldUseMarkdown=${analysis.shouldUseMarkdown}`);
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);

// Test the existing markdown content from the speech data
console.log('\nTesting with real speech data...');
const realMarkdownContent = `> 對話中提到的文件

# 強化軟體開發流程到產品/服務上線的內控機制

## 一、開源軟體從入門到管理 必修內訓

隨著數位轉型、Al、IoT 等跨領域技術的普及，現在不只是資通訊領域，幾乎各領域的研發人員都會需要軟體開發，使用開源軟體(Open Source Software， OSS)更是趨勢。將調整以下：

1.  「開源專案法遵」課程由選修改為「必修」：本院已訂定強化與開源社群平台的合作政策，並將上項法遵課程列為全院使用開源軟體技術人員必修課程。
2.  內部機制檢討調整：由資安長啟動檢視，遵循開源軟體之規範，審視本院現有開源專案，進行內部檢討與調整。`;

const realResult = detectContentType(realMarkdownContent);
const realAnalysis = analyzeContent(realMarkdownContent);

console.log(`Real markdown content detected as: ${realResult}`);
console.log(`Analysis: complexity=${realAnalysis.complexity}, shouldUseMarkdown=${realAnalysis.shouldUseMarkdown}`);

if (realResult === 'markdown') {
  console.log('✅ Real markdown content correctly detected!');
} else {
  console.log('❌ Real markdown content not detected correctly');
}