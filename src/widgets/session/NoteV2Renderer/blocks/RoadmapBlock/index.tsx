import type { NoteV2Output } from '../../types';

import { AdminPlanHeader, serializeAdminPlan } from './AdminPlanHeader';
import { PrioritiesList, serializePriorities } from './PrioritiesList';
import { QuestionsList, serializeQuestions } from './QuestionsList';
import { ReferralQuote, serializeReferral } from './ReferralQuote';
import { TechniquesList, serializeTechniques } from './TechniquesList';

interface RoadmapBlockProps {
  roadmap: NoteV2Output['phase4']['roadmap'];
  editable?: boolean;
  /** "5-1" 등. 제공 시 자식 라벨 앞에 "{prefix}-{idx}. " 자동 부여. */
  numberPrefix?: string;
}

export function RoadmapBlock({
  roadmap,
  editable,
  numberPrefix,
}: RoadmapBlockProps) {
  return (
    <div className="space-y-6 p-3">
      <AdminPlanHeader
        value={roadmap.admin_plan}
        editable={editable}
        numberPrefix={numberPrefix ? `${numberPrefix}-1` : undefined}
      />
      <PrioritiesList
        priorities={roadmap.priorities}
        editable={editable}
        numberPrefix={numberPrefix ? `${numberPrefix}-2` : undefined}
      />
      <QuestionsList
        questions={roadmap.suggested_questions}
        editable={editable}
        numberPrefix={numberPrefix ? `${numberPrefix}-3` : undefined}
      />
      <TechniquesList
        techniques={roadmap.suggested_techniques}
        editable={editable}
        numberPrefix={numberPrefix ? `${numberPrefix}-4` : undefined}
      />
      {roadmap.referral && (
        <ReferralQuote value={roadmap.referral} editable={editable} />
      )}
    </div>
  );
}

export function serializeRoadmap(
  roadmap: NoteV2Output['phase4']['roadmap']
): string {
  return [
    `다음 회기 로드맵`,
    serializeAdminPlan(roadmap.admin_plan),
    serializePriorities(roadmap.priorities),
    serializeQuestions(roadmap.suggested_questions),
    serializeTechniques(roadmap.suggested_techniques),
    roadmap.referral ? serializeReferral(roadmap.referral) : '',
  ]
    .filter(Boolean)
    .join('\n');
}
