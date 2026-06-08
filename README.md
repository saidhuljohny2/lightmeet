# LightMeet

A simple, lightweight online meeting platform built with Next.js 15, TypeScript, Tailwind CSS, WebRTC, and a tiny WebSocket signaling relay.

## Features

- Create a meeting with a unique ID
- Schedule a meeting by generating a future meeting link
- Schedule one-time, daily, weekly, or monthly recurring meeting links with occurrence count or end date
- Download a local `.ics` calendar invite for scheduled and recurring meetings
- Join a meeting by URL or meeting ID
- Peer-to-peer camera and microphone with WebRTC
- Camera toggle, microphone mute, screen sharing, and leave controls
- Participant tiles with names, status, participant count, and raise hand state
- Lightweight in-memory meeting chat
- Local recording with the MediaRecorder API and direct MP4 download when supported, with WebM fallback
- Active local recordings are finalized automatically when the recording participant leaves
- Meeting timer and basic connection quality indicator
- Emoji raise-hand indicator on controls and participant tiles
- Responsive layout for desktop, tablet, and mobile
- Configurable room limit, defaulting to 100 members
- Admin login for starting and scheduling meetings
- Admin participant controls for muting, camera-off requests, and removing students
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
NEXT_PUBLIC_MAX_PARTICIPANTS=100
MAX_PARTICIPANTS=100
ADMIN_USERNAME=saidh
ADMIN_PASSWORD=LightMeet@123
AUTH_SECRET=replace-with-a-long-random-secret
```

For production, use a secure WebSocket URL:

```bash
NEXT_PUBLIC_SIGNALING_URL=wss://your-signaling-host.example.com
NEXT_PUBLIC_MAX_PARTICIPANTS=100
MAX_PARTICIPANTS=100
ADMIN_USERNAME=saidh
ADMIN_PASSWORD=replace-this-before-deploying
AUTH_SECRET=replace-with-a-long-random-secret
```

## Admin Access

Temporary local admin credentials:

```text
Username: saidh
Password: LightMeet@123
```

Only the admin can create or schedule meetings. Students can still join with a meeting link or meeting ID. Change `ADMIN_PASSWORD` and `AUTH_SECRET` before deploying.

Admin controls are sent through the signaling server. The browser receiving the command applies mute/camera-off locally, which matches browser security rules around camera and microphone access.

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

Scheduled meetings generate a meeting URL in the browser. Recurring meetings reuse that same URL and add an `RRULE` to the downloaded `.ics` calendar invite.

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

The app itself does not need a database or file storage. Recordings stay in the browser and download directly to the user as `.mp4` when the browser supports MP4 `MediaRecorder` output, otherwise `.webm`.

If the participant who started recording clicks **Leave**, LightMeet stops the recorder first and downloads the video before returning to the home page. Browser tab closes and refreshes also trigger a best-effort recorder stop, but browsers may restrict downloads during abrupt page unloads.

## Signaling Relay Deployment

The included relay is a small in-memory WebSocket process:

```bash
PORT=3001 node signaling-server.mjs
```

It stores rooms only in memory. Restarting the process clears active rooms, which keeps the architecture simple and cheap. Deploy it to any Node host that supports WebSockets and free hobby usage, then set the resulting `wss://` URL in `NEXT_PUBLIC_SIGNALING_URL`.

## Capacity Notes

The app defaults to a 100-member room limit through `NEXT_PUBLIC_MAX_PARTICIPANTS` and `MAX_PARTICIPANTS`.

This limit controls admission and UI display. Pure peer-to-peer WebRTC mesh is still expensive for large meetings because every camera/microphone stream must be sent to many other browsers. For a real 100-person all-video meeting, use an SFU media server architecture. For this lightweight free-tier version, 100-member rooms are best used with most people muted, camera-off, or primarily using chat while only a few participants share active media.

## Browser Support Notes

- WebRTC works best in current Chrome, Edge, Firefox, and Safari.
- Some restrictive networks require TURN servers for reliable NAT traversal. This project uses a public STUN server by default and does not include paid TURN infrastructure.
- Recording support depends on `MediaRecorder`. MP4 output is used where supported; WebM is used as a compatibility fallback.

## Verification

The project has been checked with:

```bash
npm run lint
npm run build
npm audit --omit=dev
```
