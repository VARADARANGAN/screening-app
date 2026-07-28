import React from 'react';

export function MultiSelectRenderer({ question, answer, onAnswerChange, onClearAnswer }: any) {
  const optionsArray = Array.isArray(question.optionsJson) 
    ? question.optionsJson 
    : (question.optionsJson?.options || []);

  const selectedOptions = answer ? (Array.isArray(answer) ? answer : JSON.parse(answer)) : [];

  const handleToggle = (optionVal: string) => {
    let newSelected = [...selectedOptions];
    if (newSelected.includes(optionVal)) {
      newSelected = newSelected.filter(o => o !== optionVal);
    } else {
      newSelected.push(optionVal);
    }
    onAnswerChange(question.id, JSON.stringify(newSelected));
  };

  return (
    <div className="space-y-2.5">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold text-slate-600">Select one or more options:</span>
        {selectedOptions.length > 0 && (
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
        const isSelected = selectedOptions.includes(optionVal);
        return (
          <label 
            key={idx} 
            className={`flex items-center p-4 border rounded-xl hover:bg-slate-50 transition cursor-pointer ${
              isSelected ? 'border-blue-600 bg-blue-50/20' : 'border-slate-200'
            }`}
          >
            <input
              type="checkbox"
              value={optionVal}
              checked={isSelected}
              onChange={() => handleToggle(optionVal)}
              className="mr-3 text-blue-600 focus:ring-blue-500 rounded"
            />
            <span className="text-sm font-semibold text-slate-700">{optionVal}</span>
          </label>
        );
      })}
    </div>
  );
}
