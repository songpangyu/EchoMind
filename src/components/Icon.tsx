import React from 'react';
import { ViewStyle } from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline, G, Ellipse } from 'react-native-svg';

export type IconName =
    // Tab bar
    | 'home' | 'journal' | 'mic' | 'globe' | 'user'
    // Greetings / time
    | 'moon' | 'sunrise' | 'sun' | 'sunset'
    // Moods
    | 'peaceful' | 'happy' | 'anxious' | 'sad' | 'calm'
    // Actions
    | 'search' | 'close' | 'heart' | 'heart-fill' | 'comment' | 'star' | 'star-fill'
    | 'more' | 'back' | 'share' | 'check' | 'edit' | 'camera'
    // Content types
    | 'tree' | 'sparkle' | 'wave' | 'mountain' | 'city' | 'train' | 'flower' | 'galaxy'
    // Features
    | 'bell' | 'lock' | 'help' | 'logout'
    // Suggestions
    | 'meditate' | 'book' | 'leaf' | 'music'
    // Dream detail perspectives
    | 'sprout' | 'briefcase' | 'heart-duo' | 'thought' | 'sparkles'
    // Record
    | 'pen' | 'palette' | 'image' | 'film' | 'brush' | 'pencil' | 'rainbow' | 'flag'
    // Misc
    | 'warning' | 'clock' | 'sleep' | 'list' | 'calendar' | 'like' | 'user-plus' | 'comment-at'
    | 'calendar-outline' | 'mic-outline' | 'note' | 'robot' | 'bulb';

