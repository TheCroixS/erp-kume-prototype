import React, { useState, useRef, useEffect } from 'react';
import { correctSpelling, suggestCorrections } from '../utils/validation';

interface SpellCheckTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  autoCorrect?: boolean;
}

export default function SpellCheckTextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
  className = '',
  autoCorrect = true
}: SpellCheckTextAreaProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    
    if (autoCorrect) {
      // Apply automatic corrections
      newValue = correctSpelling(newValue);
    }
    
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyEvent<HTMLTextAreaElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      // Check the last word for suggestions
      const words = value.split(/\s+/);
      const lastWord = words[words.length - 1];
      
      if (lastWord && lastWord.length > 3) {
        const wordSuggestions = suggestCorrections(lastWord);
        if (wordSuggestions.length > 0) {
          setSuggestions(wordSuggestions);
          setSelectedWord(lastWord);
          setShowSuggestions(true);
        }
      }
    }
  };

  const applySuggestion = (suggestion: string) => {
    const words = value.split(/\s+/);
    words[words.length - 1] = suggestion;
    onChange(words.join(' '));
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <textarea
        ref={textAreaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={`${className} spell-check-enabled`}
        spellCheck="true"
        lang="es"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Sugerencias para "{selectedWord}":
          </p>
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => applySuggestion(suggestion)}
                className="block w-full text-left px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowSuggestions(false)}
            className="mt-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}