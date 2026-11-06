import Clipboard from '@react-native-clipboard/clipboard';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Icon } from './icons';
import { useTheme } from './theme';

import { Focusable } from './Focusable';

const mono = Platform.select({ ios: 'Menlo', android: 'monospace' });

const INLINE
  = /(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\)|(?:https?:\/\/|www\.)[^\s<>()\[\]]+)/gi;

const URL_TAIL = /[),.;:!?'"]+$/;

export type Segment =
  | { kind: 'text' | 'bold' | 'italic' | 'code'; text: string }
  | { kind: 'link'; text: string; url: string };

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function parseInline(value: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const match of value.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) {
      out.push({ kind: 'text', text: value.slice(last, index) });
    }
    const token = match[0];
    if (token.startsWith('**') || token.startsWith('__')) {
      out.push({ kind: 'bold', text: token.slice(2, -2) });
    }
    else if (token.startsWith('`')) {
      out.push({ kind: 'code', text: token.slice(1, -1) });
    }
    else if (/^(?:https?:\/\/|www\.)/i.test(token)) {
      // URL suelta en el texto: quita puntuacion final y normaliza www.
      const text = token.replace(URL_TAIL, '');
      out.push({
        kind: 'link',
        text,
        url: /^www\./i.test(text) ? `https://${text}` : text,
      });
    }
    else if (token.startsWith('[')) {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (link) {
        out.push({ kind: 'link', text: link[1], url: normalizeUrl(link[2]) });
      }
      else {
        out.push({ kind: 'text', text: token });
      }
    }
    else {
      out.push({ kind: 'italic', text: token.slice(1, -1) });
    }
    last = index + token.length;
  }
  if (last < value.length) {
    out.push({ kind: 'text', text: value.slice(last) });
  }
  return out;
}

function Inline({
  value,
  color,
  size,
}: {
  value: string;
  color: string;
  size: number;
}) {
  const { c } = useTheme();
  return (
    <Text selectable style={{ color, fontSize: size, lineHeight: size * 1.45 }}>
      {parseInline(value).map((segment, index) => {
        switch (segment.kind) {
          case 'bold':
            return (
              <Text key={index} style={styles.bold}>
                {segment.text}
              </Text>
            );
          case 'italic':
            return (
              <Text key={index} style={styles.italic}>
                {segment.text}
              </Text>
            );
          case 'code':
            return (
              <Text
                key={index}
                style={[
                  styles.inlineCode,
                  { fontFamily: mono, backgroundColor: c.surface, color: c.text },
                ]}
              >
                {segment.text}
              </Text>
            );
          case 'link':
            return (
              <Text
                key={index}
                style={{ color: c.accent, textDecorationLine: 'underline' }}
                onPress={() => {
                  // ACTION_VIEW: abre el navegador o la app por defecto del sistema.
                  void Linking.openURL(normalizeUrl(segment.url)).catch((error: unknown) => {
                    Alert.alert(
                      'No se pudo abrir',
                      error instanceof Error
                        ? error.message
                        : `Sin app para abrir ${segment.url}`,
                    );
                  });
                }}
              >
                {segment.text}
              </Text>
            );
          default:
            return <Text key={index}>{segment.text}</Text>;
        }
      })}
    </Text>
  );
}

function CopyCode({ value }: { value: string }) {
  const { c } = useTheme();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
  }, []);

  const onPress = useCallback(() => {
    Clipboard.setString(value);
    setCopied(true);
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <Focusable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={copied ? 'Copiado' : 'Copiar bloque'}
      style={styles.copyCode}
    >
      <Icon name={copied ? 'check' : 'copy'} size={12} color={copied ? c.accent : c.muted} />
    </Focusable>
  );
}

type Align = 'left' | 'center' | 'right';

export type Block =
  | { kind: 'code'; text: string; lang: string }
  | { kind: 'table'; header: string[]; rows: string[][]; align: Align[] }
  | { kind: 'heading'; text: string; level: number }
  | { kind: 'list'; items: string[]; ordered: boolean }
  | { kind: 'quote'; text: string }
  | { kind: 'rule' }
  | { kind: 'paragraph'; text: string };

