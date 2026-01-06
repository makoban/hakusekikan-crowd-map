import { useRef } from "react";

export type CrowdStatus = "available" | "normal" | "crowded";

export interface SpotData {
  id: number;
  name: string;
  description?: string;
  status: CrowdStatus;
  waitTime: number; // 待ち時間（分）
  positionX: number; // マップ上のX座標（%）
  positionY: number; // マップ上のY座標（%）
}

interface CrowdMarkerProps {
  spot: SpotData;
  scale: number;
  onTap: (spot: SpotData) => void;
}

// ステータスに応じた色を返す
const getStatusColor = (status: CrowdStatus): string => {
  switch (status) {
    case "available":
      return "#3B82F6"; // 青（空き）
    case "normal":
      return "#22C55E"; // 緑（通常）
    case "crowded":
      return "#EF4444"; // 赤（混雑）
    default:
      return "#6B7280"; // グレー
  }
};

// ステータスのラベルを返す
export const getStatusLabel = (status: CrowdStatus): string => {
  switch (status) {
    case "available":
      return "空き";
    case "normal":
      return "通常";
    case "crowded":
      return "混雑";
    default:
      return "不明";
  }
};

export function CrowdMarker({ spot, scale, onTap }: CrowdMarkerProps) {
  const color = getStatusColor(spot.status);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  
  // マーカーサイズはズームに関係なく一定（逆スケール）
  const markerSize = 28 / scale;

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // タップ判定（移動が少ない場合のみ）
    if (touchStartRef.current && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - touchStartRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);
      
      if (dx < 10 && dy < 10) {
        onTap(spot);
      }
    }
    touchStartRef.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onTap(spot);
  };

  return (
    <div
      className="absolute cursor-pointer"
      style={{
        left: `${spot.positionX}%`,
        top: `${spot.positionY}%`,
        transform: 'translate(-50%, -100%)',
        zIndex: 100,
        pointerEvents: 'auto',
      }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* 三角形マーカー（▲） */}
      <svg
        width={markerSize}
        height={markerSize}
        viewBox="0 0 24 24"
        style={{
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
          transition: "transform 0.15s ease-out",
        }}
        className="hover:scale-125 active:scale-95"
      >
        <path
          d="M12 2 L22 20 L2 20 Z"
          fill={color}
          stroke="white"
          strokeWidth="2.5"
        />
      </svg>
    </div>
  );
}

interface SpotDetailPopupProps {
  spot: SpotData;
  onClose: () => void;
}

export function SpotDetailPopup({ spot, onClose }: SpotDetailPopupProps) {
  const color = getStatusColor(spot.status);
  const statusLabel = getStatusLabel(spot.status);

  const handleBackdropClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onTouchEnd={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-[90%] max-h-[70vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div
          className="px-6 py-4 text-white"
          style={{ backgroundColor: color }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{spot.name}</h2>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* コンテンツ（スクロール可能） */}
        <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
          {/* 待ち時間 */}
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">待ち時間</div>
            <div className="text-3xl font-bold" style={{ color }}>
              {spot.waitTime > 0 ? `約${spot.waitTime}分` : "待ちなし"}
            </div>
          </div>

          {/* 説明 */}
          {spot.description && (
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-1">説明</div>
              <p className="text-gray-700 leading-relaxed">{spot.description}</p>
            </div>
          )}

          {/* 混雑状況の説明 */}
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-2">混雑状況</div>
            <div className="flex gap-2">
              <StatusBadge status="available" current={spot.status} />
              <StatusBadge status="normal" current={spot.status} />
              <StatusBadge status="crowded" current={spot.status} />
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl font-medium text-gray-700 transition-colors"
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, current }: { status: CrowdStatus; current: CrowdStatus }) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);
  const isActive = status === current;

  return (
    <div
      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
        isActive ? "ring-2 ring-offset-1" : "opacity-50"
      }`}
      style={{
        backgroundColor: isActive ? color : "#E5E7EB",
        color: isActive ? "white" : "#6B7280",
      }}
    >
      <span className="text-xs">▲</span>
      <span>{label}</span>
    </div>
  );
}
