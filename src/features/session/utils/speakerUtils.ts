import type { Speaker } from '../types';

export const getSpeakerDisplayName = (
  speakerId: number,
  speakers: Speaker[]
): string => {
  // 기본 화자명 (speakers 정보가 없거나 매칭되지 않을 때)
  const defaultNames: Record<number, string> = {
    0: '상담사',
    1: '내담자',
  };
  const defaultName = defaultNames[speakerId] ?? `화자 ${speakerId + 1}`;

  const speaker = speakers.find((s) => s.id === speakerId);
  if (!speaker) return defaultName;

  // customName이 있으면 우선 사용
  if (speaker.customName) return speaker.customName;

  // role 기반 이름
  if (speaker.role === 'counselor') return '상담사';
  if (speaker.role === 'client1') return '내담자';
  if (speaker.role === 'client2') return '내담자2';

  // custom_ prefix role은 기본값으로 대체
  if (speaker.role?.startsWith('custom_')) return defaultName;

  return speaker.role || defaultName;
};
