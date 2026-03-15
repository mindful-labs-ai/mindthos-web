import type { TranscribeSegment, Speaker } from '../types';

export interface SpeakerInfo {
  name: string;
  label: string;
  bgColor: string;
  textColor: string;
}

/**
 * ID 기반으로 고유한 색상 생성 (customName이 있는 speaker용)
 * @param id - speaker ID
 * @returns Tailwind 색상 클래스
 */
const getColorFromId = (id: number): { bgColor: string; textColor: string } => {
  // 다양한 색상 팔레트 (Tailwind의 100/600 shade 사용)
  const colors = [
    { bg: 'bg-purple-100', text: 'text-purple-600' },
    { bg: 'bg-pink-100', text: 'text-pink-600' },
    { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    { bg: 'bg-cyan-100', text: 'text-cyan-600' },
    { bg: 'bg-teal-100', text: 'text-teal-600' },
    { bg: 'bg-amber-100', text: 'text-amber-600' },
    { bg: 'bg-orange-100', text: 'text-orange-600' },
    { bg: 'bg-lime-100', text: 'text-lime-600' },
    { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    { bg: 'bg-sky-100', text: 'text-sky-600' },
  ];

  // ID를 색상 배열 길이로 나눈 나머지로 색상 선택
  const colorIndex = id % colors.length;
  return {
    bgColor: colors[colorIndex].bg,
    textColor: colors[colorIndex].text,
  };
};

/**
 * Speaker 객체에서 표시 이름을 반환하는 중앙화된 함수
 * SpeakerEditPopup과 TranscriptSegment 모두에서 사용
 * @param speaker - Speaker 객체
 * @returns 표시할 이름 문자열
 */
export const getSpeakerDisplayName = (speaker: Speaker): string => {
  // 1. customName이 있으면 우선 사용
  if (speaker.customName) {
    return speaker.customName;
  }

  // 2. role 기반 기본 이름
  if (speaker.role === 'counselor') {
    return '상담사';
  }

  if (speaker.role.startsWith('client')) {
    // client1 -> A, client2 -> B 형식으로 변환
    const clientNum = speaker.role.replace('client', '');
    if (clientNum) {
      const parsed = parseInt(clientNum, 10);
      if (!isNaN(parsed)) {
        return `내담자 ${String.fromCharCode(64 + parsed)}`;
      }
    }
    return '내담자';
  }

  // 3. 그 외 (custom_ 등) - 알파벳 라벨 사용
  const alphaLabel = String.fromCharCode(64 + speaker.id);
  return `참석자 ${alphaLabel}`;
};

/**
 * Speaker 객체에서 아바타 라벨(짧은 표시)을 반환
 * @param speaker - Speaker 객체
 * @returns 아바타에 표시할 짧은 라벨
 */
export const getSpeakerLabel = (speaker: Speaker): string => {
  // customName이 있으면 첫 글자 사용
  if (speaker.customName) {
    return speaker.customName.charAt(0).toUpperCase();
  }

  // role 기반 기본 라벨
  if (speaker.role === 'counselor') {
    return '상';
  }

  if (speaker.role.startsWith('client')) {
    const clientNum = speaker.role.replace('client', '');
    if (clientNum) {
      const parsed = parseInt(clientNum, 10);
      if (!isNaN(parsed)) {
        return String.fromCharCode(64 + parsed); // A, B, C...
      }
    }
    return '내';
  }

  // 그 외 - 알파벳 라벨
  return String.fromCharCode(64 + speaker.id);
};

export const getSpeakerInfo = (
  segment: TranscribeSegment,
  speakers: Speaker[]
): SpeakerInfo => {
  const speaker = speakers.find((s) => s.id === segment.speaker);

  if (!speaker) {
    // speaker를 찾지 못한 경우 기본값 반환
    return {
      name: '알 수 없음',
      label: '?',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600',
    };
  }

  const name = getSpeakerDisplayName(speaker);
  const label = getSpeakerLabel(speaker);

  // 색상 결정
  let bgColor: string;
  let textColor: string;

  if (speaker.customName) {
    // customName이 있는 경우: ID 기반으로 고유 색상 생성
    const colors = getColorFromId(speaker.id);
    bgColor = colors.bgColor;
    textColor = colors.textColor;
  } else if (speaker.role === 'counselor') {
    bgColor = 'bg-red-100';
    textColor = 'text-red-600';
  } else if (speaker.role.startsWith('client')) {
    // client 계열은 녹색 기반, 번호에 따라 약간 다른 색상
    const clientNum = speaker.role.replace('client', '');
    if (clientNum && parseInt(clientNum, 10) > 1) {
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-600';
    } else {
      bgColor = 'bg-green-100';
      textColor = 'text-green-600';
    }
  } else {
    // 기타 role: ID 기반 색상
    const colors = getColorFromId(speaker.id);
    bgColor = colors.bgColor;
    textColor = colors.textColor;
  }

  return { name, label, bgColor, textColor };
};
