'use client';

import { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';

interface FilePreviewProps {
  url: string;
  filename: string;
}

export default function FilePreview({ url, filename }: FilePreviewProps) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);

  useEffect(() => {
    if (isImg || ext === 'pdf') {
      setLoading(false);
      return;
    }

    if (ext === 'docx' || ext === 'doc') {
      setLoading(true);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
      script.onload = async () => {
        try {
          const res = await fetch(url);
          const arrayBuffer = await res.arrayBuffer();
          // @ts-expect-error mammoth loaded globally
          const result = await window.mammoth.convertToHtml({ arrayBuffer });
          setContent(result.value);
        } catch {
          setError(true);
        } finally {
          setLoading(false);
        }
      };
      script.onerror = () => { setError(true); setLoading(false); };
      document.head.appendChild(script);
      return () => { document.head.removeChild(script); };
    }

    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      setLoading(true);
      const script = document.createElement('script');
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js';
      script.onload = async () => {
        try {
          const res = await fetch(url);
          const arrayBuffer = await res.arrayBuffer();
          // @ts-expect-error XLSX loaded globally
          const workbook = window.XLSX.read(arrayBuffer);
          const html = workbook.SheetNames.map((name: string) =>
            // @ts-expect-error XLSX loaded globally
            window.XLSX.utils.sheet_to_html(workbook.Sheets[name], { editable: false })
          ).join('<hr/>');
          setContent(html);
        } catch {
          setError(true);
        } finally {
          setLoading(false);
        }
      };
      script.onerror = () => { setError(true); setLoading(false); };
      document.head.appendChild(script);
      return () => { document.head.removeChild(script); };
    }

    setLoading(false);
  }, [url, filename, isImg, ext]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-2">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading preview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <FileText className="size-16 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Unable to preview this file.</p>
        <a href={url} download={filename} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">
          Download file
        </a>
      </div>
    );
  }

  if (isImg) {
    return <img src={url} alt={filename} className="w-full h-full object-contain" />;
  }

  if (ext === 'pdf') {
    return <iframe src={url} className="w-full h-full border-0" title={filename} />;
  }

  if (content) {
    return (
      <div
        className="p-6 prose prose-sm max-w-none bg-white"
        style={{ color: '#000' }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <FileText className="size-16 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">This file type is not supported for preview.</p>
      <a href={url} download={filename} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">
        Download file
      </a>
    </div>
  );
}
