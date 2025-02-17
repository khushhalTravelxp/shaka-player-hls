"use client";
import { useEffect, useRef, useState } from "react";
import shaka from "shaka-player";

export default function ShakaPlayer() {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [codecInfo, setCodecInfo] = useState("");

  useEffect(() => {
    async function initPlayer() {
      if (!videoRef.current) return;

      shaka.polyfill.installAll();
      playerRef.current = new shaka.Player(videoRef.current);

      playerRef.current.addEventListener("error", (event) => {
        console.error("Error code", event.detail.code, "object", event.detail);
      });

      playerRef.current.getNetworkingEngine().registerRequestFilter((type, request) => {
        if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
          request.headers["X-AxDRM-Message"] = "";
        }
      });

      const drmConfig = {
        "com.apple.fps": ""
      };
      playerRef.current.configure({
        drm: {
          servers: drmConfig,
          advanced: {
            "com.apple.fps": {
              serverCertificateUri: ""
            }
          }
        },
        streaming: {
          useNativeHlsForFairPlay: true,
          bufferingGoal: 20,
          rebufferingGoal: 4,
          bufferBehind: 20,
          lowLatencyMode: false
        }
      });

      try {
        await playerRef.current.load("https://travelxp.akamaized.net/60a66806d659ded70c8f1eb6/manifest_v1_hd_28042023_1353_only_h264.m3u8");
        console.log("The video has been loaded successfully!");

        // Get codec information from the loaded manifest
        const tracks = playerRef.current.getVariantTracks();
        if (tracks.length > 0) {
          const codecs = tracks.map((track) => track.videoCodec + ", " + track.audioCodec).join(" | ");
          console.log("Codec Information:", codecs);
          setCodecInfo(codecs);
        } else {
          console.warn("No tracks found!");
        }
      } catch (error) {
        console.error("Error loading video", error);
      }
    }

    if (shaka.Player.isBrowserSupported()) {
      initPlayer();
    } else {
      console.error("Browser not supported!");
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div>
      <video ref={videoRef} controls width="70%" height="700px" />
      <p>
        <strong>Codec Info:</strong> {codecInfo}
      </p>
    </div>
  );
}
