/**
 * Webview 相關的工具函數
 * 統一管理 webview URL 提取和內容提取功能
 */

/**
 * 統一的 webview URL 提取函數
 * 優先從 webview 獲取真實 URL，回退到 URL 參數解析
 */
async function extractRealWebviewUrl(webContents, maxRetries = 3) {
  const currentUrl = webContents.getURL();
  console.log('🔍 當前 URL:', currentUrl);

  // 嘗試從 webview 獲取真實 URL（帶重試機制）
  for (let i = 0; i < maxRetries; i++) {
    try {
      const webviewInfo = await webContents.executeJavaScript(`
        (function() {
          const webview = document.querySelector('webview');
          if (webview && webview.src && !webview.src.includes('about:blank')) {
            try {
              return {
                url: webview.src,
                title: webview.getTitle ? webview.getTitle() : null,
                isLoaded: webview.src !== 'about:blank'
              };
            } catch (e) {
              return {
                url: webview.src,
                title: null,
                isLoaded: webview.src !== 'about:blank'
              };
            }
          }
          return null;
        })();
      `);

      if (webviewInfo && webviewInfo.url && webviewInfo.isLoaded) {
        console.log('✅ 從 webview 獲取到真實 URL:', webviewInfo.url);
        return {
          url: webviewInfo.url,
          title: webviewInfo.title,
          source: 'webview'
        };
      }

      // 如果 webview 還沒載入完成，等待一下再重試
      if (i < maxRetries - 1) {
        console.log(`⏳ webview 還未載入完成，等待重試 (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ 第 ${i + 1} 次嘗試獲取 webview 信息失敗:`, error);
    }
  }

  // 回退到 URL 參數解析
  console.log('🔄 回退到 URL 參數解析');
  if (currentUrl.includes('/browser?url=')) {
    const urlParams = new URL(currentUrl).searchParams;
    const urlParam = urlParams.get('url');

    if (urlParam) {
      const targetUrl = urlParam.startsWith('http') ? urlParam : `https://${urlParam}`;
      console.log('✅ 從 URL 參數解析得到:', targetUrl);
      return {
        url: targetUrl,
        title: null,
        source: 'url_param'
      };
    }
  }

  console.log('❌ 無法提取真實 URL');
  return {
    url: currentUrl,
    title: null,
    source: 'fallback'
  };
}

/**
 * 從 webview 提取真實的 HTML 內容並轉換為 markdown
 */
async function extractWebviewContent(webContents) {
  try {
    console.log('📄 開始從 webview 提取內容...');

    // 首先檢查 webview 是否存在
    const webviewExists = await webContents.executeJavaScript(`
      !!document.querySelector('webview')
    `);

    if (!webviewExists) {
      console.error('❌ webview 元素不存在');
      return { error: 'webview not found' };
    }

    // 通過 webview 的 executeJavaScript 方法獲取內容
    try {
      // const contentData = await webContents.executeJavaScript(`
      //   (async function() {
      //     const webview = document.querySelector('webview');
      //     if (!webview) {
      //       return { error: 'webview not found' };
      //     }

      //     try {
      //       // 使用 webview 的 executeJavaScript 方法來獲取內容
      //       const result = await webview.executeJavaScript(\`
      //         (function() {
      //           try {
      //             // 提取標題
      //             const title = document.title || 'Untitled';

      //             // 單一最佳提取策略：遍歷所有元素，生成完整的 markdown
      //             const extractionResult = extractAllElementsAsMarkdown();
      //             const content = extractionResult.content;
      //             const interactiveElements = extractionResult.interactiveElements;
      //             const links = extractionResult.links;

      //             // 遍歷所有元素並轉換為 markdown (按順序，整合所有元素)
      //             function extractAllElementsAsMarkdown() {
      //               console.log('開始按順序遍歷所有元素生成完整的 markdown');

      //               let markdown = '';
      //               const links = []; // 只保留 links，用於返回數據

      //               // 頁面標題和基本信息
      //               const pageTitle = document.title || 'Untitled Page';
      //               const currentUrl = window.location.href;
      //               markdown += '# ' + cleanText(pageTitle) + '\\\\\\\\n\\\\\\\\n';
      //               markdown += '**URL:** ' + currentUrl + '\\\\\\\\n\\\\\\\\n';

      //               // 按順序遍歷所有可見元素，直接生成完整的 markdown
      //               const allElements = document.body.querySelectorAll('*');
      //               const processedElements = new Set(); // 避免重複處理
      //               const selectorCounts = {}; // 追蹤 selector 使用次數

      //               console.log('總共找到元素數量:', allElements.length);

      //               // 按 DOM 順序處理每個元素
      //               for (let i = 0; i < allElements.length && i < 1500; i++) {
      //                 const element = allElements[i];

      //                 // 跳過已處理的元素
      //                 if (processedElements.has(element)) continue;

      //                 // 跳過不可見或不需要的元素
      //                 if (isElementHidden(element) || isElementUnwanted(element)) continue;

      //                 const elementInfo = convertElementToMarkdownWithDetails(element, selectorCounts);
      //                 if (elementInfo && elementInfo.markdown) {
      //                   // 直接按順序添加到 markdown
      //                   markdown += elementInfo.markdown;

      //                   // 只收集連結數據用於返回
      //                   if (elementInfo.isLink) {
      //                     links.push(elementInfo.elementData);
      //                   }

      //                   processedElements.add(element);
      //                 }
      //               }

      //               // 限制最大字數為 30000 字
      //               if (markdown.length > 30000) {
      //                 console.log('內容超過 30000 字，進行截斷');
      //                 markdown = markdown.substring(0, 30000) + '\\\\\\\\n\\\\\\\\n[內容已截斷，總長度超過 30000 字]';
      //               }

      //               console.log('最終 markdown 長度:', markdown.length);
      //               console.log('連結數量:', links.length);

      //               return {
      //                 content: markdown,
      //                 links: links
      //               };
      //             }

      //             // 清理文字，移除特殊字符和編碼問題
      //             function cleanText(text) {
      //               if (!text) return '';
      //               return text
      //                 // 移除零寬字符
      //                 .replace(/[\\\\u200b\\\\u200c\\\\u200d\\\\u200e\\\\u200f\\\\ufeff]/g, '')
      //                 // 移除非斷行空格
      //                 .replace(/\\\\u00a0/g, ' ')
      //                 // 移除多餘空白
      //                 .replace(/\\\\s+/g, ' ')
      //                 // 移除前後空白
      //                 .trim();
      //             }

      //             // 檢查元素是否隱藏
      //             function isElementHidden(element) {
      //               const style = window.getComputedStyle(element);
      //               return style.display === 'none' ||
      //                      style.visibility === 'hidden' ||
      //                      style.opacity === '0' ||
      //                      element.offsetWidth === 0 ||
      //                      element.offsetHeight === 0;
      //             }

      //             // 檢查元素是否不需要
      //             function isElementUnwanted(element) {
      //               const unwantedTags = ['script', 'style', 'meta', 'link', 'noscript'];
      //               const unwantedClasses = ['ad', 'advertisement', 'popup', 'modal', 'overlay'];

      //               // 檢查標籤名
      //               if (unwantedTags.includes(element.tagName.toLowerCase())) {
      //                 return true;
      //               }

      //               // 檢查類名
      //               if (element.className && typeof element.className === 'string') {
      //                 const classes = element.className.toLowerCase();
      //                 if (unwantedClasses.some(cls => classes.includes(cls))) {
      //                   return true;
      //                 }
      //               }

      //               return false;
      //             }

      //             // 將單個元素轉換為 markdown（按 HTML 標籤順序處理）
      //             function convertElementToMarkdownWithDetails(element, selectorCounts) {
      //               const tagName = element.tagName.toLowerCase();
      //               let markdown = '';
      //               let isInteractive = false;
      //               let isLink = false;
      //               let elementData = null;

      //               // 生成選擇器和索引
      //               const selector = generatePreciseSelector(element);
      //               selectorCounts[selector] = (selectorCounts[selector] || 0) + 1;
      //               const index = selectorCounts[selector];

      //               switch (tagName) {
      //                 case 'h1':
      //                 case 'h2':
      //                 case 'h3':
      //                 case 'h4':
      //                 case 'h5':
      //                 case 'h6':
      //                   const level = parseInt(tagName.charAt(1)) + 1; // +1 因為頁面標題已經是 h1
      //                   const headingText = cleanText(element.textContent);
      //                   if (headingText && headingText.length > 0) {
      //                     markdown = '\\\\\\\\n' + '#'.repeat(level) + ' ' + headingText + '\\\\\\\\n\\\\\\\\n';
      //                   }
      //                   break;

      //                 case 'p':
      //                   const pText = cleanText(element.textContent);
      //                   if (pText && pText.length > 5) {
      //                     markdown = pText + '\\\\\\\\n\\\\\\\\n';
      //                   }
      //                   break;

      //                 case 'div':
      //                   // 處理 div 元素 - 只提取直接文字內容
      //                   const divText = Array.from(element.childNodes)
      //                     .filter(node => node.nodeType === Node.TEXT_NODE)
      //                     .map(node => cleanText(node.textContent))
      //                     .join(' ')
      //                     .trim();

      //                   if (divText && divText.length > 5) {
      //                     // 檢查是否是可點擊的
      //                     if (element.onclick || element.getAttribute('onclick') || element.style.cursor === 'pointer' || element.getAttribute('role') === 'button') {
      //                       isInteractive = true;
      //                       elementData = {
      //                         type: 'clickable-div',
      //                         text: divText,
      //                         selector: selector,
      //                         index: index,
      //                         id: element.id || '',
      //                         className: element.className || '',
      //                         tagName: tagName
      //                       };
      //                       markdown = '### 🎯 可點擊區域: ' + divText.substring(0, 50) + '\\\\\\\\n';
      //                       markdown += '- **動作**: 點擊執行動作\\\\\\\\n';
      //                       markdown += '- **選擇器**: ' + String.fromCharCode(96) + selector + String.fromCharCode(96) + '\\\\\\\\n';
      //                       markdown += '- **索引**: ' + index + '\\\\\\\\n';
      //                       markdown += '- **使用方法**: 使用 browser_click_tool("' + selector + '", ' + index + ')\\\\\\\\n\\\\\\\\n';
      //                     } else {
      //                       markdown = divText + '\\\\\\\\n\\\\\\\\n';
      //                     }
      //                   }
      //                   break;

      //                 case 'a':
      //                   const linkText = cleanText(element.textContent);
      //                   const href = element.href;
      //                   if (linkText && href && linkText.length > 0) {
      //                     // 跳過已經在表格行中處理過的連結
      //                     const parentRow = element.closest('tr[role="row"], tr.zA');
      //                     if (parentRow) {
      //                       // 這個連結已經在表格行中處理過了，跳過
      //                       break;
      //                     }

      //                     isLink = true;
      //                     elementData = {
      //                       type: 'link',
      //                       text: linkText,
      //                       href: href,
      //                       selector: selector,
      //                       index: index,
      //                       id: element.id || '',
      //                       className: element.className || '',
      //                       tagName: tagName
      //                     };
      //                     markdown = '### 🔗 連結: ' + linkText + '\\\\\\\\n';
      //                     markdown += '- **目標URL**: ' + href + '\\\\\\\\n';
      //                     markdown += '- **選擇器**: ' + String.fromCharCode(96) + selector + String.fromCharCode(96) + '\\\\\\\\n';
      //                     markdown += '- **索引**: ' + index + '\\\\\\\\n';
      //                     markdown += '- **使用方法**: 使用 browser_click_tool("' + selector + '", ' + index + ')\\\\\\\\n\\\\\\\\n';
      //                   }
      //                   break;

      //                 case 'button':
      //                   const buttonText = cleanText(element.textContent || element.value || element.getAttribute('aria-label') || 'Button');
      //                   if (buttonText && buttonText.length > 0) {
      //                     isInteractive = true;
      //                     elementData = {
      //                       type: 'button',
      //                       text: buttonText,
      //                       selector: selector,
      //                       index: index,
      //                       id: element.id || '',
      //                       className: element.className || '',
      //                       tagName: tagName
      //                     };
      //                     markdown = '### 🔘 按鈕: ' + buttonText + '\\\\\\\\n';
      //                     markdown += '- **動作**: 點擊執行動作\\\\\\\\n';
      //                     markdown += '- **選擇器**: ' + String.fromCharCode(96) + selector + String.fromCharCode(96) + '\\\\\\\\n';
      //                     markdown += '- **索引**: ' + index + '\\\\\\\\n';
      //                     markdown += '- **使用方法**: 使用 browser_click_tool("' + selector + '", ' + index + ')\\\\\\\\n\\\\\\\\n';
      //                   }
      //                   break;

      //                 case 'input':
      //                   const inputType = element.type || 'text';
      //                   const inputLabel = cleanText(element.placeholder || element.name || element.id || element.getAttribute('aria-label') || 'Input');
      //                   if (inputLabel && inputLabel.length > 0) {
      //                     isInteractive = true;
      //                     elementData = {
      //                       type: 'input',
      //                       inputType: inputType,
      //                       text: inputLabel,
      //                       selector: selector,
      //                       index: index,
      //                       id: element.id || '',
      //                       className: element.className || '',
      //                       tagName: tagName,
      //                       value: element.value || ''
      //                     };
      //                     markdown = '### 📝 輸入框 (' + inputType + '): ' + inputLabel + '\\\\\\\\n';
      //                     markdown += '- **動作**: ' + (inputType === 'submit' ? '點擊提交' : '輸入文字') + '\\\\\\\\n';
      //                     if (element.value) {
      //                       markdown += '- **當前值**: ' + cleanText(element.value) + '\\\\\\\\n';
      //                     }
      //                     markdown += '- **選擇器**: ' + String.fromCharCode(96) + selector + String.fromCharCode(96) + '\\\\\\\\n';
      //                     markdown += '- **索引**: ' + index + '\\\\\\\\n';
      //                     if (inputType === 'submit' || inputType === 'button') {
      //                       markdown += '- **使用方法**: 使用 browser_click_tool("' + selector + '", ' + index + ')\\\\\\\\n\\\\\\\\n';
      //                     } else {
      //                       markdown += '- **使用方法**: 使用 browser_type_tool("' + selector + '", "要輸入的文字", ' + index + ')\\\\\\\\n\\\\\\\\n';
      //                     }
      //                   }
      //                   break;

      //                 case 'textarea':
      //                   const textareaLabel = cleanText(element.placeholder || element.name || element.id || element.getAttribute('aria-label') || 'Textarea');
      //                   if (textareaLabel && textareaLabel.length > 0) {
      //                     isInteractive = true;
      //                     elementData = {
      //                       type: 'textarea',
      //                       text: textareaLabel,
      //                       selector: selector,
      //                       index: index,
      //                       id: element.id || '',
      //                       className: element.className || '',
      //                       tagName: tagName,
      //                       value: element.value || ''
      //                     };
      //                     markdown = '### 📝 文字區域: ' + textareaLabel + '\\\\\\\\n';
      //                     markdown += '- **動作**: 輸入多行文字\\\\\\\\n';
      //                     if (element.value) {
      //                       markdown += '- **當前值**: ' + cleanText(element.value.substring(0, 100)) + (element.value.length > 100 ? '...' : '') + '\\\\\\\\n';
      //                     }
      //                     markdown += '- **選擇器**: ' + String.fromCharCode(96) + selector + String.fromCharCode(96) + '\\\\\\\\n';
      //                     markdown += '- **索引**: ' + index + '\\\\\\\\n';
      //                     markdown += '- **使用方法**: 使用 browser_type_tool("' + selector + '", "要輸入的文字", ' + index + ')\\\\\\\\n\\\\\\\\n';
      //                   }
      //                   break;

      //                 case 'select':
      //                   const selectLabel = cleanText(element.name || element.id || element.getAttribute('aria-label') || 'Select');
      //                   if (selectLabel && selectLabel.length > 0) {
      //                     isInteractive = true;
      //                     const options = Array.from(element.options || []).map(opt => cleanText(opt.text));
      //                     elementData = {
      //                       type: 'select',
      //                       text: selectLabel,
      //                       selector: selector,
      //                       index: index,
      //                       id: element.id || '',
      //                       className: element.className || '',
      //                       tagName: tagName,
      //                       options: options
      //                     };
      //                     markdown = '### 📋 下拉選單: ' + selectLabel + '\\\\\\\\n';
      //                     markdown += '- **動作**: 選擇選項\\\\\\\\n';
      //                     if (options.length > 0) {
      //                       markdown += '- **可選項目**: ' + options.join(', ') + '\\\\\\\\n';
      //                     }
      //                     markdown += '- **選擇器**: ' + String.fromCharCode(96) + selector + String.fromCharCode(96) + '\\\\\\\\n';
      //                     markdown += '- **索引**: ' + index + '\\\\\\\\n';
      //                     markdown += '- **使用方法**: 使用 browser_select_option_tool("' + selector + '", ["選項值"], ' + index + ')\\\\\\\\n\\\\\\\\n';
      //                   }
      //                   break;

      //                 case 'table':
      //                   markdown = extractTableAsMarkdown(element);
      //                   break;

      //                 case 'tr':
      //                   // 特別處理表格行（如 Gmail 郵件列表）
      //                   if (element.getAttribute('role') === 'row' || element.classList.contains('zA')) {
      //                     const rowText = cleanText(element.textContent);
      //                     if (rowText && rowText.length > 10) {
      //                       // 查找這一行中的所有連結
      //                       const rowLinks = element.querySelectorAll('a[href]');
      //                       let emailLink = null;

      //                       console.log('郵件行找到連結數量:', rowLinks.length);

      //                       // 找到郵件的主要連結
      //                       for (const link of rowLinks) {
      //                         console.log('檢查連結:', link.href);
      //                         if (link.href && link.href.includes('mail.google.com')) {
      //                           // 找到包含郵件 ID 的連結
      //                           if (link.href.includes('#inbox/') || link.href.includes('#thread/') || link.href.includes('#label/')) {
      //                             emailLink = {
      //                               href: link.href,
      //                               text: cleanText(link.textContent) || '開啟郵件'
      //                             };
      //                             console.log('找到郵件連結:', emailLink.href);
      //                             break;
      //                           }
      //                         }
      //                       }

      //                       // 如果沒找到特定連結，嘗試使用第一個連結或構建點擊方式
      //                       if (!emailLink) {
      //                         if (rowLinks.length > 0) {
      //                           const firstLink = rowLinks[0];
      //                           emailLink = {
      //                             href: firstLink.href,
      //                             text: cleanText(firstLink.textContent) || '郵件連結'
      //                           };
      //                         } else {
      //                           // 沒有連結，使用點擊行的方式
      //                           emailLink = {
      //                             href: 'javascript:void(0)',
      //                             text: '點擊開啟郵件'
      //                           };
      //                         }
      //                       }

      //                       isInteractive = true;
      //                       elementData = {
      //                         type: 'email-row',
      //                         text: rowText.substring(0, 200),
      //                         selector: selector,
      //                         index: index,
      //                         id: element.id || '',
      //                         className: element.className || '',
      //                         tagName: tagName,
      //                         emailLink: emailLink
      //                       };

      //                       markdown = '### 📧 郵件: ' + rowText.substring(0, 100) + '\\\\\\\\n';
      //                       if (emailLink) {
      //                         markdown += '- **郵件連結**: [' + emailLink.text + '](' + emailLink.href + ')\\\\\\\\n';
      //                       }
      //                       markdown += '- **動作**: 點擊開啟郵件\\\\\\\\n';
      //                       markdown += '- **選擇器**: ' + String.fromCharCode(96) + selector + String.fromCharCode(96) + '\\\\\\\\n';
      //                       markdown += '- **索引**: ' + index + '\\\\\\\\n';
      //                       markdown += '- **使用方法**: 使用 browser_click_tool("' + selector + '", ' + index + ')\\\\\\\\n\\\\\\\\n';

      //                       // 如果有郵件連�，標記為連結類型
      //                       if (emailLink) {
      //                         isLink = true;
      //                       }
      //                     }
      //                   }
      //                   break;

      //                 case 'ul':
      //                 case 'ol':
      //                   // 只處理直接的列表，避免嵌套重複
      //                   if (!element.closest('ul, ol')) {
      //                     markdown = '\\\\\\\\n';
      //                     const listItems = element.querySelectorAll('li');
      //                     listItems.forEach((li, liIndex) => {
      //                       const liText = cleanText(li.textContent);
      //                       if (liText && liText.length > 0) {
      //                         const prefix = tagName === 'ul' ? '- ' : (liIndex + 1) + '. ';
      //                         markdown += prefix + liText + '\\\\\\\\n';
      //                       }
      //                     });
      //                     markdown += '\\\\\\\\n';
      //                   }
      //                   break;

      //                 case 'span':
      //                   // 對於 div 和 span，只提取直接文字內容（不包含子元素）
      //                   const directText = Array.from(element.childNodes)
      //                     .filter(node => node.nodeType === Node.TEXT_NODE)
      //                     .map(node => cleanText(node.textContent))
      //                     .join(' ')
      //                     .trim();

      //                   if (directText && directText.length > 5) {
      //                     // 檢查是否是可點擊的
      //                     if (element.onclick || element.getAttribute('onclick') || element.style.cursor === 'pointer' || element.getAttribute('role') === 'button') {
      //                       isInteractive = true;
      //                       elementData = {
      //                         type: 'clickable',
      //                         text: directText,
      //                         selector: selector,
      //                         index: index,
      //                         id: element.id || '',
      //                         className: element.className || '',
      //                         tagName: tagName
      //                       };
      //                       markdown = '### 🎯 可點擊區域: ' + directText.substring(0, 50) + '\\\\\\\\n';
      //                       markdown += '- **動作**: 點擊執行動作\\\\\\\\n';
      //                       markdown += '- **選擇器**: ' + String.fromCharCode(96) + selector + String.fromCharCode(96) + '\\\\\\\\n';
      //                       markdown += '- **索引**: ' + index + '\\\\\\\\n';
      //                       markdown += '- **使用方法**: 使用 browser_click_tool("' + selector + '", ' + index + ')\\\\\\\\n\\\\\\\\n';
      //                     } else {
      //                       markdown = directText + '\\\\\\\\n\\\\\\\\n';
      //                     }
      //                   }
      //                   break;

      //                 default:
      //                   // 對於其他元素，提取純文字內容
      //                   const otherText = cleanText(element.textContent);
      //                   if (otherText && otherText.length > 5 && !element.children.length) {
      //                     markdown = otherText + '\\\\\\\\n\\\\\\\\n';
      //                   }
      //                   break;
      //               }

      //               return {
      //                 markdown: markdown,
      //                 isInteractive: isInteractive,
      //                 isLink: isLink,
      //                 elementData: elementData
      //               };
      //             }

      //             // 生成精確的選擇器
      //             function generatePreciseSelector(element) {
      //               // 優先級：id > name > class > 屬性 > 位置
      //               if (element.id) {
      //                 return '#' + element.id;
      //               }

      //               if (element.name) {
      //                 return '[name="' + element.name + '"]';
      //               }

      //               if (element.className && typeof element.className === 'string') {
      //                 const classes = element.className.split(' ').filter(c => c.trim());
      //                 if (classes.length > 0) {
      //                   return '.' + classes[0];
      //                 }
      //               }

      //               // 使用屬性
      //               const attrs = ['data-id', 'data-testid', 'aria-label', 'title', 'role'];
      //               for (const attr of attrs) {
      //                 const value = element.getAttribute(attr);
      //                 if (value) {
      //                   return '[' + attr + '="' + value + '"]';
      //                 }
      //               }

      //               // 最後使用標籤名 + 位置
      //               const tagName = element.tagName.toLowerCase();
      //               const siblings = Array.from(element.parentNode.children).filter(el => el.tagName.toLowerCase() === tagName);
      //               const index = siblings.indexOf(element) + 1;
      //               return tagName + ':nth-of-type(' + index + ')';
      //             }

      //             // 提取表格為 markdown
      //             function extractTableAsMarkdown(table) {
      //               let tableMarkdown = '\\\\\\\\n';
      //               const rows = table.querySelectorAll('tr');

      //               rows.forEach((row, rowIndex) => {
      //                 const cells = row.querySelectorAll('td, th');
      //                 if (cells.length > 0) {
      //                   const cellTexts = Array.from(cells).map(cell => cell.textContent.trim());
      //                   tableMarkdown += '| ' + cellTexts.join(' | ') + ' |\\\\\\\\n';

      //                   // 添加表頭分隔線
      //                   if (rowIndex === 0 && row.querySelectorAll('th').length > 0) {
      //                     tableMarkdown += '|' + cellTexts.map(() => '---').join('|') + '|\\\\\\\\n';
      //                   }
      //                 }
      //               });

      //               return tableMarkdown + '\\\\\\\\n';
      //             }

      //             return {
      //               title,
      //               content,
      //               links
      //             };

      //           } catch (e) {
      //             return { error: 'failed to extract content: ' + e.message };
      //           }
      //         })();
      //       \`);

      //       return result;
      //     } catch (e) {
      //       return { error: 'failed to execute script in webview: ' + e.message };
      //     }
      //   })();
      // `);
      const contentData = await webContents.executeJavaScript(`
        (async function() {
          const webview = document.querySelector('webview');
          if (!webview) {
            return { error: 'webview not found' };
          }
    
          try {
            const result = await webview.executeJavaScript(\`
              (function() {
                try {
                  // 提取標題
                  const title = document.title || 'Untitled';
                  const currentUrl = window.location.href;
    
                  // 生成純內容 markdown
                  const extractionResult = extractPageContentAsMarkdown();
                  const content = extractionResult.content;
                  const links = extractionResult.links;
    
                  function extractPageContentAsMarkdown() {
                    console.log('開始提取頁面純內容');
    
                    let markdown = '';
                    const links = [];
    
                    // 頁面標題和基本信息
                    const pageTitle = document.title || 'Untitled Page';
                    markdown += '# ' + cleanText(pageTitle) + '\\\\n\\\\n';
                    markdown += '**URL:** ' + currentUrl + '\\\\n\\\\n';
    
                    // 提取頁面元數據
                    const metaDescription = document.querySelector('meta[name="description"]');
                    if (metaDescription && metaDescription.content) {
                      markdown += '**描述:** ' + cleanText(metaDescription.content) + '\\\\n\\\\n';
                    }
    
                    // 按順序遍歷所有可見元素，只提取內容
                    const allElements = document.body.querySelectorAll('*');
                    const processedElements = new Set();
    
                    console.log('總共找到元素數量:', allElements.length);
    
                    for (let i = 0; i < allElements.length && i < 1500; i++) {
                      const element = allElements[i];
    
                      if (processedElements.has(element)) continue;
                      if (isElementHidden(element) || isElementUnwanted(element)) continue;
    
                      const elementContent = extractElementContent(element);
                      if (elementContent) {
                        if (elementContent.markdown) {
                          markdown += elementContent.markdown;
                        }
                        if (elementContent.links) {
                          links.push(...elementContent.links);
                        }
                        processedElements.add(element);
                      }
                    }
    
                    // 限制最大字數為 30000 字
                    if (markdown.length > 30000) {
                      console.log('內容超過 30000 字，進行截斷');
                      markdown = markdown.substring(0, 30000) + '\\\\n\\\\n[內容已截斷，總長度超過 30000 字]';
                    }
    
                    console.log('最終 markdown 長度:', markdown.length);
                    console.log('連結數量:', links.length);
    
                    return {
                      content: markdown,
                      links: links
                    };
                  }
    
                  // 提取元素內容（僅內容，無操作資訊）
                  function extractElementContent(element) {
                    const tagName = element.tagName.toLowerCase();
                    let markdown = '';
                    const links = [];
    
                    switch (tagName) {
                      case 'h1':
                      case 'h2':
                      case 'h3':
                      case 'h4':
                      case 'h5':
                      case 'h6':
                        const level = parseInt(tagName.charAt(1)) + 1;
                        const headingText = cleanText(element.textContent);
                        if (headingText && headingText.length > 0) {
                          markdown = '\\\\n' + '#'.repeat(level) + ' ' + headingText + '\\\\n\\\\n';
                        }
                        break;
    
                      case 'p':
                        const pText = cleanText(element.textContent);
                        if (pText && pText.length > 5) {
                          markdown = pText + '\\\\n\\\\n';
                        }
                        break;
    
                      case 'div':
                      case 'span':
                        const directText = Array.from(element.childNodes)
                          .filter(node => node.nodeType === Node.TEXT_NODE)
                          .map(node => cleanText(node.textContent))
                          .join(' ')
                          .trim();
    
                        if (directText && directText.length > 5) {
                          markdown = directText + '\\\\n\\\\n';
                        }
                        break;
    
                      case 'a':
                        const linkText = cleanText(element.textContent);
                        const href = element.href;
                        if (linkText && href && linkText.length > 0) {
                          const parentRow = element.closest('tr[role="row"], tr.zA');
                          if (!parentRow) {
                            markdown = '[' + linkText + '](' + href + ')\\\\n\\\\n';
                            links.push({
                              text: linkText,
                              href: href
                            });
                          }
                        }
                        break;
    
                      case 'table':
                        markdown = extractTableContent(element);
                        break;
    
                      case 'ul':
                      case 'ol':
                        if (!element.closest('ul, ol')) {
                          markdown = '\\\\n';
                          const listItems = element.querySelectorAll('li');
                          listItems.forEach((li, liIndex) => {
                            const liText = cleanText(li.textContent);
                            if (liText && liText.length > 0) {
                              const prefix = tagName === 'ul' ? '- ' : (liIndex + 1) + '. ';
                              markdown += prefix + liText + '\\\\n';
                            }
                          });
                          markdown += '\\\\n';
                        }
                        break;
    
                      case 'blockquote':
                        const quoteText = cleanText(element.textContent);
                        if (quoteText && quoteText.length > 5) {
                          markdown = '> ' + quoteText + '\\\\n\\\\n';
                        }
                        break;
    
                      case 'code':
                        const codeText = element.textContent;
                        if (codeText && codeText.length > 0) {
                          if (element.parentElement && element.parentElement.tagName.toLowerCase() === 'pre') {
                            markdown = '\\\\n' + codeText + '\\\\n\\\\n';
                          } else {
                            markdown = codeText;
                          }
                        }
                        break;
    
                      case 'img':
                        const alt = element.alt || '';
                        const src = element.src || '';
                        if (alt || src) {
                          markdown = '![' + alt + '](' + src + ')\\\\n\\\\n';
                        }
                        break;
    
                      default:
                        const otherText = cleanText(element.textContent);
                        if (otherText && otherText.length > 5 && !element.children.length) {
                          markdown = otherText + '\\\\n\\\\n';
                        }
                        break;
                    }
    
                    return {
                      markdown: markdown,
                      links: links
                    };
                  }
    
                  // 提取表格內容
                  function extractTableContent(table) {
                    let tableMarkdown = '\\\\n';
                    const rows = table.querySelectorAll('tr');
    
                    rows.forEach((row, rowIndex) => {
                      const cells = row.querySelectorAll('td, th');
                      if (cells.length > 0) {
                        const cellTexts = Array.from(cells).map(cell => cleanText(cell.textContent));
                        tableMarkdown += '| ' + cellTexts.join(' | ') + ' |\\\\n';
    
                        if (rowIndex === 0 && row.querySelectorAll('th').length > 0) {
                          tableMarkdown += '|' + cellTexts.map(() => '---').join('|') + '|\\\\n';
                        }
                      }
                    });
    
                    return tableMarkdown + '\\\\n';
                  }
    
                  // 清理文字
                  function cleanText(text) {
                    if (!text) return '';
                    return text
                      .replace(/[\\\\u200b\\\\u200c\\\\u200d\\\\u200e\\\\u200f\\\\ufeff]/g, '')
                      .replace(/\\\\u00a0/g, ' ')
                      .replace(/\\\\s+/g, ' ')
                      .trim();
                  }
    
                  // 檢查元素是否隱藏
                  function isElementHidden(element) {
                    const style = window.getComputedStyle(element);
                    return style.display === 'none' ||
                           style.visibility === 'hidden' ||
                           style.opacity === '0' ||
                           element.offsetWidth === 0 ||
                           element.offsetHeight === 0;
                  }
    
                  // 檢查元素是否不需要
                  function isElementUnwanted(element) {
                    const unwantedTags = ['script', 'style', 'meta', 'link', 'noscript', 'button', 'input', 'textarea', 'select'];
                    const unwantedClasses = ['ad', 'advertisement', 'popup', 'modal', 'overlay', 'toolbar', 'navigation'];
    
                    if (unwantedTags.includes(element.tagName.toLowerCase())) {
                      return true;
                    }
    
                    if (element.className && typeof element.className === 'string') {
                      const classes = element.className.toLowerCase();
                      if (unwantedClasses.some(cls => classes.includes(cls))) {
                        return true;
                      }
                    }
    
                    return false;
                  }
    
                  return {
                    title,
                    url: currentUrl,
                    content,
                    links,
                    metadata: {
                      description: (document.querySelector('meta[name="description"]') || {}).content || '',
                      keywords: (document.querySelector('meta[name="keywords"]') || {}).content || '',
                      author: (document.querySelector('meta[name="author"]') || {}).content || '',
                      language: document.documentElement.lang || 'unknown'
                    }
                  };
    
                } catch (e) {
                  return { error: 'failed to extract content: ' + e.message };
                }
              })();
            \`);
    
            return result;
          } catch (e) {
            return { error: 'failed to execute script in webview: ' + e.message };
          }
        })();
      `);

      if (contentData.error) {
        console.error('❌ webview 內容提取失敗:', contentData.error);
        return null;
      }

      console.log('✅ webview 內容提取成功');
      return contentData;

    } catch (error) {
      console.error('❌ webview executeJavaScript 失敗:', error);
      return { error: 'webview execution failed: ' + error.message };
    }

  } catch (error) {
    console.error('❌ webview 內容提取異常:', error);
    return null;
  }
}

module.exports = {
  extractRealWebviewUrl,
  extractWebviewContent
};