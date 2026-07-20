'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';

const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxBytes = 8 * 1024 * 1024;
const maxPhotos = 5;

export function PhotoPicker({ files, onChange, onError }: { files: readonly File[]; onChange(files: File[]): void; onError(message: string): void }) {
  const input = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';
    const next = [...files];
    for (const file of selected) {
      if (next.length >= maxPhotos) { onError('A sighting can have at most 5 photos.'); break; }
      if (!acceptedTypes.has(file.type)) { onError('Only JPG, PNG, or WebP images are accepted.'); continue; }
      if (file.size <= 0) { onError('Empty image files are not accepted.'); continue; }
      if (file.size > maxBytes) { onError('Each photo must be 8 MB or smaller.'); continue; }
      next.push(file);
    }
    onChange(next);
  }

  return <section className="photo-picker"><div className="section-heading"><span className="eyebrow">Optional photos</span><h3>Add clear, recent images</h3><p>Up to five JPG, PNG, or WebP files, 8 MB each. The server validates content and removes supported metadata before public storage.</p></div><input ref={input} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={choose} /><button className="secondary-action" type="button" onClick={() => input.current?.click()}>Choose photos</button>{files.length ? <div className="photo-preview-grid">{files.map((file, index) => <figure key={`${file.name}-${String(file.lastModified)}-${String(index)}`}><img src={previews[index]} alt={`Selected photo ${String(index + 1)} preview`} /><figcaption><span>{file.name}</span><button type="button" aria-label={`Remove ${file.name}`} onClick={() => onChange(files.filter((_, candidate) => candidate !== index))}>Remove</button></figcaption></figure>)}</div> : <p className="photo-empty">No photos selected. A report can still be submitted without photos.</p>}</section>;
}
