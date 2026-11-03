import type { ChatImage } from '../llm/types';
import type { SshProfile } from '../ssh/types';

import { getActiveSshProfile } from '../settings/store';
import { connectSsh } from '../ssh/client';
import { pickFileNative, pickImageNative, uploadNative } from './native';


export type Attachment =
  | { kind: 'image'; name: string; size: number; image: ChatImage }
  | { kind: 'file'; name: string; size: number; uri: string; remotePath?: string };

export function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function safeName(name: string): string {
  const cleaned = name.replace(/[^\w.\-]+/g, '_').replace(/^_+/, '');
  return cleaned || 'adjunto';
}

export async function pickImage(): Promise<Attachment | null> {
  const picked = await pickImageNative();
  if (!picked) {
    return null;
  }
  const size = picked.size || Math.floor(((picked.data?.length ?? 0) * 3) / 4);
  if (!picked.data) {
    throw new Error('No se pudo leer la imagen.');
  }
  if (picked.mimeType && !picked.mimeType.startsWith('image/')) {
    throw new Error(`Ese archivo no es una imagen (${picked.mimeType}).`);
  }
  return {
    kind: 'image',
    name: picked.name,
    size,
    image: {
      mimeType: picked.mimeType || 'image/jpeg',
      data: picked.data,
      width: picked.width,
      height: picked.height,
    },
  };
}

export async function pickDocument(): Promise<Attachment | null> {
  const picked = await pickFileNative();
  if (!picked) {
    return null;
  }
  return {
    kind: 'file',
    name: picked.name,
    size: picked.size,
    uri: picked.uri,
  };
}

export async function uploadDocument(
  attachment: Extract<Attachment, { kind: 'file' }>,
  profile: SshProfile = getActiveSshProfile(),
): Promise<Attachment> {
  const remotePath
    = `/home/${profile.username}/uploads/${Date.now()}_${safeName(attachment.name)}`;
  await connectSsh(profile);
  await uploadNative(attachment.uri, remotePath);
  return { ...attachment, remotePath };
}
