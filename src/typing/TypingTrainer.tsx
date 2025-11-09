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
  const [caretPixelWidth, setCaretPixelWidth] = useState(14.38);

  const inputRef = useRef<HTMLInputElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);

  // Update caret width based on screen size
  useEffect(() => {
    const updateCaretWidth = () => {
      if (window.innerWidth >= 1024) {
        setCaretPixelWidth(16.3);
      } else {
        setCaretPixelWidth(14.38);
      }
    };

    updateCaretWidth();
    window.addEventListener('resize', updateCaretWidth);
    return () => window.removeEventListener('resize', updateCaretWidth);
  }, []);

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
      // Calculate caret position using pixel-based measurement
      const caretLeft = currentInput.length * caretPixelWidth;
      const maxCaretLeft = (word.length + 5) * caretPixelWidth;
      const finalCaretLeft = Math.min(caretLeft, maxCaretLeft);

      return (
        <span key={wordIndex} className="relative inline-block">
          {/* Caret */}
          {isTestActive && inputFocused && (
            <span
              className="absolute w-[0.12rem] h-6 lg:h-7 rounded-sm bg-typing-secondary animate-pulse transition-all duration-75"
              style={{
                left: `${finalCaretLeft}px`,
                top: '2.5px'
              }}
            />
          )}
          {word.split('').map((char, charIndex) => {
            const typedChar = currentInput[charIndex];
            let className = '';

            if (typedChar !== undefined) {
              // Check if character matches
              if (typedChar === char) {
                className = 'text-typing-secondary';
              } else {
                className = 'text-typing-tertiary';
              }
            }

            return (
              <span key={charIndex} className={className}>
                {char}
              </span>
            );
          })}
          {/* Extra characters typed beyond word length */}
          {currentInput.length > word.length && (
            <span className="text-typing-tertiary border-b-[3px] border-typing-tertiary">
              {currentInput.slice(word.length, word.length + 5)}
            </span>
          )}
        </span>
      );
    } else if (isPast && typedWord) {
      const isCorrect = typedWord === word;
      return (
        <span
          key={wordIndex}
          className={isCorrect ? 'text-typing-primary' : 'text-typing-tertiary'}
        >
          {word}
        </span>
      );
    } else {
      return (
        <span key={wordIndex} className="text-typing-primary">
          {word}
        </span>
      );
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 font-typing">
      {/* Settings Bar - MonkeyType Style */}
      {!isTestActive && !isTestComplete && (
        <div className="mb-12 flex justify-center">
          <div className="inline-flex items-center rounded-lg bg-slate-800 text-gray-400 px-4 py-2 text-sm space-x-1">
            {/* Mode selector */}
            <button
              onClick={() => setSettings({ mode: 'time', duration: 30 })}
              className={`flex items-center px-2 py-1 rounded transition-colors ${
                settings.mode === 'time'
                  ? 'text-typing-accent'
                  : 'hover:text-typing-secondary'
              }`}
            >
              <FaClock className="mr-1" />
              time
            </button>
            <button
              onClick={() => setSettings({ mode: 'words', duration: 25 })}
              className={`flex items-center px-2 py-1 rounded transition-colors ${
                settings.mode === 'words'
                  ? 'text-typing-accent'
                  : 'hover:text-typing-secondary'
              }`}
            >
              <FaSortAlphaDown className="mr-1" />
              words
            </button>

            {/* Vertical divider */}
            <div className="w-[2px] h-5 bg-slate-900 rounded-lg mx-2" />

            {/* Duration selector */}
            {settings.mode === 'time' ? (
              <>
                {[15, 30, 60, 120].map(duration => (
                  <button
                    key={duration}
                    onClick={() => setSettings({ ...settings, duration })}
                    className={`px-2 py-1 rounded transition-colors ${
                      settings.duration === duration
                        ? 'text-typing-accent'
                        : 'hover:text-typing-secondary'
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
                        ? 'text-typing-accent'
                        : 'hover:text-typing-secondary'
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
        <div className="mb-6 flex justify-center">
          <div className="text-typing-tertiary text-2xl lg:text-[1.7rem]">
            {settings.mode === 'time' && timeRemaining !== null && (
              <span>{timeRemaining}</span>
            )}
            {settings.mode === 'words' && (
              <span>{currentWordIndex}/{settings.duration}</span>
            )}
          </div>
        </div>
      )}

      {/* Main typing area */}
      {!isTestComplete ? (
        <div className="relative flex items-center flex-col">
          <div
            className="relative flex justify-center"
            onClick={handleFocusClick}
          >
            {!inputFocused && (
              <div className="text-lg lg:text-xl px-3 text-typing-secondary z-10 absolute w-full h-full backdrop-blur-sm flex justify-center items-center cursor-pointer">
                <GiArrowCursor className="mr-3" />
                {!isTestActive ? 'Click here or start typing' : 'Click here to focus'}
              </div>
            )}

            {testWords.length > 0 && (
              <div className="flex text-typing-primary text-2xl lg:text-[1.7rem] h-[7.5rem] overflow-hidden">
                <p className="leading-10 w-64 xs:w-80 sm:w-[31.25rem] md:w-[37.5rem] lg:w-[50rem] xl:w-[62.5rem]">
                  {testWords.slice(0, Math.min(currentWordIndex + 50, testWords.length)).map((word, index) => (
                    <span key={index}>
                      {renderWord(word, index)}
                      {index < testWords.length - 1 && ' '}
                    </span>
                  ))}
                </p>
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
            className="mt-3 py-2 sr-only"
            spellCheck={false}
          />

          {/* Restart button */}
          {isTestActive && (
            <button
              className="px-8 py-4 rounded-md text-2xl lg:text-[1.7rem] flex justify-center mt-10
              hover:text-typing-secondary transition ease-in-out delay-75
              focus:bg-typing-secondary focus:text-black outline-none"
              onClick={resetTest}
              title="Restart Test (Tab)"
            >
              <VscDebugRestart />
            </button>
          )}
        </div>
      ) : (
        /* Results */
        <div className="space-y-8 text-center">
          <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto">
            <div>
              <div className="text-6xl font-bold text-typing-accent mb-2">{stats?.wpm}</div>
              <div className="text-typing-primary text-sm uppercase tracking-wider">wpm</div>
            </div>
            <div>
              <div className="text-6xl font-bold text-typing-accent mb-2">{stats?.accuracy}%</div>
              <div className="text-typing-primary text-sm uppercase tracking-wider">acc</div>
            </div>
          </div>

          <div className="text-typing-primary space-y-1 text-sm">
            <p>characters: {stats?.correctChars}/{stats?.totalChars}</p>
            <p>words: {typedWords.length}</p>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={resetTest}
              className="px-6 py-2 text-gray-400 hover:text-typing-secondary transition-colors"
            >
              change settings
            </button>
            <button
              onClick={startTest}
              className="px-6 py-2 bg-slate-800 text-typing-accent rounded hover:bg-slate-700 transition-colors"
            >
              try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
