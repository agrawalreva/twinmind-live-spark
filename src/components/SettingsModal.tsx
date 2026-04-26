import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/context/SettingsContext";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/settings";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettingsModal({ open, onOpenChange }: Props) {
  const { settings, setSettings, restoreDefaults } = useSettings();
  const [draft, setDraft] = useState<Settings>(settings);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(settings);
    onOpenChange(next);
  };

  const save = () => {
    setSettings(draft);
    onOpenChange(false);
  };

  const reset = () => {
    restoreDefaults();
    setDraft(DEFAULT_SETTINGS);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Groq API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={draft.groqApiKey}
                onChange={(e) => setDraft({ ...draft, groqApiKey: e.target.value })}
              />
              <Button type="button" variant="outline" onClick={() => setShowApiKey((v) => !v)}>
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <PromptField
            id="suggestion-prompt"
            label="Suggestion prompt"
            value={draft.suggestionPrompt}
            onChange={(value) => setDraft({ ...draft, suggestionPrompt: value })}
          />
          <PromptField
            id="chat-prompt"
            label="Chat prompt"
            value={draft.chatPrompt}
            onChange={(value) => setDraft({ ...draft, chatPrompt: value })}
          />
          <PromptField
            id="click-prompt"
            label="Click expand prompt"
            value={draft.clickExpandPrompt}
            onChange={(value) => setDraft({ ...draft, clickExpandPrompt: value })}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <NumberField
              id="suggestion-window"
              label="Suggestion context window"
              value={draft.suggestionContextWindow}
              onChange={(value) => setDraft({ ...draft, suggestionContextWindow: value })}
            />
            <NumberField
              id="chat-window"
              label="Chat context window"
              value={draft.chatContextWindow}
              onChange={(value) => setDraft({ ...draft, chatContextWindow: value })}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={reset}>
            Restore defaults
          </Button>
          <Button type="button" onClick={save}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PromptField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} rows={6} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}
