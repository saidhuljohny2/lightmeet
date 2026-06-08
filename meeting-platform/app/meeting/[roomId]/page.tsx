import { MeetingRoom } from "@/components/MeetingRoom";

type MeetingPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function MeetingPage({ params }: MeetingPageProps) {
  const { roomId } = await params;

  return <MeetingRoom roomId={roomId} />;
}
