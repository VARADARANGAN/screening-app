import React from 'react';

export function OpenTextRenderer({ question, answer, onAnswerChange, onClearAnswer }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Answer</span>
        {answer && (
          <button
            onClick={() => onClearAnswer(question.id)}
            className="text-xs font-bold text-slate-500 hover:text-rose-600 transition underline underline-offset-2"
          >
            Clear
          </button>
        )}
      </div>

      <textarea
        className="w-full min-h-[200px] border border-slate-200 rounded-xl p-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition resize-y text-sm"
        placeholder="Type your answer here..."
        value={answer || ''}
        onChange={(e) => onAnswerChange(question.id, e.target.value)}
      />
    </div>
  );
}
