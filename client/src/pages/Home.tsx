import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startTranslateX, setStartTranslateX] = useState(0);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  // ピンチズーム用の状態
  const [initialPinchDistance, setInitialPinchDistance] = useState(0);
  const [initialPinchScale, setInitialPinchScale] = useState(1);

  const minScale = 1;
  const maxScale = 4;

  // ビューポートの高さを取得（モバイルブラウザのURL欄を考慮）
  useEffect(() => {
    const updateViewportHeight = () => {
      // CSS変数でビューポート高さを設定
      const vh = window.innerHeight;
      setViewportHeight(vh);
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    
    // モバイルブラウザでスクロール時にURL欄が隠れた時の対応
    window.addEventListener('scroll', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
      window.removeEventListener('scroll', updateViewportHeight);
    };
  }, []);

  // translateXの範囲を制限する関数
  const clampTranslateX = useCallback((x: number, currentScale: number, imgWidth: number) => {
    if (!containerRef.current) return x;
    
    const containerWidth = containerRef.current.offsetWidth;
    const scaledImageWidth = imgWidth * currentScale;
    
    if (scaledImageWidth <= containerWidth) {
      return (containerWidth - scaledImageWidth) / 2;
    }
    
    const maxX = 0;
    const minX = containerWidth - scaledImageWidth;
    
    return Math.min(maxX, Math.max(minX, x));
  }, []);

  // 画像読み込み完了時
  const handleImageLoad = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const containerWidth = containerRef.current.offsetWidth;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const displayWidth = viewportHeight * aspectRatio;
      
      setImageDimensions({
        width: displayWidth,
        height: viewportHeight,
      });
      
      if (displayWidth > containerWidth) {
        const centerX = (containerWidth - displayWidth) / 2;
        setTranslateX(centerX);
      } else {
        setTranslateX((containerWidth - displayWidth) / 2);
      }
    }
  }, [viewportHeight]);

  // ビューポート高さ変更時に再計算
  useEffect(() => {
    if (imageRef.current && containerRef.current && imageRef.current.complete) {
      const img = imageRef.current;
      const containerWidth = containerRef.current.offsetWidth;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const displayWidth = viewportHeight * aspectRatio;
      
      setImageDimensions({
        width: displayWidth,
        height: viewportHeight,
      });
      
      setTranslateX(x => clampTranslateX(x, scale, displayWidth));
    }
  }, [viewportHeight, scale, clampTranslateX]);

  // ズームイン
  const handleZoomIn = useCallback(() => {
    setScale(prev => {
      const newScale = Math.min(prev * 1.3, maxScale);
      setTimeout(() => {
        setTranslateX(x => clampTranslateX(x, newScale, imageDimensions.width));
      }, 0);
      return newScale;
    });
  }, [clampTranslateX, imageDimensions.width]);

  // ズームアウト
  const handleZoomOut = useCallback(() => {
    setScale(prev => {
      const newScale = Math.max(prev / 1.3, minScale);
      setTimeout(() => {
        setTranslateX(x => clampTranslateX(x, newScale, imageDimensions.width));
      }, 0);
      return newScale;
    });
  }, [clampTranslateX, imageDimensions.width]);

  // リセット
  const handleReset = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      setScale(1);
      if (imageDimensions.width > containerWidth) {
        const centerX = (containerWidth - imageDimensions.width) / 2;
        setTranslateX(centerX);
      } else {
        setTranslateX((containerWidth - imageDimensions.width) / 2);
      }
    }
  }, [imageDimensions.width]);

  // マウスドラッグ
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
    setStartTranslateX(translateX);
  }, [translateX]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const newTranslateX = clampTranslateX(startTranslateX + deltaX, scale, imageDimensions.width);
    setTranslateX(newTranslateX);
  }, [isDragging, startX, startTranslateX, scale, clampTranslateX, imageDimensions.width]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 2点間の距離を計算
  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // タッチ開始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // シングルタッチ（ドラッグ）
      setIsDragging(true);
      setStartX(e.touches[0].clientX);
      setStartTranslateX(translateX);
    } else if (e.touches.length === 2) {
      // ピンチズーム開始
      setIsDragging(false);
      const distance = getDistance(e.touches);
      setInitialPinchDistance(distance);
      setInitialPinchScale(scale);
    }
  }, [translateX, scale]);

  // タッチ移動
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      // シングルタッチ（ドラッグ）
      const deltaX = e.touches[0].clientX - startX;
      const newTranslateX = clampTranslateX(startTranslateX + deltaX, scale, imageDimensions.width);
      setTranslateX(newTranslateX);
    } else if (e.touches.length === 2 && initialPinchDistance > 0) {
      // ピンチズーム
      const currentDistance = getDistance(e.touches);
      const scaleChange = currentDistance / initialPinchDistance;
      const newScale = Math.min(Math.max(initialPinchScale * scaleChange, minScale), maxScale);
      setScale(newScale);
      
      // ズーム後に位置を調整
      setTranslateX(x => clampTranslateX(x, newScale, imageDimensions.width));
    }
  }, [isDragging, startX, startTranslateX, scale, clampTranslateX, imageDimensions.width, initialPinchDistance, initialPinchScale]);

  // タッチ終了
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setInitialPinchDistance(0);
  }, []);

  // ホイールでズーム
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => {
      const newScale = Math.min(Math.max(prev * delta, minScale), maxScale);
      setTimeout(() => {
        setTranslateX(x => clampTranslateX(x, newScale, imageDimensions.width));
      }, 0);
      return newScale;
    });
  }, [clampTranslateX, imageDimensions.width]);

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
        className="select-none"
        draggable={false}
        style={{
          height: `${viewportHeight}px`,
          width: 'auto',
          maxWidth: 'none',
          transform: `translateX(${translateX}px) scale(${scale})`,
          transformOrigin: 'left center',
          filter: 'sepia(0.1) contrast(1.05)',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
        onLoad={handleImageLoad}
      />

      {/* Zoom Controls - 画面内に固定 */}
      <div 
        className="fixed flex flex-col gap-2 z-50"
        style={{
          bottom: 'max(env(safe-area-inset-bottom, 16px), 16px)',
          right: 'max(env(safe-area-inset-right, 16px), 16px)',
        }}
      >
        <div className="flex flex-col gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-2xl shadow-xl border-2 border-[#d4c5a3]">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="rounded-full w-11 h-11 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-md"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="rounded-full w-11 h-11 bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95 transition-all shadow-md"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="rounded-full w-11 h-11 bg-accent text-accent-foreground hover:bg-accent/90 active:scale-95 transition-all shadow-md"
            aria-label="Reset View"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Scale Indicator - 左下に固定 */}
      <div 
        className="fixed z-40 pointer-events-none opacity-80"
        style={{
          bottom: 'max(env(safe-area-inset-bottom, 16px), 16px)',
          left: 'max(env(safe-area-inset-left, 16px), 16px)',
        }}
      >
        <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-mono">
          {Math.round(scale * 100)}%
        </div>
      </div>
    </div>
  );
}
