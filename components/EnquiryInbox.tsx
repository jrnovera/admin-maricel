"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Trash2, MailOpen, MailWarning } from "lucide-react";
import {
  setEnquiryRead,
  deleteEnquiry,
} from "@/app/(dashboard)/enquiries/actions";
import type { Enquiry } from "@/lib/types";

type Filter = "unread" | "all";

const cell = "border border-gray-200 px-3 py-2 align-top";
const head =
  "sticky top-0 border border-gray-300 bg-gray-100 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-700";

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

export default function EnquiryInbox({
  enquiries,
  canDelete,
}: {
  enquiries: Enquiry[];
  canDelete: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("unread");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const unreadCount = enquiries.filter((e) => !e.is_read).length;
  const visible =
    filter === "unread" ? enquiries.filter((e) => !e.is_read) : enquiries;
  const selected = enquiries.find((e) => e.id === selectedId) ?? null;

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

      <div className="mb-4 flex gap-2">
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

      {/* Formula-bar style preview — a table cell can't show a full paragraph,
          so clicking a row surfaces its full message here instead. */}
      <div className="flex items-start gap-2 rounded-t-lg border border-b-0 border-gray-300 bg-gray-50 px-3 py-2 text-xs">
        <span className="mt-0.5 shrink-0 font-mono font-semibold text-ink-400">
          fx
        </span>
        <p className="whitespace-pre-wrap leading-relaxed text-ink-700">
          {selected ? selected.message : "Click a row to preview its full message…"}
        </p>
      </div>

      <div className="overflow-x-auto rounded-b-lg border border-gray-300">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr>
              <th className={`${head} w-10 text-center`}>#</th>
              <th className={head}>Date</th>
              <th className={head}>Name</th>
              <th className={head}>Phone</th>
              <th className={head}>Email</th>
              <th className={head}>Subject</th>
              <th className={head}>Service</th>
              <th className={head}>Message</th>
              <th className={head}>Status</th>
              <th className={`${head} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((e, i) => (
              <tr
                key={e.id}
                onClick={() => setSelectedId(e.id)}
                className={`cursor-pointer transition-colors ${
                  selectedId === e.id
                    ? "bg-pink-50"
                    : i % 2 === 0
                      ? "bg-white hover:bg-pink-50/50"
                      : "bg-gray-50/70 hover:bg-pink-50/50"
                }`}
              >
                <td className={`${cell} text-center text-xs text-ink-400`}>
                  {i + 1}
                </td>
                <td className={`${cell} whitespace-nowrap text-xs text-ink-500`}>
                  {format(new Date(e.created_at), "d MMM yyyy, h:mm a")}
                </td>
                <td className={`${cell} ${e.is_read ? "" : "font-medium text-ink-900"}`}>
                  {e.full_name}
                  {!e.is_read && (
                    <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-pink-500 align-middle" />
                  )}
                </td>
                <td className={`${cell} whitespace-nowrap`}>
                  <a
                    href={`tel:${e.phone}`}
                    onClick={(ev) => ev.stopPropagation()}
                    className="hover:text-pink-500"
                  >
                    {e.phone}
                  </a>
                </td>
                <td className={`${cell} whitespace-nowrap`}>
                  {e.email ? (
                    <a
                      href={`mailto:${e.email}`}
                      onClick={(ev) => ev.stopPropagation()}
                      className="hover:text-pink-500"
                    >
                      {e.email}
                    </a>
                  ) : (
                    <span className="text-ink-300">—</span>
                  )}
                </td>
                <td className={cell}>
                  {e.subject || <span className="text-ink-300">—</span>}
                </td>
                <td className={`${cell} whitespace-nowrap`}>
                  {e.service ? (
                    <span className="rounded bg-pink-50 px-1.5 py-0.5 text-[11px] text-pink-600">
                      {e.service}
                    </span>
                  ) : (
                    <span className="text-ink-300">—</span>
                  )}
                </td>
                <td className={`${cell} max-w-[260px] truncate`} title={e.message}>
                  {truncate(e.message, 60)}
                </td>
                <td className={`${cell} whitespace-nowrap`}>
                  {e.is_read ? (
                    <span className="text-xs text-ink-400">Read</span>
                  ) : (
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">
                      New
                    </span>
                  )}
                </td>
                <td
                  className={`${cell} whitespace-nowrap text-right`}
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <span className="flex items-center justify-end gap-3">
                    <button
                      disabled={pending}
                      onClick={() => run(() => setEnquiryRead(e.id, !e.is_read))}
                      className="text-ink-500 hover:text-pink-500 disabled:opacity-50"
                      title={e.is_read ? "Mark unread" : "Mark read"}
                    >
                      {e.is_read ? <MailWarning size={14} /> : <MailOpen size={14} />}
                    </button>

                    {canDelete &&
                      (confirmId === e.id ? (
                        <span className="flex items-center gap-1.5 text-xs">
                          <span className="text-ink-500">Delete?</span>
                          <button
                            disabled={pending}
                            onClick={() =>
                              run(async () => {
                                await deleteEnquiry(e.id);
                                setConfirmId(null);
                                if (selectedId === e.id) setSelectedId(null);
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
                          <Trash2 size={14} />
                        </button>
                      ))}
                  </span>
                </td>
              </tr>
            ))}

            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="border border-gray-200 px-6 py-12 text-center text-sm text-ink-500"
                >
                  {filter === "unread" ? "No unread enquiries." : "No enquiries yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
