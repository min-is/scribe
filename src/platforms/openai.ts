// Minimal OpenAI platform module - photography features removed
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { AI_TEXT_GENERATION_ENABLED } from '@/app/config';

const MODEL = 'gpt-4o';

const openai = AI_TEXT_GENERATION_ENABLED
  ? createOpenAI({ apiKey: process.env.OPENAI_SECRET_KEY })
  : undefined;

export const testOpenAiConnection = async () => {
  if (openai) {
    return generateText({
      model: openai(MODEL),
      messages: [{
        'role': 'user',
        'content': [
          {
            'type': 'text',
            'text': 'Test connection',
          },
        ],
      }],
    });
  }
};
