import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [positionStart, setPositionStart] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  // ピンチズーム用の状態
  const [initialPinchDistance, setInitialPinchDistance] = useState(0);
  const [initialPinchScale, setInitialPinchScale] = useState(1);
  const [pinchCenter, setPinchCenter] = useState({ x: 0, y: 0 });
  const [initialPinchPosition, setInitialPinchPosition] = useState({ x: 0, y: 0 });

  const minScale = 1;
  const maxScale = 4;

  // ビューポートの高さを取得
  useEffect(() => {
    const updateViewportHeight = () => {
      const vh = window.innerHeight;
      setViewportHeight(vh);
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  // 位置の制限（余白が見えないように）
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
  }, [imageDimensions, viewportHeight]);

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
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
      
      // 初期位置を中央に設定
      const initialX = displayWidth > containerWidth ? (containerWidth - displayWidth) / 2 : (containerWidth - displayWidth) / 2;
      setPosition({ x: initialX, y: 0 });
    }
  }, [viewportHeight]);

  // ビューポート変更時に再計算
  useEffect(() => {
    if (imageRef.current && containerRef.current && imageRef.current.complete && imageDimensions.naturalWidth > 0) {
      const containerWidth = containerRef.current.offsetWidth;
      const aspectRatio = imageDimensions.naturalWidth / imageDimensions.naturalHeight;
      const displayHeight = viewportHeight;
      const displayWidth = displayHeight * aspectRatio;
      
      setImageDimensions(prev => ({
        ...prev,
        width: displayWidth,
        height: displayHeight,
      }));
      
      setPosition(prev => clampPosition(prev.x, prev.y, scale));
    }
  }, [viewportHeight, scale, clampPosition, imageDimensions.naturalWidth, imageDimensions.naturalHeight]);

  // ズームイン（ボタン）
  const handleZoomIn = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const centerX = containerWidth / 2;
    const centerY = viewportHeight / 2;
    
    setScale(prev => {
      const newScale = Math.min(prev * 1.3, maxScale);
      const scaleRatio = newScale / prev;
      
      setPosition(pos => {
        const newX = centerX - (centerX - pos.x) * scaleRatio;
        const newY = centerY - (centerY - pos.y) * scaleRatio;
        return clampPosition(newX, newY, newScale);
      });
      
      return newScale;
    });
  }, [viewportHeight, clampPosition]);

  // ズームアウト（ボタン）
  const handleZoomOut = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const centerX = containerWidth / 2;
    const centerY = viewportHeight / 2;
    
    setScale(prev => {
      const newScale = Math.max(prev / 1.3, minScale);
      const scaleRatio = newScale / prev;
      
      setPosition(pos => {
        const newX = centerX - (centerX - pos.x) * scaleRatio;
        const newY = centerY - (centerY - pos.y) * scaleRatio;
        return clampPosition(newX, newY, newScale);
      });
      
      return newScale;
    });
  }, [viewportHeight, clampPosition]);

  // リセット
  const handleReset = useCallback(() => {
    if (containerRef.current && imageDimensions.width > 0) {
      const containerWidth = containerRef.current.offsetWidth;
      setScale(1);
      const initialX = imageDimensions.width > containerWidth 
        ? (containerWidth - imageDimensions.width) / 2 
        : (containerWidth - imageDimensions.width) / 2;
      setPosition({ x: initialX, y: 0 });
    }
  }, [imageDimensions.width]);

  // マウスドラッグ開始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPositionStart(position);
  }, [position]);

  // マウスドラッグ中
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    const newPos = clampPosition(positionStart.x + deltaX, positionStart.y + deltaY, scale);
    setPosition(newPos);
  }, [isDragging, dragStart, positionStart, scale, clampPosition]);

  // マウスドラッグ終了
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

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
    if (e.touches.length === 1) {
      // シングルタッチ（ドラッグ）
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setPositionStart(position);
    } else if (e.touches.length === 2) {
      // ピンチズーム開始
      setIsDragging(false);
      const { distance, centerX, centerY } = getPinchData(e.touches);
      setInitialPinchDistance(distance);
      setInitialPinchScale(scale);
      setPinchCenter({ x: centerX, y: centerY });
      setInitialPinchPosition(position);
    }
  }, [position, scale]);

  // タッチ移動
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      // シングルタッチ（ドラッグ）
      const deltaX = e.touches[0].clientX - dragStart.x;
      const deltaY = e.touches[0].clientY - dragStart.y;
      const newPos = clampPosition(positionStart.x + deltaX, positionStart.y + deltaY, scale);
      setPosition(newPos);
    } else if (e.touches.length === 2 && initialPinchDistance > 0) {
      // ピンチズーム - 指の中心点を基準に拡大
      const { distance } = getPinchData(e.touches);
      const scaleChange = distance / initialPinchDistance;
      const newScale = Math.min(Math.max(initialPinchScale * scaleChange, minScale), maxScale);
      
      // ピンチ中心点を基準にズーム
      const scaleRatio = newScale / initialPinchScale;
      const newX = pinchCenter.x - (pinchCenter.x - initialPinchPosition.x) * scaleRatio;
      const newY = pinchCenter.y - (pinchCenter.y - initialPinchPosition.y) * scaleRatio;
      
      setScale(newScale);
      // ピンチ中は余白を許容（指を離したときに制限）
      setPosition({ x: newX, y: newY });
    }
  }, [isDragging, dragStart, positionStart, scale, clampPosition, initialPinchDistance, initialPinchScale, pinchCenter, initialPinchPosition]);

  // タッチ終了
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (initialPinchDistance > 0) {
      // ピンチ終了時に位置を制限
      setPosition(pos => clampPosition(pos.x, pos.y, scale));
    }
    setInitialPinchDistance(0);
  }, [initialPinchDistance, scale, clampPosition]);

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
      const scaleRatio = newScale / prev;
      
      setPosition(pos => {
        const newX = mouseX - (mouseX - pos.x) * scaleRatio;
        const newY = mouseY - (mouseY - pos.y) * scaleRatio;
        return clampPosition(newX, newY, newScale);
      });
      
      return newScale;
    });
  }, [clampPosition]);

  // グローバルマウスアップ
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

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
        cursor: isDragging ? 'grabbing' : 'grab',
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
          height: `${imageDimensions.height}px`,
          width: `${imageDimensions.width}px`,
          maxWidth: 'none',
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'top left',
          transition: isDragging || initialPinchDistance > 0 ? 'none' : 'transform 0.1s ease-out',
        }}
        onLoad={handleImageLoad}
      />

      {/* Zoom Controls - 画面下部に固定（URL欄より上） */}
      <div 
        className="absolute flex flex-col gap-2 z-50"
        style={{
          bottom: '120px',
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
        className="absolute z-40 pointer-events-none opacity-80"
        style={{
          bottom: '120px',
          left: '16px',
        }}
      >
        <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-mono">
          {Math.round(scale * 100)}%
        </div>
      </div>
    </div>
  );
}
