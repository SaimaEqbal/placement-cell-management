import { Landmark } from "lucide-react";

export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "compact" : ""}`}>
      <div className="brand-mark">
        <Landmark size={22} />
      </div>
      <div>
        <strong>University Placement Cell</strong>
        {!compact && <span>Jamia Millia Islamia</span>}
      </div>
    </div>
  );
}
