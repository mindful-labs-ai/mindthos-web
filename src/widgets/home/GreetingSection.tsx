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
    <div className="mb-6 pt-9">
      <p className="greeting-section-typo mb-2 text-grey-60">{date}</p>
      <h2 className="greeting-section-typo text-grey-100">
        반가워요, {userName} 상담사님
      </h2>
    </div>
  );
};
