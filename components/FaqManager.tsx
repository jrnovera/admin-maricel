"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { saveFaq, deleteFaq } from "@/app/(dashboard)/faqs/actions";
import type { MbcFaq } from "@/lib/types";
import Modal from "@/components/Modal";

const field =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-pink-400 disabled:bg-pink-50/50";
const label = "mb-1.5 block text-xs font-semibold tracking-[0.1em] text-ink-900";

function FaqForm({ faq, onDone }: { faq: MbcFaq | null; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await saveFaq(formData);
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save FAQ");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-ink-900">
          {faq ? "Edit Question" : "New Question"}
        </h2>
        <button type="button" onClick={onDone} className="text-ink-500">
          <X size={18} />
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {faq && <input type="hidden" name="id" value={faq.id} />}
      <input type="hidden" name="pageKey" value={faq?.page_key ?? "vouchers"} />

      <div>
        <label className={label}>QUESTION</label>
        <input
          name="question"
          required
          defaultValue={faq?.question ?? ""}
          disabled={pending}
          className={field}
        />
      </div>

      <div>
        <label className={label}>ANSWER</label>
        <textarea
          name="answer"
          required
          rows={3}
          defaultValue={faq?.answer ?? ""}
          disabled={pending}
          className={field}
        />
      </div>

      <div>
        <label className={label}>SORT ORDER</label>
        <input
          name="sortOrder"
          type="number"
          defaultValue={faq?.sort_order ?? 0}
          disabled={pending}
          className={`${field} sm:max-w-[10rem]`}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={faq?.is_active ?? true}
          disabled={pending}
          className="h-4 w-4 accent-pink-500"
        />
        Show on the public site
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-pink-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-pink-600 disabled:opacity-60"
      >
        {pending ? "SAVING…" : "Save Question"}
      </button>
    </form>
  );
}

export default function FaqManager({ faqs }: { faqs: MbcFaq[] }) {
  const [editing, setEditing] = useState<MbcFaq | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      {!creating && !editing && (
        <button
          onClick={() => setCreating(true)}
          className="mb-6 flex items-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-pink-600"
        >
          <Plus size={16} /> New Question
        </button>
      )}

      {(creating || editing) && (
        <Modal
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        >
          <FaqForm
            faq={editing}
            onDone={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        </Modal>
      )}

      <div className="overflow-hidden card-premium">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-pink-50">
            {faqs.map((f) => (
              <tr key={f.id} className={f.is_active ? "" : "opacity-50"}>
                <td className="px-4 py-3">
                  {f.question}
                  {!f.is_active && (
                    <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                      Hidden
                    </span>
                  )}
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-500">{f.answer}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {confirmId === f.id ? (
                    <span className="flex items-center justify-end gap-2 text-xs">
                      <span className="text-ink-500">Delete?</span>
                      <button
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await deleteFaq(f.id);
                            setConfirmId(null);
                          })
                        }
                        className="font-medium text-red-600 hover:text-red-800"
                      >
                        Yes
                      </button>
                      <button onClick={() => setConfirmId(null)} className="text-ink-500">
                        No
                      </button>
                    </span>
                  ) : (
                    <span className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setCreating(false);
                          setEditing(f);
                        }}
                        className="text-ink-500 hover:text-pink-500"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmId(f.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {faqs.length === 0 && (
        <p className="card-premium px-6 py-12 text-center text-sm text-ink-500">
          No questions yet.
        </p>
      )}
    </div>
  );
}
