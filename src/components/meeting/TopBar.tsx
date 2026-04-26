import { Download, Settings as SettingsIcon } from "lucide-react";

type Props = {
  onOpenSettings: () => void;
  onExport: () => void;
};

export function TopBar({ onOpenSettings, onExport }: Props) {
  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between border-b px-4"
      style={{ backgroundColor: "var(--primary-deep)", borderColor: "var(--primary-deep)" }}
    >
      <div className="flex items-center text-[15px] font-semibold tracking-tight text-white">
        <span>twin</span>
        <span style={{ color: "var(--accent)" }}>mind</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/40 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10"
        >
          <SettingsIcon className="h-3.5 w-3.5" />
          Settings
        </button>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>
    </header>
  );
}
