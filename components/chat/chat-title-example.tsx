"use client";

import "./styles.css";
import Image from "next/image";

interface Metadata {
  width?: string;
  scale?: number;
  margin?: string;
}

interface ChatTitleExampleProps {
  imageSrc: string | null;
  metadata: Metadata;
  nickname?: string;
}

const ChatTitleExample = ({
  imageSrc,
  metadata,
  nickname = "예시유저",
}: ChatTitleExampleProps) => {
  if (!imageSrc) {
    return (
      <div className="chat_default">
        <div className="header">전체</div>
        <span className="userInfo">도꾸 : </span>
        <span className="chat">미리보기를 로드할 수 없습니다.</span>
      </div>
    );
  }

  const customWidth = metadata?.width || "100px";
  const customScale = metadata?.scale !== undefined ? metadata.scale : 0.7;
  const customMargin = metadata?.margin || "0px 0px 0px 0px";

  return (
    <div className="chat_default">
      <div className="header">전체</div>
      <span
        className="custom"
        style={{
          width: customWidth,
          transform: `scale(${customScale})`,
          margin: customMargin,
          backgroundImage: `url(${imageSrc})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center left",
          display: "inline-block",
          verticalAlign: "middle",
          height: "25px",
        }}
        role="img"
        aria-label="채팅 칭호 미리보기"
      ></span>
      <span className="userInfo">{nickname} : </span>
      <span className="chat">안녕하세요. 시바서버입니다.</span>
    </div>
  );
};

export default ChatTitleExample;
