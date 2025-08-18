// 這個腳本會被注入到webview中執行，用於提取頁面內容並轉換為YAML格式

// YAML 字符串轉義函數
function escapeYamlString(str) {
  if (!str) return '';
  return str.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

// 清理文本函數
function cleanText(text) {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ').substring(0, 200);
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
  const tagName = element.tagName.toLowerCase();
  const unwantedTags = ['script', 'style', 'meta', 'link', 'noscript', 'br', 'hr'];
  return unwantedTags.includes(tagName);
}

// 生成精確的選擇器
function generatePreciseSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c.trim());
    if (classes.length > 0) {
      return `.${classes[0]}`;
    }
  }
  
  const tagName = element.tagName.toLowerCase();
  const parent = element.parentElement;
  
  if (parent) {
    const siblings = Array.from(parent.children).filter(child => child.tagName === element.tagName);
    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1;
      return `${tagName}:nth-of-type(${index})`;
    }
  }
  
  return tagName;
}

// 將單個元素轉換為 YAML（按 HTML 標籤順序處理）
function convertElementToYAMLWithDetails(element, selectorCounts) {
  const tagName = element.tagName.toLowerCase();
  let yaml = '';

  // 生成選擇器和索引
  const selector = generatePreciseSelector(element);
  selectorCounts[selector] = (selectorCounts[selector] || 0) + 1;
  const index = selectorCounts[selector];

  switch (tagName) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      const level = parseInt(tagName.charAt(1));
      const headingText = cleanText(element.textContent);
      if (headingText && headingText.length > 0) {
        yaml = '  - type: heading\n';
        yaml += '    level: ' + level + '\n';
        yaml += '    text: "' + escapeYamlString(headingText) + '"\n\n';
      }
      break;

    case 'p':
      const pText = cleanText(element.textContent);
      if (pText && pText.length > 5) {
        yaml = '  - type: paragraph\n';
        yaml += '    text: "' + escapeYamlString(pText) + '"\n\n';
      }
      break;

    case 'div':
    case 'span':
      // 對於 div 和 span，只提取直接文字內容（不包含子元素）
      const directText = Array.from(element.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => cleanText(node.textContent))
        .join(' ')
        .trim();

      if (directText && directText.length > 5) {
        // 檢查是否是可點擊的
        if (element.onclick || element.getAttribute('onclick') || element.style.cursor === 'pointer' || element.getAttribute('role') === 'button') {
          yaml = '  - type: clickable_element\n';
          yaml += '    element_type: ' + tagName + '\n';
          yaml += '    text: "' + escapeYamlString(directText.substring(0, 100)) + '"\n';
          yaml += '    action: click\n';
          yaml += '    selector: "' + escapeYamlString(selector) + '"\n';
          yaml += '    selector_index: ' + index + '\n';
          if (element.id) yaml += '    id: "' + escapeYamlString(element.id) + '"\n';
          if (element.className) yaml += '    class: "' + escapeYamlString(element.className) + '"\n';
          yaml += '\n';
        } else {
          yaml = '  - type: text\n';
          yaml += '    content: "' + escapeYamlString(directText) + '"\n\n';
        }
      }
      break;

    case 'a':
      const linkText = cleanText(element.textContent);
      const href = element.href;
      if (linkText && href && linkText.length > 0) {
        yaml = '  - type: link\n';
        yaml += '    text: "' + escapeYamlString(linkText) + '"\n';
        yaml += '    href: "' + escapeYamlString(href) + '"\n';
        yaml += '    action: click\n';
        yaml += '    selector: "' + escapeYamlString(selector) + '"\n';
        yaml += '    selector_index: ' + index + '\n';
        if (element.id) yaml += '    id: "' + escapeYamlString(element.id) + '"\n';
        if (element.className) yaml += '    class: "' + escapeYamlString(element.className) + '"\n';
        yaml += '\n';
      }
      break;

    case 'button':
      const buttonText = cleanText(element.textContent || element.value || element.getAttribute('aria-label') || 'Button');
      if (buttonText && buttonText.length > 0) {
        yaml = '  - type: button\n';
        yaml += '    text: "' + escapeYamlString(buttonText) + '"\n';
        yaml += '    action: click\n';
        yaml += '    selector: "' + escapeYamlString(selector) + '"\n';
        yaml += '    selector_index: ' + index + '\n';
        if (element.id) yaml += '    id: "' + escapeYamlString(element.id) + '"\n';
        if (element.className) yaml += '    class: "' + escapeYamlString(element.className) + '"\n';
        yaml += '\n';
      }
      break;

    case 'input':
      const inputType = element.type || 'text';
      const inputLabel = cleanText(element.placeholder || element.name || element.id || element.getAttribute('aria-label') || 'Input');
      if (inputLabel && inputLabel.length > 0) {
        yaml = '  - type: input\n';
        yaml += '    input_type: "' + inputType + '"\n';
        yaml += '    label: "' + escapeYamlString(inputLabel) + '"\n';
        if (element.value) {
          yaml += '    current_value: "' + escapeYamlString(element.value) + '"\n';
        }
        yaml += '    action: ' + (inputType === 'submit' || inputType === 'button' ? 'click' : 'type') + '\n';
        yaml += '    selector: "' + escapeYamlString(selector) + '"\n';
        yaml += '    selector_index: ' + index + '\n';
        if (element.id) yaml += '    id: "' + escapeYamlString(element.id) + '"\n';
        if (element.className) yaml += '    class: "' + escapeYamlString(element.className) + '"\n';
        yaml += '\n';
      }
      break;

    case 'textarea':
      const textareaLabel = cleanText(element.placeholder || element.name || element.id || element.getAttribute('aria-label') || 'Textarea');
      if (textareaLabel && textareaLabel.length > 0) {
        yaml = '  - type: textarea\n';
        yaml += '    label: "' + escapeYamlString(textareaLabel) + '"\n';
        if (element.value) {
          yaml += '    current_value: "' + escapeYamlString(element.value.substring(0, 200)) + '"\n';
        }
        yaml += '    action: type\n';
        yaml += '    selector: "' + escapeYamlString(selector) + '"\n';
        yaml += '    selector_index: ' + index + '\n';
        if (element.id) yaml += '    id: "' + escapeYamlString(element.id) + '"\n';
        if (element.className) yaml += '    class: "' + escapeYamlString(element.className) + '"\n';
        yaml += '\n';
      }
      break;

    case 'select':
      const selectLabel = cleanText(element.name || element.id || element.getAttribute('aria-label') || 'Select');
      if (selectLabel && selectLabel.length > 0) {
        const options = Array.from(element.options || []).map(opt => cleanText(opt.text));
        yaml = '  - type: select\n';
        yaml += '    label: "' + escapeYamlString(selectLabel) + '"\n';
        if (options.length > 0) {
          yaml += '    options:\n';
          options.forEach(opt => {
            yaml += '      - "' + escapeYamlString(opt) + '"\n';
          });
        }
        yaml += '    action: select\n';
        yaml += '    selector: "' + escapeYamlString(selector) + '"\n';
        yaml += '    selector_index: ' + index + '\n';
        if (element.id) yaml += '    id: "' + escapeYamlString(element.id) + '"\n';
        if (element.className) yaml += '    class: "' + escapeYamlString(element.className) + '"\n';
        yaml += '\n';
      }
      break;

    default:
      // 對於其他元素，提取純文字內容
      const otherText = cleanText(element.textContent);
      if (otherText && otherText.length > 5 && !element.children.length) {
        yaml = '  - type: text\n';
        yaml += '    content: "' + escapeYamlString(otherText) + '"\n\n';
      }
      break;
  }

  return {
    yaml: yaml
  };
}

