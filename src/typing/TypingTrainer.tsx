'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { medicalTerms } from './medical-terms';
import { VscDebugRestart } from 'react-icons/vsc';
import { FaClock, FaSortAlphaDown } from 'react-icons/fa';
import { GiArrowCursor } from 'react-icons/gi';

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
  const [inputFocused, setInputFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);

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
    setInputFocused(true);

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
    }
  };

  // Handle focus
  const handleFocusClick = () => {
    if (!isTestActive) {
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

    if (isCurrent) {
      // Calculate caret position (approx 0.6em per character in monospace)
      const caretLeft = currentInput.length * 0.6;

      return (
        <span key={wordIndex} className="relative inline-block">
          {/* Caret */}
          {isTestActive && inputFocused && (
            <span
              className="absolute w-[2px] h-[1.5em] rounded-sm bg-gray-200 dark:bg-gray-100 animate-pulse"
              style={{
                left: `${caretLeft}em`,
                top: '0.125rem'
              }}
            />
          )}
          {word.split('').map((char, charIndex) => {
            const typedChar = currentInput[charIndex];
            let className = 'text-gray-500';

            if (typedChar !== undefined) {
              className = typedChar === char
                ? 'text-gray-200'
                : 'text-red-500';
            }

            return (
              <span key={charIndex} className={className}>
                {char}
              </span>
            );
          })}
          {currentInput.length > word.length && (
            <span className="text-red-500 border-b-2 border-red-500">
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
          className={isCorrect ? 'text-gray-500' : 'text-red-500/70'}
        >
          {word}
        </span>
      );
    } else {
      return (
        <span key={wordIndex} className="text-gray-500">
          {word}
        </span>
      );
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 font-mono">
      {/* Settings Bar - MonkeyType Style */}
      {!isTestActive && !isTestComplete && (
        <div className="mb-12 flex justify-center">
          <div className="inline-flex items-center rounded-lg bg-gray-800 text-gray-400 px-4 py-2 text-sm space-x-1">
            {/* Mode selector */}
            <button
              onClick={() => setSettings({ mode: 'time', duration: 30 })}
              className={`flex items-center px-2 py-1 rounded transition-colors ${
                settings.mode === 'time'
                  ? 'text-yellow-400'
                  : 'hover:text-gray-200'
              }`}
            >
              <FaClock className="mr-1" />
              time
            </button>
            <button
              onClick={() => setSettings({ mode: 'words', duration: 25 })}
              className={`flex items-center px-2 py-1 rounded transition-colors ${
                settings.mode === 'words'
                  ? 'text-yellow-400'
                  : 'hover:text-gray-200'
              }`}
            >
              <FaSortAlphaDown className="mr-1" />
              words
            </button>

            {/* Vertical divider */}
            <div className="w-[2px] h-5 bg-gray-900 rounded-lg mx-2" />

            {/* Duration selector */}
            {settings.mode === 'time' ? (
              <>
                {[15, 30, 60, 120].map(duration => (
                  <button
                    key={duration}
                    onClick={() => setSettings({ ...settings, duration })}
                    className={`px-2 py-1 rounded transition-colors ${
                      settings.duration === duration
                        ? 'text-yellow-400'
                        : 'hover:text-gray-200'
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
                    className={`px-2 py-1 rounded transition-colors ${
                      settings.duration === count
                        ? 'text-yellow-400'
                        : 'hover:text-gray-200'
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
            className="text-gray-400 hover:text-gray-200 transition-colors"
            title="Reset (Tab)"
          >
            <VscDebugRestart size={20} />
          </button>
        </div>
      )}

      {/* Main typing area */}
      {!isTestComplete ? (
        <div className="relative">
          <div
            className="relative text-gray-500 flex justify-center"
            onClick={handleFocusClick}
            ref={wordsRef}
          >
            {!inputFocused && !isTestActive && (
              <div className="text-lg px-3 text-gray-200 z-10 absolute w-full h-full backdrop-blur-sm flex justify-center items-center cursor-pointer">
                <GiArrowCursor className="mr-3" />
                Click here or start typing
              </div>
            )}
            {!inputFocused && isTestActive && (
              <div className="text-lg px-3 text-gray-200 z-10 absolute w-full h-full backdrop-blur-sm flex justify-center items-center cursor-pointer">
                <GiArrowCursor className="mr-3" />
                Click here to focus
              </div>
            )}

            {testWords.length > 0 && (
              <div className="text-2xl leading-relaxed flex flex-wrap gap-x-3 gap-y-2 select-none max-w-4xl">
                {testWords.slice(0, Math.min(currentWordIndex + 15, testWords.length)).map((word, index) =>
                  renderWord(word, index)
                )}
              </div>
            )}
          </div>

          {/* Hidden input */}
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            className="absolute opacity-0 pointer-events-none"
          />
        </div>
      ) : (
        /* Results */
        <div className="space-y-8 text-center">
          <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto">
            <div>
              <div className="text-6xl font-bold text-yellow-400 mb-2">{stats?.wpm}</div>
              <div className="text-gray-500 text-sm uppercase tracking-wider">wpm</div>
            </div>
            <div>
              <div className="text-6xl font-bold text-yellow-400 mb-2">{stats?.accuracy}%</div>
              <div className="text-gray-500 text-sm uppercase tracking-wider">acc</div>
            </div>
          </div>

          <div className="text-gray-500 space-y-1 text-sm">
            <p>characters: {stats?.correctChars}/{stats?.totalChars}</p>
            <p>words: {typedWords.length}</p>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={resetTest}
              className="px-6 py-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              change settings
            </button>
            <button
              onClick={startTest}
              className="px-6 py-2 bg-gray-800 text-yellow-400 rounded hover:bg-gray-700 transition-colors"
            >
              try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
