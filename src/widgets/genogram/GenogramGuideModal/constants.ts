import type { GuideStep } from './types';

/**
 * 가계도 안내 모달 기본 스텝 데이터
 */
export const DEFAULT_GUIDE_STEPS: GuideStep[] = [
  {
    id: 'step-1-drag',
    imageSrc: '/genogram/genogram-information-1.png',
    imageAlt: '가계도 위치 조정 예시',
    mainText:
      '첫 번째, 혹시 겹치거나 어색한 부분이 있나요?\n겹쳐있는 도형은 드래그해서 **위치를 알맞게 옮겨**주세요.',
    subText: '가계도의 최종적인 완성도는 선생님의 검수를 통해 확정됩니다.',
  },
  {
    id: 'step-2-toolbar',
    imageSrc: '/genogram/genogram-information-2.png',
    imageAlt: '가계도 툴바 예시',
    mainText:
      '두 번째, 더 추가해야할 도형이나 관계가 있다면\n하단에 있는 **아이콘 버튼을 눌러서 추가**해보세요.',
    subText: '전문가의 시선으로 가계도의 마지막 디테일을 채워주세요.',
  },
];

/**
 * LocalStorage 키: 다시 보지 않기 설정
 */
export const GUIDE_DONT_SHOW_AGAIN_KEY = 'genogram-guide-dont-show-again';
