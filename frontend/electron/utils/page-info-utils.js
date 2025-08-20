/**
 * 頁面資訊提取工具 - 僅提取頁面內容，不包含操作資訊
 * Page Information Extraction Utility - Content only, no interactive elements
 */

async function extractPageInfo(webContents) {
  const pageData = await webContents.executeJavaScript(`
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

  if (pageData && pageData.error) {
    console.error('❌ webview 內容提取失敗:', pageData.error);
    return { error: pageData.error };
  }
  return pageData;
}

module.exports = {
  extractPageInfo
};