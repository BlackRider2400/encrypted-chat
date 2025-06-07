import { useEffect, useState, useRef, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { format } from "date-fns";

const PAGE_SIZE = 20;

export default function ChatRoom({ user, chatId, chatPartner, onBack }) {
  const [messages, setMessages] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newMsg, setNewMsg] = useState("");
  const scrollRef = useRef(null);
  const topRef = useRef(null);
  const textareaRef = useRef(null);

  const fetchMessages = useCallback(
    async (initial = false) => {
      const baseQuery = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("timestamp", "desc"),
        ...(lastVisible ? [startAfter(lastVisible)] : []),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(baseQuery);
      const newMessages = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // mark messages as read
      for (let docSnap of snap.docs) {
        const data = docSnap.data();
        if (!data.readBy?.includes(user.uid)) {
          await updateDoc(docSnap.ref, {
            readBy: [...(data.readBy || []), user.uid],
          });
        }
      }

      if (initial) {
        setMessages(newMessages.reverse());
      } else {
        setMessages((prev) => [...newMessages.reverse(), ...prev]);
      }

      if (snap.docs.length < PAGE_SIZE) setHasMore(false);
      else setLastVisible(snap.docs[snap.docs.length - 1]);
    },
    [chatId, lastVisible, user.uid]
  );

  useEffect(() => {
    setMessages([]);
    setLastVisible(null);
    setHasMore(true);
    fetchMessages(true);
  }, [chatId]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (el && el.scrollTop < 80 && hasMore && !loadingMore) {
      setLoadingMore(true);
      fetchMessages().then(() => setLoadingMore(false));
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: newMsg,
      senderId: user.uid,
      timestamp: serverTimestamp(),
      readBy: [user.uid],
    });

    setNewMsg("");
    textareaRef.current.style.height = "auto";

    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  const deleteMessage = async (messageId) => {
    if (window.confirm("Delete this message?")) {
      await deleteDoc(doc(db, "chats", chatId, "messages", messageId));
    }
  };

  const handleInput = (e) => {
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    setNewMsg(e.target.value);
  };

  return (
    <div className="flex flex-col h-screen bg-[#fff0f6] font-sans">
      {/* Header */}
      <div className="p-4 bg-[#ffb6d9] border-b border-[#ff80c9] shadow-md flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#9b1859]">
          {chatPartner.name || chatPartner.email}
        </h2>
        <button
          onClick={onBack}
          className="text-white bg-[#ff5ca2] px-3 py-1 rounded-full hover:bg-[#ff3d94] transition"
        >
          ← Back
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-[#fff0f6]"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        <div ref={topRef} />
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`relative max-w-xs px-4 py-2 rounded-2xl shadow-md text-sm ${
              msg.senderId === user.uid
                ? "bg-[#ff5ca2] text-white self-end ml-auto"
                : "bg-[#fff5fa] text-[#9b1859] self-start"
            }`}
          >
            <div className="whitespace-pre-wrap">{msg.text}</div>
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
        <div style={{ height: 1 }} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="p-4 bg-white border-t border-[#ff80c9] flex gap-2"
      >
        <textarea
          ref={textareaRef}
          className="flex-1 border border-[#ff80c9] bg-[#fff5fa] text-[#d63384] rounded-full px-4 py-2 placeholder-[#ff80c9] focus:outline-none resize-none overflow-hidden"
          value={newMsg}
          onChange={handleInput}
          placeholder="Type something sweet..."
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(e);
            }
          }}
        />
        <button
          type="submit"
          className="bg-[#ff5ca2] hover:bg-[#ff3d94] text-white px-5 py-2 rounded-full font-semibold transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}
