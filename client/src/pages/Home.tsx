import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { CrowdMarker, SpotDetailPopup, SpotData } from "@/components/CrowdMarker";

// モックデータ（後でAPIから取得）
const mockSpots: SpotData[] = [
  {
    id: 1,
    name: "宝石さがし体験",
    description: "砂の中から本物の宝石を探し出す人気アトラクション。見つけた宝石はお持ち帰りできます。",
    status: "crowded",
    waitTime: 30,
    positionX: 58,
    positionY: 22,
  },
  {
    id: 2,
    name: "化石発掘",
    description: "本物の化石を発掘する体験ができます。発掘した化石は持ち帰れます。",
    status: "normal",
    waitTime: 10,
    positionX: 88,
    positionY: 18,
  },
  {
    id: 3,
    name: "鉱山体験館",
    description: "鉱山の歴史や宝石の成り立ちを学べる展示館。",
    status: "available",
    waitTime: 0,
    positionX: 78,
    positionY: 35,
  },
  {
    id: 4,
    name: "ミュージアムショップ",
    description: "宝石や鉱物のお土産が購入できるショップ。",
    status: "normal",
    waitTime: 5,
    positionX: 38,
    positionY: 58,
  },
  {
    id: 5,
    name: "喫茶MW（ムウ）",
    description: "休憩できるカフェ。軽食やドリンクをお楽しみいただけます。",
    status: "available",
    waitTime: 0,
    positionX: 52,
    positionY: 78,
  },
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [isInteracting, setIsInteracting] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<SpotData | null>(null);
  
  // タッチ操作用のref
  const touchStateRef = useRef({
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    positionStart: { x: 0, y: 0 },
    initialPinchDistance: 0,
    initialPinchScale: 1,
    pinchCenter: { x: 0, y: 0 },
    initialPinchPosition: { x: 0, y: 0 },
    isPinching: false,
  });

  const minScale = 1;
  const maxScale = 4;

  // ビューポートの高さを取得
  useEffect(() => {
    const updateViewportHeight = () => {
      const vh = window.innerHeight;
      setViewportHeight(vh);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  // 位置の制限（指を離した後のスナップバック用）
  const clampPosition = useCallback((x: number, y: number, currentScale: number) => {
    if (!containerRef.current || imageDimensions.width === 0) return { x, y };
    
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = viewportHeight;
    const scaledWidth = imageDimensions.width * currentScale;
    const scaledHeight = imageDimensions.height * currentScale;
    
    let clampedX = x;
    let clampedY = y;
    
    // 横方向の制限
    if (scaledWidth <= containerWidth) {
      clampedX = (containerWidth - scaledWidth) / 2;
    } else {
      const minX = containerWidth - scaledWidth;
      const maxX = 0;
      clampedX = Math.min(maxX, Math.max(minX, x));
    }
    
    // 縦方向の制限
    if (scaledHeight <= containerHeight) {
      clampedY = (containerHeight - scaledHeight) / 2;
    } else {
      const minY = containerHeight - scaledHeight;
      const maxY = 0;
      clampedY = Math.min(maxY, Math.max(minY, y));
    }
    
    return { x: clampedX, y: clampedY };
  }, [imageDimensions.width, imageDimensions.height, viewportHeight]);

  // 画像読み込み完了時
  const handleImageLoad = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const containerWidth = containerRef.current.offsetWidth;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const displayHeight = viewportHeight;
      const displayWidth = displayHeight * aspectRatio;
      
      setImageDimensions({
        width: displayWidth,
        height: displayHeight,
      });
      
      // 初期位置を中央に設定
      const initialX = (containerWidth - displayWidth) / 2;
      setPosition({ x: initialX, y: 0 });
    }
  }, [viewportHeight]);

  // ズームイン（ボタン）- 画面中央を基準に
  const handleZoomIn = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const centerX = containerWidth / 2;
    const centerY = viewportHeight / 2;
    
    setScale(prev => {
      const newScale = Math.min(prev * 1.3, maxScale);
      
      // 画像内座標に変換してから新しい位置を計算
      const imageX = (centerX - position.x) / prev;
      const imageY = (centerY - position.y) / prev;
      const newX = centerX - imageX * newScale;
      const newY = centerY - imageY * newScale;
      
      setPosition(clampPosition(newX, newY, newScale));
      return newScale;
    });
  }, [viewportHeight, position, clampPosition]);

  // ズームアウト（ボタン）- 画面中央を基準に
  const handleZoomOut = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const centerX = containerWidth / 2;
    const centerY = viewportHeight / 2;
    
    setScale(prev => {
      const newScale = Math.max(prev / 1.3, minScale);
      
      // 画像内座標に変換してから新しい位置を計算
      const imageX = (centerX - position.x) / prev;
      const imageY = (centerY - position.y) / prev;
      const newX = centerX - imageX * newScale;
      const newY = centerY - imageY * newScale;
      
      setPosition(clampPosition(newX, newY, newScale));
      return newScale;
    });
  }, [viewportHeight, position, clampPosition]);

  // リセット
  const handleReset = useCallback(() => {
    if (containerRef.current && imageDimensions.width > 0) {
      const containerWidth = containerRef.current.offsetWidth;
      setScale(1);
      const initialX = (containerWidth - imageDimensions.width) / 2;
      setPosition({ x: initialX, y: 0 });
    }
  }, [imageDimensions.width]);

  // 2点間の距離と中心点を計算
  const getPinchData = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const centerX = (touches[0].clientX + touches[1].clientX) / 2;
    const centerY = (touches[0].clientY + touches[1].clientY) / 2;
    return { distance, centerX, centerY };
  };

  // タッチ開始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const state = touchStateRef.current;
    setIsInteracting(true);
    
    if (e.touches.length === 1) {
      // シングルタッチ（ドラッグ）
      state.isDragging = true;
      state.isPinching = false;
      state.dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      state.positionStart = { ...position };
    } else if (e.touches.length === 2) {
      // ピンチズーム開始
      state.isDragging = false;
      state.isPinching = true;
      const { distance, centerX, centerY } = getPinchData(e.touches);
      state.initialPinchDistance = distance;
      state.initialPinchScale = scale;
      state.pinchCenter = { x: centerX, y: centerY };
      state.initialPinchPosition = { ...position };
    }
  }, [position, scale]);

  // タッチ移動
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const state = touchStateRef.current;
    
    if (e.touches.length === 1 && state.isDragging && !state.isPinching) {
      // シングルタッチ（ドラッグ）- 操作中は余白を許容
      const deltaX = e.touches[0].clientX - state.dragStart.x;
      const deltaY = e.touches[0].clientY - state.dragStart.y;
      setPosition({
        x: state.positionStart.x + deltaX,
        y: state.positionStart.y + deltaY,
      });
    } else if (e.touches.length === 2 && state.isPinching && state.initialPinchDistance > 0) {
      // ピンチズーム - 指の中心点を基準に拡大（正しい座標計算）
      const { distance } = getPinchData(e.touches);
      const scaleChange = distance / state.initialPinchDistance;
      const newScale = Math.min(Math.max(state.initialPinchScale * scaleChange, minScale), maxScale);
      
      // 画像内座標に変換してから新しい位置を計算
      const imageX = (state.pinchCenter.x - state.initialPinchPosition.x) / state.initialPinchScale;
      const imageY = (state.pinchCenter.y - state.initialPinchPosition.y) / state.initialPinchScale;
      const newX = state.pinchCenter.x - imageX * newScale;
      const newY = state.pinchCenter.y - imageY * newScale;
      
      setScale(newScale);
      // ピンチ中は余白を許容
      setPosition({ x: newX, y: newY });
    }
  }, []);

  // タッチ終了 - アニメーションで画像範囲内に戻す
  const handleTouchEnd = useCallback(() => {
    const state = touchStateRef.current;
    setIsInteracting(false);
    
    // 指を離したら位置を制限（アニメーション付き）
    setPosition(pos => clampPosition(pos.x, pos.y, scale));
    
    state.isDragging = false;
    state.isPinching = false;
    state.initialPinchDistance = 0;
  }, [scale, clampPosition]);

  // マウスドラッグ開始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const state = touchStateRef.current;
    state.isDragging = true;
    state.dragStart = { x: e.clientX, y: e.clientY };
    state.positionStart = { ...position };
    setIsInteracting(true);
  }, [position]);

  // マウスドラッグ中
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const state = touchStateRef.current;
    if (!state.isDragging) return;
    
    const deltaX = e.clientX - state.dragStart.x;
    const deltaY = e.clientY - state.dragStart.y;
    // ドラッグ中は余白を許容
    setPosition({
      x: state.positionStart.x + deltaX,
      y: state.positionStart.y + deltaY,
    });
  }, []);

  // マウスドラッグ終了
  const handleMouseUp = useCallback(() => {
    touchStateRef.current.isDragging = false;
    setIsInteracting(false);
    // 指を離したら位置を制限（アニメーション付き）
    setPosition(pos => clampPosition(pos.x, pos.y, scale));
  }, [scale, clampPosition]);

  // ホイールでズーム
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    
    setScale(prev => {
      const newScale = Math.min(Math.max(prev * delta, minScale), maxScale);
      
      // 画像内座標に変換してから新しい位置を計算
      setPosition(pos => {
        const imageX = (mouseX - pos.x) / prev;
        const imageY = (mouseY - pos.y) / prev;
        const newX = mouseX - imageX * newScale;
        const newY = mouseY - imageY * newScale;
        return clampPosition(newX, newY, newScale);
      });
      
      return newScale;
    });
  }, [clampPosition]);

  // グローバルマウスアップ
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (touchStateRef.current.isDragging) {
        touchStateRef.current.isDragging = false;
        setIsInteracting(false);
        setPosition(pos => clampPosition(pos.x, pos.y, scale));
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [scale, clampPosition]);

  // マーカータップ時
  const handleMarkerTap = useCallback((spot: SpotData) => {
    setSelectedSpot(spot);
  }, []);

  // マーカーの画面上の位置を計算
  const getMarkerScreenPosition = (spot: SpotData) => {
    const x = position.x + (imageDimensions.width * spot.positionX / 100) * scale;
    const y = position.y + (imageDimensions.height * spot.positionY / 100) * scale;
    return { x, y };
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-screen overflow-hidden bg-[#e8e4d9]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{ 
        touchAction: 'none', 
        cursor: touchStateRef.current.isDragging ? 'grabbing' : 'grab',
        height: `${viewportHeight}px`,
      }}
    >
      {/* Map Image */}
      <img
        ref={imageRef}
        src="/map.png"
        alt="Hakusekikan Park Map"
        className="select-none absolute"
        draggable={false}
        style={{
          width: `${imageDimensions.width}px`,
          height: `${imageDimensions.height}px`,
          maxWidth: 'none',
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'top left',
          transition: isInteracting ? 'none' : 'transform 0.3s ease-out',
        }}
        onLoad={handleImageLoad}
      />

      {/* Crowd Markers - 別レイヤーで画面座標に配置 */}
      {imageDimensions.width > 0 && mockSpots.map((spot) => {
        const screenPos = getMarkerScreenPosition(spot);
        return (
          <div
            key={spot.id}
            className="absolute z-[100]"
            style={{
              left: `${screenPos.x}px`,
              top: `${screenPos.y}px`,
              transform: 'translate(-50%, -100%)',
              transition: isInteracting ? 'none' : 'left 0.3s ease-out, top 0.3s ease-out',
              pointerEvents: 'auto',
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleMarkerTap(spot);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleMarkerTap(spot);
            }}
          >
            <svg
              width={28}
              height={28}
              viewBox="0 0 24 24"
              style={{
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
                cursor: 'pointer',
              }}
              className="hover:scale-125 active:scale-95 transition-transform"
            >
              <path
                d="M12 2 L22 20 L2 20 Z"
                fill={spot.status === 'crowded' ? '#EF4444' : spot.status === 'normal' ? '#22C55E' : '#3B82F6'}
                stroke="white"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        );
      })}

      {/* Zoom Controls - 画面下部に固定 */}
      <div 
        className="fixed flex flex-col gap-2 z-50"
        style={{
          bottom: '100px',
          right: '16px',
        }}
      >
        <div className="flex flex-col gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-2xl shadow-xl border-2 border-[#d4c5a3]">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="rounded-full w-12 h-12 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-md"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="rounded-full w-12 h-12 bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95 transition-all shadow-md"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="rounded-full w-12 h-12 bg-accent text-accent-foreground hover:bg-accent/90 active:scale-95 transition-all shadow-md"
            aria-label="Reset View"
          >
            <RotateCcw className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Scale Indicator - 左下に固定 */}
      <div 
        className="fixed z-40 pointer-events-none opacity-80"
        style={{
          bottom: '100px',
          left: '16px',
        }}
      >
        <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-mono">
          {Math.round(scale * 100)}%
        </div>
      </div>

      {/* Spot Detail Popup */}
      {selectedSpot && (
        <SpotDetailPopup
          spot={selectedSpot}
          onClose={() => setSelectedSpot(null)}
        />
      )}
    </div>
  );
}
