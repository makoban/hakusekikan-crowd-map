import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Map as MapIcon } from "lucide-react";
import { TransformWrapper, TransformComponent, ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch";
import { useRef, useState } from "react";

export default function Home() {
  const transformComponentRef = useRef<ReactZoomPanPinchContentRef>(null);
  const [scale, setScale] = useState(1);

  const handleZoomIn = () => {
    if (transformComponentRef.current) {
      transformComponentRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (transformComponentRef.current) {
      transformComponentRef.current.zoomOut();
    }
  };

  const handleReset = () => {
    if (transformComponentRef.current) {
      transformComponentRef.current.resetTransform();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#e8e4d9]">
      {/* Map Viewer */}
      <TransformWrapper
        ref={transformComponentRef}
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        limitToBounds={false}
        onZoom={(ref) => setScale(ref.state.scale)}
        wheel={{ step: 0.1 }}
        pinch={{ step: 5 }}
      >
        <TransformComponent
          wrapperClass="!w-screen !h-screen"
          contentClass="!w-full !h-full flex items-center justify-center"
        >
          <img
            src="/map.png"
            alt="Hakusekikan Park Map"
            className="h-full w-auto max-w-none object-contain shadow-2xl"
            style={{
              filter: "sepia(0.1) contrast(1.05)", // Slight retro feel
            }}
          />
        </TransformComponent>
      </TransformWrapper>

      {/* Retro HUD Controls */}
      <div className="absolute bottom-8 right-6 flex flex-col gap-4 z-50">
        <div className="flex flex-col gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-xl border-2 border-[#d4c5a3]">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="rounded-full w-12 h-12 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shadow-md border-2 border-white/20"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="rounded-full w-12 h-12 bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105 transition-all shadow-md border-2 border-[#8b5e3c]/10"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
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

      {/* Scale Indicator (Optional decoration) */}
      <div className="absolute bottom-8 left-6 z-40 pointer-events-none opacity-80">
        <div className="bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded-md text-xs font-mono">
          Scale: {Math.round(scale * 100)}%
        </div>
      </div>
    </div>
  );
}
