/**
 * ============================================
 * 섹션 디스패처
 * ============================================
 *
 * [커스텀 가이드]
 * - 새로운 섹션 타입 추가 시:
 *   1. reportSchema.ts에 새 타입 추가
 *   2. sections/ 폴더에 새 블록 컴포넌트 생성
 *   3. 아래 switch문에 case 추가
 */

import { View } from '@react-pdf/renderer';

import type { ReportSection } from '@/features/report/types/reportSchema';

import { BulletListBlock } from './sections/BulletListBlock';
import { DividerBlock } from './sections/DividerBlock';
import { GenogramImageBlock } from './sections/GenogramImageBlock';
import { HeadingBlock } from './sections/HeadingBlock';
import { InfoTableBlock } from './sections/InfoTableBlock';
import { KeyValueBlock } from './sections/KeyValueBlock';
import { LetterBoxBlock } from './sections/LetterBoxBlock';
import { ParagraphBlock } from './sections/ParagraphBlock';
import { ProfileSelectBlock } from './sections/ProfileSelectBlock';
import { RelationPatternBlock } from './sections/RelationPatternBlock';
import { ScoreTableBlock } from './sections/ScoreTableBlock';
import { StageAdaptationBlock } from './sections/StageAdaptationBlock';
import { SubHeadingBlock } from './sections/SubHeadingBlock';
import { TimelineBlock } from './sections/TimelineBlock';

export const SectionRenderer = ({
  section,
  headingNumber,
}: {
  section: ReportSection;
  headingNumber?: number;
}) => {
  switch (section.type) {
    case 'heading':
      return <HeadingBlock section={section} headingNumber={headingNumber} />;
    case 'sub_heading':
      return <SubHeadingBlock section={section} />;
    case 'paragraph':
      return <ParagraphBlock section={section} />;
    case 'genogram_image':
      return <GenogramImageBlock section={section} />;
    case 'score_table':
      return <ScoreTableBlock section={section} />;
    case 'bullet_list':
      return <BulletListBlock section={section} />;
    case 'key_value':
      return <KeyValueBlock section={section} />;
    case 'info_table':
      return <InfoTableBlock section={section} />;
    case 'profile_select':
      return <ProfileSelectBlock section={section} />;
    case 'letter_box':
      return <LetterBoxBlock section={section} />;
    case 'timeline':
      return <TimelineBlock section={section} />;
    case 'stage_adaptation':
      return <StageAdaptationBlock section={section} />;
    case 'relation_pattern':
      return <RelationPatternBlock section={section} />;
    case 'divider':
      return <DividerBlock />;
    case 'page_break':
      return <View break />;
    case 'cover':
      // cover는 GenogramReportPDF에서 별도 Page로 처리
      return null;
    default:
      return null;
  }
};
