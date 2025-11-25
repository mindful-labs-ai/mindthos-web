import type {
  FileInfo,
  ProgressNote,
  Session,
  Transcribe,
  TranscribeContents,
} from '../types';

interface CreateMockSessionDataParams {
  file: FileInfo;
  clientId: string | null;
  userId: string;
}

interface MockSessionData {
  session: Session;
  transcribe: Transcribe;
  progressNotes: ProgressNote[];
}

// UUID 간단 생성 (실제로는 서버에서 생성)
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Mock 전사 컨텐츠 (실제로는 서버에서 STT 처리)
const createMockTranscribeContents = (): TranscribeContents => {
  return {
    audio_uuid: '64a4b8aa0599-c4dfece7',
    status: 'completing',
    result: {
      segments: [
        {
          id: 0,
          speaker: 0,
          start: 0.0,
          end: 2.15,
          text: '최근에 건강은 어때요?',
        },
        {
          id: 1,
          speaker: 1,
          start: 2.8,
          end: 4.1,
          text: '건강한 편이에요.',
        },
        {
          id: 2,
          speaker: 0,
          start: 4.9,
          end: 7.2,
          text: '최근에 다친 적이 있었나요?',
        },
        {
          id: 3,
          speaker: 1,
          start: 7.8,
          end: 9.3,
          text: '팔에 멍들었어요.',
        },
        {
          id: 4,
          speaker: 0,
          start: 10.1,
          end: 12.5,
          text: '언제 어떻게 하다가 다쳤어요?',
        },
        {
          id: 5,
          speaker: 1,
          start: 13.0,
          end: 14.4,
          text: '언니가 꼬집었어요.',
        },
        {
          id: 6,
          speaker: 0,
          start: 15.2,
          end: 17.1,
          text: '뭘 할 때가 즐거워요?',
        },
        {
          id: 7,
          speaker: 1,
          start: 17.8,
          end: 20.3,
          text: '집에서 뜨개질로 뭐 만들 때요.',
        },
        {
          id: 8,
          speaker: 0,
          start: 21.0,
          end: 22.8,
          text: '어떤 점이 즐거워요?',
        },
        {
          id: 9,
          speaker: 1,
          start: 23.5,
          end: 25.9,
          text: '완성된 거 보면 뿌듯해요.',
        },
        {
          id: 10,
          speaker: 0,
          start: 26.8,
          end: 30.1,
          text: '최근 일주일 동안 짜증이나 화가 난 적이 있을까요?',
        },
        {
          id: 11,
          speaker: 1,
          start: 30.8,
          end: 32.5,
          text: '언니 때문에 화났어요.',
        },
        {
          id: 12,
          speaker: 0,
          start: 33.2,
          end: 35.1,
          text: '무엇 때문에 화가 났어요?',
        },
        {
          id: 13,
          speaker: 1,
          start: 35.9,
          end: 39.2,
          text: '거의 다 만든 목도리 언니가 풀어버렸어요.',
        },
        {
          id: 14,
          speaker: 0,
          start: 40.0,
          end: 41.8,
          text: '그런 일이 자주 일어나나요?',
        },
        {
          id: 15,
          speaker: 1,
          start: 42.5,
          end: 43.9,
          text: '맨날 저 괴롭혀요.',
        },
        {
          id: 16,
          speaker: 0,
          start: 44.8,
          end: 47.9,
          text: '평소에 짜증이 나면 어떻게 할 때 맘이 풀려요?',
        },
        {
          id: 17,
          speaker: 1,
          start: 48.8,
          end: 50.1,
          text: '잘 모르겠어요.',
        },
        {
          id: 18,
          speaker: 0,
          start: 51.0,
          end: 53.2,
          text: '몇 시에 자고 몇 시에 일어나요?',
        },
        {
          id: 19,
          speaker: 1,
          start: 53.9,
          end: 56.5,
          text: '열 시에 자고 일곱 시에 일어나요.',
        },
        {
          id: 20,
          speaker: 0,
          start: 57.3,
          end: 59.8,
          text: '아침 일어났을 때 몸 상태는 어때요?',
        },
        {
          id: 21,
          speaker: 1,
          start: 60.5,
          end: 61.8,
          text: '좋은 편이에요.',
        },
        {
          id: 22,
          speaker: 0,
          start: 62.6,
          end: 66.2,
          text: '잠들기 힘들거나 잠 자는 중간에 깨는 일이 있을까요?',
        },
        {
          id: 23,
          speaker: 1,
          start: 66.9,
          end: 67.8,
          text: '아뇨?',
        },
        {
          id: 24,
          speaker: 0,
          start: 68.6,
          end: 71.3,
          text: '평상시에 아빠는 어떤 표정을 자주 지어요?',
        },
        {
          id: 25,
          speaker: 1,
          start: 72.1,
          end: 73.8,
          text: '무뚝뚝한 표정이요.',
        },
        {
          id: 26,
          speaker: 0,
          start: 74.6,
          end: 76.5,
          text: '왜 그런 표정을 짓는 것 같아요?',
        },
        {
          id: 27,
          speaker: 1,
          start: 77.3,
          end: 79.9,
          text: '아빠는 언니만 예뻐하는 것 같아요.',
        },
        {
          id: 28,
          speaker: 0,
          start: 80.8,
          end: 82.5,
          text: '아빠랑 사이는 어때요?',
        },
        {
          id: 29,
          speaker: 1,
          start: 83.2,
          end: 84.4,
          text: '그냥 그래요.',
        },
        {
          id: 30,
          speaker: 0,
          start: 85.3,
          end: 88.0,
          text: '평상시에 엄마는 어떤 표정을 자주 지어요?',
        },
        {
          id: 31,
          speaker: 1,
          start: 88.8,
          end: 90.6,
          text: '엄마는 친절한 표정이요.',
        },
        {
          id: 32,
          speaker: 0,
          start: 91.5,
          end: 93.4,
          text: '왜 그런 표정을 짓는 것 같아요?',
        },
        {
          id: 33,
          speaker: 1,
          start: 94.2,
          end: 95.7,
          text: '엄마는 착해서요.',
        },
        {
          id: 34,
          speaker: 0,
          start: 96.6,
          end: 98.2,
          text: '엄마랑 사이는 어떤가요?',
        },
        {
          id: 35,
          speaker: 1,
          start: 99.0,
          end: 99.9,
          text: '좋아요.',
        },
        {
          id: 36,
          speaker: 0,
          start: 100.8,
          end: 102.3,
          text: '형제 자매가 있나요?',
        },
        {
          id: 37,
          speaker: 1,
          start: 103.1,
          end: 104.6,
          text: '언니 하나 있어요.',
        },
        {
          id: 38,
          speaker: 0,
          start: 105.5,
          end: 106.8,
          text: '사이가 어때요?',
        },
        {
          id: 39,
          speaker: 1,
          start: 107.6,
          end: 110.5,
          text: '언니 싫어요. 맨날 저 괴롭혀요.',
        },
        {
          id: 40,
          speaker: 0,
          start: 111.4,
          end: 114.2,
          text: '부모님이 형제와 나를 차별하는 것 같아요?',
        },
        {
          id: 41,
          speaker: 1,
          start: 115.0,
          end: 117.1,
          text: '아빠가 언니만 예뻐해요.',
        },
        {
          id: 42,
          speaker: 0,
          start: 118.0,
          end: 120.1,
          text: '친구들이랑 주로 뭐 하고 놀아요?',
        },
        {
          id: 43,
          speaker: 1,
          start: 120.9,
          end: 123.6,
          text: '친구들이랑은 맛있는 거 먹으러 다녀요.',
        },
        {
          id: 44,
          speaker: 0,
          start: 124.5,
          end: 126.1,
          text: '주로 몇 명이랑 놀아요?',
        },
        {
          id: 45,
          speaker: 1,
          start: 126.9,
          end: 127.8,
          text: '세 명이요.',
        },
        {
          id: 46,
          speaker: 0,
          start: 128.7,
          end: 131.2,
          text: '담임 선생님은 어때요? 좋은 것 같아요?',
        },
        {
          id: 47,
          speaker: 1,
          start: 132.0,
          end: 134.3,
          text: '좋아요. 선생님 재미있어요.',
        },
        {
          id: 48,
          speaker: 0,
          start: 135.2,
          end: 137.1,
          text: '요즘 제일 걱정되는 게 뭐예요?',
        },
        {
          id: 49,
          speaker: 1,
          start: 137.9,
          end: 138.8,
          text: '언니요.',
        },
        {
          id: 50,
          speaker: 0,
          start: 139.7,
          end: 141.6,
          text: '어떤 점에서 걱정이 돼요?',
        },
        {
          id: 51,
          speaker: 1,
          start: 142.4,
          end: 145.8,
          text: '엄마 아빠 안 계실 때마다 저 때리고 괴롭혀요.',
        },
        {
          id: 52,
          speaker: 0,
          start: 146.7,
          end: 149.9,
          text: '걱정 때문에 불편한 느낌이 일주일에 몇 번 정도 들어요?',
        },
        {
          id: 53,
          speaker: 1,
          start: 150.8,
          end: 152.0,
          text: '매일 불편해요.',
        },
        {
          id: 54,
          speaker: 0,
          start: 152.9,
          end: 154.5,
          text: '요즘 행복한 것 같아요?',
        },
        {
          id: 55,
          speaker: 1,
          start: 155.3,
          end: 156.8,
          text: '네, 그런 것 같아요.',
        },
        {
          id: 56,
          speaker: 0,
          start: 157.7,
          end: 159.6,
          text: '어떤 점에서 행복한가요?',
        },
        {
          id: 57,
          speaker: 1,
          start: 160.4,
          end: 163.5,
          text: '언니랑 둘이 있는 거 말고는 다 좋아요.',
        },
        {
          id: 58,
          speaker: 0,
          start: 164.4,
          end: 166.4,
          text: '커서 어떤 사람이 되고 싶어요?',
        },
        {
          id: 59,
          speaker: 1,
          start: 167.2,
          end: 168.1,
          text: '군인이요.',
        },
        {
          id: 60,
          speaker: 0,
          start: 169.0,
          end: 170.8,
          text: '왜 그 일이 하고 싶어요?',
        },
        {
          id: 61,
          speaker: 1,
          start: 171.6,
          end: 175.2,
          text: '자기 몸 지킬 수 있는 강한 사람이 멋있어 보여요.',
        },
        {
          id: 62,
          speaker: 0,
          start: 176.1,
          end: 178.9,
          text: '집에서 주로 나를 돌봐주는 어른은 누구인가요?',
        },
        {
          id: 63,
          speaker: 1,
          start: 179.7,
          end: 180.5,
          text: '엄마요.',
        },
        {
          id: 64,
          speaker: 0,
          start: 181.4,
          end: 184.2,
          text: '학교나 학원 끝나고 집에 가면 항상 누가 있나요?',
        },
        {
          id: 65,
          speaker: 1,
          start: 185.0,
          end: 186.2,
          text: '엄마 있어요.',
        },
        {
          id: 66,
          speaker: 0,
          start: 187.1,
          end: 190.1,
          text: '배가 고픈데 먹을 게 없어서 굶은 적이 있나요?',
        },
        {
          id: 67,
          speaker: 1,
          start: 190.9,
          end: 191.7,
          text: '아뇨?',
        },
        {
          id: 68,
          speaker: 0,
          start: 192.6,
          end: 196.1,
          text: '어디 아픈 곳이 있는데 병원에 가지 못한 적이 있나요?',
        },
        {
          id: 69,
          speaker: 1,
          start: 196.9,
          end: 198.5,
          text: '아니요, 없어요.',
        },
        {
          id: 70,
          speaker: 0,
          start: 199.4,
          end: 203.2,
          text: '빨래를 못해서 더럽거나 냄새나는 옷을 입어야 한 적이 있나요?',
        },
        {
          id: 71,
          speaker: 1,
          start: 204.0,
          end: 204.9,
          text: '아니요?',
        },
        {
          id: 72,
          speaker: 0,
          start: 205.8,
          end: 208.7,
          text: '옷이나 신발 사이즈가 작아서 불편한 적이 있나요?',
        },
        {
          id: 73,
          speaker: 1,
          start: 209.5,
          end: 211.2,
          text: '불편한 적 없어요.',
        },
        {
          id: 74,
          speaker: 0,
          start: 212.1,
          end: 215.9,
          text: '인터넷이나 휴대폰을 가지고 노는 시간은 하루에 몇 시간 정도예요?',
        },
        {
          id: 75,
          speaker: 1,
          start: 216.7,
          end: 218.1,
          text: '두 시간 정도요.',
        },
        {
          id: 76,
          speaker: 0,
          start: 219.0,
          end: 222.1,
          text: '어른들이 운동회나 참관 수업 같은 학교 행사에 잘 오시나요?',
        },
        {
          id: 77,
          speaker: 1,
          start: 222.9,
          end: 223.7,
          text: '네.',
        },
        {
          id: 78,
          speaker: 0,
          start: 224.6,
          end: 227.8,
          text: '부모님이나 선생님 때문에 기분이 안 좋아진 적이 있나요?',
        },
        {
          id: 79,
          speaker: 1,
          start: 228.6,
          end: 230.1,
          text: '아니요, 없어요.',
        },
        {
          id: 80,
          speaker: 0,
          start: 231.0,
          end: 236.5,
          text: '내가 무엇을 하려고 하면 무조건 안 된다고 하거나 하기 싫은데도 무조건 하라고 할 때가 있나요?',
        },
        {
          id: 81,
          speaker: 1,
          start: 237.3,
          end: 238.8,
          text: '없는 것 같아요.',
        },
        {
          id: 82,
          speaker: 0,
          start: 239.7,
          end: 244.2,
          text: '어른들이 나를 집에서 쫓아낸다고 말하거나 어디에 가두고 못 나오게 한 적이 있나요?',
        },
        {
          id: 83,
          speaker: 1,
          start: 245.0,
          end: 246.0,
          text: '아니요?',
        },
        {
          id: 84,
          speaker: 0,
          start: 246.9,
          end: 249.4,
          text: '마음이 힘들 때 가족에게 내 마음을 이야기하나요?',
        },
        {
          id: 85,
          speaker: 1,
          start: 250.2,
          end: 251.6,
          text: '잘 모르겠어요.',
        },
        {
          id: 86,
          speaker: 0,
          start: 252.5,
          end: 255.6,
          text: '주위 어른이나 가족들 중 나를 때린 적이 있는 사람이 있나요?',
        },
        {
          id: 87,
          speaker: 1,
          start: 256.4,
          end: 257.5,
          text: '언니가요.',
        },
        {
          id: 88,
          speaker: 0,
          start: 258.4,
          end: 260.9,
          text: '그 사람이 나를 때리는 이유는 뭐라고 생각해요?',
        },
        {
          id: 89,
          speaker: 1,
          start: 261.7,
          end: 264.1,
          text: '그냥 괜히 괴롭히고 그러는 것 같아요.',
        },
        {
          id: 90,
          speaker: 0,
          start: 265.0,
          end: 267.1,
          text: '어느 부위를 무엇으로 맞았나요?',
        },
        {
          id: 91,
          speaker: 1,
          start: 267.9,
          end: 270.4,
          text: '머리채도 잡고 팔도 꼬집어요.',
        },
        {
          id: 92,
          speaker: 0,
          start: 271.3,
          end: 272.9,
          text: '그런 일이 자주 있나요?',
        },
        {
          id: 93,
          speaker: 1,
          start: 273.7,
          end: 276.4,
          text: '집에 언니랑 둘이 있으면 자주 그래요.',
        },
        {
          id: 94,
          speaker: 0,
          start: 277.3,
          end: 280.1,
          text: '맞은 것 때문에 다치거나 병원에 간 적이 있나요?',
        },
        {
          id: 95,
          speaker: 1,
          start: 280.9,
          end: 283.1,
          text: '아니요, 그냥 멍만 들었어요.',
        },
        {
          id: 96,
          speaker: 0,
          start: 284.0,
          end: 288.1,
          text: '내가 원하지 않는데도 누군가가 내 몸을 만지거나 보여달라고 한 적 있어요?',
        },
        {
          id: 97,
          speaker: 1,
          start: 288.9,
          end: 289.8,
          text: '아니요?',
        },
        {
          id: 98,
          speaker: 0,
          start: 290.7,
          end: 295.4,
          text: '성적인 목적으로 내 신체 부위를 촬영해서 누구한테 보내거나 어디 올린 적 있나요?',
        },
        {
          id: 99,
          speaker: 1,
          start: 296.2,
          end: 297.9,
          text: '아니요, 그런 적 없어요.',
        },
        {
          id: 100,
          speaker: 0,
          start: 298.8,
          end: 302.5,
          text: '내가 싫다는데도 계속해서 연락하거나 따라다니는 사람이 있나요?',
        },
        {
          id: 101,
          speaker: 1,
          start: 303.3,
          end: 304.1,
          text: '없어요.',
        },
        {
          id: 102,
          speaker: 0,
          start: 305.0,
          end: 308.5,
          text: '가족들끼리 소리지르면서 싸우는 걸 듣거나 본 적이 있나요?',
        },
        {
          id: 103,
          speaker: 1,
          start: 309.3,
          end: 310.5,
          text: '아니요, 없어요.',
        },
        {
          id: 104,
          speaker: 0,
          start: 311.4,
          end: 315.7,
          text: '어른이 아닌 주변 사람들이 나를 자주 놀리거나 괴롭힌다고 느낀 적이 있나요?',
        },
        {
          id: 105,
          speaker: 1,
          start: 316.5,
          end: 317.8,
          text: '그런 적 없어요.',
        },
        {
          id: 106,
          speaker: 0,
          start: 318.7,
          end: 320.6,
          text: '어떨 때 마음이 복잡하거나 힘든가요?',
        },
        {
          id: 107,
          speaker: 1,
          start: 321.4,
          end: 322.8,
          text: '잘 모르겠어요.',
        },
        {
          id: 108,
          speaker: 0,
          start: 323.7,
          end: 328.2,
          text: '안 좋은 기억 때문에 괴로워서 스스로 해치거나 죽고 싶다는 생각을 한 적 있나요?',
        },
        {
          id: 109,
          speaker: 1,
          start: 329.0,
          end: 330.4,
          text: '그런 적은 없어요.',
        },
        {
          id: 110,
          speaker: 0,
          start: 331.3,
          end: 333.1,
          text: '잠 잘 때 주로 어떤 꿈을 꾸나요?',
        },
        {
          id: 111,
          speaker: 1,
          start: 333.9,
          end: 338.2,
          text: '가끔 깜짝 놀라면서 깰 때 있는데 무슨 꿈인지는 기억 안 나요.',
        },
        {
          id: 112,
          speaker: 0,
          start: 339.1,
          end: 341.6,
          text: '그런 꿈을 꾸고 일어나면 몸 상태는 어때요?',
        },
        {
          id: 113,
          speaker: 1,
          start: 342.4,
          end: 343.8,
          text: '별로 이상 없어요.',
        },
        {
          id: 114,
          speaker: 0,
          start: 344.7,
          end: 348.1,
          text: '생각하고 싶지 않은데도 자꾸 안 좋은 기억이 떠오른 적이 있나요?',
        },
        {
          id: 115,
          speaker: 1,
          start: 348.9,
          end: 350.2,
          text: '아니요, 없어요.',
        },
        {
          id: 116,
          speaker: 0,
          start: 351.1,
          end: 352.5,
          text: '가출해 본 적이 있나요?',
        },
        {
          id: 117,
          speaker: 1,
          start: 353.3,
          end: 354.0,
          text: '없어요.',
        },
        {
          id: 118,
          speaker: 0,
          start: 354.9,
          end: 357.2,
          text: '친한 친구 중에 가출한 친구가 있을까요?',
        },
        {
          id: 119,
          speaker: 1,
          start: 358.0,
          end: 358.9,
          text: '아니요?',
        },
      ],
      speakers: [
        {
          id: 0,
          role: 'counselor',
        },
        {
          id: 1,
          role: 'client1',
        },
      ],
    },
  };
};

