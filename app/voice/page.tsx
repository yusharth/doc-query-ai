"use client";
import dynamic from "next/dynamic";

const EnhancedVoiceUI = dynamic(
  () => import("@/components/enhanced-voice-ui"),
  {
    ssr: false,
  }
);

const VoicePage = () => {
  return (
    <div
      className="flex flex-col bg-gray-100 overflow-hidden"
      style={{ height: "calc(100vh - 3.6rem)" }}
    >
      <div className="flex-1 overflow-hidden">
        <EnhancedVoiceUI />
      </div>
    </div>
  );
};

export default VoicePage;
