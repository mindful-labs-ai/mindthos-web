import { CopyButton } from '../../CopyButton';
import type { NoteV2Output } from '../../types';
import { useCopyToClipboard } from '../../useCopyToClipboard';
import { EDITABLE_CLASS } from '../editable';

interface QuestionsListProps {
  questions: NoteV2Output['phase4']['roadmap']['suggested_questions'];
  editable?: boolean;
}

export function QuestionsList({ questions, editable }: QuestionsListProps) {
  const { copiedId, copy } = useCopyToClipboard();

  return (
    <div className="space-y-2">
      <span className="note-label">제안 질문</span>
      <div className="space-y-2">
        {questions.map((sq, i) => (
          <div
            key={i}
            className="group/question relative flex items-start gap-2 rounded-lg border border-grey-40 bg-grey-10 p-3 transition-colors lg:hover:border-green-80"
          >
            <div className="min-w-0 flex-1">
              <p className="note-card-title">
                Q{i + 1}. "
                <span
                  contentEditable={editable}
                  suppressContentEditableWarning={editable}
                  data-note-path={
                    editable
                      ? `phase4.roadmap.suggested_questions.${i}.question`
                      : undefined
                  }
                  className={editable ? EDITABLE_CLASS : undefined}
                >
                  {sq.question}
                </span>
                "
              </p>
              <p className="note-card-sub mt-1">
                →{' '}
                <span
                  contentEditable={editable}
                  suppressContentEditableWarning={editable}
                  data-note-path={
                    editable
                      ? `phase4.roadmap.suggested_questions.${i}.rationale`
                      : undefined
                  }
                  className={editable ? EDITABLE_CLASS : undefined}
                >
                  {sq.rationale}
                </span>
              </p>
            </div>
            {!editable && (
              <div className="absolute right-3 top-1.5 transition-opacity lg:opacity-0 lg:group-hover/question:opacity-100">
                <CopyButton
                  isCopied={copiedId === `p4-q-${i}`}
                  onClick={() => copy(sq.question, `p4-q-${i}`)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function serializeQuestions(
  questions: NoteV2Output['phase4']['roadmap']['suggested_questions']
): string {
  return [
    `- 제안 질문:`,
    ...questions.map(
      (sq, i) => `  Q${i + 1}. "${sq.question}" (${sq.rationale})`
    ),
  ].join('\n');
}
