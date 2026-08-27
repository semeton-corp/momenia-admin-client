import { apiClient } from "@/api/http-client";

export type Music = {
  id: string;
  title: string;
  artist: string;
  musicKey: string;
  musicUrl: string;
  contentType: string;
  durationSeconds: number;
  isActive: boolean;
};

export type MusicPayload = {
  title: string;
  artist: string;
  musicKey: string;
  durationSeconds: number;
  isActive: boolean;
  contentType: string;
};

export function getMusics() {
  return apiClient.get<Music[]>("/api/v1/musics");
}

export function getMusicById(id: string) {
  return apiClient.get<Music>(`/api/v1/musics/${id}`);
}

export function createMusic(payload: MusicPayload) {
  return apiClient.post<Music>("/api/v1/musics", payload);
}

export function updateMusic(id: string, payload: MusicPayload) {
  return apiClient.put<Music>(`/api/v1/musics/${id}`, payload);
}
