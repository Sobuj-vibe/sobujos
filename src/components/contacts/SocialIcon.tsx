import * as Icons from 'lucide-react';
import { detectPlatform, SOCIAL_PLATFORMS } from '@/data/contactDefaults';

export function SocialIcon({ platform, url, className }: { platform?: string; url?: string; className?: string }) {
  const p = platform
    ? SOCIAL_PLATFORMS.find((x) => x.id === platform) || SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1]
    : detectPlatform(url || '');
  const I = (Icons[p.icon as keyof typeof Icons] as any) || Icons.Globe;
  return <I className={className || 'h-4 w-4'} />;
}
