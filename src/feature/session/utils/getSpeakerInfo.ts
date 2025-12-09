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

export const getSpeakerInfo = (
  segment: TranscribeSegment,
  speakers: Speaker[]
): SpeakerInfo => {
  const speaker = speakers.find((s) => s.id === segment.speaker);
  const isCounselor = speaker?.role === 'counselor';

  // customName이 있으면 우선 사용, 없으면 기본 이름 사용
  const name =
    speaker?.customName ||
    (isCounselor
      ? '상담자'
      : speaker?.role === 'client1'
        ? '내담자'
        : '내담자2');

  // customName이 있으면 첫 글자 사용, 없으면 기존 로직 사용
  const label = speaker?.customName
    ? speaker.customName.charAt(0).toUpperCase()
    : isCounselor
      ? '상'
      : speaker?.role === 'client1'
        ? '내'
        : '내2';

  // customName이 있으면 ID 기반 색상, 없으면 role 기반 고정 색상
  let bgColor: string;
  let textColor: string;

  if (speaker?.customName) {
    // customName이 있는 경우: ID 기반으로 고유 색상 생성
    const colors = getColorFromId(speaker.id);
    bgColor = colors.bgColor;
    textColor = colors.textColor;
  } else {
    // 기본 speaker (counselor, client1, client2): 고정 색상
    bgColor = isCounselor
      ? 'bg-red-100'
      : speaker?.role === 'client1'
        ? 'bg-green-100'
        : 'bg-blue-100';

    textColor = isCounselor
      ? 'text-red-600'
      : speaker?.role === 'client1'
        ? 'text-green-600'
        : 'text-blue-600';
  }

  return { name, label, bgColor, textColor };
};
