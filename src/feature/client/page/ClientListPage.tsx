import React from 'react';

import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/atoms/Button';
import { Input } from '@/components/ui/atoms/Input';
import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { AddClientModal } from '@/feature/client/components/AddClientModal';
import { ClientCard } from '@/feature/client/components/ClientCard';
import type { Client } from '@/feature/client/types';
import { calculateSearchScore, matchesInitialSearch } from '@/lib/searchUtils';

// TODO: 실제 API 연동 시 제거
const mockClients: Client[] = [
  // ㄱ
  {
    id: '1',
    group_id: 1,
    counselor_id: '1',
    name: '김성곤',
    phone_number: '010-1234-5678',
    counsel_number: 6,
    memo: '개인 상담 진행 중',
    pin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    group_id: null,
    counselor_id: '1',
    name: '강민지',
    phone_number: '010-2345-6789',
    counsel_number: 3,
    memo: null,
    pin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '0',
    group_id: null,
    counselor_id: '1',
    name: '김경민',
    phone_number: '010-6206-3776',
    counsel_number: 0,
    memo: null,
    pin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // ㄴ
  {
    id: '4',
    group_id: null,
    counselor_id: '1',
    name: '나윤서',
    phone_number: '010-4567-8901',
    counsel_number: 2,
    memo: null,
    pin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // ㄹ
  {
    id: '5',
    group_id: null,
    counselor_id: '1',
    name: '류지민',
    phone_number: '010-5678-9012',
    counsel_number: 12,
    memo: null,
    pin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    group_id: null,
    counselor_id: '1',
    name: '이서연',
    phone_number: '010-6789-0123',
    counsel_number: 5,
    memo: null,
    pin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    group_id: 1,
    counselor_id: '1',
    name: '이준호',
    phone_number: '010-7890-1234',
    counsel_number: 10,
    memo: null,
    pin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // ㅂ
  {
    id: '3',
    group_id: null,
    counselor_id: '1',
    name: '박지우',
    phone_number: '010-8901-2345',
    counsel_number: 4,
    memo: null,
    pin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '9',
    group_id: null,
    counselor_id: '1',
    name: '배수진',
    phone_number: '010-9012-3456',
    counsel_number: 7,
    memo: null,
    pin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // ㅅ
  {
    id: '10',
    group_id: null,
    counselor_id: '1',
    name: '손예진',
    phone_number: '010-0123-4567',
    counsel_number: 9,
    memo: null,
    pin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // ㅈ
  {
    id: '11',
    group_id: null,
    counselor_id: '1',
    name: '정하윤',
    phone_number: '010-1357-2468',
    counsel_number: 1,
    memo: null,
    pin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '12',
    group_id: null,
    counselor_id: '1',
    name: '조민수',
    phone_number: '010-2468-1357',
    counsel_number: 11,
    memo: null,
    pin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // ㅊ
  {
    id: '13',
    group_id: null,
    counselor_id: '1',
    name: '최서현',
    phone_number: '010-3579-2468',
    counsel_number: 6,
    memo: null,
    pin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // ㅎ
  {
    id: '14',
    group_id: null,
    counselor_id: '1',
    name: '한지원',
    phone_number: '010-4680-1357',
    counsel_number: 3,
    memo: null,
    pin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '15',
    group_id: null,
    counselor_id: '1',
    name: '홍길동',
    phone_number: '010-5791-2468',
    counsel_number: 15,
    memo: null,
    pin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // 영문
  {
    id: '16',
    group_id: null,
    counselor_id: '1',
    name: 'Alice Kim',
    phone_number: '010-6802-3579',
    counsel_number: 4,
    memo: null,
    pin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '17',
    group_id: null,
    counselor_id: '1',
    name: 'Brian Lee',
    phone_number: '010-7913-4680',
    counsel_number: 2,
    memo: null,
    pin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '18',
    group_id: null,
    counselor_id: '1',
    name: 'David Park',
    phone_number: '010-8024-5791',
    counsel_number: 8,
    memo: null,
    pin: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * 한글 초성 추출
 */
const getKoreanInitial = (char: string): string => {
  const code = char.charCodeAt(0) - 44032;
  if (code < 0 || code > 11171) return char;
  const initialIndex = Math.floor(code / 588);
  const initials = [
    'ㄱ',
    'ㄲ',
    'ㄴ',
    'ㄷ',
    'ㄸ',
    'ㄹ',
    'ㅁ',
    'ㅂ',
    'ㅃ',
    'ㅅ',
    'ㅆ',
    'ㅇ',
    'ㅈ',
    'ㅉ',
    'ㅊ',
    'ㅋ',
    'ㅌ',
    'ㅍ',
    'ㅎ',
  ];
  return initials[initialIndex];
};

/**
 * 클라이언트 이름의 첫 글자를 기준으로 그룹 키 반환
 */
const getGroupKey = (name: string): string => {
  const firstChar = name.charAt(0);
  const code = firstChar.charCodeAt(0);

  // 한글
  if (code >= 44032 && code <= 55203) {
    return getKoreanInitial(firstChar);
  }

  // 영문 대문자
  if (code >= 65 && code <= 90) {
    return firstChar;
  }

  // 영문 소문자
  if (code >= 97 && code <= 122) {
    return firstChar.toUpperCase();
  }

  // 숫자 또는 특수문자
  return '0-9!@';
};

export const ClientListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [clients] = React.useState<Client[]>(mockClients);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  // 검색 필터링 (초성 검색 + 가중치 정렬)
  const filteredClients = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return clients;
    }

    const query = searchQuery.trim();

    // 검색어에 매칭되는 클라이언트 필터링
    const matched = clients
      .filter(
        (client) =>
          matchesInitialSearch(client.name, query) ||
          client.phone_number.includes(query)
      )
      .map((client) => {
        // 이름 매칭 점수
        const nameScore = calculateSearchScore(client.name, query);
        // 전화번호 매칭 점수 (이름보다 낮은 가중치)
        const phoneScore = client.phone_number.includes(query) ? 10 : 0;

        return {
          client,
          score: nameScore + phoneScore,
        };
      });

    // 점수 기준 내림차순 정렬
    matched.sort((a, b) => b.score - a.score);

    return matched.map((item) => item.client);
  }, [clients, searchQuery]);

  // 클라이언트를 그룹별로 정리
  const groupedClients = React.useMemo(() => {
    const groups: Record<string, Client[]> = {};

    filteredClients.forEach((client) => {
      const key = getGroupKey(client.name);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(client);
    });

    // 각 그룹 내에서 이름순 정렬
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => a.name.localeCompare(b.name));
    });

    // 그룹 키 정렬 (ㄱㄴㄷ → A-Z → 0-9!@)
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const koreanInitials = [
        'ㄱ',
        'ㄲ',
        'ㄴ',
        'ㄷ',
        'ㄸ',
        'ㄹ',
        'ㅁ',
        'ㅂ',
        'ㅃ',
        'ㅅ',
        'ㅆ',
        'ㅇ',
        'ㅈ',
        'ㅉ',
        'ㅊ',
        'ㅋ',
        'ㅌ',
        'ㅍ',
        'ㅎ',
      ];

      const aIndex = koreanInitials.indexOf(a);
      const bIndex = koreanInitials.indexOf(b);

      // 둘 다 한글 초성
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // a만 한글 초성
      if (aIndex !== -1) return -1;

      // b만 한글 초성
      if (bIndex !== -1) return 1;

      // 숫자/특수문자는 맨 뒤로
      if (a === '0-9!@') return 1;
      if (b === '0-9!@') return -1;

      // 영문은 알파벳순
      return a.localeCompare(b);
    });

    return sortedKeys.map((key) => ({
      key,
      clients: groups[key],
    }));
  }, [filteredClients]);

  const handleClientClick = (client: Client) => {
    console.log('클라이언트 클릭:', client);
    // TODO: 클라이언트 상세 페이지로 이동
    navigate(`/clients/${client.id}`);
  };

  const handleMenuClick = (client: Client) => {
    console.log('메뉴 클릭:', client);
    // TODO: 메뉴 팝업 표시 (수정, 삭제 등)
  };

  const handleAddClient = () => {
    setIsAddModalOpen(true);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-12 py-6 lg:px-16 lg:py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <Title as="h1" className="text-2xl font-bold">
            모든 클라이언트
          </Title>

          <div className="flex items-center gap-4">
            {/* Search Input */}
            <Input
              type="text"
              placeholder="검색하기"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<Search size={18} />}
              className="w-80"
            />

            {/* Add Client Button */}
            <Button
              variant="solid"
              tone="primary"
              size="md"
              onClick={handleAddClient}
            >
              고객 추가하기
            </Button>
          </div>
        </div>

        {/* Client List by Group */}
        {groupedClients.length > 0 ? (
          <div className="space-y-8">
            {groupedClients.map((group) => (
              <div key={group.key}>
                {/* Group Header */}
                <div className="mb-4 border-b border-border pb-2 text-left">
                  <Title as="h2" className="text-xl font-bold text-fg-muted">
                    {group.key}
                  </Title>
                </div>

                {/* Client List in Group */}
                <div className="space-y-3">
                  {group.clients.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      onClick={handleClientClick}
                      onMenuClick={handleMenuClick}
                      searchQuery={searchQuery}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex min-h-[400px] items-center justify-center">
            <Text className="text-lg text-fg-muted">검색 결과 없음</Text>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      <AddClientModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
    </>
  );
};
