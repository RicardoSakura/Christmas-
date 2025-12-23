
import React, { useRef, useEffect, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { GestureState, HandData, Landmark } from '../types';
import { GESTURE_SENSITIVITY } from '../constants';

interface HandTrackerProps {
  onGesture: (data: HandData) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onGesture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    const initTracking = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        landmarkerRef.current = handLandmarker;
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 }, 
              height: { ideal: 480 },
              facingMode: 'user' 
            } 
          });

          if (videoRef.current && isMounted) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(e => console.error("Video play failed", e));
              setActive(true);
              requestAnimationFrame(predictLoop);
            };
          }
        }
      } catch (err: any) {
        console.error("Hand tracking initialization failed:", err);
        setError("摄像头访问受限");
      }
    };

    const predictLoop = () => {
      if (!isMounted || !videoRef.current || !landmarkerRef.current || !canvasRef.current) return;
      if (videoRef.current.paused || videoRef.current.ended) return;

      try {
        const results = landmarkerRef.current.detectForVideo(videoRef.current, performance.now());
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            if (showSkeleton) drawHand(ctx, landmarks);
            const gesture = analyzeGesture(landmarks);
            onGesture({ landmarks, gesture });
          } else {
            onGesture({ landmarks: [], gesture: GestureState.TREE });
          }
        }
      } catch (e) {
        console.error("Prediction loop error:", e);
      }
      
      requestAnimationFrame(predictLoop);
    };

    initTracking();

    return () => {
      isMounted = false;
      landmarkerRef.current?.close();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showSkeleton]);

  const drawHand = (ctx: CanvasRenderingContext2D, landmarks: Landmark[]) => {
    ctx.fillStyle = "#D4AF37";
    ctx.strokeStyle = "#DC143C";
    ctx.lineWidth = 3;

    landmarks.forEach(lm => {
      ctx.beginPath();
      ctx.arc(lm.x * canvasRef.current!.width, lm.y * canvasRef.current!.height, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    const drawConnection = (a: number, b: number) => {
      if (!landmarks[a] || !landmarks[b]) return;
      ctx.beginPath();
      ctx.moveTo(landmarks[a].x * canvasRef.current!.width, landmarks[a].y * canvasRef.current!.height);
      ctx.lineTo(landmarks[b].x * canvasRef.current!.width, landmarks[b].y * canvasRef.current!.height);
      ctx.stroke();
    };

    // 标准 MediaPipe 手部关节点连接
    [[0,1,2,3,4], [0,5,6,7,8], [5,9,10,11,12], [9,13,14,15,16], [13,17,18,19,20], [0,17]].forEach(chain => {
      for(let i=0; i<chain.length-1; i++) drawConnection(chain[i], chain[i+1]);
    });
  };

  const analyzeGesture = (lm: Landmark[]): GestureState => {
    if (!lm || lm.length < 21) return GestureState.TREE;
    
    const getDist = (a: number, b: number) => Math.sqrt(Math.pow(lm[a].x - lm[b].x, 2) + Math.pow(lm[a].y - lm[b].y, 2));
    const thumbTip = 4, indexTip = 8, middleTip = 12, ringTip = 16, pinkyTip = 20, palm = 0;
    
    const pinchDist = getDist(thumbTip, indexTip);
    if (pinchDist < GESTURE_SENSITIVITY.PINCH_THRESHOLD) {
      // 检查其他三指是否弯曲来区分 Focus 和 Heart
      const othersCurled = [12, 16, 20].every(tip => getDist(tip, palm) < 0.25);
      if (othersCurled) return GestureState.HEART;
      return GestureState.FOCUS;
    }

    const allCurled = [8, 12, 16, 20].every(tip => getDist(tip, palm) < 0.22);
    if (allCurled) return GestureState.TREE;

    const allExtended = [8, 12, 16, 20].every(tip => getDist(tip, palm) > 0.38);
    if (allExtended) return GestureState.SCATTER;

    return GestureState.TREE;
  };

  return (
    <div className="absolute top-4 right-4 z-40 flex flex-col items-end gap-2">
      <button 
        onClick={() => setShowSkeleton(!showSkeleton)}
        className="bg-black/60 border border-[#D4AF37] px-4 py-1 rounded-full text-[10px] cinzel hover:bg-[#D4AF37] hover:text-black transition-all"
      >
        {showSkeleton ? "收起骨架视图" : "开启手势校准"}
      </button>
      
      {showSkeleton && (
        <div className="relative border-2 border-[#D4AF37]/50 rounded-xl overflow-hidden bg-black/40 backdrop-blur-md transition-all animate-in slide-in-from-top duration-300">
          <video ref={videoRef} className="hidden" playsInline muted />
          <canvas 
            ref={canvasRef} 
            width={240} 
            height={180} 
            className="w-56 h-42 opacity-90 grayscale contrast-125"
          />
          <div className="absolute top-2 left-2 flex items-center gap-1">
             <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
             <span className="text-[9px] cinzel uppercase font-bold text-white/70">
               {error ? error : (active ? "捕捉就绪" : "传感器初始化...")}
             </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HandTracker;
