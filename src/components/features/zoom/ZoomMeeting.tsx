import React, { useEffect } from "react";
import { ZoomMtg } from "@zoom/meetingsdk";

export function ZoomMeeting() {
  const meetingNumber = "92717043151";
  const passWord = "EO50QxxWd8hSApz7bgS0yJNLEpnGPw.1";
  const userName = "Demo User";
  const userEmail = "email@gmail.com";
  const leaveUrl = "http://localhost:3000";

  useEffect(() => {
    // MUST be static + run once
    ZoomMtg.setZoomJSLib(
      "https://source.zoom.us/3.11.2/lib",
      "/av"
    );

    ZoomMtg.preLoadWasm();
    ZoomMtg.prepareWebSDK();
  }, []);

  const getSignature = () => {
    alert("Joining");

    // ⚠️ This should come from backend in real apps
    const signature =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBLZXkiOiJTS0tmZXRHWVIxV0RUb0JBa2Rsc1EiLCJzZGtLZXkiOiJTS0tmZXRHWVIxV0RUb0JBa2Rsc1EiLCJtbiI6IjkyNzE3MDQzMTUxIiwicm9sZSI6MSwidG9rZW5FeHAiOjE3NzA3MzUxNTksImlhdCI6MTc3MDczMTU1OSwiZXhwIjoxNzcwNzM1MTU5fQ.1083Ohke8B7qBKK8vulOIagjL5CJyFOtgIgAOata1hw";

    startMeeting(signature);
  };

  function startMeeting(signature: string) {
    const meetingSDKElement = document.getElementById("zmmtg-root");
    if (meetingSDKElement) {
      meetingSDKElement.style.display = "block";
    }

    ZoomMtg.init({
      leaveUrl,
      patchJsMedia: true,
      leaveOnPageUnload: true,
      success: () => {
        ZoomMtg.join({
          signature,
          meetingNumber,
          passWord,
          userName,
          userEmail,
          success: (res: any) => {
            console.log("Join meeting success:", res);
          },
          error: (err: any) => {
            console.error("Join meeting error:", err);
          },
        });
      },
      error: (err: any) => {
        console.error("Zoom SDK init error:", err);
      },
    });
  }

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Zoom SDK Integration</h1>
      <button
        style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
        onClick={getSignature}
      >
        Join Meeting
      </button>

      {/* MUST exist */}
      <div id="zmmtg-root" />
    </div>
  );
}
