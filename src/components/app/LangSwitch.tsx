import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function LangSwitch() {
  const { i18n } = useTranslation();
  const change = (l: string) => { i18n.changeLanguage(l); localStorage.setItem('app_lang', l); };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-2 rounded-full hover:bg-muted tap inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Languages className="h-4 w-4" />
        <span>{i18n.language === 'bn' ? 'বাং' : 'EN'}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => change('bn')}>বাংলা</DropdownMenuItem>
        <DropdownMenuItem onClick={() => change('en')}>English</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
