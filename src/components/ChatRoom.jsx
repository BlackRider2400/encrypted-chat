import { useEffect, useState, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { format } from "date-fns";

export default function ChatRoom({ user, chatId, chatPartner, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp"),
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);

      snapshot.docs.forEach(async (doc) => {
        const data = doc.data();
        if (!data.readBy?.includes(user.uid)) {
          await updateDoc(doc.ref, {
            readBy: [...(data.readBy || []), user.uid],
          });
        }
      });
    });

    return () => unsubscribe();
  }, [chatId]);

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
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-[#fff0f6]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-xs px-4 py-2 rounded-2xl shadow-md text-sm ${
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
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="p-4 bg-white border-t border-[#ff80c9] flex gap-2"
      >
        <input
          className="flex-1 border border-[#ff80c9] bg-[#fff5fa] text-[#d63384] rounded-full px-4 py-2 placeholder-[#ff80c9] focus:outline-none"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Type something sweet..."
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
