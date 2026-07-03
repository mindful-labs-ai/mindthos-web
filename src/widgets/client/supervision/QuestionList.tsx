import { EditableText } from './EditableText';
import { SectionTitle } from './SectionTitle';

interface QuestionListProps {
  title: string;
  questions: string[];
  /** 편집 모드 — 질문을 필드 단위로 수정 */
  editable?: boolean;
  onQuestionsChange?: (questions: string[]) => void;
}

/** section6: 번호 목록 형태의 촉진적 질문. */
export function QuestionList({
  title,
  questions,
  editable = false,
  onQuestionsChange,
}: QuestionListProps) {
  const handleQuestionChange = (index: number, value: string) => {
    onQuestionsChange?.(questions.map((q, i) => (i === index ? value : q)));
  };

  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <ol className="list-decimal space-y-2 pl-5 marker:text-fg-muted">
        {questions.map((question, i) => (
          <li
            key={i}
            className="whitespace-pre-line break-keep text-m leading-relaxed text-fg"
          >
            {editable ? (
              <EditableText
                value={question}
                onChange={(value) => handleQuestionChange(i, value)}
                ariaLabel={`질문 ${i + 1} 편집`}
              />
            ) : (
              question
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
