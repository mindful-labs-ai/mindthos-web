import React from 'react';

import { Text, Title } from '@/components/ui';

interface GreetingSectionProps {
  userName: string;
  date: string;
}

export const GreetingSection: React.FC<GreetingSectionProps> = ({
  userName,
  date,
}) => {
  return (
    <div className="mb-6 pt-12">
      <Text className="mb-2 text-base font-bold text-fg-muted">{date}</Text>
      <Title as="h1" className="text-3xl font-bold">
        반갑습니다, {userName} 선생님
      </Title>
    </div>
  );
};
