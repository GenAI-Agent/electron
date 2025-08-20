const { ipcMain } = require('electron');
const { extractRealWebviewUrl, extractWebviewContent } = require('../utils/webview-utils');

// Token 驗證和刷新功能
async function validateAndRefreshToken(accessToken, refreshToken, clientConfig) {
  try {
    // 測試 access token 是否有效
    const testResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (testResponse.ok) {
      console.log('✅ Access token 有效');
      return { success: true, accessToken: accessToken };
    }

    // Token 無效，嘗試刷新
    if (refreshToken && clientConfig) {
      console.log('🔄 Access token 無效，嘗試刷新...');

      const OAuthUtils = require('../oauth-utils');
      const oauthUtils = new OAuthUtils();

      const refreshResult = await oauthUtils.refreshAccessToken({
        clientId: clientConfig.clientId,
        clientSecret: clientConfig.clientSecret,
        refreshToken: refreshToken
      });

      if (refreshResult.access_token) {
        console.log('✅ Token 刷新成功');
        return {
          success: true,
          accessToken: refreshResult.access_token,
          refreshed: true,
          newRefreshToken: refreshResult.refresh_token
        };
      }
    }

    console.warn('❌ Token 驗證和刷新都失敗');
    return { success: false, error: 'Token 無效且無法刷新' };

  } catch (error) {
    console.error('❌ Token 驗證失敗:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to extract email body from payload
function extractEmailBody(payload) {
  let textBody = '';
  let htmlBody = '';

  function extractFromPart(part) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      try {
        textBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } catch (e) {
        console.warn('Failed to decode text body:', e);
      }
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      try {
        htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } catch (e) {
        console.warn('Failed to decode HTML body:', e);
      }
    }

    // Recursively check parts
    if (part.parts) {
      part.parts.forEach(extractFromPart);
    }
  }

  extractFromPart(payload);

  // Prefer text body, fall back to HTML if needed
  return {
    text: textBody,
    html: htmlBody,
    body: textBody || htmlBody
  };
}

// Helper function to extract attachments
function extractAttachments(payload) {
  const attachments = [];

  function extractFromPart(part) {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size || 0,
        attachmentId: part.body.attachmentId
      });
    }

    // Recursively check parts
    if (part.parts) {
      part.parts.forEach(extractFromPart);
    }
  }

  extractFromPart(payload);
  return attachments;
}

// Helper function to parse email headers into structured format
function parseEmailHeaders(headers) {
  const headerDict = {};
  headers.forEach(h => {
    headerDict[h.name] = h.value;
  });

  // Parse recipients
  const parseRecipients = (headerValue) => {
    if (!headerValue) return [];
    return headerValue.split(',').map(r => r.trim()).filter(r => r);
  };

  return {
    subject: headerDict['Subject'] || '',
    from: headerDict['From'] || '',
    to: parseRecipients(headerDict['To']),
    cc: parseRecipients(headerDict['Cc']),
    bcc: parseRecipients(headerDict['Bcc']),
    date: headerDict['Date'] || '',
    messageId: headerDict['Message-ID'] || '',
    inReplyTo: headerDict['In-Reply-To'] || '',
    references: headerDict['References'] || '',
    raw: headerDict
  };
}

