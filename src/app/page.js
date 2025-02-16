"use client";
import { useEffect, useRef } from "react";
import shaka from "shaka-player";

export default function ShakaPlayer() {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  async function keepOnlyH264FromM3U8(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const m3u8Text = await response.text();
        const lines = m3u8Text.split("\n");
        
        let filteredLines = [];
        let keepNextLine = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check if the line contains the H.264 codec
            if (line.includes('CODECS="avc1"')) {
                filteredLines.push(line); // Keep the codec line
                keepNextLine = true; // Keep the next line (URL)
                continue;
            }

            if (keepNextLine) {
                filteredLines.push(line); // Keep the stream URL
                keepNextLine = false;
                continue;
            }
        }

        return filteredLines.join("\n");
    } catch (error) {
        console.error("Error fetching or processing M3U8:", error);
        return null;
    }
}

// Example usage
keepOnlyH264FromM3U8("https://travelxp.akamaized.net/5ffe9c0a623b58327a2e5163/manifest_v2_hd_15032024_1846.m3u8")
    .then(cleanedM3U8 => {
        console.log(cleanedM3U8); // Print or save the filtered M3U8 file
    });


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
            "eyJhbGciOiJIUzI1NiJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5X2lkIjoiYjQ1ODc2N2QtYTgzYi00MWQ0LWFlNjgtYWNhNzAwZDNkODRmIiwibWVzc2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsInZlcnNpb24iOjIsImxpY2Vuc2UiOnsiZXhwaXJhdGlvbl9kYXRldGltZSI6IjIwMjUtMDItMTZUMDg6MDM6MTYuNTAyWiIsImFsbG93X3BlcnNpc3RlbmNlIjp0cnVlLCJyZWFsX3RpbWVfZXhwaXJhdGlvbiI6dHJ1ZX0sImNvbnRlbnRfa2V5X3VzYWdlX3BvbGljaWVzIjpbeyJuYW1lIjoiUG9saWN5IEEiLCJ3aWRldmluZSI6eyJkZXZpY2Vfc2VjdXJpdHlfbGV2ZWwiOiJTV19TRUNVUkVfQ1JZUFRPIn19XSwiY29udGVudF9rZXlzX3NvdXJjZSI6eyJpbmxpbmUiOlt7ImlkIjoiOWE5MmYyODYxMmFhNjFlODc4MDE1M2U5Zjk3ODk1ZTgiLCJ1c2FnZV9wb2xpY3kiOiJQb2xpY3kgQSJ9LHsiaWQiOiJmNjQ0YTRiZTc0NDMwOTMwOGYwZTVjZDExYTEwMGIyZCIsInVzYWdlX3BvbGljeSI6IlBvbGljeSBBIn0seyJpZCI6IjI3Zjg1NjljN2IzNTE3Nzg2ZDcxNWYzZmRhM2I3MWMzIiwidXNhZ2VfcG9saWN5IjoiUG9saWN5IEEifV19fSwiaWF0IjoxNzM5NjEwMTk2LCJleHAiOjE3Mzk2OTY1OTZ9.3pJ8Nwv7pFXSrKTb0qoUd-ExZvCdKocoxA7NpxQzJ64";
        }
      });

      const drmConfig = {};
      drmConfig["com.apple.fps"] = "https://c8eaeae1-drm-fairplay-licensing.axprod.net/AcquireLicense";
      playerRef.current.configure({
        drm: {
          servers: drmConfig,
          advanced: {
            "com.apple.fps": {
              serverCertificateUri: "https://travelxp.akamaized.net/cert/fairplay/fairplay.cer",
              getContentId: (emeOptions, initData) => {
                return new TextDecoder().decode(initData.filter((item) => item !== 0 && item !== 150));
              }
            }
          }
        }
      });

      try {
        await playerRef.current.load(keepOnlyH264FromM3U8('https://travelxp.akamaized.net/5ffe9c0a623b58327a2e5163/manifest_v2_hd_15032024_1846.m3u8'));
        console.log("The video has been loaded successfully!");
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

  return <video ref={videoRef} controls width="70%" height="700px" />;
}
