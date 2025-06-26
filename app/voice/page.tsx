"use client";
import dynamic from "next/dynamic";

const VoiceUI = dynamic(() => import("@/components/voice-ui"), {
  ssr: false,
});

const VoicePage = () => {
  // const { agentId } = await params;

  // console.log("Agent ID", agentId);
  // const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="flex flex-col bg-gray-100"
      style={{ height: "calc(100vh - 3.6rem)" }}
    >
      <div className="flex-1">
        <VoiceUI />
      </div>
    </div>
  );
};

export default VoicePage;
