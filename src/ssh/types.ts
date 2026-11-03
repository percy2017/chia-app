export type SshAuthType = 'password' | 'key';

export type SshProfile = {
  id: string;
  label: string;
  host: string;
  port: number;
  username: string;
  authType: SshAuthType;
  password: string;
  privateKey: string;
  passphrase: string;
};

export type SshExecResult = {
  output: string;
  exitCode: number;
  durationMs: number;
  timedOut: boolean;
  closed: boolean;
};

export function profileKey(profile: SshProfile): string {
  return [
    profile.host,
    profile.port,
    profile.username,
    profile.authType,
    profile.password ? 'p' : '',
    profile.privateKey ? 'k' : '',
  ].join(':');
}
