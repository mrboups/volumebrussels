"use client";

import { useEffect, useRef } from "react";

export default function EmbedSocial() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    if (document.getElementById("EmbedSocialHashtagScript")) return;

    const js = document.createElement("script");
    js.id = "EmbedSocialHashtagScript";
    js.src = "https://embedsocial.com/cdn/ht.js";
    js.async = true;
    document.head.appendChild(js);
  }, []);

  return (
    <div
      className="embedsocial-hashtag"
      data-ref="e0647ca3b95dcb0c67a6edb18799370458262528"
    />
  );
}
