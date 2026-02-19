'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type ProgressStep = 'writing' | 'illustrations';

const PLACEHOLDER_PHOTO_URL =
  'https://placehold.co/800x1000/FFE4F1/E24E8A?text=Your+Storybook+Cover';

export default function StoryCreatorForm() {
  const router = useRouter();

  const [characterName, setCharacterName] = useState('');
  const [characterAge, setCharacterAge] = useState('');
  const [storyDescription, setStoryDescription] = useState('');
  const [artStyle, setArtStyle] = useState<'watercolor' | 'whimsical' | 'soft_pastel' | 'bold_pop' | 'fantasy' | 'classic'>('watercolor');

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressStep, setProgressStep] = useState<ProgressStep>('writing');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cycle progress message while waiting for generate API
  useEffect(() => {
    if (!isSubmitting) return;
    setProgressStep('writing');
    const t = setTimeout(() => setProgressStep('illustrations'), 6000);
    return () => clearTimeout(t);
  }, [isSubmitting]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setPhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return objectUrl;
    });
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const addTagFromInput = () => {
    const value = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (value.length === 0) return;

    setTags((prev) => {
      const existing = new Set(prev);
      value.forEach((v) => existing.add(v));
      return Array.from(existing);
    });
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTagFromInput();
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      // Quick remove last tag
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!characterName.trim()) {
      setError('Please add a character name.');
      return;
    }
    if (!storyDescription.trim()) {
      setError('Please add a short description for the story.');
      return;
    }

    setIsSubmitting(true);

    try {
      let photoUrl = PLACEHOLDER_PHOTO_URL;

      if (photoFile) {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: photoFile.name,
            fileType: photoFile.type,
            fileSize: photoFile.size,
          }),
        });
        if (!uploadRes.ok) {
          const data = await uploadRes.json().catch(() => ({}));
          throw new Error(data.error || 'Photo upload failed');
        }
        const { signedUrl, publicUrl } = await uploadRes.json();
        const putRes = await fetch(signedUrl, {
          method: 'PUT',
          body: photoFile,
          headers: { 'Content-Type': photoFile.type },
        });
        if (!putRes.ok) throw new Error('Failed to upload photo to storage');
        photoUrl = publicUrl;
      }

      // 1) Create draft book
      const resBook = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: characterName.trim(),
          characterAge: characterAge ? Number(characterAge) : null,
          photoUrl,
          storyPrompt: storyDescription.trim(),
          inclusions: tags,
          artStyle,
        }),
      });

      if (!resBook.ok) {
        const data = await resBook.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create book.');
      }

      const { book } = await resBook.json();

      // 2) Trigger story generation
      const resGen = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id }),
      });

      if (!resGen.ok) {
        // We still redirect, but surface a gentle message in console
        console.error('Story generation failed', await resGen.json().catch(() => ({})));
      }

      // 3) Redirect to book preview (or dashboard if not ready)
      const targetPath = book?.id ? `/books/${book.id}` : '/dashboard';
      router.push(targetPath);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong while creating your story.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo upload */}
      <div>
        <label className="block font-display font-bold text-sm mb-2">📸 Character photo (optional)</label>
        <div
          className={`flex flex-col sm:flex-row gap-4 items-stretch sm:items-center`}
        >
          <div
            className={`flex-1 border-2 border-dashed rounded-2xl px-4 py-6 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-brand-pink bg-pink-50/60' : 'border-gray-200 bg-brand-page-bg'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <p className="font-display text-sm mb-1">Drag &amp; drop a photo here</p>
            <p className="text-xs text-brand-ink-muted mb-2">or click to browse from your device</p>
            <p className="text-[11px] text-brand-ink-muted">
              For now we&apos;ll use a placeholder cover behind the scenes while upload is wired up.
            </p>
          </div>

          <div className="w-28 h-36 rounded-xl overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-3xl shrink-0">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              '📖'
            )}
          </div>
        </div>
      </div>

      {/* Character basics */}
      <div className="grid grid-cols-1 sm:grid-cols-[2fr,1fr] gap-4">
        <div>
          <label className="block font-display font-bold text-sm mb-2">🧒 Character name</label>
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="Ava the Brave"
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block font-display font-bold text-sm mb-2">🎂 Age</label>
          <input
            type="number"
            min={1}
            max={18}
            value={characterAge}
            onChange={(e) => setCharacterAge(e.target.value)}
            placeholder="6"
            className="input-field"
          />
        </div>
      </div>

      {/* Story description */}
      <div>
        <label className="block font-display font-bold text-sm mb-2">📝 Story description</label>
        <textarea
          value={storyDescription}
          onChange={(e) => setStoryDescription(e.target.value)}
          placeholder="A cozy bedtime adventure with dragons that are friendly, not scary, and lots of stars and fireflies."
          className="input-field min-h-[120px] resize-y"
          required
        />
        <p className="text-xs text-brand-ink-muted mt-1">
          Share the vibe, themes, or lessons you want in the story. A few sentences is perfect.
        </p>
      </div>

      {/* Tags */}
      <div>
        <label className="block font-display font-bold text-sm mb-2">
          🏷️ People, places &amp; things to include
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 text-xs font-semibold text-brand-purple border border-purple-100 hover:bg-purple-100 transition-colors"
            >
              <span>{tag}</span>
              <span aria-hidden>×</span>
            </button>
          ))}
          {tags.length === 0 && (
            <span className="text-xs text-brand-ink-muted">
              e.g. Grandma Lucy, our dog Milo, Brooklyn Bridge, favorite stuffed bunny…
            </span>
          )}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          onBlur={addTagFromInput}
          placeholder="Type a name, place, or thing and press Enter"
          className="input-field"
        />
      </div>

      {/* Art style */}
      <div>
        <label className="block font-display font-bold text-sm mb-2">🎨 Art style</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { id: 'watercolor', label: 'Watercolor' },
            { id: 'whimsical', label: 'Whimsical' },
            { id: 'soft_pastel', label: 'Soft pastel' },
            { id: 'bold_pop', label: 'Bold pop' },
            { id: 'fantasy', label: 'Fantasy' },
            { id: 'classic', label: 'Classic' },
          ].map((style) => {
            const isActive = artStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setArtStyle(style.id as typeof artStyle)}
                className={`text-left rounded-xl px-3 py-2 text-xs sm:text-sm border transition-all ${
                  isActive
                    ? 'border-brand-pink bg-pink-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-brand-pink/70'
                }`}
              >
                <span className="font-display font-semibold">{style.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 border border-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
        <p className="text-xs text-brand-ink-muted">
          We&apos;ll first save your book as a draft, then ask our story AI to write the pages.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full sm:w-auto justify-center disabled:opacity-60"
        >
          {!isSubmitting && '📚 Create & generate story'}
          {isSubmitting && progressStep === 'writing' && '✨ Writing your story...'}
          {isSubmitting && progressStep === 'illustrations' && '🎨 Generating illustrations...'}
        </button>
      </div>
    </form>
  );
}

