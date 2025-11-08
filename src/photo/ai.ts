// Stub module for photo AI functions
// TODO: Remove when admin configuration is cleaned up

export const AI_AUTO_GENERATED_FIELDS_ALL = ['title', 'caption', 'tags'] as const;

export async function generatePhotoCaption(): Promise<string> {
  return '';
}

export function cleanUpAiTextResponse(text: string): string {
  return text.trim();
}
