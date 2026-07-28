import React from 'react';

export function McqRenderer({ question, answer, onAnswerChange, onClearAnswer }: any) {
  const optionsArray = Array.isArray(question.optionsJson) 
    ? question.optionsJson 
    : (question.optionsJson?.options || []);

  return (
    <div className="space-y-2.5">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold text-slate-600">Select one option:</span>
        {answer && (
          <button
            onClick={() => onClearAnswer(question.id)}
            className="text-xs font-bold text-slate-500 hover:text-rose-600 transition underline underline-offset-2"
          >
            Clear Selection
          </button>
        )}
      </div>
      {optionsArray.map((option: any, idx: number) => {
        const optionVal = typeof option === 'object' && option !== null && 'text' in option ? option.text : String(option);
        const isSelected = answer === optionVal;
        return (
          <label 
            key={idx} 
            className={`flex items-center p-4 border rounded-xl hover:bg-slate-50 transition cursor-pointer ${
              isSelected ? 'border-blue-600 bg-blue-50/20' : 'border-slate-200'
            }`}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={optionVal}
              checked={isSelected}
              onChange={(e) => onAnswerChange(question.id, e.target.value)}
              className="mr-3 text-blue-600 focus:ring-blue-500 rounded-full"
            />
            <span className="text-sm font-semibold text-slate-700">{optionVal}</span>
          </label>
        );
      })}
    </div>
  );
}
