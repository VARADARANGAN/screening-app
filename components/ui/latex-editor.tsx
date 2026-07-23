import React, { useRef } from 'react';
import { MarkdownRenderer } from './markdown-renderer';
import { Button } from './button';

interface LatexEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export function LatexEditor({ value, onChange, placeholder, className = '', rows = 6 }: LatexEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const insertSnippet = (snippet: string, cursorOffset: number) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    const newValue = value.substring(0, start) + snippet + value.substring(end);
    onChange(newValue);
    
    // Set cursor position after React re-renders
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + cursorOffset, start + cursorOffset);
      }
    }, 0);
  };

  const snippets = [
    { label: 'Fraction', snippet: '$\\frac{a}{b}$', offset: 7 },
    { label: 'Square Root', snippet: '$\\sqrt{x}$', offset: 7 },
    { label: 'Integral', snippet: '$\\int_{a}^{b} x dx$', offset: 14 },
    { label: 'Summation', snippet: '$\\sum_{i=1}^{n} x_i$', offset: 16 },
    { label: 'Matrix', snippet: '$$\n\\begin{bmatrix}\na & b \\\\\nc & d\n\\end{bmatrix}\n$$', offset: 19 },
    { label: 'Alpha (α)', snippet: '$\\alpha$', offset: 8 },
    { label: 'Beta (β)', snippet: '$\\beta$', offset: 7 },
    { label: 'Infinity (∞)', snippet: '$\\infty$', offset: 8 },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
        {snippets.map((s, i) => (
          <Button
            key={i}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertSnippet(s.snippet, s.offset)}
            className="text-xs py-1 px-3 h-auto border-slate-200 hover:bg-slate-100 font-semibold cursor-pointer"
          >
            {s.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Editor</label>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-mono text-sm shadow-sm transition"
          />
        </div>

        {/* Live Preview */}
        <div className="space-y-1 h-full flex flex-col">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Preview</label>
          <div className="flex-1 p-4 bg-white border border-slate-200 rounded-xl overflow-y-auto shadow-sm">
            {value.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-slate-400 italic text-sm">Preview will appear here...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