// 遍歷所有元素並轉換為 YAML (按順序，整合所有元素)
function extractAllElementsAsYAML() {
  console.log('開始按順序遍歷所有元素生成完整的 YAML');

  let yamlContent = '';
  
  // 頁面基本信息
  const pageTitle = document.title || 'Untitled Page';
  const currentUrl = window.location.href;
  
  yamlContent += 'page_info:\n';
  yamlContent += '  title: "' + escapeYamlString(cleanText(pageTitle)) + '"\n';
  yamlContent += '  url: "' + escapeYamlString(currentUrl) + '"\n\n';
  
  yamlContent += 'content:\n';

  // 按順序遍歷所有可見元素，直接生成完整的 YAML
  const allElements = document.body.querySelectorAll('*');
  const processedElements = new Set(); // 避免重複處理
  const selectorCounts = {}; // 追蹤 selector 使用次數

  console.log('總共找到元素數量:', allElements.length);

  // 按 DOM 順序處理每個元素
  for (let i = 0; i < allElements.length && i < 1500; i++) {
    const element = allElements[i];

    // 跳過已處理的元素
    if (processedElements.has(element)) continue;

    // 跳過不可見或不需要的元素
    if (isElementHidden(element) || isElementUnwanted(element)) continue;

    const elementInfo = convertElementToYAMLWithDetails(element, selectorCounts);
    if (elementInfo && elementInfo.yaml) {
      // 直接按順序添加到 YAML
      yamlContent += elementInfo.yaml;
      processedElements.add(element);
    }
  }

  // 限制最大字數為 30000 字
  if (yamlContent.length > 30000) {
    console.log('內容超過 30000 字，進行截斷');
    yamlContent = yamlContent.substring(0, 30000) + '\n\n# [內容已截斷，總長度超過 30000 字]';
  }

  console.log('最終 YAML 長度:', yamlContent.length);

  return {
    content: yamlContent
  };
}
