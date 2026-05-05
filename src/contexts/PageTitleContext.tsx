import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Ctx = {
  title: string;
  subtitle?: string;
  setTitle: (title: string, subtitle?: string) => void;
};

const PageTitleCtx = createContext<Ctx>({ title: '', setTitle: () => {} });

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitleState] = useState('');
  const [subtitle, setSubtitle] = useState<string | undefined>();
  const setTitle = (t: string, s?: string) => {
    setTitleState(t);
    setSubtitle(s);
  };
  return (
    <PageTitleCtx.Provider value={{ title, subtitle, setTitle }}>
      {children}
    </PageTitleCtx.Provider>
  );
}

export const usePageTitleContext = () => useContext(PageTitleCtx);

/** Pages call this to set the page title (for desktop topbar + mobile AppBar fallback). */
export function usePageTitle(title: string, subtitle?: string) {
  const { setTitle } = usePageTitleContext();
  useEffect(() => {
    setTitle(title, subtitle);
  }, [title, subtitle, setTitle]);
}