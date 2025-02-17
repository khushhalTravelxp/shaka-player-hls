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
          request.headers["X-AxDRM-Message"] =
            "eyJhbGciOiJIUzI1NiJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5X2lkIjoiYjQ1ODc2N2QtYTgzYi00MWQ0LWFlNjgtYWNhNzAwZDNkODRmIiwibWVzc2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsInZlcnNpb24iOjIsImxpY2Vuc2UiOnsiZXhwaXJhdGlvbl9kYXRldGltZSI6IjIwMjUtMDItMThUMDM6NDQ6MDAuODIxWiIsImFsbG93X3BlcnNpc3RlbmNlIjp0cnVlLCJyZWFsX3RpbWVfZXhwaXJhdGlvbiI6dHJ1ZX0sImNvbnRlbnRfa2V5X3VzYWdlX3BvbGljaWVzIjpbeyJuYW1lIjoiUG9saWN5IEEiLCJ3aWRldmluZSI6eyJkZXZpY2Vfc2VjdXJpdHlfbGV2ZWwiOiJTV19TRUNVUkVfQ1JZUFRPIn19XSwiY29udGVudF9rZXlzX3NvdXJjZSI6eyJpbmxpbmUiOlt7ImlkIjoiMTAyM2JhMThiZTMzYWE4YTg2MTFlZWE4OGNkZWQ5ZTMiLCJ1c2FnZV9wb2xpY3kiOiJQb2xpY3kgQSJ9LHsiaWQiOiJjY2I0ZjJmYjExNTVmN2JmYmIwN2U3Yzc1ZDI2YTY3YSIsInVzYWdlX3BvbGljeSI6IlBvbGljeSBBIn0seyJpZCI6IjU4ODE5M2VjZjhjMzc5OGY2MjMxYjM1N2M0N2YwYWJiIiwidXNhZ2VfcG9saWN5IjoiUG9saWN5IEEifV19fSwiaWF0IjoxNzM5NzY3NDQwLCJleHAiOjE3Mzk4NTM4NDB9.VhZA2UrSXAR52syUJ-deu8WNAsT65RMJDbDIdogKx4M";
        }
      });

      const drmConfig = {
        "com.apple.fps": "https://c8eaeae1-drm-fairplay-licensing.axprod.net/AcquireLicense"
      };
      playerRef.current.configure({
        drm: {
          servers: drmConfig,
          advanced: {
            "com.apple.fps": {
              serverCertificateUri: "https://travelxp.akamaized.net/cert/fairplay/fairplay.cer"
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
