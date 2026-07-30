"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Phone, Mail, Trash2, MailOpen, MailWarning } from "lucide-react";
import {
  setEnquiryRead,
  deleteEnquiry,
} from "@/app/(dashboard)/enquiries/actions";
import type { Enquiry } from "@/lib/types";

type Filter = "unread" | "all";

export default function EnquiryInbox({
  enquiries,
  canDelete,
}: {
  enquiries: Enquiry[];
  canDelete: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("unread");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const unreadCount = enquiries.filter((e) => !e.is_read).length;
  const visible =
    filter === "unread" ? enquiries.filter((e) => !e.is_read) : enquiries;

  function run(fn: () => Promise<void>) {
    setError("");
    startTransition(async () => {
      try {
        await fn();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mb-5 flex gap-2">
        {(["unread", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? "border-pink-500 bg-pink-500 text-white"
                : "border-black/10 bg-white text-ink-700"
            }`}
          >
            {f}
            <span
              className={`rounded-full px-1.5 text-[10px] ${
                filter === f ? "bg-white/20" : "bg-black/[0.04]"
              }`}
            >
              {f === "unread" ? unreadCount : enquiries.length}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map((e) => (
          <div
            key={e.id}
            className={`card-premium p-5 ${e.is_read ? "opacity-70" : ""}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-ink-900">
                  {e.full_name}
                  {!e.is_read && (
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
                      New
                    </span>
                  )}
                </p>
                {e.subject && (
                  <p className="mt-0.5 text-sm text-ink-700">{e.subject}</p>
                )}
                {e.service && (
                  <p className="mt-1 inline-block rounded bg-pink-50 px-2 py-0.5 text-[11px] text-pink-600">
                    {e.service}
                  </p>
                )}
              </div>
              <p className="whitespace-nowrap text-xs text-ink-500">
                {format(new Date(e.created_at), "d MMM yyyy, h:mm a")}
              </p>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
              {e.message}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-black/[0.06] pt-3 text-xs">
              <a
                href={`tel:${e.phone}`}
                className="flex items-center gap-1.5 text-ink-500 hover:text-pink-500"
              >
                <Phone size={12} /> {e.phone}
              </a>
              {e.email && (
                <a
                  href={`mailto:${e.email}`}
                  className="flex items-center gap-1.5 text-ink-500 hover:text-pink-500"
                >
                  <Mail size={12} /> {e.email}
                </a>
              )}

              <span className="ml-auto flex items-center gap-3">
                <button
                  disabled={pending}
                  onClick={() => run(() => setEnquiryRead(e.id, !e.is_read))}
                  className="flex items-center gap-1.5 font-medium text-ink-500 hover:text-pink-500 disabled:opacity-50"
                >
                  {e.is_read ? (
                    <>
                      <MailWarning size={13} /> Mark unread
                    </>
                  ) : (
                    <>
                      <MailOpen size={13} /> Mark read
                    </>
                  )}
                </button>

                {canDelete &&
                  (confirmId === e.id ? (
                    <span className="flex items-center gap-2">
                      <span className="text-ink-500">Delete?</span>
                      <button
                        disabled={pending}
                        onClick={() =>
                          run(async () => {
                            await deleteEnquiry(e.id);
                            setConfirmId(null);
                          })
                        }
                        className="font-medium text-red-600 hover:text-red-800"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-ink-500"
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmId(e.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete enquiry"
                    >
                      <Trash2 size={13} />
                    </button>
                  ))}
              </span>
            </div>
          </div>
        ))}

        {visible.length === 0 && (
          <p className="card-premium px-6 py-12 text-center text-sm text-ink-500">
            {filter === "unread" ? "No unread enquiries." : "No enquiries yet."}
          </p>
        )}
      </div>
    </div>
  );
}