interface IconProps {
    name: IconName;
    size?: number;
    color?: string;
    strokeWidth?: number;
    style?: ViewStyle;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#b5d9a8', strokeWidth = 1.8, style }) => {
    const sw = strokeWidth;
    const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const, style };

    switch (name) {
        // ── Tab bar ──
        case 'home':
            return <Svg {...props}><Path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M9 21V14h6v7" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'journal':
            return <Svg {...props}><Path d="M4 4h12a2 2 0 012 2v12a2 2 0 01-2 2H4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M4 2v20" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="8" y1="8" x2="14" y2="8" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="8" y1="12" x2="12" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>;
        case 'mic':
            return <Svg {...props}><Rect x="9" y="2" width="6" height="11" rx="3" stroke={color} strokeWidth={sw} /><Path d="M5 10a7 7 0 0014 0" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="12" y1="17" x2="12" y2="22" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="8" y1="22" x2="16" y2="22" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>;
        case 'globe':
            return <Svg {...props}><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={sw} /><Path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" stroke={color} strokeWidth={sw} /></Svg>;
        case 'user':
            return <Svg {...props}><Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={sw} /><Path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>;

        // ── Time / Greetings ──
        case 'moon':
            return <Svg {...props}><Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'sunrise':
            return <Svg {...props}><Path d="M17 18a5 5 0 10-10 0" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="12" y1="2" x2="12" y2="7" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="4.22" y1="10.22" x2="5.64" y2="11.64" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="1" y1="18" x2="3" y2="18" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="21" y1="18" x2="23" y2="18" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="18.36" y1="11.64" x2="19.78" y2="10.22" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Polyline points="8 14 12 10 16 14" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'sun':
            return <Svg {...props}><Circle cx="12" cy="12" r="5" stroke={color} strokeWidth={sw} /><Line x1="12" y1="1" x2="12" y2="3" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="12" y1="21" x2="12" y2="23" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="1" y1="12" x2="3" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="21" y1="12" x2="23" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>;
        case 'sunset':
            return <Svg {...props}><Path d="M17 18a5 5 0 10-10 0" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="12" y1="9" x2="12" y2="2" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="4.22" y1="10.22" x2="5.64" y2="11.64" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="1" y1="18" x2="3" y2="18" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="21" y1="18" x2="23" y2="18" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="18.36" y1="11.64" x2="19.78" y2="10.22" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Polyline points="8 14 12 18 16 14" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;

        // ── Moods (Kawaii Pastel style) ──
        case 'peaceful':
            return <Svg {...props}><Circle cx="12" cy="12" r="11" fill="#a8e6cf" /><Path d="M8 9.8c.3-.15.7-.15 1 0" stroke="#5a7a6a" strokeWidth="1.5" strokeLinecap="round" fill="none" /><Path d="M15 9.8c-.3-.15-.7-.15-1 0" stroke="#5a7a6a" strokeWidth="1.5" strokeLinecap="round" fill="none" /><Circle cx="7" cy="12.5" r="1.8" fill="#f8b4b4" opacity="0.5" /><Circle cx="17" cy="12.5" r="1.8" fill="#f8b4b4" opacity="0.5" /><Path d="M9.5 14c.8 1.2 2.2 1.2 3 1.2s2.2 0 3-1.2" stroke="#5a7a6a" strokeWidth="1.2" strokeLinecap="round" fill="none" /></Svg>;
        case 'happy':
            return <Svg {...props}><Circle cx="12" cy="12" r="11" fill="#ffd3b6" /><Circle cx="9" cy="10" r="1.2" fill="#6b5044" /><Circle cx="15" cy="10" r="1.2" fill="#6b5044" /><Circle cx="9.4" cy="9.5" r="0.4" fill="#fff" /><Circle cx="15.4" cy="9.5" r="0.4" fill="#fff" /><Circle cx="7" cy="12.5" r="1.8" fill="#f8a0a0" opacity="0.5" /><Circle cx="17" cy="12.5" r="1.8" fill="#f8a0a0" opacity="0.5" /><Path d="M9 14s1.2 2.2 3 2.2 3-2.2 3-2.2" stroke="#6b5044" strokeWidth="1.3" strokeLinecap="round" fill="none" /></Svg>;
        case 'anxious':
            return <Svg {...props}><Circle cx="12" cy="12" r="11" fill="#ffb3b3" /><Circle cx="9" cy="9.5" r="1.4" fill="#fff" /><Circle cx="15" cy="9.5" r="1.4" fill="#fff" /><Circle cx="9" cy="9.8" r="0.8" fill="#6b4444" /><Circle cx="15" cy="9.8" r="0.8" fill="#6b4444" /><Circle cx="7.2" cy="12.5" r="1.6" fill="#e88" opacity="0.4" /><Circle cx="16.8" cy="12.5" r="1.6" fill="#e88" opacity="0.4" /><Path d="M7.5 7.5c.8-.6 1.8-.3 2.5.1" stroke="#6b4444" strokeWidth="1" strokeLinecap="round" fill="none" /><Path d="M16.5 7.5c-.8-.6-1.8-.3-2.5.1" stroke="#6b4444" strokeWidth="1" strokeLinecap="round" fill="none" /><Ellipse cx="12" cy="15.5" rx="1.8" ry="1.3" fill="#6b4444" opacity="0.7" /></Svg>;
        case 'sad':
            return <Svg {...props}><Circle cx="12" cy="12" r="11" fill="#c3c3f5" /><Circle cx="9" cy="10" r="1.2" fill="#5b5b8a" /><Circle cx="15" cy="10" r="1.2" fill="#5b5b8a" /><Circle cx="9.4" cy="9.5" r="0.35" fill="#fff" /><Circle cx="15.4" cy="9.5" r="0.35" fill="#fff" /><Circle cx="7.2" cy="12.8" r="1.6" fill="#a3a3d5" opacity="0.5" /><Circle cx="16.8" cy="12.8" r="1.6" fill="#a3a3d5" opacity="0.5" /><Path d="M9.5 15.5c.8-1 1.5-1.2 2.5-1.2s1.7.2 2.5 1.2" stroke="#5b5b8a" strokeWidth="1.2" strokeLinecap="round" fill="none" /><Path d="M14.8 7c0 1.5-.3 2.5-.3 3.5" stroke="#8888cc" strokeWidth="0.8" strokeLinecap="round" fill="none" /></Svg>;
        case 'calm':
            return <Svg {...props}><Circle cx="12" cy="12" r="11" fill="#d5b8f0" /><Path d="M8 10c.4-.2.8-.2 1.2 0" stroke="#6b5080" strokeWidth="1.5" strokeLinecap="round" fill="none" /><Path d="M14.8 10c.4-.2.8-.2 1.2 0" stroke="#6b5080" strokeWidth="1.5" strokeLinecap="round" fill="none" /><Circle cx="7" cy="12.5" r="1.8" fill="#c9a0e0" opacity="0.5" /><Circle cx="17" cy="12.5" r="1.8" fill="#c9a0e0" opacity="0.5" /><Line x1="9.5" y1="14.5" x2="14.5" y2="14.5" stroke="#6b5080" strokeWidth="1.2" strokeLinecap="round" /></Svg>;

        // ── Actions ──
        case 'search':
            return <Svg {...props}><Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={sw} /><Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>;
        case 'close':
            return <Svg {...props}><Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>;
        case 'heart':
            return <Svg {...props}><Path d="M12 21C12 21 4 15 4 8.5C4 5.46 6.46 3 9.5 3c1.74 0 3.41.81 4.5 2.08C15.09 3.81 16.76 3 18.5 3 21.54 3 24 5.46 24 8.5c0 6.5-8 12.5-8 12.5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M20 8.5c0-1.1-.4-2-.97-2.64" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>;
        case 'heart-fill':
            return <Svg {...props}><Path d="M12 21s-8-6-8-12.5C4 5.46 6.46 3 9.5 3c1.74 0 3.41.81 4.5 2.08C15.09 3.81 16.76 3 18.5 3 21.54 3 24 5.46 24 8.5c0 6.5-8 12.5-8 12.5" fill="#e05252" stroke="#e05252" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'comment':
            return <Svg {...props}><Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'star':
            return <Svg {...props}><Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'star-fill':
            return <Svg {...props}><Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" fill={color} stroke={color} strokeWidth={sw} /></Svg>;
        case 'more':
            return <Svg {...props}><Circle cx="12" cy="12" r="1" fill={color} /><Circle cx="5" cy="12" r="1" fill={color} /><Circle cx="19" cy="12" r="1" fill={color} /></Svg>;
        case 'back':
            return <Svg {...props}><Polyline points="15 18 9 12 15 6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'share':
            return <Svg {...props}><Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Polyline points="16 6 12 2 8 6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Line x1="12" y1="2" x2="12" y2="15" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>;
        case 'check':
            return <Svg {...props}><Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'edit':
            return <Svg {...props}><Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'camera':
            return <Svg {...props}><Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Circle cx="12" cy="13" r="4" stroke={color} strokeWidth={sw} /></Svg>;

        // ── Nature / Dream themes ──
        case 'tree':
            return <Svg {...props}><Path d="M12 22V12" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Path d="M12 4L6 12h12L12 4z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M12 8L8 14h8l-4-6z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'sparkle':
            return <Svg {...props}><Path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-7.07l-2.83 2.83M9.76 14.24l-2.83 2.83m11.14 0l-2.83-2.83M9.76 9.76L6.93 6.93" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>;
        case 'wave':
            return <Svg {...props}><Path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Path d="M2 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>;
        case 'mountain':
            return <Svg {...props}><Path d="M12 4l-9 16h18L12 4z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M7 20l5-8 3 4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'city':
            return <Svg {...props}><Rect x="2" y="10" width="5" height="12" stroke={color} strokeWidth={sw} /><Rect x="9" y="4" width="6" height="18" stroke={color} strokeWidth={sw} /><Rect x="17" y="8" width="5" height="14" stroke={color} strokeWidth={sw} /><Line x1="4" y1="14" x2="5" y2="14" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="11" y1="8" x2="12" y2="8" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="11" y1="12" x2="12" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>;
        case 'train':
            return <Svg {...props}><Rect x="4" y="3" width="16" height="14" rx="2" stroke={color} strokeWidth={sw} /><Line x1="4" y1="11" x2="20" y2="11" stroke={color} strokeWidth={sw} /><Line x1="12" y1="3" x2="12" y2="11" stroke={color} strokeWidth={sw} /><Circle cx="8" cy="21" r="1" fill={color} /><Circle cx="16" cy="21" r="1" fill={color} /><Line x1="6" y1="17" x2="8" y2="20" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="18" y1="17" x2="16" y2="20" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>;
        case 'flower':
            return <Svg {...props}><Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={sw} /><Path d="M12 2a4 4 0 010 6 4 4 0 016 0 4 4 0 010 6 4 4 0 01-6 0 4 4 0 010 6 4 4 0 01-6 0 4 4 0 010-6 4 4 0 01-6 0 4 4 0 010-6 4 4 0 016 0" stroke={color} strokeWidth={1.2} /></Svg>;
        case 'galaxy':
            return <Svg {...props}><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={sw} /><Path d="M12 2c3 4 3 8 0 10s-3 6 0 10" stroke={color} strokeWidth={sw} /><Line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth={1} /></Svg>;

        // ── Features ──
        case 'bell':
            return <Svg {...props}><Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>;
        case 'lock':
            return <Svg {...props}><Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth={sw} /><Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Circle cx="12" cy="16" r="1" fill={color} /></Svg>;
        case 'help':
            return <Svg {...props}><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={sw} /><Path d="M9 9a3 3 0 015.12 1.5c0 2-3 2.5-3 4.5" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Circle cx="12" cy="18" r="0.5" fill={color} /></Svg>;
        case 'logout':
            return <Svg {...props}><Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Polyline points="16 17 21 12 16 7" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>;

        // ── Suggestions ──
        case 'meditate':
            return <Svg {...props}><Circle cx="12" cy="5" r="2" stroke={color} strokeWidth={sw} /><Path d="M8 22l1-6H6l3-4M16 22l-1-6h3l-3-4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M10 12h4" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>;
        case 'book':
            return <Svg {...props}><Path d="M2 4c2-1 5-1 7 0v16c-2-1-5-1-7 0V4z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M12 4c2-1 5-1 7 0v16c-2-1-5-1-7 0" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Line x1="12" y1="4" x2="12" y2="20" stroke={color} strokeWidth={sw} /></Svg>;
        case 'leaf':
            return <Svg {...props}><Path d="M6 21c2-6 8-11 15-13-2 7-7 13-13 15l-2 0z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M6 21c4-4 8-7 15-13" stroke={color} strokeWidth={1.2} strokeLinecap="round" /></Svg>;
        case 'music':
            return <Svg {...props}><Path d="M9 18V5l12-2v13" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Circle cx="6" cy="18" r="3" stroke={color} strokeWidth={sw} /><Circle cx="18" cy="16" r="3" stroke={color} strokeWidth={sw} /></Svg>;

        // ── Dream Detail perspectives ──
        case 'sprout':
            return <Svg {...props}><Path d="M12 22V12" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Path d="M5 8c0-4 7-7 7-7s7 3 7 7c0 3-3 5-7 5s-7-2-7-5z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'briefcase':
            return <Svg {...props}><Rect x="2" y="7" width="20" height="14" rx="2" stroke={color} strokeWidth={sw} /><Path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="2" y1="13" x2="22" y2="13" stroke={color} strokeWidth={sw} /></Svg>;
        case 'heart-duo':
            return <Svg {...props}><Path d="M16.5 3c-1.74 0-3.41.81-4.5 2.08C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z" stroke={color} strokeWidth={sw} /><Path d="M12 8c1-1.5 2.5-2 3.5-2 1.66 0 3 1.34 3 3 0 2-2 4-6.5 7.5" stroke={color} strokeWidth={1} /></Svg>;
        case 'thought':
            return <Svg {...props}><Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Circle cx="9" cy="10" r="0.5" fill={color} /><Circle cx="12" cy="10" r="0.5" fill={color} /><Circle cx="15" cy="10" r="0.5" fill={color} /></Svg>;
        case 'sparkles':
            return <Svg {...props}><Path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M19 15l.88 2.12L22 18l-2.12.88L19 21l-.88-2.12L16 18l2.12-.88L19 15z" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;

        // ── Record Art styles ──
        case 'image':
            return <Svg {...props}><Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth={sw} /><Circle cx="8.5" cy="8.5" r="1.5" fill={color} /><Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'palette':
            return <Svg {...props}><Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.96-4.48-9-10-9z" stroke={color} strokeWidth={sw} /><Circle cx="7" cy="12" r="1.2" fill={color} /><Circle cx="10" cy="7.5" r="1.2" fill="#e07777" /><Circle cx="15" cy="7.5" r="1.2" fill="#7da8c8" /><Circle cx="17.5" cy="11" r="1.2" fill="#c6b87e" /></Svg>;
        case 'film':
            return <Svg {...props}><Rect x="2" y="2" width="20" height="20" rx="2.18" stroke={color} strokeWidth={sw} /><Line x1="7" y1="2" x2="7" y2="22" stroke={color} strokeWidth={sw} /><Line x1="17" y1="2" x2="17" y2="22" stroke={color} strokeWidth={sw} /><Line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth={sw} /></Svg>;
        case 'brush':
            return <Svg {...props}><Path d="M10 13.5v7a2.5 2.5 0 005 0v-7" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M7 2h10l1 9H6l1-9z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'pencil':
            return <Svg {...props}><Line x1="18" y1="2" x2="22" y2="6" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Path d="M7.5 20.5L4 21l.5-3.5L17 5l3 3L7.5 20.5z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'rainbow':
            return <Svg {...props}><Path d="M2 18a10 10 0 0120 0" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Path d="M5 18a7 7 0 0114 0" stroke="#7da8c8" strokeWidth={sw} strokeLinecap="round" /><Path d="M8 18a4 4 0 018 0" stroke="#c6b87e" strokeWidth={sw} strokeLinecap="round" /></Svg>;
        case 'flag':
            return <Svg {...props}><Line x1="4" y1="2" x2="4" y2="22" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Path d="M4 2c5.5 0 5.5 3 11 3 1.5 0 3-.5 5-1v10c-2 .5-3.5 1-5 1-5.5 0-5.5-3-11-3" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'pen':
            return <Svg {...props}><Path d="M12 20h9" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;

        // ── Misc ──
        case 'warning':
            return <Svg {...props}><Path d="M12 3L2 21h20L12 3z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Line x1="12" y1="10" x2="12" y2="15" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Circle cx="12" cy="18" r="0.5" fill={color} /></Svg>;
        case 'clock':
            return <Svg {...props}><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={sw} /><Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'sleep':
            return <Svg {...props}><Path d="M18 4l-4 4h4l-4 4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M14 12l-3 3h3l-3 3" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M21 12.79A9 9 0 1111.21 3" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>;

        case 'list':
            return <Svg {...props}><Line x1="8" y1="6" x2="21" y2="6" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="8" y1="12" x2="21" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="8" y1="18" x2="21" y2="18" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="3" y1="6" x2="3.01" y2="6" stroke={color} strokeWidth={sw + 1} strokeLinecap="round" /><Line x1="3" y1="12" x2="3.01" y2="12" stroke={color} strokeWidth={sw + 1} strokeLinecap="round" /><Line x1="3" y1="18" x2="3.01" y2="18" stroke={color} strokeWidth={sw + 1} strokeLinecap="round" /></Svg>;
        case 'calendar':
            return <Svg {...props}><Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth={sw} /><Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth={sw} /><Line x1="8" y1="14" x2="8.01" y2="14" stroke={color} strokeWidth={sw + 1} strokeLinecap="round" /><Line x1="12" y1="14" x2="12.01" y2="14" stroke={color} strokeWidth={sw + 1} strokeLinecap="round" /><Line x1="16" y1="14" x2="16.01" y2="14" stroke={color} strokeWidth={sw + 1} strokeLinecap="round" /></Svg>;
        case 'like':
            return <Svg {...props}><Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'user-plus':
            return <Svg {...props}><Path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Circle cx="8.5" cy="7" r="4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Line x1="20" y1="8" x2="20" y2="14" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Line x1="23" y1="11" x2="17" y2="11" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'comment-at':
            return <Svg {...props}><Path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M16 11a4 4 0 00-8 0v1a4 4 0 008 0" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M16 11A4 4 0 0112 15h0a4 4 0 01-4-4v0" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
        case 'calendar-outline':
            return <Svg {...props}><Rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth={sw} /><Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth={sw} /></Svg>;
        case 'mic-outline':
            return <Svg {...props}><Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Line x1="12" y1="19" x2="12" y2="23" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="8" y1="23" x2="16" y2="23" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>;
        case 'note':
            return <Svg {...props}><Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Polyline points="10 9 9 9 8 9" stroke={color} strokeWidth={sw} strokeLinecap="round" /></Svg>;
        case 'robot':
            return <Svg {...props}><Rect x="3" y="11" width="18" height="10" rx="2" ry="2" stroke={color} strokeWidth={sw} /><Circle cx="12" cy="5" r="2" stroke={color} strokeWidth={sw} /><Path d="M12 7v4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Line x1="8" y1="16" x2="8" y2="16" stroke={color} strokeWidth={sw + 1} strokeLinecap="round" /><Line x1="16" y1="16" x2="16" y2="16" stroke={color} strokeWidth={sw + 1} strokeLinecap="round" /></Svg>;
        case 'bulb':
            return <Svg {...props}><Path d="M9 18h6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M10 22h4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><Path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A6 6 0 1 0 7.5 11.5c.76.76 1.23 1.52 1.41 2.5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></Svg>;

        default:
            return <Svg {...props}><Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={sw} /><Line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth={sw} strokeLinecap="round" /><Circle cx="12" cy="16" r="0.5" fill={color} /></Svg>;
    }
};

export default Icon;
