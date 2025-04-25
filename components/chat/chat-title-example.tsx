"use client";

import "./styles.css";

interface ChatTitleExampleProps {
  imageSrc?: string;
  scale?: number;
  marginX?: number;
  marginY?: number;
}

export default function ChatTitleExample({
  imageSrc,
  scale = 0.8,
}: // marginX = -10,
// marginY = -3,
ChatTitleExampleProps) {
  return (
    <div className="chat_default" style={{ overflow: "hidden", width: "100%" }}>
      <div className="header">전체</div>
      {imageSrc && (
        <img
          src={imageSrc}
          alt="채팅 칭호"
          style={{
            width: "100px",
            margin: "-3px -10px 0",
            transform: `scale(${scale})`,
            objectFit: "contain",
            display: "inline-block",
            verticalAlign: "middle",
          }}
        />
      )}
      <span className="userInfo">12345 I 도꾸 : </span>
      <span className="chat" style={{ whiteSpace: "nowrap" }}>
        안녕하세요. 시바서버입니다.
      </span>
    </div>
  );
}