// Gmail API 功能
async function fetchGmailMessagesViaAPI(accessToken, maxResults = 100, options = {}) {
  try {
    console.log('📧 使用 Gmail API 獲取郵件列表...');

    // 驗證和刷新 access token
    let validToken = accessToken;
    if (options.refreshToken && options.clientConfig) {
      console.log('🔄 驗證 access token...');
      const tokenValidation = await validateAndRefreshToken(
        accessToken,
        options.refreshToken,
        options.clientConfig
      );

      if (tokenValidation.success) {
        validToken = tokenValidation.accessToken;
        if (tokenValidation.refreshed) {
          console.log('✅ 使用刷新後的 token');
          // 可以通過回調通知調用者新的 token
          if (options.onTokenRefresh) {
            options.onTokenRefresh({
              accessToken: tokenValidation.accessToken,
              refreshToken: tokenValidation.newRefreshToken
            });
          }
        }
      } else {
        console.error('❌ Token 驗證失敗:', tokenValidation.error);
        return {
          success: false,
          error: `Token 驗證失敗: ${tokenValidation.error}`,
          tokenError: true,
          source: 'api'
        };
      }
    }

    // 構建查詢參數
    const queryParams = new URLSearchParams({
      maxResults: maxResults.toString()
    });

    // 處理標籤過濾 (labelIds) 和查詢過濾 (query)
    if (options.labelIds && options.labelIds.length > 0) {
      options.labelIds.forEach(labelId => queryParams.append('labelIds', labelId));
      console.log(`📧 過濾標籤: ${options.labelIds.join(', ')}`);
    }

    // 處理查詢參數 - 用於 category:primary 等
    if (options.query) {
      queryParams.append('q', options.query);
      console.log(`📧 查詢條件: ${options.query}`);
    }

    // 處理日期範圍
    if (options.days) {
      const afterDate = new Date();
      afterDate.setDate(afterDate.getDate() - options.days);
      const dateQuery = `after:${afterDate.getFullYear()}/${afterDate.getMonth() + 1}/${afterDate.getDate()}`;

      if (options.query) {
        queryParams.set('q', `${options.query} ${dateQuery}`);
      } else {
        queryParams.set('q', dateQuery);
      }
      console.log(`📧 日期範圍: 最近 ${options.days} 天`);
    }

    // 獲取郵件 ID 列表
    const listResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!listResponse.ok) {
      if (listResponse.status === 401) {
        console.error('❌ Gmail API 授權失敗 - Token 可能已過期');
        return {
          success: false,
          error: 'Gmail API 授權失敗 - Token 已過期，請重新授權',
          tokenError: true,
          source: 'api'
        };
      }
      throw new Error(`Gmail API 列表請求失敗: ${listResponse.status} ${listResponse.statusText}`);
    }

    const listData = await listResponse.json();
    const messageIds = listData.messages || [];

    console.log(`📧 獲取到 ${messageIds.length} 個郵件 ID`);

    // 批量獲取郵件詳細資訊
    const emails = [];
    const batchSize = 5; // 減少批量大小以獲取更詳細的資料

    for (let i = 0; i < Math.min(messageIds.length, maxResults); i += batchSize) {
      const batch = messageIds.slice(i, i + batchSize);
      const batchPromises = batch.map(async (msg) => {
        try {
          // 使用 format=full 獲取完整郵件資料
          const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
            headers: {
              'Authorization': `Bearer ${validToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            console.warn(`❌ 獲取郵件 ${msg.id} 失敗: ${response.status}`);
            return null;
          }

          const emailData = await response.json();

          // 解析郵件資料
          const headers = emailData.payload?.headers || [];
          const parsedHeaders = parseEmailHeaders(headers);

          // 提取郵件內容
          const bodyData = extractEmailBody(emailData.payload || {});

          // 提取附件
          const attachments = extractAttachments(emailData.payload || {});

          // 解析日期為 ISO 格式
          let dateISO;
          try {
            dateISO = new Date(parsedHeaders.date).toISOString();
          } catch (e) {
            dateISO = new Date().toISOString();
          }

          return {
            // Gmail 特定資料
            gmailId: emailData.id,
            threadId: emailData.threadId,

            // 郵件基本資訊
            subject: parsedHeaders.subject,
            from: parsedHeaders.from,
            to: parsedHeaders.to,
            cc: parsedHeaders.cc,
            bcc: parsedHeaders.bcc,
            date: dateISO,

            // 郵件內容
            body: bodyData.body,
            // bodyText: bodyData.text,
            // bodyHtml: bodyData.html,
            snippet: emailData.snippet,

            // 附件資訊
            hasAttachments: attachments.length > 0,
            attachmentCount: attachments.length,
            attachments: attachments,

            // 狀態資訊
            isUnread: emailData.labelIds?.includes('UNREAD') || false,
            isImportant: emailData.labelIds?.includes('IMPORTANT') || false,
            labelIds: emailData.labelIds || [],

            // 其他資訊
            sizeEstimate: emailData.sizeEstimate || 0,
            url: `https://mail.google.com/mail/u/0/#all/${emailData.id}`,
            source: 'api',
            // 額外的 header 資訊
            messageId: parsedHeaders.messageId,
            inReplyTo: parsedHeaders.inReplyTo,
            references: parsedHeaders.references
          };
        } catch (error) {
          console.warn(`❌ 處理郵件 ${msg.id} 失敗:`, error.message);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      emails.push(...batchResults.filter(email => email !== null));

      // 小延遲避免 API 限制
      if (i + batchSize < messageIds.length) {
        await new Promise(resolve => setTimeout(resolve, 200)); // 稍微增加延遲
      }
    }

    console.log(`✅ Gmail API 成功獲取 ${emails.length} 封郵件（含詳細內容）`);

    return {
      success: true,
      mails: emails,
      totalCount: listData.resultSizeEstimate || emails.length,
      source: 'api'
    };

  } catch (error) {
    console.error('❌ Gmail API 請求失敗:', error);
    return {
      success: false,
      error: error.message,
      source: 'api'
    };
  }
}

let mainWindow = null;

// Gmail 專用郵件提取函數 - 支援 API 和 DOM 兩種方式
async function extractGmailEmails(webContents, options = {}) {
  const { accessToken, useAPI = true, maxResults = 10 } = options;
  try {
    console.log('📧 開始從 Gmail 提取郵件列表...');

    let apiResult = null;
    let domResult = null;

    // 1. 嘗試使用 Gmail API（如果有 access token）
    if (useAPI && accessToken) {
      console.log('🔄 嘗試使用 Gmail API...');

      // 驗證和刷新 token（如果提供了刷新相關配置）
      let validToken = accessToken;
      if (options.refreshToken && options.clientConfig) {
        const tokenValidation = await validateAndRefreshToken(
          accessToken,
          options.refreshToken,
          options.clientConfig
        );

        if (tokenValidation.success) {
          validToken = tokenValidation.accessToken;
          if (tokenValidation.refreshed) {
            console.log('✅ 使用刷新後的 token');
          }
        } else {
          console.warn('❌ Token 驗證失敗，繼續使用原 token 嘗試');
        }
      }

      // 配置 Gmail API 選項 - 預設只獲取主要區域
      const gmailOptions = {
        query: options.query,
        labelIds: options.labelIds,
        days: options.days,
        refreshToken: options.refreshToken,
        clientConfig: options.clientConfig,
        onTokenRefresh: options.onTokenRefresh
      };
      apiResult = await fetchGmailMessagesViaAPI(validToken, maxResults, gmailOptions);

      if (apiResult.success) {
        console.log(`✅ Gmail API 成功獲取 ${apiResult.mails.length} 封郵件`);
      } else {
        console.warn('❌ Gmail API 失敗，將使用 DOM 解析作為備用方案');
      }
    } else if (useAPI && !accessToken) {
      console.log('⚠️ 未提供 access token，跳過 API 方式');
    }

    // 2. 執行 DOM 解析（作為主要方式或備用方案）
    console.log('🔄 執行 DOM 解析...');

    // 檢查 webview 是否存在
    const webviewExists = await webContents.executeJavaScript(`
      !!document.querySelector('webview')
    `);

    if (!webviewExists) {
      console.error('❌ webview 元素不存在');
      return { error: 'webview not found' };
    }
    return apiResult;
    // 透過 webview 提取 Gmail 郵件
    // try {
    //   const emailData = await webContents.executeJavaScript(`
    //     (async function() {
    //       const webview = document.querySelector('webview');
    //       if (!webview) {
    //         return { error: 'webview not found' };
    //       }

    //       try {
    //         const result = await webview.executeJavaScript(\`
    //           (function() {
    //             try {
    //               const title = document.title || 'Gmail';
    //               const mails = [];
    //               const debugLogs = [];

    //               function debugLog(...args) {
    //                 const message = args.map(arg => 
    //                   typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    //                 ).join(' ');
    //                 debugLogs.push(message);
    //                 console.log(...args);
    //               }

    //               debugLog('=== Gmail 調試開始 ===');
    //               debugLog('頁面標題:', title);
    //               debugLog('完整 URL:', window.location.href);

    //               // 檢查頁面基本結構
    //               debugLog('Body 是否存在:', !!document.body);
    //               debugLog('Body 子元素數量:', document.body ? document.body.children.length : 0);

    //               // 尋找郵件列表的容器 - 從多個可能位置開始
    //               let emailContainer = null;
    //               let emailRows = [];

    //               // 先嘗試 tbody
    //               const tbody = document.querySelector('tbody');
    //               debugLog('找到 tbody 元素:', !!tbody);

    //               if (tbody) {
    //                 const tbodyRows = tbody.querySelectorAll('tr');
    //                 debugLog('tbody 中的行數:', tbodyRows.length);

    //                 // 檢查 tbody 中的行是否看起來像郵件
    //                 let validEmailRows = 0;
    //                 for (const row of tbodyRows) {
    //                   const text = row.textContent?.trim();
    //                   if (text && text.length > 20 && !text.includes('Tab 鍵')) {
    //                     validEmailRows++;
    //                   }
    //                 }
    //                 debugLog('tbody 中可能的郵件行數:', validEmailRows);

    //                 if (validEmailRows > 0) {
    //                   emailContainer = tbody;
    //                   emailRows = tbodyRows;
    //                   debugLog('使用 tbody 作為郵件容器');
    //                 }
    //               }

    //               // 如果 tbody 沒有有效郵件，嘗試其他容器
    //               if (!emailContainer || emailRows.length === 0) {
    //                 debugLog('尋找其他郵件容器...');

    //                 // 直接搜尋有 Gmail 郵件特徵的 tr 元素
    //                 const allTrs = document.querySelectorAll('tr');
    //                 debugLog('頁面總 tr 元素數:', allTrs.length);

    //                 // 尋找有郵件特徵的 tr
    //                 const mailTrs = [];
    //                 for (let i = 0; i < allTrs.length; i++) {
    //                   const tr = allTrs[i];
    //                   const classes = tr.className || '';
    //                   const role = tr.getAttribute('role');
    //                   const text = tr.textContent?.trim() || '';

    //                   debugLog('TR', i, '類別:', classes);
    //                   debugLog('TR', i, 'role:', role);
    //                   debugLog('TR', i, '內容預覽:', text.substring(0, 100));

    //                   // Gmail 郵件行通常有這些特徵
    //                   const isMailRow = (
    //                     (classes.includes('zA') || classes.includes('yW')) && // Gmail 郵件行的典型類別
    //                     role === 'row' && // 有 role="row" 屬性
    //                     text.length > 20 && // 有足夠的內容
    //                     !text.includes('Tab 鍵') && // 不是界面元素
    //                     !text.includes('載入中') // 不是載入狀態
    //                   );

    //                   if (isMailRow) {
    //                     debugLog('找到郵件行:', i, '內容:', text.substring(0, 50));
    //                     mailTrs.push(tr);
    //                   }
    //                 }

    //                 if (mailTrs.length > 0) {
    //                   debugLog('找到', mailTrs.length, '個郵件行');
    //                   emailContainer = document.body; // 使用 body 作為容器
    //                   emailRows = mailTrs;
    //                 } else {
    //                   debugLog('沒有找到任何郵件行');
    //                   return { title, mails: [], debugLogs, debug: '未找到郵件行' };
    //                 }
    //               }

    //               debugLog('最終使用的郵件行數:', emailRows.length);

    //               emailRows.forEach((row, index) => {
    //                 try {
    //                   debugLog('=== 檢查第', index, '行 ===');
    //                   debugLog('行類別:', row.className);
    //                   debugLog('行 role 屬性:', row.getAttribute('role'));
    //                   debugLog('行內容預覽:', row.textContent?.substring(0, 150));
    //                   debugLog('是否有 zA 類別:', row.classList.contains('zA'));
    //                   debugLog('是否有 role=row 屬性:', row.getAttribute('role') === 'row');

    //                   // 檢查是否為郵件行
    //                   const rowText = row.textContent?.trim();
    //                   const hasMailClass = row.classList.contains('zA') || row.classList.contains('yW');
    //                   const hasRowRole = row.getAttribute('role') === 'row';

    //                   debugLog('行是否有郵件類別:', hasMailClass);
    //                   debugLog('行是否有 row role:', hasRowRole);
    //                   debugLog('行文字長度:', rowText ? rowText.length : 0);

    //                   if (rowText && rowText.length > 20 && (hasMailClass || hasRowRole)) {
    //                     debugLog('嘗試提取郵件資訊...');
    //                     const mail = extractMailFromRow(row);
    //                     debugLog('提取結果:', mail);
    //                     if (mail) {
    //                       mails.push(mail);
    //                     }
    //                   } else {
    //                     debugLog('跳過：不符合郵件行條件');
    //                   }
    //                 } catch (e) {
    //                   debugLog('提取第', index, '行郵件失敗:', e.message);
    //                 }
    //               });

    //               // 提取單筆郵件資訊
    //               function extractMailFromRow(row) {
    //                 debugLog('    --- 開始提取郵件詳細資訊 ---');
    //                 let subject = '';
    //                 let time = '';
    //                 let sender = '';
    //                 let isRead = true;

    //                 // 提取主旨 - Gmail 中主旨通常在 span 中
    //                 debugLog('    尋找主旨元素...');

    //                 // 嘗試多種方式找主旨
    //                 const subjectSelectors = [
    //                   'span[id]:not([id=""])', // 有 ID 的 span
    //                   'a[href*="#"]', // 郵件連結
    //                   'span[jsaction]', // 有 jsaction 的 span
    //                   '.bog', // Gmail 主旨類別
    //                   '.yW span', // 未讀郵件主旨
    //                   '.zA span' // 已讀郵件主旨
    //                 ];

    //                 for (const selector of subjectSelectors) {
    //                   const elements = row.querySelectorAll(selector);
    //                   debugLog('    選擇器', selector, '找到元素數:', elements.length);

    //                   for (const el of elements) {
    //                     const text = el.textContent?.trim();
    //                     debugLog('    檢查元素文字:', text);

    //                     // 主旨的特徵：長度適中，不是純數字，不是 email，不是時間
    //                     if (text && text.length > 5 && text.length < 200 && 
    //                         !text.match(/^\\d+$/) && 
    //                         !text.includes('@') &&
    //                         !text.match(/^\\d{1,2}:\\d{2}/) &&
    //                         !text.match(/^\\d+月\\d+日/)) {
    //                       subject = text;
    //                       debugLog('    找到主旨:', subject);
    //                       break;
    //                     }
    //                   }
    //                   if (subject) break;
    //                 }

    //                 // 如果沒找到主旨，嘗試從整行文字中提取
    //                 if (!subject) {
    //                   debugLog('    主旨為空，嘗試從整行提取...');
    //                   const rowText = row.textContent?.trim();
    //                   debugLog('    整行文字:', rowText);

    //                   if (rowText) {
    //                     // 嘗試用空白分割，找出最可能是主旨的部分
    //                     const parts = rowText.split(/\\s+/);
    //                     debugLog('    分割為', parts.length, '個部分');

    //                     // 尋找最長且不是時間/email/日期的連續文字
    //                     let bestCandidate = '';
    //                     let currentPhrase = '';

    //                     for (let i = 0; i < parts.length; i++) {
    //                       const part = parts[i];
    //                       debugLog('    檢查部分', i, ':', part);

    //                       // 如果這部分像是主旨的一部分
    //                       if (part && !part.match(/^\\d+$/) && !part.includes('@') && 
    //                           !part.match(/\\d{1,2}:\\d{2}/) && !part.match(/^\\d+月/) &&
    //                           !part.match(/^(今天|昨天|前天|\\w+天前)$/)) {

    //                         currentPhrase = currentPhrase ? currentPhrase + ' ' + part : part;

    //                         // 如果這個片語比目前的候選者更好
    //                         if (currentPhrase.length > bestCandidate.length && currentPhrase.length < 200) {
    //                           bestCandidate = currentPhrase;
    //                         }
    //                       } else {
    //                         // 遇到不是主旨的部分，重置當前片語
    //                         currentPhrase = '';
    //                       }
    //                     }

    //                     if (bestCandidate && bestCandidate.length > 5) {
    //                       subject = bestCandidate;
    //                       debugLog('    從整行提取到主旨:', subject);
    //                     }
    //                   }
    //                 }

    //                 debugLog('    最終主旨:', subject);

    //                 // 提取時間 - Gmail 時間通常在特定的 span 中
    //                 debugLog('    尋找時間元素...');

    //                 // Gmail 時間的多種可能位置
    //                 const timeSelectors = [
    //                   '.bq3', // Gmail 時間的典型類別
    //                   'span[title*="2024"]', // 有完整日期的 span
    //                   'span[title*="2025"]',
    //                   'span[title*="週"]', // 中文週幾
    //                   'span[title*="下午"]', // 中文時間
    //                   'span[title*="上午"]',
    //                   'td[role="gridcell"] span' // 表格中的時間 span
    //                 ];

    //                 for (const selector of timeSelectors) {
    //                   const elements = row.querySelectorAll(selector);
    //                   debugLog('    時間選擇器', selector, '找到元素數:', elements.length);

    //                   for (const el of elements) {
    //                     const text = el.textContent?.trim();
    //                     const title = el.getAttribute('title');
    //                     const className = el.className;

    //                     debugLog('    時間元素 class:', className);
    //                     debugLog('    時間元素文字:', text);
    //                     debugLog('    時間元素 title:', title);

    //                     // 優先使用 title 中的完整時間
    //                     if (title && (title.includes('2024') || title.includes('2025') || 
    //                                  title.includes('週') || title.includes('下午') || title.includes('上午'))) {
    //                       time = title;
    //                       debugLog('    從 title 找到時間:', time);
    //                       break;
    //                     }

    //                     // 其次使用文字中的時間格式
    //                     if (text && (text.match(/\\d{1,2}:\\d{2}/) || 
    //                                 text.match(/\\d+月\\d+日/) || 
    //                                 text.match(/\\d{4}/) ||
    //                                 text.match(/(上午|下午)\\d{1,2}:\\d{2}/) ||
    //                                 text.match(/(今天|昨天|前天)/))) {
    //                       time = text;
    //                       debugLog('    從文字找到時間:', time);
    //                       break;
    //                     }
    //                   }
    //                   if (time) break;
    //                 }

    //                 // 如果還沒找到，嘗試更廣泛的搜尋
    //                 if (!time) {
    //                   debugLog('    擴大搜尋時間元素...');
    //                   const allSpans = row.querySelectorAll('span');
    //                   for (let i = 0; i < Math.min(allSpans.length, 15); i++) {
    //                     const el = allSpans[i];
    //                     const text = el.textContent?.trim();
    //                     const title = el.getAttribute('title');

    //                     debugLog('    檢查 span', i, 'class:', el.className);
    //                     debugLog('    檢查 span', i, '文字:', text);
    //                     debugLog('    檢查 span', i, 'title:', title);

    //                     // 檢查是否包含時間信息
    //                     if (title && title.length > 10 && (title.includes('年') || title.includes('月') || title.includes('：'))) {
    //                       time = title;
    //                       debugLog('    從 title 找到時間:', time);
    //                       break;
    //                     }

    //                     if (text && text.length > 2 && text.length < 20 && 
    //                         (text.match(/\\d{1,2}:\\d{2}/) || text.includes('今天') || text.includes('昨天'))) {
    //                       time = text;
    //                       debugLog('    從文字找到時間:', time);
    //                       break;
    //                     }
    //                   }
    //                 }

    //                 debugLog('    最終時間:', time);

    //                 // 提取寄件者
    //                 debugLog('    尋找寄件者元素...');
    //                 const senderElements = row.querySelectorAll('span[email], span[title*="@"]');
    //                 debugLog('    找到可能的寄件者元素數:', senderElements.length);

    //                 for (const el of senderElements) {
    //                   const email = el.getAttribute('email');
    //                   const title = el.getAttribute('title');
    //                   const text = el.textContent?.trim();

    //                   debugLog('    寄件者元素 email 屬性:', email);
    //                   debugLog('    寄件者元素 title 屬性:', title);
    //                   debugLog('    寄件者元素文字:', text);

    //                   if (email) {
    //                     sender = email;
    //                     debugLog('    從 email 屬性找到寄件者:', sender);
    //                     break;
    //                   } else if (title && title.includes('@')) {
    //                     sender = title;
    //                     debugLog('    從 title 屬性找到寄件者:', sender);
    //                     break;
    //                   } else if (text && text.includes('@')) {
    //                     sender = text;
    //                     debugLog('    從文字找到寄件者:', sender);
    //                     break;
    //                   }
    //                 }

    //                 // 如果沒有明確的寄件者，嘗試從行首提取
    //                 if (!sender) {
    //                   debugLog('    寄件者為空，嘗試從行首提取...');
    //                   const rowText = row.textContent?.trim();
    //                   if (rowText) {
    //                     const firstPart = rowText.split(/\\s+/)[0];
    //                     debugLog('    行首部分:', firstPart);
    //                     if (firstPart && (firstPart.includes('@') || firstPart.length > 2)) {
    //                       sender = firstPart;
    //                       debugLog('    從行首提取到寄件者:', sender);
    //                     }
    //                   }
    //                 }

    //                 debugLog('    最終寄件者:', sender);

    //                 // 檢查是否已讀（通常未讀郵件有特殊樣式）
    //                 isRead = !row.classList.contains('zE') && !row.querySelector('.yW');
    //                 debugLog('    是否已讀:', isRead);

    //                 // 只返回有主旨的郵件
    //                 debugLog('    檢查是否返回郵件 - 主旨長度:', subject ? subject.length : 0);
    //                 if (subject && subject.length > 0) {
    //                   const result = {
    //                     subject: subject.substring(0, 200), // 限制主旨長度
    //                     time: time || '未知時間',
    //                     sender: sender || '未知寄件者',
    //                     isRead: isRead
    //                   };
    //                   debugLog('    返回郵件:', result);
    //                   return result;
    //                 }

    //                 debugLog('    沒有主旨，不返回郵件');
    //                 return null;
    //               }

    //               debugLog('成功提取', mails.length, '封郵件');
    //               return { title, mails, debugLogs };

    //             } catch (e) {
    //               return { error: 'failed to extract Gmail emails: ' + e.message, debugLogs: debugLogs || [] };
    //             }
    //           })();
    //         \`);

    //         return result;
    //       } catch (e) {
    //         return { error: 'failed to execute script in webview: ' + e.message };
    //       }
    //     })();
    //   `);

    //   if (emailData.error) {
    //     console.error('❌ Gmail DOM 解析失敗:', emailData.error);
    //     domResult = { success: false, error: emailData.error, source: 'dom' };
    //   } else {
    //     console.log('✅ Gmail DOM 解析成功，共', emailData.mails?.length || 0, '封');
    //     domResult = {
    //       success: true,
    //       mails: emailData.mails?.map(mail => ({ ...mail, source: 'dom' })) || [],
    //       title: emailData.title,
    //       debugLogs: emailData.debugLogs,
    //       source: 'dom'
    //     };
    //   }

    //   // 3. 整合兩種數據源的結果
    //   // return integrateGmailResults(apiResult, domResult);
    //   return {
    //     url: 'https://mail.google.com/mail/u/0/#inbox',
    //     apiResult: apiResult
    //   };

    // } catch (error) {
    //   console.error('❌ Gmail webview executeJavaScript 失敗:', error);
    //   return { error: 'Gmail webview execution failed: ' + error.message };
    // }

  } catch (error) {
    console.error('❌ Gmail 郵件提取異常:', error);
    return { error: 'Gmail extraction exception: ' + error.message };
  }
}

// 整合 Gmail API 和 DOM 解析的結果
/**
 * 將中文日期時間格式轉換為標準時間戳
 * 例如: "2025年8月16日 週六 下午1:34" -> RFC 格式時間戳
 */
function parseChineseDatetime(chineseTime) {
  try {
    // 解析中文時間格式：2025年8月16日 週六 下午1:34
    const match = chineseTime.match(/(\d{4})年(\d{1,2})月(\d{1,2})日.*?([上下])午(\d{1,2}):(\d{2})/);
    if (!match) return null;

    const [, year, month, day, period, hour, minute] = match;
    let hour24 = parseInt(hour);

    // 轉換12小時制到24小時制
    if (period === '下' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === '上' && hour24 === 12) {
      hour24 = 0;
    }

    // 創建日期對象 (假設為台北時區 UTC+8)
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minute));
    return date.getTime();
  } catch (error) {
    console.warn('解析中文時間失敗:', chineseTime, error);
    return null;
  }
}

