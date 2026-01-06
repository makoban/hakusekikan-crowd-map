import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Map as MapIcon } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startTranslateX, setStartTranslateX] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const minScale = 1;
  const maxScale = 4;

  // translateXの範囲を制限する関数
  const clampTranslateX = useCallback((x: number, currentScale: number, imgWidth: number) => {
    if (!containerRef.current) return x;
    
    const containerWidth = containerRef.current.offsetWidth;
    const scaledImageWidth = imgWidth * currentScale;
    
    // 画像幅が画面幅以下の場合は中央に固定
    if (scaledImageWidth <= containerWidth) {
      return (containerWidth - scaledImageWidth) / 2;
    }
    
    // 画像の左端が画面左端より右に行かない（左側に余白が出ない）
    const maxX = 0;
    // 画像の右端が画面右端より左に行かない（右側に余白が出ない）
    const minX = containerWidth - scaledImageWidth;
    
    return Math.min(maxX, Math.max(minX, x));
  }, []);

  // 画像読み込み完了時に寸法を取得し、初期位置を中央に設定
  const handleImageLoad = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const containerWidth = containerRef.current.offsetWidth;
      const screenHeight = window.innerHeight;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const displayWidth = screenHeight * aspectRatio;
      
      setImageDimensions({
        width: displayWidth,
        height: screenHeight,
      });
      setImageLoaded(true);
      
      // 初期位置を中央に設定（画像幅が画面幅より大きい場合）
      if (displayWidth > containerWidth) {
        const centerX = (containerWidth - displayWidth) / 2;
        setTranslateX(centerX);
      } else {
        setTranslateX((containerWidth - displayWidth) / 2);
      }
    }
  }, []);

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

  // リセット（中央に戻す）
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

  // ドラッグ開始（マウス）
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
    setStartTranslateX(translateX);
  }, [translateX]);

  // ドラッグ中（マウス）
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const newTranslateX = clampTranslateX(startTranslateX + deltaX, scale, imageDimensions.width);
    setTranslateX(newTranslateX);
  }, [isDragging, startX, startTranslateX, scale, clampTranslateX, imageDimensions.width]);

  // ドラッグ終了（マウス）
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // タッチ開始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setStartX(e.touches[0].clientX);
      setStartTranslateX(translateX);
    }
  }, [translateX]);

  // タッチ移動
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - startX;
    const newTranslateX = clampTranslateX(startTranslateX + deltaX, scale, imageDimensions.width);
    setTranslateX(newTranslateX);
  }, [isDragging, startX, startTranslateX, scale, clampTranslateX, imageDimensions.width]);

  // タッチ終了
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
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

  // ウィンドウリサイズ時に再計算
  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current && containerRef.current) {
        const img = imageRef.current;
        const containerWidth = containerRef.current.offsetWidth;
        const screenHeight = window.innerHeight;
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const displayWidth = screenHeight * aspectRatio;
        
        setImageDimensions({
          width: displayWidth,
          height: screenHeight,
        });
        
        // リサイズ後にtranslateXを調整
        setTranslateX(x => clampTranslateX(x, scale, displayWidth));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [scale, clampTranslateX]);

  // マウスが画面外に出た時のドラッグ終了
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-[#e8e4d9]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{ touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Map Image */}
      <img
        ref={imageRef}
        src="/map.png"
        alt="Hakusekikan Park Map"
        className="select-none"
        draggable={false}
        style={{
          height: '100vh',
          width: 'auto',
          maxWidth: 'none',
          transform: `translateX(${translateX}px) scale(${scale})`,
          transformOrigin: 'left center',
          filter: 'sepia(0.1) contrast(1.05)',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
        onLoad={handleImageLoad}
      />

      {/* Retro HUD Controls */}
      <div className="absolute bottom-8 right-6 flex flex-col gap-4 z-50">
        <div className="flex flex-col gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-xl border-2 border-[#d4c5a3]">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            onMouseDown={(e) => e.stopPropagation()}
            className="rounded-full w-12 h-12 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shadow-md border-2 border-white/20"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            onMouseDown={(e) => e.stopPropagation()}
            className="rounded-full w-12 h-12 bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105 transition-all shadow-md border-2 border-[#8b5e3c]/10"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            onMouseDown={(e) => e.stopPropagation()}
            className="rounded-full w-12 h-12 bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-105 transition-all shadow-md border-2 border-white/20"
            aria-label="Reset View"
          >
            <RotateCcw className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Header / Title Badge */}
      <div className="absolute top-6 left-6 z-50 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border-2 border-primary/20 transform -rotate-1">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg shadow-inner">
              <MapIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-heading text-primary leading-none">HAKUSEKIKAN</h1>
              <p className="text-xs font-bold text-muted-foreground tracking-wider uppercase mt-1">Crowd Map</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scale Indicator */}
      <div className="absolute bottom-8 left-6 z-40 pointer-events-none opacity-80">
        <div className="bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded-md text-xs font-mono">
          Scale: {Math.round(scale * 100)}%
        </div>
      </div>
    </div>
  );
}
