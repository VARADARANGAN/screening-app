import React from 'react';

export function RankingRenderer({ question, answer, onAnswerChange, onClearAnswer }: any) {
  const optionsArray = Array.isArray(question.optionsJson) 
    ? question.optionsJson 
    : (question.optionsJson?.options || []);

  const rankedOptions = answer ? (Array.isArray(answer) ? answer : JSON.parse(answer)) : [];
  
  // Initialize with unranked options if empty
  const currentList = rankedOptions.length > 0 
    ? rankedOptions 
    : optionsArray.map((o: any) => typeof o === 'object' && o !== null && 'text' in o ? o.text : String(o));

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newList = [...currentList];
    if (direction === 'up' && index > 0) {
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    } else if (direction === 'down' && index < newList.length - 1) {
      [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
    }
    onAnswerChange(question.id, JSON.stringify(newList));
  };

  return (
    <div className="space-y-2.5">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold text-slate-600">Rank the options below:</span>
        {answer && (
          <button
            onClick={() => onClearAnswer(question.id)}
            className="text-xs font-bold text-slate-500 hover:text-rose-600 transition underline underline-offset-2"
          >
            Reset
          </button>
        )}
      </div>
      <div className="space-y-2">
        {currentList.map((item: string, idx: number) => (
          <div key={item} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex justify-center items-center font-bold text-xs">{idx + 1}</span>
              <span className="text-sm font-semibold text-slate-700">{item}</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="w-8 h-8 rounded-lg bg-white border border-slate-200 disabled:opacity-30">↑</button>
              <button onClick={() => moveItem(idx, 'down')} disabled={idx === currentList.length - 1} className="w-8 h-8 rounded-lg bg-white border border-slate-200 disabled:opacity-30">↓</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