/**
 * 將RFC時間格式轉換為時間戳
 * 例如: "Sat, 16 Aug 2025 05:34:49 +0000" -> 時間戳
 */
function parseRfcDatetime(rfcTime) {
  try {
    return new Date(rfcTime).getTime();
  } catch (error) {
    console.warn('解析RFC時間失敗:', rfcTime, error);
    return null;
  }
}

/**
 * 比較兩個郵件是否為同一封 (基於subject和時間)
 */
function emailsMatch(email1, email2, timeToleranceMs = 60000) { // 1分鐘容差
  // 比較 subject (忽略大小寫和前後空白)
  const subject1 = (email1.subject || '').trim().toLowerCase();
  const subject2 = (email2.subject || '').trim().toLowerCase();

  if (subject1 !== subject2 || !subject1) {
    return false;
  }

  // 解析時間
  let time1, time2;

  if (email1.source === 'api') {
    time1 = parseRfcDatetime(email1.time);
  } else {
    time1 = parseChineseDatetime(email1.time);
  }

  if (email2.source === 'api') {
    time2 = parseRfcDatetime(email2.time);
  } else {
    time2 = parseChineseDatetime(email2.time);
  }

  if (!time1 || !time2) {
    return false; // 如果時間解析失敗，只基於subject判斷
  }

  // 比較時間差是否在容差範圍內
  const timeDiff = Math.abs(time1 - time2);
  return timeDiff <= timeToleranceMs;
}

