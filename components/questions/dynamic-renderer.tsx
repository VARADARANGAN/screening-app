import React from 'react';
import { McqRenderer } from './types/mcq';
import { CodingRenderer } from './types/coding';
import { SingleSelectRenderer } from './types/single-select';
import { MultiSelectRenderer } from './types/multi-select';
import { RankingRenderer } from './types/ranking';
import { OpenTextRenderer } from './types/open-text';
import { StructuredResponseRenderer } from './types/structured-response';
import { DateRenderer } from './types/date';

interface DynamicRendererProps {
  question: any;
  answer: string;
  onAnswerChange: (questionId: string, answer: string) => void;
  onClearAnswer: (questionId: string) => void;
}

export function DynamicQuestionRenderer({ question, answer, onAnswerChange, onClearAnswer }: DynamicRendererProps) {
  const type = question.type;

  switch (type) {
    case 'mcq':
      return <McqRenderer question={question} answer={answer} onAnswerChange={onAnswerChange} onClearAnswer={onClearAnswer} />;
    case 'coding':
      return <CodingRenderer question={question} answer={answer} onAnswerChange={onAnswerChange} onClearAnswer={onClearAnswer} />;
    case 'single_select':
      return <SingleSelectRenderer question={question} answer={answer} onAnswerChange={onAnswerChange} onClearAnswer={onClearAnswer} />;
    case 'multi_select':
      return <MultiSelectRenderer question={question} answer={answer} onAnswerChange={onAnswerChange} onClearAnswer={onClearAnswer} />;
    case 'ranking':
      return <RankingRenderer question={question} answer={answer} onAnswerChange={onAnswerChange} onClearAnswer={onClearAnswer} />;
    case 'open_text':
      return <OpenTextRenderer question={question} answer={answer} onAnswerChange={onAnswerChange} onClearAnswer={onClearAnswer} />;
    case 'structured_response':
      return <StructuredResponseRenderer question={question} answer={answer} onAnswerChange={onAnswerChange} onClearAnswer={onClearAnswer} />;
    case 'date':
      return <DateRenderer question={question} answer={answer} onAnswerChange={onAnswerChange} onClearAnswer={onClearAnswer} />;
    default:
      return <div>Unsupported question type: {type}</div>;
  }
}
