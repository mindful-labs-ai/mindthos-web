import { Font } from '@react-pdf/renderer';

/**
 * @react-pdf/renderer용 폰트 등록
 * public/pdf/ 디렉토리의 로컬 파일 사용
 *
 * [커스텀 가이드]
 * - 새 폰트 추가: public/pdf/에 TTF/OTF 파일 넣고 아래에 Font.register 추가
 * - family 이름은 StyleSheet에서 fontFamily로 참조
 * - WOFF2는 @react-pdf/renderer 미지원 → TTF 또는 OTF만 사용
 */
export function registerFonts() {
  // ---- NanumSquareNeo (본문 기본) ----
  Font.register({
    family: 'NanumSquareNeo',
    fonts: [
      { src: '/pdf/NanumSquareNeoOTF-Rg.otf', fontWeight: 400 },
      { src: '/pdf/NanumSquareNeoOTF-Eb.otf', fontWeight: 800 },
    ],
  });

  // ---- Jura (표지 CONFIDENTIAL 등 영문 장식) ----
  Font.register({
    family: 'Jura',
    fonts: [
      { src: '/pdf/Jura-Light.ttf', fontWeight: 300 },
      { src: '/pdf/Jura-Regular.ttf', fontWeight: 400 },
      { src: '/pdf/Jura-Medium.ttf', fontWeight: 500 },
      { src: '/pdf/Jura-SemiBold.ttf', fontWeight: 600 },
      { src: '/pdf/Jura-Bold.ttf', fontWeight: 700 },
    ],
  });

  // ---- BinggraeII (표지 메인 타이틀) ----
  Font.register({
    family: 'BinggraeII',
    fonts: [{ src: '/pdf/BinggraeⅡ-Bold.ttf', fontWeight: 700 }],
  });

  // ---- Open Sans (영문 본문 등) ----
  Font.register({
    family: 'OpenSans',
    fonts: [{ src: '/pdf/OpenSans-Regular.ttf', fontWeight: 400 }],
  });

  // 하이픈 자동 줄바꿈 비활성화 (한글에서 불필요)
  Font.registerHyphenationCallback((word) => [word]);
}