const BULLET = /^\s*[-*+]\s+/;
const ORDERED = /^\s*\d+[.)]\s+/;
const HEADING = /^(#{1,6})\s+/;
const RULE = /^\s*([-*_])\1{2,}\s*$/;
const QUOTE = /^>\s?/;
const FENCE = /^\s*```/;
const TABLE_LINE = /^\s*\|.*\|\s*$/;
const TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(cell => cell.trim());
}

function alignments(separator: string, columns: number): Align[] {
  return Array.from({ length: columns }, (_, index) => {
    const cell = splitRow(separator)[index] ?? '';
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) {
      return 'center';
    }
    return right ? 'right' : 'left';
  });
}

/** JSON compacto de una linea: devuelve el pretty print, o null. */
function prettyJson(line: string): string | null {
  const text = line.trim();
  const object = text.startsWith('{') && text.endsWith('}');
  const array = text.startsWith('[') && text.endsWith(']');
  if (!object && !array) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return JSON.stringify(parsed, null, 2);
  }
  catch {
    return null;
  }
}

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (FENCE.test(line)) {
      const lang = line.trim().slice(3).trim();
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !FENCE.test(lines[i])) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ kind: 'code', text: body.join('\n'), lang });
      continue;
    }

    const json = prettyJson(line);
    if (json) {
      blocks.push({ kind: 'code', text: json, lang: 'json' });
      i += 1;
      continue;
    }

    if (RULE.test(line)) {
      blocks.push({ kind: 'rule' });
      i += 1;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({
        kind: 'heading',
        text: line.slice(heading[0].length),
        level: heading[1].length,
      });
      i += 1;
      continue;
    }

    if (BULLET.test(line) || ORDERED.test(line)) {
      const ordered = ORDERED.test(line);
      const pattern = ordered ? ORDERED : BULLET;
      const items: string[] = [];
      while (i < lines.length && pattern.test(lines[i])) {
        items.push(lines[i].replace(pattern, ''));
        i += 1;
      }
      blocks.push({ kind: 'list', items, ordered });
      continue;
    }

    if (
      TABLE_LINE.test(line)
      && i + 1 < lines.length
      && TABLE_SEP.test(lines[i + 1])
      && lines[i + 1].includes('-')
    ) {
      const header = splitRow(line);
      const align = alignments(lines[i + 1], header.length);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && TABLE_LINE.test(lines[i])) {
        const cells = splitRow(lines[i]);
        rows.push(header.map((_, index) => cells[index] ?? ''));
        i += 1;
      }
      blocks.push({ kind: 'table', header, rows, align });
      continue;
    }

    if (QUOTE.test(line)) {
      const parts: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        parts.push(lines[i].replace(QUOTE, ''));
        i += 1;
      }
      blocks.push({ kind: 'quote', text: parts.join(' ') });
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const parts: string[] = [];
    while (
      i < lines.length
      && lines[i].trim()
      && !FENCE.test(lines[i])
      && !HEADING.test(lines[i])
      && !BULLET.test(lines[i])
      && !ORDERED.test(lines[i])
      && !QUOTE.test(lines[i])
      && !RULE.test(lines[i])
      && !TABLE_LINE.test(lines[i])
      && prettyJson(lines[i]) === null
    ) {
      parts.push(lines[i]);
      i += 1;
    }
    if (parts.length === 0) {
      // La linea abre un bloque (p. ej. un JSON): no se queda en bucle.
      parts.push(lines[i]);
      i += 1;
    }
    blocks.push({ kind: 'paragraph', text: parts.join('\n') });
  }

  return blocks;
}

export function Markdown({
  text,
  color,
  size = 16,
}: {
  text: string;
  color: string;
  size?: number;
}) {
  const { c } = useTheme();
  const blocks = React.useMemo(() => parseMarkdown(text), [text]);

  return (
    <View>
      {blocks.map((block, index) => {
        const spacing = index === 0 ? 0 : 8;
        switch (block.kind) {
          case 'code':
            if (block.lang === 'json') {
              return (
                <View
                  key={index}
                  style={[
                    styles.codeWrap,
                    { marginTop: spacing, backgroundColor: c.surface },
                  ]}
                >
                  <ScrollView
                    nestedScrollEnabled
                    style={styles.jsonBlock}
                    showsVerticalScrollIndicator={false}
                  >
                    <Text
                      selectable
                      style={[styles.json, { fontFamily: mono, color: c.text }]}
                    >
                      {block.text}
                    </Text>
                  </ScrollView>
                  <CopyCode value={block.text} />
                </View>
              );
            }
            return (
              <View
                key={index}
                style={[
                  styles.codeWrap,
                  { marginTop: spacing, backgroundColor: c.surface },
                ]}
              >
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  style={styles.codeBlock}
                  showsHorizontalScrollIndicator={false}
                >
                  <Text
                    selectable
                    style={[styles.code, { fontFamily: mono, color: c.text }]}
                  >
                    {block.text}
                  </Text>
                </ScrollView>
                <CopyCode value={block.text} />
              </View>
            );
          case 'table':
            if (block.header.length === 2) {
              return (
                <View
                  key={index}
                  style={[
                    styles.pairs,
                    { marginTop: spacing, borderColor: c.border },
                  ]}
                >
                  {block.rows.map((row, rowIndex) => (
                    <View
                      key={rowIndex}
                      style={[
                        styles.pair,
                        rowIndex > 0
                          ? {
                              borderTopWidth: StyleSheet.hairlineWidth,
                              borderTopColor: c.border,
                            }
                          : null,
                      ]}
                    >
                      <Inline value={row[0]} color={c.muted} size={size - 3} />
                      <View style={styles.pairValue}>
                        <Inline value={row[1]} color={c.text} size={size - 1} />
                      </View>
                    </View>
                  ))}
                </View>
              );
            }
            return (
              <ScrollView
                key={index}
                horizontal
                nestedScrollEnabled
                style={{ marginTop: spacing }}
                showsHorizontalScrollIndicator
                contentContainerStyle={styles.tableWrap}
              >
                <View
                  style={[
                    styles.table,
                    { borderColor: c.border, backgroundColor: c.bg },
                  ]}
                >
                  <View style={[styles.tableRow, { backgroundColor: c.surface }]}>
                    {block.header.map((cell, position) => (
                      <View key={position} style={[styles.tableCell, { borderColor: c.border }]}>
                        <Inline value={cell} color={c.text} size={size - 2} />
                      </View>
                    ))}
                  </View>
                  {block.rows.map((row, rowIndex) => (
                    <View
                      key={rowIndex}
                      style={[
                        styles.tableRow,
                        {
                          borderTopColor: c.border,
                          borderTopWidth: StyleSheet.hairlineWidth,
                        },
                      ]}
                    >
                      {row.map((cell, position) => (
                        <View
                          key={position}
                          style={[
                            styles.tableCell,
                            { borderColor: c.border },
                            block.align[position] === 'right'
                              ? styles.cellRight
                              : block.align[position] === 'center'
                                ? styles.cellCenter
                                : null,
                          ]}
                        >
                          <Inline value={cell} color={c.text} size={size - 2} />
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            );
          case 'heading': {
            const headingSize = [22, 20, 18, 17, 16, 16][block.level - 1] ?? 16;
            return (
              <Text
                key={index}
                selectable
                style={[
                  styles.heading,
                  {
                    marginTop: spacing + 2,
                    fontSize: headingSize,
                    color,
                  },
                ]}
              >
                {block.text}
              </Text>
            );
          }
          case 'list':
            return (
              <View key={index} style={{ marginTop: spacing }}>
                {block.items.map((item, position) => (
                  <View key={position} style={styles.listRow}>
                    <Text style={[styles.marker, { color }]}>
                      {block.ordered ? `${position + 1}.` : '\u2022'}
                    </Text>
                    <View style={styles.listText}>
                      <Inline value={item} color={color} size={size} />
                    </View>
                  </View>
                ))}
              </View>
            );
          case 'quote':
            return (
              <View
                key={index}
                style={[
                  styles.quote,
                  { marginTop: spacing, borderLeftColor: c.border },
                ]}
              >
                <Inline value={block.text} color={c.muted} size={size - 1} />
              </View>
            );
          case 'rule':
            return (
              <View
                key={index}
                style={[styles.rule, { marginTop: spacing, backgroundColor: c.border }]}
              />
            );
          default:
            return (
              <View key={index} style={{ marginTop: spacing }}>
                <Inline value={block.text} color={color} size={size} />
              </View>
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  inlineCode: {
    fontSize: 14,
  },
  codeWrap: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  codeBlock: {
    paddingRight: 22,
  },
  copyCode: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  code: {
    fontSize: 12,
    lineHeight: 17,
  },
  jsonBlock: {
    maxHeight: 240,
    paddingRight: 18,
  },
  json: {
    fontSize: 11,
    lineHeight: 15,
  },
  heading: {
    fontWeight: '700',
  },
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableWrap: {
    paddingRight: 2,
  },
  cellRight: {
    alignItems: 'flex-end',
  },
  cellCenter: {
    alignItems: 'center',
  },
  pairs: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    overflow: 'hidden',
  },
  pair: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    gap: 2,
  },
  pairValue: {
    marginTop: 1,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    minWidth: 84,
    maxWidth: 240,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderLeftWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-start',
  },
  listRow: {
    flexDirection: 'row',
    gap: 6,
  },
  marker: {
    minWidth: 14,
    fontSize: 15,
    lineHeight: 22,
  },
  listText: {
    flexGrow: 1,
    flexShrink: 1,
  },
  quote: {
    borderLeftWidth: 2,
    paddingLeft: 8,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
  },
});
