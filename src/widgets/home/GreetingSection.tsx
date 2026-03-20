import React from 'react';

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
      <p className="greeting-section-typo text-grey-60 mb-2">{date}</p>
      <h2 className="greeting-section-typo text-grey-100">
        반갑습니다, {userName} 선생님
      </h2>
    </div>
  );
};
