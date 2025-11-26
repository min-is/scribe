/**
 * Data Migration Script: Populate Page model from existing data
 *
 * This script converts existing Provider, Procedure, SmartPhrase, and Scenario
 * records into the unified Page model with TipTap JSON content.
 *
 * Run with: npx tsx scripts/migrate-to-pages.ts
 */

import { PrismaClient, PageType } from '@prisma/client';
import { generateJitteredKeyBetween } from 'fractional-indexing-jittered';

const prisma = new PrismaClient();

/**
 * Convert WikiContent JSON to TipTap JSON format
 */
function wikiContentToTipTap(wikiContent: any): any {
  if (!wikiContent || !wikiContent.sections) {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'No content available.' }]
        }
      ]
    };
  }

  const content: any[] = [];

  wikiContent.sections.forEach((section: any) => {
    // Add section heading
    if (section.title) {
      content.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: section.title }]
      });
    }

    // Add section content
    if (section.content) {
      const lines = section.content.split('\n').filter((line: string) => line.trim());

      lines.forEach((line: string) => {
        // Detect bullet points
        if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
          const text = line.replace(/^[•\-]\s*/, '');
          content.push({
            type: 'bulletList',
            content: [{
              type: 'listItem',
              content: [{
                type: 'paragraph',
                content: [{ type: 'text', text }]
              }]
            }]
          });
        } else {
          // Regular paragraph
          content.push({
            type: 'paragraph',
            content: [{ type: 'text', text: line }]
          });
        }
      });
    }
  });

  return {
    type: 'doc',
    content: content.length > 0 ? content : [
      { type: 'paragraph', content: [{ type: 'text', text: 'No content available.' }] }
    ]
  };
}

/**
 * Convert plain text/markdown content to TipTap JSON
 */
function textToTipTap(text: string, title?: string): any {
  const content: any[] = [];

  if (title) {
    content.push({
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: title }]
    });
  }

  const lines = text.split('\n').filter(line => line.trim());

  lines.forEach(line => {
    const trimmed = line.trim();

    // Check for markdown headings
    if (trimmed.startsWith('### ')) {
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: trimmed.slice(4) }]
      });
    } else if (trimmed.startsWith('## ')) {
      content.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: trimmed.slice(3) }]
      });
    } else if (trimmed.startsWith('# ')) {
      content.push({
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: trimmed.slice(2) }]
      });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // Bullet point
      content.push({
        type: 'bulletList',
        content: [{
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: trimmed.slice(2) }]
          }]
        }]
      });
    } else if (/^\d+\.\s/.test(trimmed)) {
      // Numbered list
      content.push({
        type: 'orderedList',
        content: [{
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: trimmed.replace(/^\d+\.\s/, '') }]
          }]
        }]
      });
    } else {
      // Regular paragraph
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: trimmed }]
      });
    }
  });

  return {
    type: 'doc',
    content: content.length > 0 ? content : [
      { type: 'paragraph', content: [{ type: 'text', text: 'No content available.' }] }
    ]
  };
}

/**
 * Extract plain text from TipTap JSON for search indexing
 */
function extractTextFromTipTap(content: any): string {
  if (!content || !content.content) return '';

  const extractFromNode = (node: any): string => {
    if (node.type === 'text') {
      return node.text || '';
    }

    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractFromNode).join(' ');
    }

    return '';
  };

  return content.content.map(extractFromNode).join(' ').trim();
}

/**
 * Create Page from Provider
 */
