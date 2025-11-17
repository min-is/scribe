'use client';

import { useState, useEffect } from 'react';

export default function TypewriterText() {
  const [messages, setMessages] = useState<string[]>([
    'The best place for your documentation needs',
    'A magician pulls a rabbit out of a hat, an ER doctor pulls a rabbit out of a body cavity',
    'Love your neighbors like Dr. Gromis loves his US machine',
  ]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  // Fetch messages from API
  useEffect(() => {
    fetch('/api/animated-messages')
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setMessages(data.map((m: any) => m.message));
        }
      })
      .catch((err) => {
        console.error('Failed to load animated messages:', err);
      });
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;

    const currentMessage = messages[currentMessageIndex];

    const handleTyping = () => {
      if (!isDeleting) {
        // Typing forward
        if (currentText.length < currentMessage.length) {
          setCurrentText(currentMessage.substring(0, currentText.length + 1));
          setTypingSpeed(100);
        } else {
          // Finished typing, wait then start deleting
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting backward
        if (currentText.length > 0) {
          setCurrentText(currentMessage.substring(0, currentText.length - 1));
          setTypingSpeed(50);
        } else {
          // Finished deleting, move to next message
          setIsDeleting(false);
          setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentMessageIndex, messages, typingSpeed]);

  return (
    <span className="inline-block">
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  );
}
