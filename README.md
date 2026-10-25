# KLIX Portal

KLIX Portal is a local-first browser workspace for creator tools. This first release introduces KLIX Enhance: a responsive foundation for importing, previewing, comparing, and configuring local images and video.

## Implemented

- Portal dashboard with KLIX Enhance and future-tool cards
- Drag-and-drop and picker import for MP4, browser-supported MOV, WebM, PNG, JPG, and WebP
- Native video playback, timeline, sound control, and fullscreen
- Image and video metadata extraction using browser-native media elements
- Reusable before/after viewer with a pointer and touch draggable divider
- Enhancement configuration UI, profiles, presets, adjustment sliders, and output predictions
- Lightweight browser capability detection for WebGPU, WebCodecs, Workers, and OffscreenCanvas

## Architecture

`src/features/enhance` keeps media types, utilities, hooks, and workspace components together. `useMediaFile` owns the browser object URL lifecycle and metadata read; processing is deliberately not part of the rendering path. The component boundaries leave room for workers, WebCodecs, WebGPU, OffscreenCanvas, and future local processing adapters.

## Privacy

Imported files remain in the browser. Previews use `URL.createObjectURL()` and object URLs are revoked when media is replaced or the workspace unmounts. No media is uploaded or converted to base64.

## Development

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Browser limitations

MOV support and codec availability depend on the browser and operating system. FPS and codec information are intentionally shown as unavailable until a deeper inspection adapter is added. Enhancement controls configure future processing only; they do not alter media in this release.

## Roadmap

The next phase adds classic local enhancement with lightweight GPU and image filtering, followed by optional local AI processing adapters.
