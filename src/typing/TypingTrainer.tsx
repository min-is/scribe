'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { medicalTerms } from './medical-terms';
import themesData from './themes.json';
import { VscDebugRestart, VscSettingsGear } from 'react-icons/vsc';

interface TypingStats {
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
}

interface TestSettings {
  mode: 'time' | 'words';
  duration: number;
}

interface Theme {
  name: string;
  background: string;
  text: string;
  subtext: string;
  primary: string;
  secondary: string;
  error: string;
  caret: string;
  correct: string;
  incorrect: string;
}

export function TypingTrainer() {
  const [testWords, setTestWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [typedWords, setTypedWords] = useState<string[]>([]);
  const [isTestActive, setIsTestActive] = useState(false);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [stats, setStats] = useState<TypingStats | null>(null);
  const [settings, setSettings] = useState<TestSettings>({
    mode: 'time',
    duration: 30
  });
  const [inputFocused, setInputFocused] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(themesData.themes[4]); // Dark theme default
  const [showSettings, setShowSettings] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Apply theme to CSS variables
  useEffect(() => {
    if (containerRef.current) {
      const root = containerRef.current;
      root.style.setProperty('--typing-bg', currentTheme.background);
      root.style.setProperty('--typing-text', currentTheme.text);
      root.style.setProperty('--typing-subtext', currentTheme.subtext);
      root.style.setProperty('--typing-primary', currentTheme.primary);
      root.style.setProperty('--typing-secondary', currentTheme.secondary);
      root.style.setProperty('--typing-error', currentTheme.error);
      root.style.setProperty('--typing-caret', currentTheme.caret);
      root.style.setProperty('--typing-correct', currentTheme.correct);
      root.style.setProperty('--typing-incorrect', currentTheme.incorrect);
    }
  }, [currentTheme]);

  // Generate random words
  const generateTestWords = useCallback((count: number = 200) => {
    const shuffled = [...medicalTerms].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(t => t.word);
  }, []);

  // Start test
  const startTest = useCallback(() => {
    const wordCount = settings.mode === 'words' ? settings.duration : 200;
    setTestWords(generateTestWords(wordCount));
    setCurrentWordIndex(0);
    setCurrentInput('');
    setTypedWords([]);
    setIsTestActive(true);
    setIsTestComplete(false);
    setStartTime(Date.now());
    setStats(null);
    setInputFocused(true);
    setShowSettings(false);

    if (settings.mode === 'time') {
      setTimeRemaining(settings.duration);
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  }, [settings, generateTestWords]);

  // Reset test
  const resetTest = useCallback(() => {
    setIsTestActive(false);
    setIsTestComplete(false);
    setStartTime(null);
    setTimeRemaining(null);
    setCurrentWordIndex(0);
    setCurrentInput('');
    setTypedWords([]);
    setStats(null);
    setInputFocused(false);
    setShowSettings(false);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (settings.mode === 'time' && isTestActive && timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [settings.mode, isTestActive, timeRemaining]);

  // Calculate statistics
  const calculateStats = useCallback(() => {
    if (!startTime) return;

    const endTime = Date.now();
    const timeElapsedMinutes = (endTime - startTime) / 60000;

    let correctChars = 0;
    let incorrectChars = 0;

    typedWords.forEach((typed, index) => {
      const expected = testWords[index];
      if (typed === expected) {
        correctChars += typed.length + 1;
      } else {
        const minLength = Math.min(typed.length, expected.length);
        for (let i = 0; i < minLength; i++) {
          if (typed[i] === expected[i]) {
            correctChars++;
          } else {
            incorrectChars++;
          }
        }
        incorrectChars += Math.abs(typed.length - expected.length) + 1;
      }
    });

    const totalChars = correctChars + incorrectChars;
    const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 0;
    const wpm = Math.round((correctChars / 5) / timeElapsedMinutes);

    setStats({ wpm, accuracy: Math.round(accuracy), correctChars, incorrectChars, totalChars });
  }, [startTime, typedWords, testWords]);

  // End test
  const endTest = useCallback(() => {
    setIsTestActive(false);
    setIsTestComplete(true);
    setInputFocused(false);
    calculateStats();
  }, [calculateStats]);

  // Check if test should end
  useEffect(() => {
    if (!isTestActive) return;
    if (settings.mode === 'time' && timeRemaining === 0) {
      endTest();
    } else if (settings.mode === 'words' && currentWordIndex >= settings.duration) {
      endTest();
    }
  }, [settings, timeRemaining, currentWordIndex, isTestActive, endTest]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.startsWith(' ')) return;
    setCurrentInput(value);
  };

  // Handle word completion
  const handleWordComplete = useCallback(() => {
    if (currentInput.trim() === '') return;
    setTypedWords(prev => [...prev, currentInput.trim()]);
    setCurrentWordIndex(prev => prev + 1);
    setCurrentInput('');
  }, [currentInput]);

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
      handleWordComplete();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      resetTest();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSettings(false);
      setShowThemeSelector(false);
    }
  };

  // Handle focus
  const handleFocusClick = () => {
    if (!isTestActive && !isTestComplete) {
      startTest();
    } else {
      inputRef.current?.focus();
      setInputFocused(true);
    }
  };

  // Render word with character coloring
  const renderWord = (word: string, wordIndex: number) => {
    const typedWord = typedWords[wordIndex];
    const isCurrent = wordIndex === currentWordIndex;
    const isPast = wordIndex < currentWordIndex;
    const isNext = wordIndex > currentWordIndex;

    if (isCurrent) {
      return (
        <span key={wordIndex} className="relative inline-block transition-all duration-200">
          {word.split('').map((char, charIndex) => {
            const typedChar = currentInput[charIndex];
            let className = '';

            if (typedChar !== undefined) {
              className = typedChar === char
                ? 'text-[var(--typing-correct)] transition-colors duration-100'
                : 'text-[var(--typing-incorrect)] transition-colors duration-100';
            } else {
              className = 'text-[var(--typing-text)]';
            }

            return (
              <span key={charIndex} className={className}>
                {char}
              </span>
            );
          })}
          {currentInput.length > word.length && (
            <span className="text-[var(--typing-incorrect)] border-b-2 border-[var(--typing-incorrect)]">
              {currentInput.slice(word.length)}
            </span>
          )}
        </span>
      );
    } else if (isPast && typedWord) {
      const isCorrect = typedWord === word;
      return (
        <span
          key={wordIndex}
          className={`transition-all duration-300 ${
            isCorrect ? 'text-[var(--typing-subtext)] opacity-60' : 'text-[var(--typing-error)] opacity-60'
          }`}
        >
          {word}
        </span>
      );
    } else if (isNext) {
      return (
        <span key={wordIndex} className="text-[var(--typing-text)] opacity-50">
          {word}
        </span>
      );
    } else {
      return (
        <span key={wordIndex} className="text-[var(--typing-text)]">
          {word}
        </span>
      );
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full flex flex-col items-center justify-center font-typing transition-colors duration-300"
      style={{ backgroundColor: 'var(--typing-bg)' }}
    >
      {/* Settings Icon */}
      {!isTestActive && !isTestComplete && (
        <div className="absolute top-6 right-6">
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              setShowThemeSelector(false);
            }}
            className="p-3 rounded-lg transition-all duration-200 hover:scale-110"
            style={{ color: 'var(--typing-subtext)' }}
            title="Settings"
          >
            <VscSettingsGear size={24} />
          </button>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && !isTestActive && !isTestComplete && (
        <div className="absolute top-20 right-6 rounded-xl p-6 shadow-2xl backdrop-blur-sm border transition-all duration-300 animate-fade-in-from-top"
          style={{
            backgroundColor: 'var(--typing-bg)',
            borderColor: 'var(--typing-subtext)',
            color: 'var(--typing-text)'
          }}
        >
          <div className="space-y-4">
            {/* Mode Selection */}
            <div>
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--typing-subtext)' }}>
                Mode
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSettings({ mode: 'time', duration: 30 })}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    settings.mode === 'time' ? 'scale-105' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: settings.mode === 'time' ? 'var(--typing-primary)' : 'transparent',
                    color: settings.mode === 'time' ? 'var(--typing-bg)' : 'var(--typing-text)',
                    border: `1px solid ${settings.mode === 'time' ? 'var(--typing-primary)' : 'var(--typing-subtext)'}`
                  }}
                >
                  time
                </button>
                <button
                  onClick={() => setSettings({ mode: 'words', duration: 25 })}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    settings.mode === 'words' ? 'scale-105' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: settings.mode === 'words' ? 'var(--typing-primary)' : 'transparent',
                    color: settings.mode === 'words' ? 'var(--typing-bg)' : 'var(--typing-text)',
                    border: `1px solid ${settings.mode === 'words' ? 'var(--typing-primary)' : 'var(--typing-subtext)'}`
                  }}
                >
                  words
                </button>
              </div>
            </div>

            {/* Duration Selection */}
            <div>
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--typing-subtext)' }}>
                {settings.mode === 'time' ? 'Time (seconds)' : 'Word Count'}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(settings.mode === 'time' ? [15, 30, 60, 120] : [10, 25, 50, 100]).map(duration => (
                  <button
                    key={duration}
                    onClick={() => setSettings({ ...settings, duration })}
                    className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                      settings.duration === duration ? 'scale-105' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: settings.duration === duration ? 'var(--typing-primary)' : 'transparent',
                      color: settings.duration === duration ? 'var(--typing-bg)' : 'var(--typing-text)',
                      border: `1px solid ${settings.duration === duration ? 'var(--typing-primary)' : 'var(--typing-subtext)'}`
                    }}
                  >
                    {duration}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selection */}
            <div>
              <button
                onClick={() => setShowThemeSelector(!showThemeSelector)}
                className="w-full px-4 py-2 rounded-lg transition-all duration-200 opacity-60 hover:opacity-100"
                style={{
                  border: `1px solid var(--typing-subtext)`,
                  color: 'var(--typing-text)'
                }}
              >
                Theme: {currentTheme.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Selector */}
      {showThemeSelector && (
        <div className="absolute top-20 right-6 mt-[23rem] rounded-xl p-4 shadow-2xl backdrop-blur-sm border max-h-96 overflow-y-auto transition-all duration-300 animate-fade-in-from-top"
          style={{
            backgroundColor: 'var(--typing-bg)',
            borderColor: 'var(--typing-subtext)',
            color: 'var(--typing-text)'
          }}
        >
          <div className="grid gap-2">
            {themesData.themes.map((theme) => (
              <button
                key={theme.name}
                onClick={() => {
                  setCurrentTheme(theme);
                  setShowThemeSelector(false);
                }}
                className={`px-4 py-3 rounded-lg text-left transition-all duration-200 hover:scale-105 ${
                  currentTheme.name === theme.name ? '' : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: theme.background,
                  color: theme.text,
                  outline: currentTheme.name === theme.name ? `2px solid ${theme.primary}` : 'none',
                  outlineOffset: '2px'
                }}
              >
                <div className="font-medium">{theme.name}</div>
                <div className="flex gap-1 mt-1">
                  {[theme.primary, theme.error, theme.caret].map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full max-w-4xl mx-auto px-6">
        {/* Progress Indicator */}
        {isTestActive && (
          <div className="mb-8 text-center transition-all duration-300 animate-fade-in">
            <div className="text-3xl font-light tracking-wider" style={{ color: 'var(--typing-primary)' }}>
              {settings.mode === 'time' && timeRemaining !== null && (
                <span>{timeRemaining}</span>
              )}
              {settings.mode === 'words' && (
                <span>{currentWordIndex}/{settings.duration}</span>
              )}
            </div>
          </div>
        )}

        {/* Typing Area */}
        {!isTestComplete ? (
          <div className="relative">
            <div
              className="relative min-h-[300px] flex items-center justify-center"
              onClick={handleFocusClick}
            >
              {!inputFocused && (
                <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px] transition-all duration-300 cursor-pointer z-10"
                  style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                >
                  <div className="text-2xl font-light tracking-wide" style={{ color: 'var(--typing-text)' }}>
                    {!isTestActive ? 'Click to start typing' : 'Click to focus'}
                  </div>
                </div>
              )}

              {testWords.length > 0 && (
                <div className="relative">
                  {/* Caret */}
                  {isTestActive && inputFocused && (
                    <div
                      className="absolute w-0.5 h-8 rounded-full animate-pulse transition-all duration-100"
                      style={{
                        backgroundColor: 'var(--typing-caret)',
                        left: `${currentInput.length * 0.6}em`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        boxShadow: `0 0 8px var(--typing-caret)`
                      }}
                    />
                  )}

                  <div className="text-center text-3xl leading-relaxed tracking-wide select-none">
                    {testWords.slice(currentWordIndex, currentWordIndex + 20).map((word, index) => (
                      <span key={currentWordIndex + index} className="inline-block mx-2">
                        {renderWord(word, currentWordIndex + index)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hidden Input */}
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              className="sr-only"
              spellCheck={false}
            />

            {/* Restart Button */}
            {isTestActive && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={resetTest}
                  className="p-4 rounded-full transition-all duration-200 hover:scale-110 opacity-40 hover:opacity-100"
                  style={{ color: 'var(--typing-subtext)' }}
                  title="Restart (Tab)"
                >
                  <VscDebugRestart size={24} />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Results */
          <div className="space-y-8 text-center animate-fade-in" style={{ animation: 'fadeInScale 0.5s ease-out' }}>
            <div className="grid grid-cols-2 gap-12 max-w-lg mx-auto">
              <div className="transform transition-all duration-300 hover:scale-105">
                <div className="text-7xl font-bold mb-2" style={{ color: 'var(--typing-primary)' }}>
                  {stats?.wpm}
                </div>
                <div className="text-sm uppercase tracking-widest" style={{ color: 'var(--typing-subtext)' }}>
                  wpm
                </div>
              </div>
              <div className="transform transition-all duration-300 hover:scale-105">
                <div className="text-7xl font-bold mb-2" style={{ color: 'var(--typing-primary)' }}>
                  {stats?.accuracy}%
                </div>
                <div className="text-sm uppercase tracking-widest" style={{ color: 'var(--typing-subtext)' }}>
                  accuracy
                </div>
              </div>
            </div>

            <div className="space-y-2" style={{ color: 'var(--typing-text)' }}>
              <p>characters: {stats?.correctChars}/{stats?.totalChars}</p>
              <p>words: {typedWords.length}</p>
            </div>

            <div className="flex justify-center gap-6 pt-6">
              <button
                onClick={resetTest}
                className="px-8 py-3 rounded-lg transition-all duration-200 opacity-60 hover:opacity-100 hover:scale-105"
                style={{
                  border: `1px solid var(--typing-subtext)`,
                  color: 'var(--typing-text)'
                }}
              >
                change settings
              </button>
              <button
                onClick={startTest}
                className="px-8 py-3 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
                style={{
                  backgroundColor: 'var(--typing-primary)',
                  color: 'var(--typing-bg)',
                  boxShadow: `0 4px 12px rgba(0,0,0,0.2)`
                }}
              >
                try again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
