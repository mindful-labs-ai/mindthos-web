import type { NoteV2Output } from '../../types';
import {
  SafetyAssessmentBlock,
  serializeSafety,
} from '../SafetyAssessmentBlock';

import { AdminPlanHeader, serializeAdminPlan } from './AdminPlanHeader';
import { PrioritiesList, serializePriorities } from './PrioritiesList';
import { QuestionsList, serializeQuestions } from './QuestionsList';
import { ReferralQuote, serializeReferral } from './ReferralQuote';
import { TechniquesList, serializeTechniques } from './TechniquesList';

interface RoadmapBlockProps {
  roadmap: NoteV2Output['phase4']['roadmap'];
  safety: NoteV2Output['phase1']['safety_assessment'];
  editable?: boolean;
}

export function RoadmapBlock({ roadmap, safety, editable }: RoadmapBlockProps) {
  return (
    <div className="space-y-6 p-3">
      <AdminPlanHeader value={roadmap.admin_plan} editable={editable} />
      <SafetyAssessmentBlock safety={safety} editable={editable} />
      <PrioritiesList priorities={roadmap.priorities} editable={editable} />
      <QuestionsList
        questions={roadmap.suggested_questions}
        editable={editable}
      />
      <TechniquesList
        techniques={roadmap.suggested_techniques}
        editable={editable}
      />
      {roadmap.referral && (
        <ReferralQuote value={roadmap.referral} editable={editable} />
      )}
    </div>
  );
}

export function serializeRoadmap(
  roadmap: NoteV2Output['phase4']['roadmap'],
  safety: NoteV2Output['phase1']['safety_assessment']
): string {
  return [
    `다음 회기 로드맵`,
    serializeAdminPlan(roadmap.admin_plan),
    serializeSafety(safety),
    serializePriorities(roadmap.priorities),
    serializeQuestions(roadmap.suggested_questions),
    serializeTechniques(roadmap.suggested_techniques),
    roadmap.referral ? serializeReferral(roadmap.referral) : '',
  ]
    .filter(Boolean)
    .join('\n');
}