function integrateGmailResults(apiResult, domResult) {
  console.log('📊 整合 Gmail 數據源結果...');

  const result = {
    title: 'Gmail',
    mails: [],
    totalApiMails: 0,
    totalDomMails: 0,
    matchedCount: 0,
    sources: [],
    errors: []
  };

  let apiMails = [];
  let domMails = [];

  // 準備 API 結果
  if (apiResult && apiResult.success) {
    apiMails = apiResult.mails || [];
    result.totalApiMails = apiMails.length;
    result.sources.push('api');
    result.totalCount = apiResult.totalCount;
    console.log(`✅ API 數據: ${apiMails.length} 封郵件`);
  } else if (apiResult && !apiResult.success) {
    result.errors.push(`API 錯誤: ${apiResult.error}`);
    console.log(`❌ API 數據獲取失敗: ${apiResult.error}`);
  }

  // 準備 DOM 結果  
  if (domResult && domResult.success) {
    domMails = domResult.mails || [];
    result.totalDomMails = domMails.length;
    result.sources.push('dom');
    result.title = domResult.title || result.title;
    result.debugLogs = domResult.debugLogs;
    console.log(`✅ DOM 數據: ${domMails.length} 封郵件`);
  } else if (domResult && !domResult.success) {
    result.errors.push(`DOM 錯誤: ${domResult.error}`);
    console.log(`❌ DOM 數據獲取失敗: ${domResult.error}`);
  }

  // 如果兩種方式都失敗
  if (result.sources.length === 0) {
    return {
      error: '所有數據源都失敗: ' + result.errors.join('; '),
      sources: [],
      attempts: { api: !!apiResult, dom: !!domResult }
    };
  }

  // 智能合併：以 DOM 為主，為每封 DOM 郵件尋找對應的 API ID
  if (domMails.length > 0 && apiMails.length > 0) {
    console.log('🔄 開始郵件比對和 ID 匹配...');

    for (const domEmail of domMails) {
      let enrichedEmail = { ...domEmail };

      // 尋找匹配的 API 郵件
      const matchingApiEmail = apiMails.find(apiEmail =>
        emailsMatch(domEmail, apiEmail)
      );

      if (matchingApiEmail) {
        // 將 API 的 ID 添加到 DOM 郵件中
        enrichedEmail.id = matchingApiEmail.id;
        enrichedEmail.matchedFromAPI = true;
        result.matchedCount++;
        console.log(`✅ 匹配成功: "${domEmail.subject}" -> ID: ${matchingApiEmail.id}`);
      } else {
        enrichedEmail.matchedFromAPI = false;
        console.log(`⚠️ 未找到匹配: "${domEmail.subject}"`);
      }

      result.mails.push(enrichedEmail);
    }

    console.log(`📊 比對結果: ${result.matchedCount}/${domMails.length} 封郵件成功匹配到 API ID`);

  } else if (domMails.length > 0) {
    // 只有 DOM 數據
    result.mails = domMails;
  } else if (apiMails.length > 0) {
    // 只有 API 數據
    result.mails = apiMails;
  }

  console.log(`📧 最終結果: ${result.mails.length} 封郵件，來源: ${result.sources.join(', ')}，匹配: ${result.matchedCount || 0}`);

  return result;
}

