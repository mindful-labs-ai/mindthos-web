import type { FileInfo, UploadType } from '../types';

export const useFileUpload = (
  type: UploadType,
  onFileSelect: (fileInfo: FileInfo | null) => void
) => {
  const processAudioFile = async (file: File) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    audio.src = objectUrl;

    audio.addEventListener('loadedmetadata', () => {
      const fileInfo: FileInfo = {
        name: file.name,
        size: file.size,
        duration: Math.floor(audio.duration),
        file,
      };

      onFileSelect(fileInfo);
      URL.revokeObjectURL(objectUrl);
    });
  };

  const processPdfFile = (file: File) => {
    const fileInfo: FileInfo = {
      name: file.name,
      size: file.size,
      file,
    };

    onFileSelect(fileInfo);
  };

  const processFile = async (file: File) => {
    if (type === 'audio') {
      await processAudioFile(file);
    } else if (type === 'pdf') {
      processPdfFile(file);
    }
  };

  return { processFile };
};