async function migrateProviders() {
  const providers = await prisma.provider.findMany({
    where: { page: null }, // Only migrate providers without a page
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Migrating ${providers.length} providers...`);

  let position = generateJitteredKeyBetween(null, null);

  for (const provider of providers) {
    const content = provider.wikiContent
      ? wikiContentToTipTap(provider.wikiContent)
      : textToTipTap(
          [
            provider.noteTemplate || '',
            provider.noteSmartPhrase || '',
            JSON.stringify(provider.preferences || {}, null, 2)
          ].filter(Boolean).join('\n\n'),
          provider.name
        );

    const textContent = extractTextFromTipTap(content);

    await prisma.page.create({
      data: {
        slug: provider.slug,
        title: provider.credentials
          ? `${provider.name}, ${provider.credentials}`
          : provider.name,
        content,
        textContent,
        type: PageType.PROVIDER,
        position,
        icon: '👨‍⚕️',
        category: 'Emergency Department',
        tags: ['provider', 'physician'],
        providerId: provider.id,
        viewCount: provider.viewCount || 0,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt,
      }
    });

    position = generateJitteredKeyBetween(position, null);
    console.log(`✓ Migrated provider: ${provider.name}`);
  }
}

/**
 * Create Page from Procedure
 */
async function migrateProcedures() {
  const procedures = await prisma.procedure.findMany({
    where: { page: null },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Migrating ${procedures.length} procedures...`);

  let position = generateJitteredKeyBetween(null, null);

  for (const procedure of procedures) {
    // Steps is now stored as TipTap JSON, use it directly if it's JSON, otherwise convert
    let content;
    let textContent;

    if (typeof procedure.steps === 'object' && procedure.steps !== null) {
      // Already TipTap JSON format
      content = procedure.steps;
      textContent = extractTextFromTipTap(content);
    } else {
      // Legacy text format - convert to TipTap
      const contentText = [
        procedure.description ? `## Overview\n${procedure.description}` : '',
        procedure.steps ? `## Steps\n${procedure.steps}` : '',
        procedure.complications ? `## Complications\n${procedure.complications}` : '',
      ].filter(Boolean).join('\n\n');

      content = textToTipTap(contentText, procedure.title);
      textContent = extractTextFromTipTap(content);
    }

    await prisma.page.create({
      data: {
        slug: procedure.slug,
        title: procedure.title,
        content,
        textContent,
        type: PageType.PROCEDURE,
        position,
        icon: '📋',
        category: procedure.category,
        tags: ['procedure', ...procedure.tags],
        procedureId: procedure.id,
        viewCount: procedure.viewCount || 0,
        createdAt: procedure.createdAt,
        updatedAt: procedure.updatedAt,
      }
    });

    position = generateJitteredKeyBetween(position, null);
    console.log(`✓ Migrated procedure: ${procedure.title}`);
  }
}

/**
 * Create Page from SmartPhrase
 */
async function migrateSmartPhrases() {
  const smartPhrases = await prisma.smartPhrase.findMany({
    where: { page: null },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Migrating ${smartPhrases.length} smart phrases...`);

  let position = generateJitteredKeyBetween(null, null);

  for (const smartPhrase of smartPhrases) {
    const contentText = [
      `**Dot Phrase:** ${smartPhrase.slug}`,
      smartPhrase.description || '',
      `## Content`,
      smartPhrase.content,
    ].filter(Boolean).join('\n\n');

    const content = textToTipTap(contentText, smartPhrase.title);
    const textContent = extractTextFromTipTap(content);

    await prisma.page.create({
      data: {
        slug: smartPhrase.slug.replace(/^\./, 'sp-'), // Remove leading dot for URL
        title: smartPhrase.title,
        content,
        textContent,
        type: PageType.SMARTPHRASE,
        position,
        icon: '💬',
        category: smartPhrase.category,
        tags: ['smartphrase', ...smartPhrase.tags],
        smartPhraseId: smartPhrase.id,
        viewCount: smartPhrase.usageCount || 0,
        createdAt: smartPhrase.createdAt,
        updatedAt: smartPhrase.updatedAt,
      }
    });

    position = generateJitteredKeyBetween(position, null);
    console.log(`✓ Migrated smart phrase: ${smartPhrase.title}`);
  }
}

/**
 * Create Page from Scenario
 */
async function migrateScenarios() {
  const scenarios = await prisma.scenario.findMany({
    where: { page: null },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Migrating ${scenarios.length} scenarios...`);

  let position = generateJitteredKeyBetween(null, null);

  for (const scenario of scenarios) {
    const contentText = [
      scenario.description || '',
      `## Protocol`,
      scenario.content,
    ].filter(Boolean).join('\n\n');

    const content = textToTipTap(contentText, scenario.title);
    const textContent = extractTextFromTipTap(content);

    await prisma.page.create({
      data: {
        slug: scenario.slug,
        title: scenario.title,
        content,
        textContent,
        type: PageType.SCENARIO,
        position,
        icon: '🚨',
        category: scenario.category,
        tags: ['scenario', 'emergency', ...scenario.tags],
        scenarioId: scenario.id,
        viewCount: scenario.viewCount || 0,
        createdAt: scenario.createdAt,
        updatedAt: scenario.updatedAt,
      }
    });

    position = generateJitteredKeyBetween(position, null);
    console.log(`✓ Migrated scenario: ${scenario.title}`);
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting data migration to Page model...\n');

  try {
    await migrateProviders();
    console.log('');
    await migrateProcedures();
    console.log('');
    await migrateSmartPhrases();
    console.log('');
    await migrateScenarios();
    console.log('');

    console.log('✅ Migration completed successfully!');

    // Print summary
    const pageCount = await prisma.page.count();
    const providerPages = await prisma.page.count({ where: { type: PageType.PROVIDER } });
    const procedurePages = await prisma.page.count({ where: { type: PageType.PROCEDURE } });
    const smartPhrasePages = await prisma.page.count({ where: { type: PageType.SMARTPHRASE } });
    const scenarioPages = await prisma.page.count({ where: { type: PageType.SCENARIO } });

    console.log('\n📊 Migration Summary:');
    console.log(`   Total Pages: ${pageCount}`);
    console.log(`   Providers: ${providerPages}`);
    console.log(`   Procedures: ${procedurePages}`);
    console.log(`   Smart Phrases: ${smartPhrasePages}`);
    console.log(`   Scenarios: ${scenarioPages}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
