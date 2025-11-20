import type { Speaker } from '../types';

export const getSpeakerDisplayName = (
  speakerId: number,
  speakers: Speaker[]
): string => {
  const speaker = speakers.find((s) => s.id === speakerId);
  if (!speaker) return '알 수 없음';
  if (speaker.role === 'counselor') return '상담사';
  if (speaker.role === 'client1') return '내담자1';
  if (speaker.role === 'client2') return '내담자2';
  return speaker.role;
};
