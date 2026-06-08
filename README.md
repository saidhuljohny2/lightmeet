# LightMeet

A simple, lightweight online meeting platform built with Next.js 15, TypeScript, Tailwind CSS, WebRTC, and a tiny WebSocket signaling relay.

## Features

- Create a meeting with a unique ID
- Join a meeting by URL or meeting ID
- Peer-to-peer camera and microphone with WebRTC
- Camera toggle, microphone mute, screen sharing, and leave controls
- Participant tiles with names, status, participant count, and raise hand state
- Lightweight in-memory meeting chat
- Local recording with the MediaRecorder API and direct WebM download
- Meeting timer and basic connection quality indicator
- Responsive layout for desktop, tablet, and mobile
- No database, accounts, cloud storage, or paid meeting SDKs

## Important Vercel Note

The Next.js app is optimized for Vercel free tier deployment. The signaling relay is intentionally separate because Vercel Functions do not act as a WebSocket server. Vercel documents this limitation in its WebSockets limits and recommends external realtime providers or services for persistent WebSocket connections:

- [Vercel WebSocket guide](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections)
- [Vercel limits: WebSockets](https://vercel.com/docs/limits/overview#websockets)

For production, deploy the Next.js app to Vercel and point `NEXT_PUBLIC_SIGNALING_URL` at any free WebSocket-capable host running `signaling-server.mjs`. For local development, run the included signaling relay on your machine.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Native WebRTC APIs
- Native browser WebSocket client
- `ws` for the minimal local signaling relay

## Project Structure

```text
app/
components/
hooks/
lib/
public/
types/
signaling-server.mjs
```

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SIGNALING_URL=ws://localhost:3001
```

For production, use a secure WebSocket URL:

```bash
NEXT_PUBLIC_SIGNALING_URL=wss://your-signaling-host.example.com
```

## Local Development

Install dependencies:

```bash
npm install
```

Start the signaling server in one terminal:

```bash
npm run dev:signal
```

Start Next.js in another terminal:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Use two browser tabs or two devices on the same network to test joining the same meeting ID. Camera, microphone, screen sharing, and recording require a browser context that allows media permissions.

## Production Build

```bash
npm run lint
npm run build
npm start
```

## Vercel Deployment

1. Push this project to a Git repository.
2. Import the repository in Vercel.
3. Set the framework preset to Next.js.
4. Add `NEXT_PUBLIC_SIGNALING_URL` in Vercel project settings.
5. Deploy.

The app itself does not need a database or file storage. Recordings stay in the browser and download directly to the user as `.webm` files.

## Signaling Relay Deployment

The included relay is a small in-memory WebSocket process:

```bash
PORT=3001 node signaling-server.mjs
```

It stores rooms only in memory. Restarting the process clears active rooms, which keeps the architecture simple and cheap. Deploy it to any Node host that supports WebSockets and free hobby usage, then set the resulting `wss://` URL in `NEXT_PUBLIC_SIGNALING_URL`.

## Browser Support Notes

- WebRTC works best in current Chrome, Edge, Firefox, and Safari.
- Some restrictive networks require TURN servers for reliable NAT traversal. This project uses a public STUN server by default and does not include paid TURN infrastructure.
- Recording support depends on `MediaRecorder` and WebM support in the browser.

## Verification

The project has been checked with:

```bash
npm run lint
npm run build
npm audit --omit=dev
```
