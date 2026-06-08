export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function buildRecordingStream(streams: MediaStream[]) {
  const tracks = streams.flatMap((stream) => stream.getTracks());
  return new MediaStream(tracks);
}

export type RecordingFormat = {
  extension: "mp4" | "webm";
  mimeType: string;
};

const preferredFormats: RecordingFormat[] = [
  { extension: "mp4", mimeType: "video/mp4;codecs=avc1,mp4a.40.2" },
  { extension: "mp4", mimeType: "video/mp4" },
  { extension: "webm", mimeType: "video/webm;codecs=vp8,opus" },
  { extension: "webm", mimeType: "video/webm" },
];

export function getSupportedRecordingFormat(): RecordingFormat {
  return preferredFormats.find((format) => MediaRecorder.isTypeSupported(format.mimeType)) ?? preferredFormats[preferredFormats.length - 1];
}
