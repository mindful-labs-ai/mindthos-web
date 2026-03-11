/**
 * pdf-lib를 이용한 PDF 후처리: 각 페이지에 "1 / 7p" 형식의 페이지 번호 삽입
 *
 * @react-pdf/renderer의 render prop이 React 19에서 미동작하여
 * 생성된 PDF blob을 후처리하는 방식으로 페이지 번호를 추가한다.
 *
 * [커스텀 가이드]
 * - 위치 조정: X, Y 좌표 수정
 * - 폰트 크기: fontSize 수정
 * - 표지 스킵: skipFirstPage 옵션
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface AddPageNumbersOptions {
  /** 표지(첫 페이지)를 건너뛸지 여부 (기본: true) */
  skipFirstPage?: boolean;
  /** 폰트 크기 (기본: 8) */
  fontSize?: number;
  /** 텍스트 색상 RGB 0~1 (기본: #6B7280 = 회색) */
  color?: { r: number; g: number; b: number };
}

export async function addPageNumbers(
  blob: Blob,
  options: AddPageNumbersOptions = {}
): Promise<Blob> {
  const {
    skipFirstPage = true,
    fontSize = 8,
    color = {
      r: 0.6274509803921569,
      g: 0.6745098039215687,
      b: 0.6352941176470588,
    },
  } = options;

  const arrayBuffer = await blob.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  const startIdx = skipFirstPage ? 1 : 0;
  const totalPages = pages.length - startIdx;

  for (let i = startIdx; i < pages.length; i++) {
    const page = pages[i];
    const pageNumber = i - startIdx + 1;
    const text = `${pageNumber} / ${totalPages}p`;
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    const x = page.getWidth() - 28 - textWidth;
    // 푸터 영역 중앙 (하단에서 약 30pt)
    const y = 48;

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
    });
  }

  const modifiedBytes = await pdfDoc.save();
  return new Blob([modifiedBytes.buffer as ArrayBuffer], {
    type: 'application/pdf',
  });
}
