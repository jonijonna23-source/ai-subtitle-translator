import { SRTBlock } from '../types';

export interface ParseResult {
  blocks: SRTBlock[];
  format: 'srt' | 'vtt' | 'ass' | 'txt';
  rawLines: string[];
}

export const detectFormat = (content: string, filename: string): 'srt' | 'vtt' | 'ass' | 'txt' => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'txt') {
    return 'txt';
  }
  if (ext === 'vtt' || content.trim().startsWith('WEBVTT')) {
    return 'vtt';
  }
  if (ext === 'ass' || ext === 'ssa' || content.includes('[Script Info]') || content.includes('Dialogue:')) {
    return 'ass';
  }
  return 'srt';
};

export const parseSubtitle = (content: string, filename: string): ParseResult => {
  const normalized = content.replace(/\r\n/g, '\n');
  const format = detectFormat(normalized, filename);
  const rawLines = normalized.split('\n');
  const blocks: SRTBlock[] = [];

  if (format === 'vtt') {
    // Parse WebVTT
    const rawBlocks = normalized.trim().split(/\n\s*\n/);
    let index = 0;
    for (const rawBlock of rawBlocks) {
      if (rawBlock.trim() === 'WEBVTT' || rawBlock.trim().startsWith('WEBVTT\n')) continue;
      const lines = rawBlock.split('\n');
      const timeIndex = lines.findIndex(line => line.includes('-->'));
      if (timeIndex !== -1) {
        let id = (timeIndex > 0) ? lines[timeIndex - 1].trim() : String(index + 1);
        const timeRange = lines[timeIndex].trim();
        const text = lines.slice(timeIndex + 1).join('\n').trim();
        if (text) {
          blocks.push({
            id,
            timeRange,
            text,
            originalText: text,
            status: 'pending'
          });
          index++;
        }
      }
    }
  } else if (format === 'ass') {
    // Parse Advanced SubStation Alpha (ASS)
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (line.startsWith('Dialogue:')) {
        const prefix = 'Dialogue: ';
        const fieldsString = line.substring(prefix.length);
        let commaIndices: number[] = [];
        for (let j = 0; j < fieldsString.length; j++) {
          if (fieldsString[j] === ',') {
            commaIndices.push(j);
            if (commaIndices.length === 9) break;
          }
        }
        if (commaIndices.length === 9) {
          const ninthCommaIdx = commaIndices[8];
          const text = fieldsString.substring(ninthCommaIdx + 1);
          const metaPrefix = fieldsString.substring(0, ninthCommaIdx + 1);
          const fields = metaPrefix.split(',');
          const startTime = fields[1] || '';
          const endTime = fields[2] || '';

          blocks.push({
            id: String(blocks.length + 1),
            timeRange: `${startTime} --> ${endTime}`,
            text: text,
            originalText: text,
            status: 'pending',
            metaPrefix: prefix + metaPrefix,
            originalIndex: i
          });
        }
      }
    }
  } else if (format === 'txt') {
    // Parse Plaintext File line-by-line
    let index = 0;
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (line) {
        blocks.push({
          id: String(index + 1),
          timeRange: `Line ${i + 1}`,
          text: line,
          originalText: line,
          status: 'pending',
          originalIndex: i
        });
        index++;
      }
    }
  } else {
    // Parse Standard SRT
    const rawBlocks = normalized.trim().split(/\n\s*\n/);
    for (const rawBlock of rawBlocks) {
      const lines = rawBlock.split('\n');
      if (lines.length >= 3) {
        const id = lines[0].trim();
        const timeRange = lines[1].trim();
        const text = lines.slice(2).join('\n').trim();
        if (id && timeRange && text) {
          blocks.push({
            id,
            timeRange,
            text,
            originalText: text,
            status: 'pending'
          });
        }
      }
    }
  }

  return { blocks, format, rawLines };
};

export const stringifySubtitle = (
  blocks: SRTBlock[],
  format: 'srt' | 'vtt' | 'ass' | 'txt',
  originalRawLines?: string[]
): string => {
  if (format === 'txt' && originalRawLines) {
    // Reconstruct plain text exactly, replacing ONLY the non-empty lines with their translations
    const linesCopy = [...originalRawLines];
    for (const block of blocks) {
      if (block.originalIndex !== undefined) {
        linesCopy[block.originalIndex] = block.text;
      }
    }
    return linesCopy.join('\n');
  } else if (format === 'txt') {
    return blocks.map(b => b.text).join('\n');
  } else if (format === 'ass' && originalRawLines) {
    // Full ASS reconstruction: replace Dialogue lines in the exact original position
    const linesCopy = [...originalRawLines];
    for (const block of blocks) {
      if (block.originalIndex !== undefined && block.metaPrefix !== undefined) {
        linesCopy[block.originalIndex] = `${block.metaPrefix}${block.text}`;
      }
    }
    return linesCopy.join('\n');
  } else if (format === 'vtt') {
    let output = 'WEBVTT\n\n';
    output += blocks
      .map(b => `${b.id}\n${b.timeRange}\n${b.text}`)
      .join('\n\n');
    return output;
  } else {
    // Standard SRT
    return blocks
      .map(b => `${b.id}\n${b.timeRange}\n${b.text}\n`)
      .join('\n');
  }
};

// Backward compatibility exports for App.tsx if needed
export const parseSRT = (content: string): SRTBlock[] => {
  return parseSubtitle(content, 'subtitle.srt').blocks;
};

export const stringifySRT = (blocks: SRTBlock[]): string => {
  return stringifySubtitle(blocks, 'srt');
};
