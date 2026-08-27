import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  FileAudio,
  Music2,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { createMusic, getMusics, updateMusic, type Music, type MusicPayload } from "@/api/cms/musics";
import { uploadObjectWithPresignedUrl } from "@/api/objects";
import { queryKeys } from "@/api/query-keys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type MusicForm = {
  title: string;
  artist: string;
  musicKey: string;
  contentType: string;
  durationSeconds: string;
  isActive: boolean;
  fileName: string;
};

type ModalMode = { type: "create" } | { type: "edit"; item: Music };

const WAVEFORM_POINT_COUNT = 160;
const waveformCache = new Map<string, number[]>();

const emptyForm = (): MusicForm => ({
  title: "",
  artist: "",
  musicKey: "",
  contentType: "audio/mp3",
  durationSeconds: "",
  isActive: true,
  fileName: "",
});

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function readAudioDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const audio = document.createElement("audio");
    const objectUrl = URL.createObjectURL(file);

    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read audio duration"));
    };
    audio.src = objectUrl;
  });
}

function buildPayload(form: MusicForm): MusicPayload {
  return {
    title: form.title.trim(),
    artist: form.artist.trim(),
    musicKey: form.musicKey.trim(),
    durationSeconds: Number(form.durationSeconds),
    isActive: form.isActive,
    contentType: form.contentType.trim(),
  };
}

function fallbackWaveformBars(seed: string) {
  const source = seed || "momenia-music";

  return Array.from({ length: WAVEFORM_POINT_COUNT }, (_, index) => {
    const code = source.charCodeAt(index % source.length);
    return 10 + ((code + index * 13) % 62);
  });
}

function getAudioContextConstructor() {
  return (
    window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  );
}

function buildWaveformBars(audioBuffer: AudioBuffer) {
  const channelCount = Math.max(1, audioBuffer.numberOfChannels);
  const samplesPerBar = Math.max(1, Math.floor(audioBuffer.length / WAVEFORM_POINT_COUNT));

  const peaks = Array.from({ length: WAVEFORM_POINT_COUNT }, (_, barIndex) => {
    const start = barIndex * samplesPerBar;
    const end = Math.min(start + samplesPerBar, audioBuffer.length);
    const sampleStep = Math.max(1, Math.floor((end - start) / 220));
    let peak = 0;

    for (let sampleIndex = start; sampleIndex < end; sampleIndex += sampleStep) {
      for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
        const channel = audioBuffer.getChannelData(channelIndex);
        peak = Math.max(peak, Math.abs(channel[sampleIndex] ?? 0));
      }
    }

    return peak;
  });

  const maxPeak = Math.max(...peaks, 0.01);

  return peaks.map((peak) => 8 + Math.round((peak / maxPeak) * 78));
}

function buildWaveformPath(amplitudes: number[]) {
  if (amplitudes.length === 0) {
    return "";
  }

  const centerY = 50;
  const maxHalfHeight = 40;
  const topPoints = amplitudes.map((amplitude, index) => {
    const x = amplitudes.length === 1 ? 0 : (index / (amplitudes.length - 1)) * 100;
    const halfHeight = (Math.min(92, Math.max(4, amplitude)) / 100) * maxHalfHeight;

    return `${x.toFixed(2)},${(centerY - halfHeight).toFixed(2)}`;
  });
  const bottomPoints = [...amplitudes].reverse().map((amplitude, reverseIndex) => {
    const index = amplitudes.length - 1 - reverseIndex;
    const x = amplitudes.length === 1 ? 100 : (index / (amplitudes.length - 1)) * 100;
    const halfHeight = (Math.min(92, Math.max(4, amplitude)) / 100) * maxHalfHeight;

    return `${x.toFixed(2)},${(centerY + halfHeight).toFixed(2)}`;
  });

  return `M ${topPoints.join(" L ")} L ${bottomPoints.join(" L ")} Z`;
}

async function getWaveformBarsFromUrl(audioUrl: string) {
  const cachedBars = waveformCache.get(audioUrl);

  if (cachedBars) {
    return cachedBars;
  }

  const AudioContextConstructor = getAudioContextConstructor();

  if (!AudioContextConstructor) {
    throw new Error("Audio decoding is not available in this browser");
  }

  const response = await fetch(audioUrl);

  if (!response.ok) {
    throw new Error("Could not load audio for waveform");
  }

  const audioContext = new AudioContextConstructor();

  try {
    const audioBuffer = await audioContext.decodeAudioData(await response.arrayBuffer());
    const bars = buildWaveformBars(audioBuffer);

    waveformCache.set(audioUrl, bars);

    return bars;
  } finally {
    await audioContext.close().catch(() => undefined);
  }
}

