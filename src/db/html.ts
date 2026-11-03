import type { ChatMessage, ChatToolResult } from '../llm/types';
import { parseInline, parseMarkdown } from '../ui/Markdown';

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inline(value: string): string {
  return parseInline(value)
    .map((segment) => {
      switch (segment.kind) {
        case 'bold':
          return `<strong>${esc(segment.text)}</strong>`;
        case 'italic':
          return `<em>${esc(segment.text)}</em>`;
        case 'code':
          return `<code>${esc(segment.text)}</code>`;
        case 'link':
          return `<a href="${esc(segment.url)}" target="_blank" rel="noopener noreferrer">`
            + `${esc(segment.text)}</a>`;
        default:
          return esc(segment.text);
      }
    })
    .join('');
}

/** Markdown -> HTML con los mismos bloques que pinta Markdown.tsx. */
export function markdownToHtml(source: string): string {
  const out: string[] = [];
  for (const block of parseMarkdown(source)) {
    switch (block.kind) {
      case 'code':
        out.push(`<pre><code>${esc(block.text)}</code></pre>`);
        break;
      case 'table':
        out.push(
          '<table><thead><tr>'
          + block.header.map(cell => `<th>${inline(cell)}</th>`).join('')
          + '</tr></thead><tbody>'
          + block.rows
            .map(
              row => '<tr>'
                + row
                  .map(
                    (cell, index) => `<td style="text-align:${block.align[index] ?? 'left'}">`
                      + `${inline(cell)}</td>`,
                  )
                  .join('')
                + '</tr>',
            )
            .join('')
          + '</tbody></table>',
        );
        break;
      case 'heading': {
        const level = Math.min(block.level + 1, 6);
        out.push(`<h${level}>${inline(block.text)}</h${level}>`);
        break;
      }
      case 'list': {
        const tag = block.ordered ? 'ol' : 'ul';
        out.push(
          `<${tag}>${block.items.map(item => `<li>${inline(item)}</li>`).join('')}</${tag}>`,
        );
        break;
      }
      case 'quote':
        out.push(`<blockquote>${inline(block.text)}</blockquote>`);
        break;
      case 'rule':
        out.push('<hr>');
        break;
      default:
        out.push(`<p>${inline(block.text).replace(/\n/g, '<br>')}</p>`);
    }
  }
  return out.join('\n');
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function stamp(value?: number): string {
  const date = value ? new Date(value) : new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function toolResult(
  message: ChatMessage,
  id: string,
): ChatToolResult | undefined {
  return message.toolResults?.find(item => item.toolCallId === id);
}

function renderTools(message: ChatMessage): string {
  const parts: string[] = [];
  for (const call of message.toolCalls ?? []) {
    const result = toolResult(message, call.id);
    const status = result
      ? `${result.isError ? 'error' : 'ok'} · exit ${result.exitCode} · ${result.durationMs} ms`
      : 'sin resultado';
    const body = result?.output || call.arguments;
    parts.push(
      `<details class="tool${result?.isError ? ' bad' : ''}">`
      + `<summary><code>${esc(call.name)}</code> `
      + `<span class="cmd">${esc(result?.command ?? call.arguments).slice(0, 200)}</span> `
      + `<span class="badge">${esc(status)}</span></summary>`
      + `<pre>${esc(body)}</pre></details>`,
    );
  }
  return parts.join('\n');
}

function renderImages(message: ChatMessage): string {
  const images = message.images ?? [];
  if (images.length === 0) {
    return '';
  }
  return `<div class="images">${
    images
      .map(
        (image, index) => `<figure><img src="data:${esc(image.mimeType)};base64,`
          + `${image.data}" alt="adjunto ${index + 1}">`
          + `<figcaption>${esc(image.mimeType)}</figcaption></figure>`,
      )
      .join('')
  }</div>`;
}

function renderMessage(message: ChatMessage): string {
  const who = message.role === 'user' ? 'Tú' : 'Chia';
  const role = message.role === 'user' ? 'user' : 'assistant';
  const meta: string[] = [stamp(message.createdAt)];
  if (message.kind === 'summary') {
    meta.push('resumen de contexto');
  }
  if (message.usage) {
    meta.push(`${message.usage.total} tokens`);
  }
  const body = message.content ? markdownToHtml(message.content) : '';
  const error = message.status === 'error' && message.error
    ? `<p class="error">${esc(message.error)}</p>`
    : '';
  const reasoning = message.reasoning
    ? `<details class="reason"><summary>razonamiento</summary><pre>`
      + `${esc(message.reasoning)}</pre></details>`
    : '';
  return `<article class="msg ${role}${message.kind === 'summary' ? ' summary' : ''}">`
    + `<header><span class="who">${esc(who)}</span>`
    + `<span class="meta">${esc(meta.join(' · '))}</span></header>`
    + `<div class="body">${body}${error}</div>`
    + renderImages(message)
    + renderTools(message)
    + reasoning
    + '</article>';
}

const CSS = `
:root{color-scheme:light dark}
*{box-sizing:border-box}
body{margin:0;padding:20px 16px 60px;font:16px/1.5 -apple-system,Roboto,"Segoe UI",sans-serif;
background:#fff;color:#111}
.wrap{max-width:820px;margin:0 auto}
h1{font-size:20px;margin:0 0 4px}
.doc{display:flex;flex-wrap:wrap;gap:10px;font-size:12px;color:#666;margin-bottom:18px}
.msg{border:1px solid #e3e3e3;border-radius:12px;padding:12px 14px;margin-bottom:12px;
background:#fafafa}
.msg.user{background:#eef4ff;border-color:#d3e0f7}
.msg.summary{background:#fff8e6;border-color:#f0e0b8}
.msg header{display:flex;justify-content:space-between;gap:8px;margin-bottom:8px;
font-size:12px;color:#666}
.who{font-weight:600;color:#111}
.body p{margin:0 0 8px}
.body p:last-child{margin-bottom:0}
.body h2,.body h3,.body h4,.body h5,.body h6{margin:12px 0 6px;font-size:1.05em}
.body ul,.body ol{margin:6px 0;padding-left:22px}
.body blockquote{margin:8px 0;padding-left:12px;border-left:3px solid #d8d8d8;color:#555}
.body code{background:#eee;border-radius:4px;padding:1px 4px;font-size:.9em}
pre{background:#1d1f24;color:#e8e8e8;border-radius:8px;padding:10px;overflow:auto;
font-size:13px;margin:8px 0}
table{border-collapse:collapse;margin:8px 0;font-size:14px}
th,td{border:1px solid #ddd;padding:4px 8px;text-align:left;vertical-align:top}
.images{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 0}
.images figure{margin:0;max-width:220px}
.images img{max-width:100%;border-radius:8px;display:block}
.images figcaption{font-size:11px;color:#666}
details.tool,details.reason{margin-top:8px;font-size:13px;border-top:1px dashed #ddd;
padding-top:6px}
details.tool summary,details.reason summary{cursor:pointer;color:#444}
details.tool .cmd{font-family:ui-monospace,monospace;font-size:12px;color:#555}
.badge{background:#e7e7e7;border-radius:10px;padding:1px 6px;font-size:11px}
details.tool.bad .badge{background:#fde2e1;color:#a01b16}
details.tool pre{max-height:320px;margin:6px 0 0}
.error{color:#a01b16;margin:0}
footer{margin-top:24px;font-size:12px;color:#666}
@media (prefers-color-scheme:dark){
body{background:#101216;color:#e8e8e8}
.msg{background:#171a20;border-color:#262a33}
.msg.user{background:#152238;border-color:#22334f}
.msg.summary{background:#221f14;border-color:#3a3520}
.who{color:#f2f2f2}
.body code{background:#23262e}
th,td{border-color:#2c313a}
details.tool summary,details.reason summary{color:#cfd3da}
details.tool,details.reason{border-top-color:#2c313a}
.badge{background:#262a33;color:#cfd3da}
footer,.doc,figcaption,.msg header{color:#9aa0aa}
}
`;

export function historyToHtml(messages: ChatMessage[]): string {
  const ordered = [...messages].sort(
    (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0),
  );
  const tools = ordered.reduce((total, item) => total + (item.toolCalls?.length ?? 0), 0);
  const from = ordered[0]?.createdAt ? stamp(ordered[0].createdAt) : '';
  const to = ordered.length > 0 ? stamp(ordered[ordered.length - 1].createdAt) : '';
  const range = from && to && from !== to ? `${from} → ${to}` : from;
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ChiaNative · historial del chat</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
<h1>ChiaNative · historial del chat</h1>
<div class="doc"><span>${esc(range)}</span><span>${ordered.length} mensajes</span>`
    + `<span>${tools} herramientas</span><span>exportado ${esc(stamp())}</span></div>
${ordered.length === 0 ? '<p>El historial esta vacio.</p>' : ''}
${ordered.map(renderMessage).join('\n')}
<footer>Generado por ChiaNative en el telefono. Archivo autocontenido (sin conexion).</footer>
</div>
</body>
</html>
`;
}
