'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { medicalTerms } from './medical-terms';
import { VscDebugRestart } from 'react-icons/vsc';

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
  const [caretPosition, setCaretPosition] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Generate random words
  const generateTestWords = useCallback((count: number = 50) => {
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
    setCaretPosition(0);

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
    setCaretPosition(0);
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
    setCaretPosition(value.length);
  };

  // Handle word completion
  const handleWordComplete = useCallback(() => {
    if (currentInput.trim() === '') return;
    setTypedWords(prev => [...prev, currentInput.trim()]);
    setCurrentWordIndex(prev => prev + 1);
    setCurrentInput('');
    setCaretPosition(0);
  }, [currentInput]);

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
      handleWordComplete();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      resetTest();
    }
  };

  // Auto-focus on click
  const handleClick = () => {
    if (isTestActive) {
      inputRef.current?.focus();
    }
  };

  // Render word with character coloring
  const renderWord = (word: string, wordIndex: number) => {
    const typedWord = typedWords[wordIndex];
    const isCurrent = wordIndex === currentWordIndex;
    const isPast = wordIndex < currentWordIndex;

    if (isCurrent) {
      return (
        <span key={wordIndex} className="relative inline-block">
          {/* Caret */}
          {isTestActive && (
            <span
              className="absolute h-[1.5em] w-[2px] bg-yellow-400 animate-pulse"
              style={{
                left: `${caretPosition * 0.6}em`,
                top: '0.05em'
              }}
            />
          )}
          {word.split('').map((char, charIndex) => {
            const typedChar = currentInput[charIndex];
            let className = 'text-gray-500 dark:text-gray-600';

            if (typedChar !== undefined) {
              className = typedChar === char
                ? 'text-white dark:text-gray-100'
                : 'text-red-500 dark:text-red-400';
            }

            return (
              <span key={charIndex} className={className}>
                {char}
              </span>
            );
          })}
          {currentInput.length > word.length && (
            <span className="text-red-500 dark:text-red-400 border-b-2 border-red-500">
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
          className={isCorrect ? 'text-gray-400 dark:text-gray-500' : 'text-red-500/70 dark:text-red-400/70'}
        >
          {word}
        </span>
      );
    } else {
      return (
        <span key={wordIndex} className="text-gray-500 dark:text-gray-600">
          {word}
        </span>
      );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 font-mono" onClick={handleClick}>
      {/* Settings Bar */}
      {!isTestActive && !isTestComplete && (
        <div className="mb-12 flex flex-wrap gap-6 items-center justify-center text-sm">
          {/* Mode selector */}
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setSettings({ mode: 'time', duration: 30 })}
              className={`px-3 py-1 rounded transition-colors ${
                settings.mode === 'time'
                  ? 'text-yellow-400 bg-yellow-400/10'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              time
            </button>
            <button
              onClick={() => setSettings({ mode: 'words', duration: 25 })}
              className={`px-3 py-1 rounded transition-colors ${
                settings.mode === 'words'
                  ? 'text-yellow-400 bg-yellow-400/10'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              words
            </button>
          </div>

          {/* Duration selector */}
          <div className="flex gap-2">
            {settings.mode === 'time' ? (
              <>
                {[15, 30, 60, 120].map(duration => (
                  <button
                    key={duration}
                    onClick={() => setSettings({ ...settings, duration })}
                    className={`px-3 py-1 rounded transition-colors ${
                      settings.duration === duration
                        ? 'text-yellow-400 bg-yellow-400/10'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {duration}
                  </button>
                ))}
              </>
            ) : (
              <>
                {[10, 25, 50, 100].map(count => (
                  <button
                    key={count}
                    onClick={() => setSettings({ ...settings, duration: count })}
                    className={`px-3 py-1 rounded transition-colors ${
                      settings.duration === count
                        ? 'text-yellow-400 bg-yellow-400/10'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {isTestActive && (
        <div className="mb-6 flex justify-between items-center text-yellow-400 text-sm">
          <div className="flex gap-4">
            {settings.mode === 'time' && timeRemaining !== null && (
              <span>{timeRemaining}s</span>
            )}
            {settings.mode === 'words' && (
              <span>{currentWordIndex}/{settings.duration}</span>
            )}
          </div>
          <button
            onClick={resetTest}
            className="text-gray-500 hover:text-gray-300 transition-colors"
            title="Reset (Tab)"
          >
            <VscDebugRestart size={20} />
          </button>
        </div>
      )}

      {/* Main typing area */}
      {!isTestComplete ? (
        <div className="relative">
          {!isTestActive && (
            <div className="text-center mb-8">
              <button
                onClick={startTest}
                className="px-6 py-3 bg-yellow-400/10 text-yellow-400 rounded-lg hover:bg-yellow-400/20 transition-colors font-medium"
              >
                Click here or start typing
              </button>
            </div>
          )}

          {testWords.length > 0 && (
            <>
              <div className="text-2xl leading-relaxed flex flex-wrap gap-x-3 gap-y-2 mb-6 select-none">
                {testWords.slice(0, Math.min(currentWordIndex + 15, testWords.length)).map((word, index) =>
                  renderWord(word, index)
                )}
              </div>

              {/* Hidden input */}
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={() => isTestActive && inputRef.current?.focus()}
                className="absolute opacity-0 pointer-events-none"
                autoFocus={isTestActive}
              />
            </>
          )}
        </div>
      ) : (
        /* Results */
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-yellow-400 mb-2">{stats?.wpm}</div>
              <div className="text-gray-500 text-sm uppercase tracking-wider">wpm</div>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold text-yellow-400 mb-2">{stats?.accuracy}%</div>
              <div className="text-gray-500 text-sm uppercase tracking-wider">accuracy</div>
            </div>
          </div>

          <div className="text-center text-gray-500 space-y-1 text-sm">
            <p>Correct characters: {stats?.correctChars}</p>
            <p>Incorrect characters: {stats?.incorrectChars}</p>
            <p>Words typed: {typedWords.length}</p>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={resetTest}
              className="px-6 py-2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              change settings
            </button>
            <button
              onClick={startTest}
              className="px-6 py-2 bg-yellow-400/10 text-yellow-400 rounded hover:bg-yellow-400/20 transition-colors"
            >
              try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
