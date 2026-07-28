import React from 'react';

export function StructuredResponseRenderer({ question, answer, onAnswerChange, onClearAnswer }: any) {
  const fieldsArray = question.optionsJson?.fields || [];
  
  const parsedAnswer = answer ? JSON.parse(answer) : {};

  const handleFieldChange = (key: string, value: string) => {
    const newAnswer = { ...parsedAnswer, [key]: value };
    onAnswerChange(question.id, JSON.stringify(newAnswer));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Structured Response</span>
        {answer && (
          <button
            onClick={() => onClearAnswer(question.id)}
            className="text-xs font-bold text-slate-500 hover:text-rose-600 transition underline underline-offset-2"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        {fieldsArray.map((field: any, idx: number) => (
          <div key={idx} className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700">
              {field.label} {field.required && <span className="text-rose-500">*</span>}
            </label>
            {field.type === 'text' ? (
              <input
                type="text"
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm"
                value={parsedAnswer[field.key] || ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
              />
            ) : (
              <textarea
                className="w-full min-h-[100px] border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition resize-y text-sm"
                value={parsedAnswer[field.key] || ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
