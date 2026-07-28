import React from 'react';
import Editor from '@monaco-editor/react';

export function CodingRenderer({ question, answer, onAnswerChange, onClearAnswer }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Solution Editor</span>
        {answer && (
          <button
            onClick={() => onClearAnswer(question.id)}
            className="text-xs font-bold text-slate-500 hover:text-rose-600 transition underline underline-offset-2"
          >
            Clear Code
          </button>
        )}
      </div>

      <div className="h-80 border border-slate-200 rounded-xl overflow-hidden shadow-inner">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={answer || ''}
          onChange={(value) => onAnswerChange(question.id, value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            contextmenu: false,
            dragAndDrop: false,
          }}
          onMount={(editor) => {
            const domNode = editor.getDomNode();
            if (domNode) {
              const handleProhibited = (e: Event) => {
                e.preventDefault();
                alert('Copy and paste are disabled during the coding test.');
              };
              domNode.addEventListener('copy', handleProhibited);
              domNode.addEventListener('paste', handleProhibited);
              domNode.addEventListener('cut', handleProhibited);
              domNode.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
              });
              editor.onKeyDown((e) => {
                if (e.ctrlKey || e.metaKey) {
                  const key = e.browserEvent.key.toLowerCase();
                  if (key === 'c' || key === 'v' || key === 'x' || key === 'a') {
                    e.preventDefault();
                    e.stopPropagation();
                    alert('Copy and paste are disabled during the coding test.');
                  }
                }
              });
            }
          }}
        />
      </div>
    </div>
  );
}
