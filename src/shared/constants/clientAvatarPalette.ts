export interface AvatarPalette {
  bg: string;
  border: string;
  text: string;
}

const PALETTES: AvatarPalette[] = [
  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900' },
  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900' },
  { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900' },
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900' },
];

const hashString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const getClientAvatarPalette = (key: string): AvatarPalette => {
  const index = hashString(key) % PALETTES.length;
  return PALETTES[index];
};
