/**
 * DOM → 마크다운 변환 유틸리티
 *
 * contentEditable로 편집된 DOM 트리를 재귀 순회하여
 * 마크다운 문자열로 변환합니다.
 */

/**
 * DOM 컨테이너의 자식 노드들을 마크다운 문자열로 변환
 */
export function domToMarkdown(container: HTMLElement): string {
  const result = processChildren(container);
  // 연속된 빈 줄을 최대 2줄로 정리
  return result.replace(/\n{3,}/g, '\n\n').trim();
}

function processChildren(node: Node): string {
  let result = '';
  node.childNodes.forEach((child) => {
    result += processNode(child);
  });
  return result;
}

function processNode(node: Node): string {
  // 텍스트 노드
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }

  // 요소 노드
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case 'h1':
      return `# ${getInlineContent(el)}\n\n`;
    case 'h2':
      return `## ${getInlineContent(el)}\n\n`;
    case 'h3':
      return `### ${getInlineContent(el)}\n\n`;

    case 'p':
      return `${getInlineContent(el)}\n\n`;

    case 'strong':
    case 'b':
      return `**${getInlineContent(el)}**`;

    case 'em':
    case 'i':
      return `*${getInlineContent(el)}*`;

    case 'code':
      // 인라인 코드 (pre 안의 code는 별도 처리)
      if (el.parentElement?.tagName.toLowerCase() === 'pre') {
        return el.textContent || '';
      }
      return `\`${el.textContent || ''}\``;

    case 'pre':
      return `\`\`\`\n${el.textContent || ''}\n\`\`\`\n\n`;

    case 'br':
      return '\n';

    case 'ul':
      return processListItems(el, 'ul') + '\n';

    case 'ol':
      return processListItems(el, 'ol') + '\n';

    case 'li':
      // li는 부모(ul/ol) 처리에서 호출됨
      return getInlineContent(el);

    case 'blockquote':
      return processBlockquote(el) + '\n';

    case 'table':
      return processTable(el) + '\n';

    case 'div':
      // MarkdownRenderer에서 table을 div로 감싸므로 내부 탐색
      if (el.querySelector('table')) {
        return processChildren(el);
      }
      return processChildren(el);

    case 'thead':
    case 'tbody':
    case 'tr':
    case 'td':
    case 'th':
      // 테이블 요소는 processTable에서 직접 처리
      return '';

    case 'span':
      // br 대체 span (MarkdownRenderer의 className="block h-4")
      if (el.className.includes('block')) {
        return '\n';
      }
      return getInlineContent(el);

    default:
      return processChildren(el);
  }
}

/** 인라인 콘텐츠 추출 (strong, em, code 등 포함) */
function getInlineContent(el: HTMLElement): string {
  let result = '';
  el.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      result += child.textContent || '';
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childEl = child as HTMLElement;
      const tag = childEl.tagName.toLowerCase();

      switch (tag) {
        case 'strong':
        case 'b':
          result += `**${getInlineContent(childEl)}**`;
          break;
        case 'em':
        case 'i':
          result += `*${getInlineContent(childEl)}*`;
          break;
        case 'code':
          result += `\`${childEl.textContent || ''}\``;
          break;
        case 'br':
          result += '\n';
          break;
        case 'span':
          if (childEl.className.includes('block')) {
            result += '\n';
          } else {
            result += getInlineContent(childEl);
          }
          break;
        default:
          result += getInlineContent(childEl);
      }
    }
  });
  return result;
}

/** 리스트 아이템 처리 */
function processListItems(
  listEl: HTMLElement,
  listType: 'ul' | 'ol',
  depth: number = 0
): string {
  const lines: string[] = [];
  const indent = '  '.repeat(depth);
  let counter = 1;

  listEl.childNodes.forEach((child) => {
    if (
      child.nodeType !== Node.ELEMENT_NODE ||
      (child as HTMLElement).tagName.toLowerCase() !== 'li'
    )
      return;

    const li = child as HTMLElement;
    const prefix =
      listType === 'ul' ? `${indent}- ` : `${indent}${counter++}. `;

    // li 내부에 중첩 리스트가 있는지 확인
    const nestedList = li.querySelector(':scope > ul, :scope > ol');
    if (nestedList) {
      // 중첩 리스트 이전의 텍스트 콘텐츠
      const textParts: string[] = [];
      li.childNodes.forEach((liChild) => {
        if (liChild === nestedList) return;
        if (liChild.nodeType === Node.TEXT_NODE) {
          const text = liChild.textContent?.trim();
          if (text) textParts.push(text);
        } else if (
          liChild.nodeType === Node.ELEMENT_NODE &&
          !['ul', 'ol'].includes((liChild as HTMLElement).tagName.toLowerCase())
        ) {
          textParts.push(getInlineContent(liChild as HTMLElement));
        }
      });

      lines.push(`${prefix}${textParts.join('')}`);

      const nestedType = nestedList.tagName.toLowerCase() as 'ul' | 'ol';
      lines.push(
        processListItems(nestedList as HTMLElement, nestedType, depth + 1)
      );
    } else {
      lines.push(`${prefix}${getInlineContent(li)}`);
    }
  });

  return lines.join('\n');
}

/** 인용문 처리 */
function processBlockquote(el: HTMLElement): string {
  const inner = processChildren(el).trim();
  return (
    inner
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n') + '\n'
  );
}

/** 테이블 처리 */
function processTable(tableEl: HTMLElement): string {
  // MarkdownRenderer는 table을 div로 감싸므로, 실제 <table> 찾기
  const actualTable =
    tableEl.tagName.toLowerCase() === 'table'
      ? tableEl
      : tableEl.querySelector('table');
  if (!actualTable) return '';

  const rows: string[][] = [];
  let hasHeader = false;

  // thead 처리
  const thead = actualTable.querySelector('thead');
  if (thead) {
    hasHeader = true;
    thead.querySelectorAll('tr').forEach((tr) => {
      const cells: string[] = [];
      tr.querySelectorAll('th, td').forEach((cell) => {
        cells.push(getInlineContent(cell as HTMLElement).trim());
      });
      rows.push(cells);
    });
  }

  // tbody 처리
  const tbody = actualTable.querySelector('tbody');
  if (tbody) {
    tbody.querySelectorAll('tr').forEach((tr) => {
      const cells: string[] = [];
      tr.querySelectorAll('th, td').forEach((cell) => {
        cells.push(getInlineContent(cell as HTMLElement).trim());
      });
      rows.push(cells);
    });
  }

  // thead/tbody가 없는 경우 직접 tr 탐색
  if (!thead && !tbody) {
    actualTable.querySelectorAll('tr').forEach((tr) => {
      const cells: string[] = [];
      tr.querySelectorAll('th, td').forEach((cell) => {
        cells.push(getInlineContent(cell as HTMLElement).trim());
      });
      rows.push(cells);
    });
  }

  if (rows.length === 0) return '';

  // 마크다운 테이블 생성
  const lines: string[] = [];
  rows.forEach((row, index) => {
    lines.push(`| ${row.join(' | ')} |`);
    // 헤더 구분선 (첫 번째 행 뒤)
    if (index === 0 && (hasHeader || rows.length > 1)) {
      lines.push(`| ${row.map(() => '---').join(' | ')} |`);
    }
  });

  return lines.join('\n') + '\n';
}
