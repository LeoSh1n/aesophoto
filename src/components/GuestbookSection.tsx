import React, { useEffect, useState } from 'react';
import { Camera, Check, MessageSquarePlus, Trash2, X } from 'lucide-react';
import { GuestbookEntry } from '../types/photobooth';
import { createGuestbookThumbnail } from '../utils/printService';

interface GuestbookSectionProps {
  currentStripDataUrl: string | null;
  attachTriggerNonce: number;
}

const VISIT_TAGS = ['방문 기념', '커플 촬영', '친구들과', '혼자 네컷', '오늘의 기록'];

export function GuestbookSection({
  currentStripDataUrl,
  attachTriggerNonce,
}: GuestbookSectionProps) {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');
  const [tag, setTag] = useState(VISIT_TAGS[0]);
  const [attachPhoto, setAttachPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (attachTriggerNonce > 0 && currentStripDataUrl) {
      setAttachPhoto(true);
    }
  }, [attachTriggerNonce, currentStripDataUrl]);

  useEffect(() => {
    let active = true;
    fetch('/api/guestbook')
      .then((res) => res.json())
      .then((data) => {
        if (active && Array.isArray(data.entries)) {
          setEntries(data.entries);
        }
      })
      .catch(() => {
        // Fallback if API unavailable
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedAuthor = author.trim();
    const trimmedMessage = message.trim();

    if (!trimmedAuthor || !trimmedMessage) {
      setErrorMsg('이름과 방명록 메시지를 모두 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      let photoDataUrl: string | undefined;
      if (attachPhoto && currentStripDataUrl) {
        photoDataUrl = await createGuestbookThumbnail(currentStripDataUrl);
      }

      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: trimmedAuthor,
          message: trimmedMessage,
          tag,
          photoDataUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || '방명록 등록에 실패했습니다.');
        return;
      }

      if (data.entry) {
        setEntries((prev) => [data.entry, ...prev]);
        setAuthor('');
        setMessage('');
        setAttachPhoto(false);
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 2500);
      }
    } catch {
      setErrorMsg('서버 연결 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/guestbook/${id}`, { method: 'DELETE' });
      setEntries((prev) => prev.filter((item) => item.id !== id));
    } catch {
      // Ignore delete error
    }
  };

  return (
    <section id="guestbook" className="no-print border-b border-white/10 py-14 md:py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wider text-zinc-400">
              04. 방명록
            </p>
            <h2 className="font-display mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-white">
              사진을 찍고 오늘의 기록을 남겨보세요
            </h2>
          </div>
          <p className="text-xs text-zinc-400 font-mono-tabular">
            총 {entries.length}개의 방명록
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
          {/* Left: Write Guestbook Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-5 flex flex-col gap-4 rounded-2xl border border-white/15 bg-[#0B0B0D] p-6"
          >
            <div>
              <label
                htmlFor="gb-author"
                className="block text-xs font-semibold text-zinc-300 mb-2"
              >
                이름 / 닉네임
              </label>
              <input
                id="gb-author"
                type="text"
                maxLength={24}
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="예: 민지, 커플 스튜디오"
                className="w-full rounded-xl border border-white/15 bg-[#050505] px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <span className="block text-xs font-semibold text-zinc-300 mb-2">
                방문 테마
              </span>
              <div className="flex flex-wrap gap-1.5">
                {VISIT_TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      tag === t
                        ? 'border-white bg-white text-black'
                        : 'border-white/10 bg-[#050505] text-zinc-400 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="gb-message"
                  className="text-xs font-semibold text-zinc-300"
                >
                  방명록 메시지
                </label>
                <span className="font-mono-tabular text-[11px] text-zinc-500">
                  {message.length} / 160
                </span>
              </div>
              <textarea
                id="gb-message"
                rows={3}
                maxLength={160}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="오늘 촬영한 소감이나 기억하고 싶은 한마디를 적어주세요."
                className="w-full resize-none rounded-xl border border-white/15 bg-[#050505] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
              />
            </div>

            {/* Attach Current Photo Strip Option */}
            <div className="rounded-xl border border-white/10 bg-[#050505] p-3.5">
              {currentStripDataUrl ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={currentStripDataUrl}
                      alt="첨부할 네컷사진"
                      className="h-14 w-10 shrink-0 rounded border border-white/15 object-cover bg-black"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        방금 만든 네컷사진 첨부
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        방명록 카드에 내 네컷사진을 함께 전시합니다
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachPhoto((v) => !v)}
                    className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      attachPhoto
                        ? 'border-white bg-white text-black'
                        : 'border-white/20 text-zinc-300 hover:border-white/40'
                    }`}
                  >
                    {attachPhoto ? (
                      <span className="inline-flex items-center gap-1">
                        <X className="h-3 w-3" /> 첨부 해제
                      </span>
                    ) : (
                      '함께 올리기'
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 text-xs text-zinc-400">
                  <Camera className="h-4 w-4 shrink-0 text-zinc-500" />
                  <span>
                    위 스튜디오에서 사진을 찍거나 샘플을 불러오면 방명록에 네컷사진도 함께 첨부할 수 있습니다.
                  </span>
                </div>
              )}
            </div>

            {errorMsg && (
              <p className="text-xs text-zinc-200 bg-white/10 border border-white/15 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  방명록에 등록되었습니다
                </>
              ) : (
                <>
                  <MessageSquarePlus className="h-4 w-4" />
                  {submitting ? '등록 중...' : '방명록 남기기'}
                </>
              )}
            </button>
          </form>

          {/* Right: Guestbook Wall */}
          <div className="lg:col-span-7">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-[#0B0B0D] p-10 text-center text-sm text-zinc-400">
                방명록을 불러오는 중입니다...
              </div>
            ) : entries.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#0B0B0D] p-10 text-center text-sm text-zinc-400">
                첫 번째 방명록의 주인공이 되어보세요.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {entries.map((entry) => (
                  <article
                    key={entry.id}
                    className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0B0B0D] p-5 transition-colors hover:border-white/25"
                  >
                    <div className="flex gap-4">
                      {entry.photoDataUrl && (
                        <div className="w-20 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black">
                          <img
                            src={entry.photoDataUrl}
                            alt={`${entry.author}님의 네컷사진`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-zinc-400">
                            {entry.tag}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            title="방명록 삭제"
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-zinc-500 hover:text-white transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-100 break-words">
                          {entry.message}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-zinc-400">
                      <span className="font-semibold text-white truncate">
                        {entry.author}
                      </span>
                      <span className="font-mono-tabular shrink-0">
                        {entry.createdAt}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