/**
 * Mock 세션 데이터 생성
 */
export const createMockSessionData = ({
  file,
  clientId,
  userId,
}: CreateMockSessionDataParams): MockSessionData => {
  const sessionId = generateId();
  const now = new Date().toISOString();

  // public 폴더의 실제 오디오 파일 경로 사용
  const audioUrl = '/audio/sample-counseling.mp3';

  // 1. Session 생성
  const session: Session = {
    id: sessionId,
    user_id: userId,
    client_id: clientId, // 내담자 ID (uuid)
    title: file.name,
    description: `${file.name} 상담 세션`,
    audio_meta_data: {
      file_name: file.name,
      file_size: file.size,
      duration: 'duration' in file ? file.duration : 0,
      mime_type: file.file.type,
      uploaded_at: now,
    },
    audio_url: audioUrl,
    created_at: now,
  };

  // 2. Transcribe 생성 (전사 완료된 상태로 시뮬레이션)
  const transcribe: Transcribe = {
    id: generateId(),
    session_id: sessionId,
    user_id: userId,
    title: file.name,
    counsel_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    contents: createMockTranscribeContents(),
    created_at: now,
  };

  // 3. ProgressNote 생성 (상담 노트 - SOAP, 마음토스)
  const progressNotes: ProgressNote[] = [
    {
      id: generateId(),
      session_id: sessionId,
      user_id: userId,
      title: 'SOAP 노트',
      template_id: 1, // SOAP 템플릿 ID
      summary: `
S (Subjective): 내담자는 최근 건강 상태가 좋다고 보고함. 식사와 수면이 규칙적이며, 운동도 꾸준히 하고 있음.

O (Objective): 내담자의 표정이 밝고 말투가 안정적임. 비언어적 의사소통도 긍정적으로 관찰됨.

A (Assessment): 내담자의 전반적인 상태가 호전되고 있음. 자기 관리 능력이 향상되었으며, 스트레스 관리 전략을 효과적으로 사용하고 있음.

P (Plan): 현재의 건강한 생활 습관 유지를 격려. 다음 세션에서 장기 목표 설정에 대해 논의 예정.
      `.trim(),
      created_at: now,
    },
    {
      id: generateId(),
      session_id: sessionId,
      user_id: userId,
      title: '마음토스 상담 노트',
      template_id: 2, // 마음토스 템플릿 ID
      summary: `
## 주요 주제
- 건강 관리 및 생활 습관
- 정서적 안정성
- 대인관계 개선

## 내담자 상태
내담자는 최근 건강 상태가 좋아졌으며, 규칙적인 생활을 유지하고 있습니다. 식사와 수면 패턴이 안정적이고, 운동을 통해 스트레스를 관리하고 있습니다.

## 상담 내용
내담자와 건강 관리에 대해 논의했습니다. 규칙적인 식사, 충분한 수면, 꾸준한 운동이 정서적 안정에 긍정적인 영향을 미치고 있음을 확인했습니다.

## 향후 계획
- 현재의 건강한 생활 습관 유지
- 스트레스 관리 전략 강화
- 장기 목표 설정 및 실행 계획 수립
      `.trim(),
      created_at: now,
    },
  ];

  return {
    session,
    transcribe,
    progressNotes,
  };
};
