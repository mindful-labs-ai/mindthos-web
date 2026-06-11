import { SectionTitle } from './SectionTitle';

interface QuestionListProps {
  title: string;
  questions: string[];
}

/** section6: 번호 목록 형태의 촉진적 질문. */
export function QuestionList({ title, questions }: QuestionListProps) {
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <ol className="list-decimal space-y-2 pl-5 marker:text-fg-muted">
        {questions.map((question, i) => (
          <li
            key={i}
            className="whitespace-pre-line break-keep text-m leading-relaxed text-fg"
          >
            {question}
          </li>
        ))}
      </ol>
    </section>
  );
}