export default function MusicManagement() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modal, setModal] = useState<ModalMode | null>(null);
  const [form, setForm] = useState<MusicForm>(emptyForm());
  const [formError, setFormError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [activeMusicId, setActiveMusicId] = useState<string | null>(null);

  const {
    data: musics = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.musics.lists(),
    queryFn: getMusics,
  });

  const createMutation = useMutation({
    mutationFn: (payload: MusicPayload) => createMusic(payload),
    onSuccess: () => {
      toast.success("Music created");
      queryClient.invalidateQueries({ queryKey: queryKeys.musics.all });
      setModal(null);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Could not create music";
      setFormError(message);
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MusicPayload }) => updateMusic(id, payload),
    onSuccess: () => {
      toast.success("Music updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.musics.all });
      setModal(null);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Could not update music";
      setFormError(message);
      toast.error(message);
    },
  });

  const activeCount = musics.filter((music) => music.isActive).length;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openCreate = () => {
    setForm(emptyForm());
    setFormError("");
    setModal({ type: "create" });
  };

  const openEdit = (music: Music) => {
    setForm({
      title: music.title,
      artist: music.artist,
      musicKey: music.musicKey,
      contentType: music.contentType,
      durationSeconds: String(music.durationSeconds),
      isActive: music.isActive,
      fileName: "",
    });
    setFormError("");
    setModal({ type: "edit", item: music });
  };

  const handleAudioSelect = async (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setFormError("Choose an audio file.");
      return;
    }

    setIsUploading(true);
    setFormError("");

    try {
      const [uploaded, durationSeconds] = await Promise.all([
        uploadObjectWithPresignedUrl(file, "music"),
        readAudioDuration(file).catch(() => 0),
      ]);

      setForm((current) => ({
        ...current,
        musicKey: uploaded.key,
        contentType: uploaded.contentType || file.type || current.contentType,
        durationSeconds: durationSeconds > 0 ? String(durationSeconds) : current.durationSeconds,
        fileName: file.name,
      }));
      toast.success("Audio uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload audio";
      setFormError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = () => {
    const payload = buildPayload(form);

    if (!payload.title) {
      setFormError("Title is required.");
      return;
    }

    if (!payload.artist) {
      setFormError("Artist is required.");
      return;
    }

    if (!payload.musicKey) {
      setFormError("Upload an audio file or enter a music key.");
      return;
    }

    if (!Number.isInteger(payload.durationSeconds) || payload.durationSeconds < 1) {
      setFormError("Duration must be at least 1 second.");
      return;
    }

    if (!payload.contentType) {
      setFormError("Content type is required.");
      return;
    }

    setFormError("");

    if (modal?.type === "edit") {
      updateMutation.mutate({ id: modal.item.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] px-4 py-6 md:px-6 lg:px-7">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-200">
              <Music2 className="size-3.5" />
              Audio library
            </div>
            <h1 className="text-2xl font-bold text-foreground">Music Management</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Curate reusable tracks for templates, keep metadata clean, and preview every upload before it goes live.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="button" variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCcw className="size-4" />
              Refresh
            </Button>
            <Button type="button" onClick={openCreate}>
              <Plus className="size-4" />
              Add music
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard label="Tracks" value={musics.length} />
          <MetricCard label="Active" value={activeCount} accent="text-emerald-600 dark:text-emerald-300" />
        </div>

        {isLoading && (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="h-16 animate-pulse border-b border-border bg-muted/60" />
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="grid gap-4 border-b border-border p-4 md:grid-cols-[1fr_240px_120px]">
                <div className="h-12 animate-pulse rounded-md bg-muted" />
                <div className="h-12 animate-pulse rounded-md bg-muted" />
                <div className="h-12 animate-pulse rounded-md bg-muted" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <Card className="p-6">
            <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>Could not load music from the API.</span>
              <Button type="button" variant="secondary" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          </Card>
        )}

        {!isLoading && !isError && musics.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-full border border-cyan-400/25 bg-cyan-400/10 p-4 text-cyan-700 dark:text-cyan-200">
                <FileAudio className="size-7" />
              </div>
              <h2 className="text-lg font-semibold">No music yet</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Upload the first track and save its title, artist, duration, and publishing status.
              </p>
              <Button type="button" className="mt-5" onClick={openCreate}>
                <Plus className="size-4" />
                Add music
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && musics.length > 0 && (
          <Card className="gap-0 overflow-hidden py-0">
            <div className="hidden border-b border-border bg-muted/50 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground lg:grid lg:grid-cols-[minmax(260px,1fr)_minmax(340px,0.95fr)_140px_120px]">
              <span>Track</span>
              <span>Preview</span>
              <span>Duration</span>
              <span className="text-right">Status</span>
            </div>
            <div className="divide-y divide-border">
              {musics.map((music) => (
                <MusicRow
                  key={`${music.id}-${music.musicUrl}`}
                  music={music}
                  isPlaying={activeMusicId === music.id}
                  onPlayChange={(playing) => setActiveMusicId(playing ? music.id : null)}
                  onEdit={openEdit}
                />
              ))}
            </div>
          </Card>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close music form"
            className="fixed inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => !isSaving && !isUploading && setModal(null)}
          />
          <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {modal.type === "create" ? "Add music" : "Edit music"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Save metadata exactly as it should appear in the template editor.
                </p>
              </div>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={isSaving || isUploading}
                onClick={() => setModal(null)}
              >
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            <div className="max-h-[calc(100vh-11rem)] overflow-y-auto px-6 py-5">
              {formError && (
                <div className="mb-5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {formError}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="music-title">Title</Label>
                  <Input
                    id="music-title"
                    value={form.title}
                    placeholder="lofi jazz"
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="music-artist">Artist</Label>
                  <Input
                    id="music-artist"
                    value={form.artist}
                    placeholder="indra"
                    onChange={(event) => setForm((current) => ({ ...current, artist: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="music-duration">Duration seconds</Label>
                  <Input
                    id="music-duration"
                    inputMode="numeric"
                    value={form.durationSeconds}
                    placeholder="100"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        durationSeconds: event.target.value.replace(/\D/g, ""),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="music-content-type">Content type</Label>
                  <Input
                    id="music-content-type"
                    value={form.contentType}
                    placeholder="audio/mp3"
                    onChange={(event) => setForm((current) => ({ ...current, contentType: event.target.value }))}
                  />
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <Label>Audio file</Label>
                <button
                  type="button"
                  disabled={isUploading || isSaving}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 rounded-lg border border-dashed border-border bg-background px-4 py-4 text-left transition-colors hover:border-cyan-500/70 hover:bg-cyan-500/5",
                    (isUploading || isSaving) && "cursor-not-allowed opacity-60",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="rounded-lg bg-cyan-400/10 p-2 text-cyan-700 dark:text-cyan-200">
                      <UploadCloud className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {isUploading ? "Uploading audio..." : form.fileName || "Choose an audio file"}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {form.fileName || form.musicKey ? "Audio is ready to save." : "The music key is stored after upload."}
                      </span>
                    </span>
                  </span>
                  {form.musicKey && !isUploading && <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(event) => handleAudioSelect(event.target.files?.[0])}
                />
              </div>

              <div className="mt-5 flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">Active</p>
                  <p className="text-xs text-muted-foreground">Show this track as available for use.</p>
                </div>
                <button
                  type="button"
                  aria-pressed={form.isActive}
                  onClick={() => setForm((current) => ({ ...current, isActive: !current.isActive }))}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    form.isActive ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-1 top-1 size-4 rounded-full bg-white shadow transition-transform",
                      form.isActive && "translate-x-5",
                    )}
                  />
                  <span className="sr-only">Toggle active status</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving || isUploading}
                onClick={() => setModal(null)}
              >
                Cancel
              </Button>
              <Button type="button" disabled={isSaving || isUploading} onClick={handleSubmit}>
                {isSaving ? "Saving..." : modal.type === "create" ? "Create music" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="px-5">
        <CardTitle className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="px-5">
        <div className={cn("text-2xl font-bold", accent)}>{value}</div>
      </CardContent>
    </Card>
  );
}

function WaveformSilhouette({
  amplitudes,
  clipId,
  isLoading,
  onSeekProgress,
  progress,
}: {
  amplitudes: number[];
  clipId: string;
  isLoading: boolean;
  onSeekProgress: (progress: number) => void;
  progress: number;
}) {
  const path = buildWaveformPath(amplitudes);
  const progressWidth = Math.min(100, Math.max(0, progress * 100));
  const seekFromPointer = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    if (rect.width <= 0) {
      return;
    }

    onSeekProgress((event.clientX - rect.left) / rect.width);
  };
  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    seekFromPointer(event);
  };
  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.buttons !== 1) {
      return;
    }

    seekFromPointer(event);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onSeekProgress(progress - 0.05);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      onSeekProgress(progress + 0.05);
    }

    if (event.key === "Home") {
      event.preventDefault();
      onSeekProgress(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      onSeekProgress(1);
    }
  };

  return (
    <button
      type="button"
      aria-label="Seek audio"
      className="h-12 min-w-0 flex-1 cursor-pointer py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={cn("h-full w-full overflow-visible", isLoading && "opacity-60")}
      >
        <path d={path} className="fill-zinc-300 dark:fill-zinc-700" />
        <clipPath id={clipId}>
          <rect x="0" y="0" width={progressWidth} height="100" />
        </clipPath>
        <path d={path} clipPath={`url(#${clipId})`} className="fill-zinc-950 dark:fill-zinc-100" />
      </svg>
    </button>
  );
}

function MusicRow({
  music,
  isPlaying,
  onPlayChange,
  onEdit,
}: {
  music: Music;
  isPlaying: boolean;
  onPlayChange: (playing: boolean) => void;
  onEdit: (music: Music) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformClipId = `waveform-${useId().replace(/:/g, "")}`;
  const [bars, setBars] = useState(() => fallbackWaveformBars(music.id));
  const [isWaveformLoading, setIsWaveformLoading] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const loadWaveform = async () => {
      setIsWaveformLoading(true);

      try {
        const nextBars = await getWaveformBarsFromUrl(music.musicUrl);

        if (!isCancelled) {
          setBars(nextBars);
        }
      } catch {
        if (!isCancelled) {
          setBars(fallbackWaveformBars(music.id));
        }
      } finally {
        if (!isCancelled) {
          setIsWaveformLoading(false);
        }
      }
    };

    void loadWaveform();

    return () => {
      isCancelled = true;
    };
  }, [music.id, music.musicUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isPlaying) {
      audio.pause();
    }
  }, [isPlaying]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      onPlayChange(false);
      return;
    }

    try {
      await audio.play();
      onPlayChange(true);
    } catch {
      toast.error("Could not play this audio file");
    }
  };

  const updatePlaybackProgress = () => {
    const audio = audioRef.current;

    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
      return;
    }

    setPlaybackProgress(Math.min(1, Math.max(0, audio.currentTime / audio.duration)));
  };

  const handleAudioEnded = () => {
    setPlaybackProgress(0);
    onPlayChange(false);
  };
  const seekToProgress = (nextProgress: number) => {
    const audio = audioRef.current;
    const clampedProgress = Math.min(1, Math.max(0, nextProgress));
    const duration =
      audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : music.durationSeconds;

    if (!audio || !Number.isFinite(duration) || duration <= 0) {
      return;
    }

    try {
      audio.currentTime = duration * clampedProgress;
      setPlaybackProgress(clampedProgress);
    } catch {
      toast.error("Could not seek this audio file");
    }
  };

  return (
    <article className="grid gap-4 px-4 py-4 transition-colors hover:bg-muted/30 lg:grid-cols-[minmax(260px,1fr)_minmax(340px,0.95fr)_140px_120px] lg:items-center lg:px-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-sm font-semibold">{music.title}</h2>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0",
              music.isActive
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
            )}
          >
            {music.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">{music.artist}</p>
        <p className="mt-2 truncate font-mono text-xs text-muted-foreground">{music.musicKey}</p>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <Button type="button" size="icon-sm" variant="outline" onClick={togglePlayback}>
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          <span className="sr-only">{isPlaying ? "Pause" : "Play"} {music.title}</span>
        </Button>
        <WaveformSilhouette
          amplitudes={bars}
          clipId={waveformClipId}
          isLoading={isWaveformLoading}
          onSeekProgress={seekToProgress}
          progress={playbackProgress}
        />
        <audio
          ref={audioRef}
          src={music.musicUrl}
          onEnded={handleAudioEnded}
          onLoadedMetadata={updatePlaybackProgress}
          onSeeked={updatePlaybackProgress}
          onTimeUpdate={updatePlaybackProgress}
          preload="metadata"
        />
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock3 className="size-4" />
        <span>{formatDuration(music.durationSeconds)}</span>
      </div>

      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <span className="text-xs text-muted-foreground lg:hidden">{music.contentType}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(music)}>
          Edit
        </Button>
      </div>
    </article>
  );
}
