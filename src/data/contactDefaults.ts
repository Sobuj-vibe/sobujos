export const DEFAULT_CONTACT_GROUPS = [
  { name: 'University', color: 'indigo', icon: 'GraduationCap' },
  { name: 'RBIT Clients', color: 'emerald', icon: 'Briefcase' },
  { name: 'Service Sellers', color: 'amber', icon: 'Store' },
  { name: 'Family', color: 'rose', icon: 'Heart' },
  { name: 'Friends', color: 'sky', icon: 'Users' },
  { name: 'Others', color: 'teal', icon: 'Contact' },
];

export const SOCIAL_PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: 'Facebook', match: /facebook\.com|fb\.com|fb\.me/i },
  { id: 'instagram', name: 'Instagram', icon: 'Instagram', match: /instagram\.com|instagr\.am/i },
  { id: 'x', name: 'X / Twitter', icon: 'Twitter', match: /twitter\.com|x\.com/i },
  { id: 'linkedin', name: 'LinkedIn', icon: 'Linkedin', match: /linkedin\.com/i },
  { id: 'github', name: 'GitHub', icon: 'Github', match: /github\.com/i },
  { id: 'youtube', name: 'YouTube', icon: 'Youtube', match: /youtube\.com|youtu\.be/i },
  { id: 'telegram', name: 'Telegram', icon: 'Send', match: /t\.me|telegram/i },
  { id: 'discord', name: 'Discord', icon: 'MessageCircle', match: /discord\.gg|discord\.com/i },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'MessageCircle', match: /wa\.me|whatsapp\.com/i },
  { id: 'wechat', name: 'WeChat', icon: 'MessageCircle', match: /weixin\.qq|wechat/i },
  { id: 'tiktok', name: 'TikTok', icon: 'Music2', match: /tiktok\.com/i },
  { id: 'website', name: 'Website', icon: 'Globe', match: /.*/i },
];

export function detectPlatform(url: string) {
  for (const p of SOCIAL_PLATFORMS) {
    if (p.match.test(url)) return p;
  }
  return SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1];
}

export const PHONE_LABELS = ['mobile', 'work', 'home', 'whatsapp', 'wechat', 'other'];
export const EMAIL_LABELS = ['personal', 'work', 'school', 'other'];
export const ADDRESS_LABELS = ['home', 'work', 'other'];

export const RELATIONSHIP_PRESETS = [
  'father', 'mother', 'brother', 'sister', 'son', 'daughter',
  'husband', 'wife', 'cousin', 'uncle', 'aunt', 'nephew', 'niece',
  'friend', 'colleague', 'classmate', 'teacher', 'student', 'mentor', 'boss',
];
