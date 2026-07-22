"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "./ui";

/**
 * Scans a barcode with the phone camera using the browser's built-in
 * BarcodeDetector. No library: the API is native where it exists.
 *
 * Support is real but not universal — Chrome on Android has it, Safari on iOS
 * does not. Rather than pretend, unsupported browsers are told plainly to type
 * the number in, which the surrounding form always allows.
 */

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}

type BarcodeDetectorCtor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorLike;

// Whether we've hydrated. The value never changes after mount, so the
// subscribe callback has nothing to listen to.
const subscribeNever = () => () => {};
const getMountedTrue = () => true;
const getMountedFalse = () => false;

function getDetectorCtor(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined") return null;
  const ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor })
    .BarcodeDetector;
  return ctor ?? null;
}

export function BarcodeScanner({
  onScan,
}: {
  onScan: (value: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  // Detector support can only be read on the client, but the first client
  // render must still match the server's HTML. useSyncExternalStore gives a
  // distinct server snapshot for exactly this, so hydration agrees and only
  // then does the real value apply.
  //
  // Reading it directly during the first render instead caused a mismatch on
  // WebKit (server: unknown, client: unsupported). React discarded and
  // rebuilt the tree, which intermittently broke form submits on this page.
  const mounted = useSyncExternalStore(
    subscribeNever,
    getMountedTrue,
    getMountedFalse
  );
  const supported = mounted ? getDetectorCtor() !== null : null;

  // Always release the camera — leaving it on drains the phone and leaves the
  // indicator light showing.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setError("");
    const Ctor = getDetectorCtor();
    if (!Ctor) {
      setError("This browser can't scan — type the barcode in instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      const detector = new Ctor({
        formats: ["code_128", "ean_13", "ean_8", "code_39", "upc_a", "upc_e"],
      });

      const tick = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const found = await detector.detect(videoRef.current);
          if (found.length > 0) {
            onScan(found[0].rawValue);
            stop();
            return;
          }
        } catch {
          // A frame can fail to decode; keep trying rather than bailing out.
        }
        if (streamRef.current) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      setError(
        "Couldn't open the camera. Check permissions, or type the barcode in."
      );
      setScanning(false);
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  if (supported === false) {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Camera scanning isn&apos;t available in this browser (it works in Chrome
        on Android). Type or paste the barcode below instead.
      </p>
    );
  }

  return (
    <div>
      {scanning ? (
        <div>
          <video
            ref={videoRef}
            className="w-full rounded-xl border border-slate-300 bg-slate-900"
            playsInline
            muted
            aria-label="Camera view for barcode scanning"
          />
          <Button
            type="button"
            variant="outline"
            onClick={stop}
            className="mt-3 w-full !min-h-[44px] !py-2"
          >
            Stop scanning
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={start}
          className="w-full !min-h-[48px] !py-2"
          data-testid="scan-barcode"
        >
          📷 Scan barcode with camera
        </Button>
      )}

      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}
    </div>
  );
}
