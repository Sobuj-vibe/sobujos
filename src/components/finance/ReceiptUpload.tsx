import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadReceipt, useSignedReceiptUrl } from '@/hooks/useFinance';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Props = {
  value: string | null;
  onChange: (path: string | null) => void;
  /** Called with the storage path right after upload — useful for OCR. */
  onUploaded?: (path: string) => void;
  label?: string;
};

export function ReceiptUpload({ value, onChange, onUploaded, label }: Props) {
  const { user } = useAuth();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const url = useSignedReceiptUrl(value);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !user) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    setBusy(true);
    try {
      const path = await uploadReceipt(user.id, f);
      onChange(path);
      onUploaded?.(path);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  };

  const removeFile = async () => {
    if (value) await supabase.storage.from('finance-receipts').remove([value]);
    onChange(null);
  };

  return (
    <div>
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={handle} />
      {url ? (
        <div className="relative inline-block">
          <img src={url} alt="receipt" className="h-24 w-24 rounded-lg object-cover border border-border" />
          <button
            type="button"
            onClick={removeFile}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            aria-label="Remove"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {label || 'Upload receipt'}
        </Button>
      )}
    </div>
  );
}