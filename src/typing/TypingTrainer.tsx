'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { medicalTerms } from './medical-terms';

interface TypingStats {
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
}

interface TestSettings {
  mode: 'time' | 'words';
  duration: number; // seconds for time mode, word count for words mode
}

export function TypingTrainer() {
  const [testWords, setTestWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [typedWords, setTypedWords] = useState<{ word: string; correct: boolean }[]>([]);
  const [isTestActive, setIsTestActive] = useState(false);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [stats, setStats] = useState<TypingStats | null>(null);
  const [settings, setSettings] = useState<TestSettings>({ mode: 'time', duration: 30 });

  const inputRef = useRef<HTMLInputElement>(null);

  // Generate random words for the test
  const generateTestWords = useCallback((count: number = 50) => {
    const shuffled = [...medicalTerms].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(t => t.word);
  }, []);

  // Initialize test
  const startTest = useCallback(() => {
    const wordCount = settings.mode === 'words' ? settings.duration : 100;
    setTestWords(generateTestWords(wordCount));
    setCurrentWordIndex(0);
    setCurrentInput('');
    setTypedWords([]);
    setIsTestActive(true);
    setIsTestComplete(false);
    setStartTime(Date.now());
    setStats(null);

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
  }, []);

  // Timer countdown for time-based mode
  useEffect(() => {
    if (settings.mode === 'time' && isTestActive && timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            return 0;
          }
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
      if (typed.word === expected) {
        correctChars += typed.word.length + 1; // +1 for space
      } else {
        const minLength = Math.min(typed.word.length, expected.length);
        for (let i = 0; i < minLength; i++) {
          if (typed.word[i] === expected[i]) {
            correctChars++;
          } else {
            incorrectChars++;
          }
        }
        incorrectChars += Math.abs(typed.word.length - expected.length);
        incorrectChars++; // for space
      }
    });

    const totalChars = correctChars + incorrectChars;
    const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 0;
    const wpm = Math.round((correctChars / 5) / timeElapsedMinutes);

    setStats({
      wpm,
      accuracy: Math.round(accuracy),
      correctChars,
      incorrectChars,
      totalChars,
    });
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

    // Don't allow spaces at the beginning
    if (value.startsWith(' ')) return;

    setCurrentInput(value);
  };

  // Handle word completion (space or enter)
  const handleWordComplete = useCallback(() => {
    if (currentInput.trim() === '') return;

    const expectedWord = testWords[currentWordIndex];
    const isCorrect = currentInput.trim() === expectedWord;

    setTypedWords(prev => [...prev, { word: currentInput.trim(), correct: isCorrect }]);
    setCurrentWordIndex(prev => prev + 1);
    setCurrentInput('');
  }, [currentInput, testWords, currentWordIndex]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleWordComplete();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Medical Typing Trainer</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Practice typing medical terminology to improve your scribe documentation speed
        </p>
      </div>

      {/* Test Settings */}
      {!isTestActive && !isTestComplete && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold">Test Settings</h3>

          <div className="flex gap-4 items-center">
            <label className="font-medium">Mode:</label>
            <button
              onClick={() => setSettings({ mode: 'time', duration: 30 })}
              className={`px-4 py-2 rounded ${settings.mode === 'time' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              Time
            </button>
            <button
              onClick={() => setSettings({ mode: 'words', duration: 25 })}
              className={`px-4 py-2 rounded ${settings.mode === 'words' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              Words
            </button>
          </div>

          {settings.mode === 'time' && (
            <div className="flex gap-2">
              <label className="font-medium">Duration:</label>
              {[15, 30, 60, 120].map(duration => (
                <button
                  key={duration}
                  onClick={() => setSettings({ ...settings, duration })}
                  className={`px-3 py-1 rounded ${settings.duration === duration ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  {duration}s
                </button>
              ))}
            </div>
          )}

          {settings.mode === 'words' && (
            <div className="flex gap-2">
              <label className="font-medium">Word Count:</label>
              {[10, 25, 50, 100].map(count => (
                <button
                  key={count}
                  onClick={() => setSettings({ ...settings, duration: count })}
                  className={`px-3 py-1 rounded ${settings.duration === count ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  {count}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={startTest}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg"
          >
            Start Test
          </button>
        </div>
      )}

      {/* Active Test */}
      {isTestActive && (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium">
                {settings.mode === 'time'
                  ? `Time: ${timeRemaining}s`
                  : `Words: ${currentWordIndex}/${settings.duration}`}
              </span>
              <button
                onClick={resetTest}
                className="text-red-500 hover:text-red-700 font-medium"
              >
                Reset
              </button>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{
                  width: settings.mode === 'time'
                    ? `${((settings.duration - (timeRemaining || 0)) / settings.duration) * 100}%`
                    : `${(currentWordIndex / settings.duration) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Word Display */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
            <div className="flex flex-wrap gap-3 mb-6 min-h-[100px]">
              {testWords.slice(0, currentWordIndex + 10).map((word, index) => (
                <span
                  key={index}
                  className={`text-xl ${
                    index < currentWordIndex
                      ? typedWords[index]?.correct
                        ? 'text-green-500'
                        : 'text-red-500 line-through'
                      : index === currentWordIndex
                      ? 'text-blue-500 font-bold underline'
                      : 'text-gray-400'
                  }`}
                >
                  {word}
                </span>
              ))}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              className="w-full px-4 py-3 text-xl border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none bg-white dark:bg-gray-900"
              placeholder="Type the highlighted word..."
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Results */}
      {isTestComplete && stats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 space-y-6">
          <h3 className="text-2xl font-bold text-center">Test Complete!</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-5xl font-bold text-blue-500">{stats.wpm}</div>
              <div className="text-gray-600 dark:text-gray-400 mt-2">WPM</div>
            </div>
            <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-5xl font-bold text-green-500">{stats.accuracy}%</div>
              <div className="text-gray-600 dark:text-gray-400 mt-2">Accuracy</div>
            </div>
          </div>

          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>Correct Characters: {stats.correctChars}</p>
            <p>Incorrect Characters: {stats.incorrectChars}</p>
            <p>Total Words Typed: {typedWords.length}</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={resetTest}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-lg"
            >
              Change Settings
            </button>
            <button
              onClick={startTest}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