function register(window) {
  mainWindow = window;

  // Browser Control IPC Handlers
  ipcMain.handle('browser-click', async (_, selector, options = {}) => {
    try {
      const webContents = mainWindow?.webContents;
      if (!webContents) {
        throw new Error('No active window');
      }

      const script = `
        (function() {
          const element = document.querySelector('${selector}');
          if (!element) {
            throw new Error('Element not found: ${selector}');
          }

          const rect = element.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) {
            throw new Error('Element is not visible');
          }

          // 模擬點擊
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: ${options.button === 'right' ? 2 : options.button === 'middle' ? 1 : 0}
          });

          element.dispatchEvent(clickEvent);

          // 如果是雙擊
          if (${options.doubleClick || false}) {
            const dblClickEvent = new MouseEvent('dblclick', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            element.dispatchEvent(dblClickEvent);
          }

          return {
            success: true,
            elementText: element.textContent?.trim() || '',
            elementTag: element.tagName.toLowerCase()
          };
        })();
      `;

      const result = await webContents.executeJavaScript(script);

      // 等待一小段時間讓頁面響應
      await new Promise(resolve => setTimeout(resolve, options.delay || 100));

      return {
        success: true,
        ...result,
        executionTime: Date.now()
      };

    } catch (error) {
      console.error('Browser click error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('browser-type', async (_, selector, text, options = {}) => {
    try {
      const webContents = mainWindow?.webContents;
      if (!webContents) {
        throw new Error('No active window');
      }

      const script = `
        (function() {
          const element = document.querySelector('${selector}');
          if (!element) {
            throw new Error('Element not found: ${selector}');
          }

          // 清空現有內容（如果需要）
          if (${options.clear || false}) {
            element.value = '';
          }

          // 聚焦元素
          element.focus();

          // 設置值
          element.value = '${text.replace(/'/g, "\\'")}';

          // 觸發 input 事件
          const inputEvent = new Event('input', { bubbles: true });
          element.dispatchEvent(inputEvent);

          // 觸發 change 事件
          const changeEvent = new Event('change', { bubbles: true });
          element.dispatchEvent(changeEvent);

          // 如果需要按 Enter
          if (${options.pressEnter || false}) {
            const keyEvent = new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              bubbles: true
            });
            element.dispatchEvent(keyEvent);
          }

          return {
            success: true,
            value: element.value
          };
        })();
      `;

      const result = await webContents.executeJavaScript(script);

      // 等待一小段時間
      await new Promise(resolve => setTimeout(resolve, options.delay || 100));

      return {
        success: true,
        ...result,
        executionTime: Date.now()
      };

    } catch (error) {
      console.error('Browser type error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('browser-scroll', async (_, direction, amount = 300) => {
    try {
      const webContents = mainWindow?.webContents;
      if (!webContents) {
        throw new Error('No active window');
      }

      const script = `
        (function() {
          let scrollX = 0, scrollY = 0;

          switch ('${direction}') {
            case 'up':
              scrollY = -${amount};
              break;
            case 'down':
              scrollY = ${amount};
              break;
            case 'left':
              scrollX = -${amount};
              break;
            case 'right':
              scrollX = ${amount};
              break;
            case 'top':
              window.scrollTo(0, 0);
              return { success: true, position: { x: 0, y: 0 } };
            case 'bottom':
              window.scrollTo(0, document.body.scrollHeight);
              return { success: true, position: { x: window.scrollX, y: window.scrollY } };
          }

          window.scrollBy(scrollX, scrollY);

          return {
            success: true,
            position: {
              x: window.scrollX,
              y: window.scrollY
            }
          };
        })();
      `;

      const result = await webContents.executeJavaScript(script);
      return result;

    } catch (error) {
      console.error('Browser scroll error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('browser-navigate', async (_, url, options = {}) => {
    try {
      const webContents = mainWindow?.webContents;
      if (!webContents) {
        throw new Error('No active window');
      }

      // 載入新頁面
      await webContents.loadURL(url);

      // 等待頁面載入完成
      const timeout = options.timeout || 10000;
      const waitUntil = options.waitUntil || 'domcontentloaded';

      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('Navigation timeout'));
        }, timeout);

        const cleanup = () => {
          clearTimeout(timer);
          webContents.removeListener('dom-ready', onDomReady);
          webContents.removeListener('did-finish-load', onFinishLoad);
        };

        const onDomReady = () => {
          if (waitUntil === 'domcontentloaded') {
            cleanup();
            resolve();
          }
        };

        const onFinishLoad = () => {
          if (waitUntil === 'load') {
            cleanup();
            resolve();
          }
        };

        webContents.once('dom-ready', onDomReady);
        webContents.once('did-finish-load', onFinishLoad);

        // 如果是 networkidle，等待額外時間
        if (waitUntil === 'networkidle') {
          setTimeout(() => {
            cleanup();
            resolve();
          }, 2000);
        }
      });

      return {
        success: true,
        url: webContents.getURL(),
        title: webContents.getTitle()
      };

    } catch (error) {
      console.error('Browser navigate error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('browser-wait-element', async (_, selector, timeout = 5000) => {
    try {
      const webContents = mainWindow?.webContents;
      if (!webContents) {
        throw new Error('No active window');
      }

      const script = `
        new Promise((resolve, reject) => {
          const startTime = Date.now();
          const checkElement = () => {
            const element = document.querySelector('${selector}');
            if (element) {
              resolve({
                success: true,
                found: true,
                elementText: element.textContent?.trim() || ''
              });
              return;
            }

            if (Date.now() - startTime > ${timeout}) {
              resolve({
                success: false,
                found: false,
                error: 'Element not found within timeout'
              });
              return;
            }

            setTimeout(checkElement, 100);
          };

          checkElement();
        });
      `;

      const result = await webContents.executeJavaScript(script);
      return result;

    } catch (error) {
      console.error('Browser wait element error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('browser-wait-navigation', async (_, timeout = 10000) => {
    try {
      const webContents = mainWindow?.webContents;
      if (!webContents) {
        throw new Error('No active window');
      }

      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('Navigation wait timeout'));
        }, timeout);

        webContents.once('did-finish-load', () => {
          clearTimeout(timer);
          resolve();
        });
      });

      return {
        success: true,
        url: webContents.getURL(),
        title: webContents.getTitle()
      };

    } catch (error) {
      console.error('Browser wait navigation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('browser-screenshot', async (_, options = {}) => {
    try {
      const webContents = mainWindow?.webContents;
      if (!webContents) {
        throw new Error('No active window');
      }

      const image = await webContents.capturePage();
      const buffer = image.toPNG();
      const base64 = buffer.toString('base64');

      return {
        success: true,
        screenshot: base64,
        format: 'png'
      };

    } catch (error) {
      console.error('Browser screenshot error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('browser-execute-script', async (_, script) => {
    try {
      const webContents = mainWindow?.webContents;
      if (!webContents) {
        throw new Error('No active window');
      }

      const result = await webContents.executeJavaScript(script);

      return {
        success: true,
        result: result
      };

    } catch (error) {
      console.error('Browser execute script error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('browser-get-page-data', async (_, options = {}) => {
    try {
      const webContents = mainWindow?.webContents;
      if (!webContents) {
        throw new Error('No active window');
      }

      // 使用統一的 URL 提取函數
      const urlInfo = await extractRealWebviewUrl(webContents);
      const targetUrl = urlInfo.url;
      let pageTitle = urlInfo.title || 'Unknown';

      // 檢查是否為 Gmail
      const isGmail = targetUrl.includes('mail.google.com');

      if (isGmail) {
        // Gmail 特殊處理 - 傳遞 access token 和選項
        const gmailOptions = {
          accessToken: options.accessToken,
          useAPI: options.useAPI !== false, // 預設使用 API
          maxResults: 10
        };
        console.log('🔄 開始從 Gmail 提取郵件列表...', gmailOptions);
        const webviewContent = await extractGmailEmails(webContents, gmailOptions);

        if (!webviewContent || webviewContent.error) {
          throw new Error(`Gmail 內容提取失敗: ${webviewContent?.error || '未知錯誤'}`);
        }

        // pageTitle = webviewContent.title || pageTitle;

        const webviewData = {
          url: targetUrl,
          title: pageTitle,
          metadata: {
            timestamp: Date.now(),
            viewport: { width: 1200, height: 800 },
            scrollPosition: { x: 0, y: 0 },
            loadState: 'complete',
            extractionMethod: 'gmail'
          },
          mails: webviewContent.mails || []
        };
        try {
          const fs = require('fs');
          const path = require('path');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `page-data-${timestamp}.json`;
          const filepath = path.join(process.cwd(), 'debug', filename);

          // 確保 debug 目錄存在
          const debugDir = path.join(process.cwd(), 'debug');
          if (!fs.existsSync(debugDir)) {
            fs.mkdirSync(debugDir, { recursive: true });
          }

          // 創建完整的調試數據
          const debugData = {
            ...webviewData,
            rawWebviewContent: webviewContent,  // 包含原始的 webview 提取數據
            urlInfo: urlInfo,  // 包含 URL 提取信息
            extractionTimestamp: new Date().toISOString(),
          };

          fs.writeFileSync(filepath, JSON.stringify(debugData, null, 2), 'utf8');
          console.log(`📄 頁面數據已導出到: ${filepath}`);
        } catch (error) {
          console.error('❌ 導出頁面數據失敗:', error);
        }
        return {
          success: true,
          pageData: webviewData
        };
      }

      // 一般網頁處理
      const webviewContent = await extractWebviewContent(webContents);

      let content, interactiveElements, links = [];

      if (!webviewContent || webviewContent.error) {
        throw new Error(`Webview 內容提取失敗: ${webviewContent?.error || '未知錯誤'}`);
      }

      // 使用從 webview 提取的真實內容
      pageTitle = webviewContent.title || pageTitle;
      content = webviewContent.content || '無法提取頁面內容';
      links = webviewContent.links || [];

      console.log('✅ 使用 webview 提取的真實內容');
      console.log('📄 內容長度:', content.length);
      console.log('🔗 連結數量:', links.length);

      console.log('✅ 最終使用的 URL:', targetUrl);
      console.log('✅ 頁面標題:', pageTitle);
      console.log('✅ URL 來源:', urlInfo.source);

      const webviewData = {
        url: targetUrl,  // 返回 webview 的真實 URL
        title: pageTitle,  // 使用真實的頁面標題
        content: content,  // 使用從 webview 提取的真實內容（包含所有互動元素）
        links: links,  // 添加連結信息
        metadata: {
          timestamp: Date.now(),
          viewport: { width: 1200, height: 800 },
          scrollPosition: { x: 0, y: 0 },
          loadState: 'complete',
          extractionMethod: 'webview'
        },
        extractionErrors: []
      };

      // 導出完整的頁面數據為 JSON 文件（用於調試和改進）
      try {
        const fs = require('fs');
        const path = require('path');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `page-data-${timestamp}.json`;
        const filepath = path.join(process.cwd(), 'debug', filename);

        // 確保 debug 目錄存在
        const debugDir = path.join(process.cwd(), 'debug');
        if (!fs.existsSync(debugDir)) {
          fs.mkdirSync(debugDir, { recursive: true });
        }

        // 創建完整的調試數據
        const debugData = {
          ...webviewData,
          rawWebviewContent: webviewContent,  // 包含原始的 webview 提取數據
          urlInfo: urlInfo,  // 包含 URL 提取信息
          extractionTimestamp: new Date().toISOString(),
          // apiResult: apiResult,
          debugInfo: {
            contentLength: content ? content.length : 0,
            linksCount: links ? links.length : 0,
            interactiveElementsCount: interactiveElements ? interactiveElements.length : 0,
            extractionSource: urlInfo.source
          }
        };

        fs.writeFileSync(filepath, JSON.stringify(debugData, null, 2), 'utf8');
        console.log(`📄 頁面數據已導出到: ${filepath}`);
      } catch (error) {
        console.error('❌ 導出頁面數據失敗:', error);
      }

      return {
        success: true,
        pageData: webviewContent
      };

    } catch (error) {
      console.error('Browser get page data error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Gmail API 專用處理器
  ipcMain.handle('gmail-fetch-emails', async (_, config) => {
    try {
      const { accessToken, refreshToken, clientConfig, maxResults = 100 } = config;

      if (!accessToken) {
        return { success: false, error: '缺少 access token' };
      }

      // 驗證和刷新 token
      let validToken = accessToken;
      if (refreshToken && clientConfig) {
        const tokenValidation = await validateAndRefreshToken(accessToken, refreshToken, clientConfig);
        if (tokenValidation.success) {
          validToken = tokenValidation.accessToken;
        }
      }

      // 調用 Gmail API - 預設只獲取主要區域
      const gmailOptions = { query: '' };
      const result = await fetchGmailMessagesViaAPI(validToken, maxResults, gmailOptions);

      return {
        success: result.success,
        mails: result.mails || [],
        totalCount: result.totalCount || 0,
        error: result.error,
        source: 'api'
      };

    } catch (error) {
      console.error('Gmail API 處理器錯誤:', error);
      return { success: false, error: error.message };
    }
  });

  // Navigate to Google to verify login status
  ipcMain.handle('navigate-to-google', async () => {
    try {
      if (mainWindow) {
        mainWindow.loadURL('https://www.google.com');
        return { success: true };
      }
      return { success: false, error: 'Main window not available' };
    } catch (error) {
      console.error('Error navigating to Google:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { register };