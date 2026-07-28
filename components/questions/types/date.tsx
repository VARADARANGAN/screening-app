import React from 'react';

export function DateRenderer({ question, answer, onAnswerChange, onClearAnswer }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select a Date</span>
        {answer && (
          <button
            onClick={() => onClearAnswer(question.id)}
            className="text-xs font-bold text-slate-500 hover:text-rose-600 transition underline underline-offset-2"
          >
            Clear Date
          </button>
        )}
      </div>

      <input
        type="date"
        className="border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm text-slate-700"
        value={answer || ''}
        onChange={(e) => onAnswerChange(question.id, e.target.value)}
      />
    </div>
  );
}
