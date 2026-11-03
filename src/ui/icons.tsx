import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export type IconName =
  | 'arrowUp'
  | 'arrowDown'
  | 'stop'
  | 'paperclip'
  | 'image'
  | 'fileText'
  | 'copy'
  | 'check'
  | 'download'
  | 'trash'
  | 'terminal'
  | 'sparkles'
  | 'bot'
  | 'thumbsUp'
  | 'pencil'
  | 'close'
  | 'volume'
  | 'settings'
  | 'arrowLeft'
  | 'eye'
  | 'eyeOff'
  | 'info'
  | 'sun'
  | 'moon'
  | 'auto'
  | 'gauge'
  | 'stethoscope'
  | 'wallet'
  | 'mic'
  | 'play'
  | 'pause'
  | 'lock'
  | 'user'
  | 'logOut'
  | 'refresh'
  | 'whatsapp'
  | 'crown'
  | 'phone'
  | 'globe'
  | 'timer'
  | 'send'
  | 'chart'
  | 'female'
  | 'male'
  | 'plus'

type IconProps = {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
};

/**
 * Iconos con trazo (estilo Lucide) para no depender de fuentes ni emojis.
 */
export function Icon({
  name,
  size = 18,
  color,
  strokeWidth = 1.9,
}: IconProps) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'arrowUp' ? (
        <Path d="M12 19V5M5 12l7-7 7 7" {...common} />
      ) : null}

      {name === 'arrowDown' ? (
        <Path d="M12 5v14M5 12l7 7 7-7" {...common} />
      ) : null}

      {name === 'stop' ? (
        <Rect x="6.5" y="6.5" width="11" height="11" rx="2.5" fill={color} />
      ) : null}

      {name === 'paperclip' ? (
        <Path
          d="M20.5 11.5 12 20a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10 18a2 2 0 0 1-2.8-2.8l8-8"
          {...common}
        />
      ) : null}

      {name === 'image' ? (
        <>
          <Rect x="3" y="4" width="18" height="16" rx="2.5" {...common} />
          <Circle cx="9" cy="10" r="1.6" {...common} />
          <Path d="M21 16.5 16.5 12 7 20" {...common} />
        </>
      ) : null}

      {name === 'phone' ? (
        <>
          <Rect x="6" y="2.5" width="12" height="19" rx="2.5" {...common} />
          <Path d="M10.5 18.5h3" {...common} />
        </>
      ) : null}

      {name === 'female' ? (
        <>
          <Circle cx="12" cy="9" r="5.5" {...common} />
          <Path d="M12 14.5V21M9 18.5h6" {...common} />
        </>
      ) : null}

      {name === 'male' ? (
        <>
          <Circle cx="10" cy="14" r="5.5" {...common} />
          <Path d="M14 10l6-6M14.5 4h5.5v5.5" {...common} />
        </>
      ) : null}

      {name === 'plus' ? (
        <Path d="M12 5v14M5 12h14" {...common} />
      ) : null}

      {name === 'send' ? (
        <>
          <Path d="M21.5 2.5 10.5 13.5" {...common} />
          <Path d="M21.5 2.5 14.5 21.5 10.5 13.5 2.5 9.5z" {...common} />
        </>
      ) : null}

      {name === 'chart' ? (
        <>
          <Path d="M4 20h16" {...common} />
          <Path d="M7 20v-6M12 20V7M17 20v-9" {...common} />
        </>
      ) : null}

      {name === 'timer' ? (
        <>
          <Circle cx="12" cy="13.5" r="7.5" {...common} />
          <Path d="M9.5 2.5h5M12 2.5v3.5M12 13.5l3 1.8" {...common} />
        </>
      ) : null}

      {name === 'globe' ? (
        <>
          <Circle cx="12" cy="12" r="9" {...common} />
          <Path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" {...common} />
        </>
      ) : null}

      {name === 'fileText' ? (
        <>
          <Path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" {...common} />
          <Path d="M14 3v5h5M9 13h6M9 17h4" {...common} />
        </>
      ) : null}

      {name === 'copy' ? (
        <>
          <Rect x="9" y="9" width="12" height="12" rx="2.5" {...common} />
          <Path d="M5 15H4a1.5 1.5 0 0 1-1.5-1.5V4A1.5 1.5 0 0 1 4 2.5h9.5A1.5 1.5 0 0 1 15 4v1" {...common} />
        </>
      ) : null}

      {name === 'check' ? <Path d="M20 6.5 9.5 17 4 11.5" {...common} /> : null}

      {name === 'download' ? (
        <>
          <Path d="M12 3v11M7.5 9.5 12 14l4.5-4.5" {...common} />
          <Path d="M4 16v2.5A2.5 2.5 0 0 0 6.5 21h11A2.5 2.5 0 0 0 20 18.5V16" {...common} />
        </>
      ) : null}

      {name === 'trash' ? (
        <>
          <Path d="M3.5 6.5h17M9 6.5V4.8A1.3 1.3 0 0 1 10.3 3.5h3.4A1.3 1.3 0 0 1 15 4.8v1.7" {...common} />
          <Path d="M6 6.5l.9 12.2A2 2 0 0 0 8.9 20.6h6.2a2 2 0 0 0 2-1.9l.9-12.2" {...common} />
          <Path d="M10.5 10.5v6M13.5 10.5v6" {...common} />
        </>
      ) : null}

      {name === 'terminal' ? (
        <>
          <Path d="M4 17l5.5-5L4 7" {...common} />
          <Path d="M12.5 19H20" {...common} />
        </>
      ) : null}

      {name === 'thumbsUp' ? (
        <>
          <Path d="M7 10.5v10M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-7.5a2 2 0 0 1 2-2h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9z" {...common} />
        </>
      ) : null}

      {name === 'bot' ? (
        <>
          <Rect x="4" y="8" width="16" height="12" rx="3" {...common} />
          <Path d="M12 4v4M9 3.2h6" {...common} />
          <Circle cx="9" cy="13.5" r="1.1" fill={color} stroke="none" />
          <Circle cx="15" cy="13.5" r="1.1" fill={color} stroke="none" />
          <Path d="M9.5 17h5" {...common} />
        </>
      ) : null}

      {name === 'sparkles' ? (
        <>
          <Path
            d="M12 3.5l1.6 4.6 4.6 1.6-4.6 1.6L12 15.9l-1.6-4.6L5.8 9.7l4.6-1.6z"
            {...common}
          />
          <Path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" {...common} />
        </>
      ) : null}

      {name === 'pencil' ? (
        <>
          <Path d="M20.2 6.2a2 2 0 0 0-2.8-2.8L4.6 16.2a2 2 0 0 0-.5.8l-1.3 4.4 4.4-1.3a2 2 0 0 0 .8-.5z" {...common} />
          <Path d="M15.8 4.6l3.6 3.6" {...common} />
        </>
      ) : null}

      {name === 'volume' ? (
        <>
          <Path d="M11 5 6.5 9H3v6h3.5L11 19z" {...common} />
          <Path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" {...common} />
        </>
      ) : null}

      {name === 'close' ? <Path d="M18 6 6 18M6 6l12 12" {...common} /> : null}

      {name === 'settings' ? (
        <>
          <Circle cx="12" cy="12" r="3.2" {...common} />
          <Path
            d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
            {...common}
          />
        </>
      ) : null}

      {name === 'arrowLeft' ? <Path d="M19 12H5M11 5l-7 7 7 7" {...common} /> : null}

      {name === 'lock' ? (
        <>
          <Rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" {...common} />
          <Path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7M12 14.5v2.5" {...common} />
        </>
      ) : null}

      {name === 'user' ? (
        <>
          <Circle cx="12" cy="8" r="3.8" {...common} />
          <Path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" {...common} />
        </>
      ) : null}

      {name === 'logOut' ? (
        <>
          <Path d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14" {...common} />
          <Path d="M17.5 8.5 21 12l-3.5 3.5M10.5 12H21" {...common} />
        </>
      ) : null}

      {name === 'eye' ? (
        <>
          <Path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" {...common} />
          <Circle cx="12" cy="12" r="2.8" {...common} />
        </>
      ) : null}

      {name === 'eyeOff' ? (
        <>
          <Path d="M3 3l18 18" {...common} />
          <Path d="M10.6 6.1A10.8 10.8 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.3 3.9M6.3 7.7A17 17 0 0 0 2 12s3.6 6 10 6a10 10 0 0 0 4.1-.8" {...common} />
          <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" {...common} />
        </>
      ) : null}
      {name === 'info' ? (
        <>
          <Circle cx="12" cy="12" r="8.5" {...common} />
          <Path d="M12 11v5.5M12 7.8v.2" {...common} />
        </>
      ) : null}
      {name === 'sun' ? (
        <>
          <Circle cx="12" cy="12" r="4" {...common} />
          <Path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" {...common} />
        </>
      ) : null}

      {name === 'moon' ? (
        <Path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z" {...common} />
      ) : null}

      {name === 'stethoscope' ? (
        <>
          <Path d="M4.5 3.5v4.5a4.5 4.5 0 0 0 9 0V3.5" {...common} />
          <Path d="M3 3.5h1.5M13 3.5h1.5" {...common} />
          <Path d="M9 12.5V15a4 4 0 0 0 8 0v-2" {...common} />
          <Circle cx="17" cy="11" r="2" {...common} />
        </>
      ) : null}

      {name === 'mic' ? (
        <>
          <Rect x="9" y="2.5" width="6" height="11" rx="3" {...common} />
          <Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" {...common} />
        </>
      ) : null}

      {name === 'play' ? (
        <Path d="M8 5.5v13l11-6.5z" {...common} fill={color} />
      ) : null}

      {name === 'pause' ? (
        <>
          <Rect x="7.5" y="5.5" width="3" height="13" rx="1" fill={color} />
          <Rect x="13.5" y="5.5" width="3" height="13" rx="1" fill={color} />
        </>
      ) : null}

      {name === 'wallet' ? (
        <>
          <Path d="M20 12V8.5H6.2A2.2 2.2 0 0 1 4 6.3 2.2 2.2 0 0 1 6.2 4H18v4.5" {...common} />
          <Path d="M4 6.3v11.4A2.2 2.2 0 0 0 6.2 20H20v-4.5" {...common} />
          <Rect x="16.5" y="12" width="7" height="3.5" rx="1.5" {...common} />
        </>
      ) : null}

      {name === 'gauge' ? (
        <>
          <Path d="M3.5 18a9 9 0 1 1 17 0" {...common} />
          <Path d="M12 13.5l4.2-4.2" {...common} />
          <Circle cx="12" cy="14.5" r="1.4" {...common} />
        </>
      ) : null}

      {name === 'refresh' ? (
        <>
          <Path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" {...common} />
          <Path d="M20.5 3.2v5.2h-5.2" {...common} />
        </>
      ) : null}

      {name === 'whatsapp' ? (
        <>
          <Path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.4-4.6a8.5 8.5 0 1 1 15.6-4.2z" {...common} />
          <Path d="M9 8.7c.3-.7.7-.7 1-.7h.6c.2 0 .4.1.5.4l.6 1.6c.1.2 0 .4-.1.6l-.5.6c-.2.2-.2.4-.1.6a6 6 0 0 0 2.8 2.4c.2.1.4 0 .6-.1l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.2.1.3.3.3.5 0 1-.8 1.9-1.6 2.1-1 .3-2.4-.1-4.2-1.4a10 10 0 0 1-3-3.6c-.6-1.3-.5-2.3-.1-3z" {...common} />
        </>
      ) : null}

      {name === 'crown' ? (
        <>
          <Path d="M4 17.5 3 7l5 3.5L12 5l4 5.5L21 7l-1 10.5z" {...common} />
          <Path d="M4.8 20.5h14.4" {...common} />
        </>
      ) : null}

      {name === 'auto' ? (
        <>
          <Circle cx="12" cy="12" r="8.5" {...common} />
          <Path d="M12 3.5a8.5 8.5 0 0 0 0 17z" fill={color} stroke="none" />
        </>
      ) : null}
    </Svg>
  );
}
