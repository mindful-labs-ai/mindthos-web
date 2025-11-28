import type { TranscribeSegment, Speaker } from '../types';

export interface SpeakerInfo {
  name: string;
  label: string;
  bgColor: string;
  textColor: string;
}

export const getSpeakerInfo = (
  segment: TranscribeSegment,
  speakers: Speaker[]
): SpeakerInfo => {
  const speaker = speakers.find((s) => s.id === segment.speaker);
  const isCounselor = speaker?.role === 'counselor';

  const name = isCounselor
    ? '상담자'
    : speaker?.role === 'client1'
      ? '내담자'
      : '내담자2';

  const label = isCounselor ? '상' : speaker?.role === 'client1' ? '내' : '내2';

  const bgColor = isCounselor
    ? 'bg-red-100'
    : speaker?.role === 'client1'
      ? 'bg-green-100'
      : 'bg-blue-100';

  const textColor = isCounselor
    ? 'text-red-600'
    : speaker?.role === 'client1'
      ? 'text-green-600'
      : 'text-blue-600';

  return { name, label, bgColor, textColor };
};
