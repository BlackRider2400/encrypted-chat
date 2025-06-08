import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  limitToLast,
  endBefore,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { format } from "date-fns";

const PAGE_SIZE = 20;

export default function ChatRoom({ user, chatId, chatPartner, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [oldestDoc, setOldestDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 300);

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc"),
      limitToLast(PAGE_SIZE),
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      if (msgs.length > 0) setOldestDoc(snap.docs[0]);
      setTimeout(
        () =>
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }),
        100,
      );
      snap.docs.forEach(async (docSnap) => {
        const data = docSnap.data();
        if (!data.readBy?.includes(user.uid)) {
          await updateDoc(docSnap.ref, {
            readBy: [...(data.readBy || []), user.uid],
          });
        }
      });
    });
    return () => unsub();
  }, [chatId, user.uid]);

  const fetchOlder = async () => {
    if (!oldestDoc || !hasMore) return;
    const olderQuery = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc"),
      endBefore(oldestDoc),
      limitToLast(PAGE_SIZE),
    );
    const snap = await getDocs(olderQuery);
    if (snap.empty) {
      setHasMore(false);
      return;
    }
    const olderMsgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (!data.readBy?.includes(user.uid)) {
        await updateDoc(docSnap.ref, {
          readBy: [...(data.readBy || []), user.uid],
        });
      }
    }
    setMessages((prev) => [...olderMsgs, ...prev]);
    setOldestDoc(snap.docs[0]);
    if (snap.docs.length < PAGE_SIZE) setHasMore(false);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (el && el.scrollTop < 80 && hasMore) {
      fetchOlder();
    }
  };

  const handleSend = async () => {
    const text = newMsg.trim();
    if (!text) return;
    setNewMsg("");
    textareaRef.current.style.height = "auto";
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      senderId: user.uid,
      timestamp: serverTimestamp(),
      readBy: [user.uid],
    });
    
    textareaRef.current?.focus();
  };

  const deleteMessage = async (id) => {
    if (window.confirm("Delete this message?")) {
      await deleteDoc(doc(db, "chats", chatId, "messages", id));
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleInput = (e) => {
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    setNewMsg(e.target.value);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-[#fff0f6] font-sans">
      <div className="flex-shrink-0 p-3 sm:p-4 bg-[#ffb6d9] border-b border-[#ff80c9] shadow-md flex justify-between items-center">
        <h2 className="text-lg sm:text-xl font-bold text-[#9b1859] truncate mr-2">
          {chatPartner.name || chatPartner.email}
        </h2>
        <button
          onClick={onBack}
          className="text-white bg-[#ff5ca2] px-3 py-1 rounded-full hover:bg-[#ff3d94] transition flex-shrink-0"
        >
          ← Back
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-[#fff0f6] min-h-0"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`relative max-w-xs px-4 py-2 rounded-2xl shadow-md text-sm whitespace-pre-wrap ${
              msg.senderId === user.uid
                ? "bg-[#ff5ca2] text-white self-end ml-auto"
                : "bg-[#fff5fa] text-[#9b1859] self-start"
            }`}
          >
            <div>{msg.text}</div>
            <div className="text-xs mt-1 text-right opacity-70">
              {msg.timestamp?.toDate
                ? format(msg.timestamp.toDate(), "HH:mm")
                : ""}
            </div>
            {msg.senderId === user.uid && (
              <button
                onClick={() => deleteMessage(msg.id)}
                className="absolute top-1 right-2 px-3 py-2 text-base text-white/70 hover:text-white/90"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex-shrink-0 p-3 sm:p-4 bg-white border-t border-[#ff80c9] flex gap-2 items-end"
      >
        <textarea
          ref={textareaRef}
          className="flex-1 border border-[#ff80c9] bg-[#fff5fa] text-[#d63384] rounded-full px-4 py-2 placeholder-[#ff80c9] focus:outline-none resize-none overflow-hidden min-h-[40px] max-h-[120px]"
          value={newMsg}
          onChange={handleInput}
          onKeyDown={onKeyDown}
          placeholder="Type something sweet..."
          rows={1}
        />
        <button
          type="submit"
          className="bg-[#ff5ca2] hover:bg-[#ff3d94] text-white px-4 sm:px-5 py-2 rounded-full font-semibold transition flex-shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  );
}
