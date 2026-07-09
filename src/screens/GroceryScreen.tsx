import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { useGroceryVoice, type GroceryVoiceError } from "../hooks/useGroceryVoice";
import { parseGroceryInput } from "../services/groceryInput";
import type { GroceryItem } from "../types/app";

const VOICE_ERRORS: Record<GroceryVoiceError, string> = {
  unsupported: "Voice recording is not supported in this browser.",
  insecure: "Voice needs a secure connection (HTTPS).",
  unavailable: "Add GEMINI_API_KEY to .env and restart npm run dev.",
  "server-offline": "Can't reach the Fridge AI server. Run npm run dev and keep the terminal open.",
  "mic-denied": "Microphone access was blocked. Allow the mic in browser settings.",
  "no-speech": "Did not catch that. Tap Say it and try again.",
  failed: "Could not understand that. Try again or type your items.",
};

interface GroceryScreenProps {
  items: GroceryItem[];
  onAddItems: (names: string[]) => void;
  onToggleItem: (id: string) => void;
  onRenameItem: (id: string, name: string) => boolean;
  onRemoveItem: (id: string) => void;
  onClearChecked: () => void;
}

export function GroceryScreen({
  items,
  onAddItems,
  onToggleItem,
  onRenameItem,
  onRemoveItem,
  onClearChecked,
}: GroceryScreenProps) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editHint, setEditHint] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const unchecked = items.filter((item) => !item.checked);

  const handleVoiceTranscript = useCallback(
    (text: string) => {
      const names = parseGroceryInput(text);
      if (names.length > 0) onAddItems(names);
      else if (text.trim()) onAddItems([text.trim()]);
    },
    [onAddItems],
  );

  const { listening, processing, supported, error, toggle } =
    useGroceryVoice(handleVoiceTranscript);

  const submitDraft = () => {
    const names = parseGroceryInput(draft);
    if (names.length === 0) return;
    onAddItems(names);
    setDraft("");
  };

  const startEditing = (item: GroceryItem) => {
    setEditingId(item.id);
    setEditDraft(item.name);
    setEditHint(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDraft("");
    setEditHint(null);
  };

  const saveEditing = useCallback(() => {
    if (!editingId) return;

    const trimmed = editDraft.trim();
    if (!trimmed) {
      setEditHint("Item name cannot be empty.");
      return;
    }

    const renamed = onRenameItem(editingId, trimmed);
    if (!renamed) {
      const current = items.find((item) => item.id === editingId);
      if (current && current.name.trim() === trimmed) {
        cancelEditing();
        return;
      }
      setEditHint("That item is already on your list.");
      return;
    }

    cancelEditing();
  }, [editDraft, editingId, items, onRenameItem]);

  useEffect(() => {
    if (!editingId) return;
    editInputRef.current?.focus();
    editInputRef.current?.select();
  }, [editingId]);

  return (
    <div className="screen">
      <PageHeader
        title="Groceries"
        subtitle="Type or say what you need — tap any item to edit it."
      />

      <section className="card grocery-add">
        <label className="grocery-add__field">
          <span className="grocery-add__label">Add items</span>
          <input
            type="text"
            className="grocery-add__input"
            placeholder="e.g. milk, eggs and bread"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={listening || processing}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitDraft();
            }}
          />
        </label>

        <div className="grocery-add__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={submitDraft}
            disabled={!draft.trim() || listening || processing}
          >
            Add
          </button>
          {supported ? (
            <button
              type="button"
              className={`btn btn--secondary grocery-add__voice${listening || processing ? " grocery-add__voice--active" : ""}`}
              onClick={toggle}
              disabled={processing}
              aria-pressed={listening}
            >
              <span aria-hidden>{listening || processing ? "🔴" : "🎤"}</span>
              {processing ? "Understanding…" : listening ? "Stop" : "Say it"}
            </button>
          ) : (
            <p className="grocery-add__voice-hint">Voice works in Chrome &amp; Safari on phone.</p>
          )}
        </div>
        {listening && (
          <p className="grocery-add__voice-status" role="status">
            Recording… say items like &ldquo;milk, eggs, and bread&rdquo;, then tap Stop.
          </p>
        )}
        {processing && (
          <p className="grocery-add__voice-status" role="status">
            Turning your voice into grocery items…
          </p>
        )}
        {error && (
          <p className="grocery-add__voice-error" role="alert">
            {VOICE_ERRORS[error]}
          </p>
        )}
      </section>

      {items.length === 0 ? (
        <div className="empty-state card">
          <p className="empty-state__emoji" aria-hidden>
            🛒
          </p>
          <h2>Your list is empty</h2>
          <p>Type items above or tap Say it and try &ldquo;milk, eggs, and bread.&rdquo;</p>
          <p className="grocery-empty__hint">Fridge scans can also add missing ingredients here.</p>
        </div>
      ) : (
        <section className="card grocery-card">
          <div className="card__head">
            <h2>Shopping list</h2>
            <p>
              {unchecked.length} item{unchecked.length === 1 ? "" : "s"} left · tap to edit
            </p>
          </div>
          <ul className="grocery-list">
            {items.map((item) => (
              <li key={item.id} className="grocery-list__row">
                <div className={`grocery-item${item.checked ? " grocery-item--checked" : ""}`}>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => onToggleItem(item.id)}
                    aria-label={`Mark ${item.name} as ${item.checked ? "needed" : "got"}`}
                  />
                  {editingId === item.id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      className="grocery-item__edit"
                      value={editDraft}
                      onChange={(event) => {
                        setEditDraft(event.target.value);
                        setEditHint(null);
                      }}
                      onBlur={() => saveEditing()}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          saveEditing();
                        }
                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelEditing();
                        }
                      }}
                      aria-label={`Edit ${item.name}`}
                    />
                  ) : (
                    <button
                      type="button"
                      className="grocery-item__name"
                      onClick={() => startEditing(item)}
                    >
                      {item.name}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="grocery-list__edit"
                  onClick={() => startEditing(item)}
                  aria-label={`Edit ${item.name}`}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="grocery-list__remove"
                  onClick={() => onRemoveItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          {editHint && (
            <p className="grocery-card__edit-hint" role="alert">
              {editHint}
            </p>
          )}
          {items.some((item) => item.checked) && (
            <button type="button" className="btn btn--ghost grocery-card__clear" onClick={onClearChecked}>
              Clear checked items
            </button>
          )}
        </section>
      )}
    </div>
  );
}
