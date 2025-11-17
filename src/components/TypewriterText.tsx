'use client';

import { useState, useEffect } from 'react';

interface TypewriterTextProps {
  messages: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
}

export default function TypewriterText({
  messages,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000,
  className = '',
}: TypewriterTextProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (messages.length === 0) return;

    const currentMessage = messages[currentMessageIndex];

    if (!isDeleting && currentText === currentMessage) {
      // Finished typing, pause then start deleting
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && currentText === '') {
      // Finished deleting, move to next message
      setIsDeleting(false);
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
      return;
    }

    // Type or delete characters
    const timeout = setTimeout(
      () => {
        if (isDeleting) {
          setCurrentText((prev) => prev.slice(0, -1));
        } else {
          setCurrentText((prev) => currentMessage.slice(0, prev.length + 1));
        }
      },
      isDeleting ? deletingSpeed : typingSpeed
    );

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentMessageIndex, messages, typingSpeed, deletingSpeed, pauseDuration]);

  // Cursor blink effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (messages.length === 0) {
    return null;
  }

  return (
    <span className={className}>
      {currentText}
      <span
        className={`inline-block w-0.5 h-5 bg-current ml-1 ${
          showCursor ? 'opacity-100' : 'opacity-0'
        } transition-opacity`}
      />
    </span>
  );
}
