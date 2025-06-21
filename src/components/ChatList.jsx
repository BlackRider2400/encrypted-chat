import { useEffect, useState } from "react";
import { format } from "date-fns";

export default function ChatList({ user, onSelectChat }) {
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    // TODO get all conversations for user
  }, [user.uid]);

  const softDeleteChat = async (chatId) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this chat?",
    );
    if (!confirm) return;

    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);
    const data = chatSnap.data();

    const otherUserId = data.users.find((id) => id !== user.uid);
    const alreadyDeleted = data.deletedFor || [];

    if (alreadyDeleted.includes(otherUserId)) {
      // Both deleted → permanently remove chat
      const messagesRef = collection(db, "chats", chatId, "messages");
      const messagesSnap = await getDocs(messagesRef);
      await Promise.all(messagesSnap.docs.map((d) => deleteDoc(d.ref)));
      await deleteDoc(chatRef);
    } else {
      // Soft delete for this user
      await updateDoc(chatRef, {
        deletedFor: arrayUnion(user.uid),
      });
    }

    setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));
  };

  const filteredUsers = allUsers.filter((u) =>
    (u.name || u.email || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-[#fff0f6] font-sans">
      <div className="flex-shrink-0 p-3 sm:p-4">
        <input
          type="text"
          className="border border-[#ff80c9] bg-[#fff5fa] placeholder-[#ff80c9] text-[#d63384] rounded-full px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#ff5ca2]"
          placeholder="Search your sweethearts…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-4">
        {searchQuery ? (
          <>
            <h2 className="text-lg font-bold mb-3 text-[#9b1859]">
              Search Results
            </h2>
            {filteredUsers.length === 0 && (
              <p className="text-[#ff5ca2] italic">No users found 💔</p>
            )}
            <ul className="space-y-3">
              {filteredUsers.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => startChat(u)}
                    className="w-full text-left p-3 bg-[#fff0c4] text-yellow-800 rounded-xl hover:bg-[#ffeaa7] transition"
                  >
                    {u.name || u.email}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold mb-3 text-[#9b1859]">
              Recent Chats
            </h2>
            {chatHistory.length === 0 && (
              <p className="text-[#ff5ca2] italic">No recent chats yet…</p>
            )}
            <ul className="space-y-3">
              {chatHistory.map((chat) => (
                <li key={chat.id}>
                  <div className="w-full flex justify-between items-center p-3 bg-[#ffe0f0] text-[#9b1859] rounded-xl hover:bg-[#ffc4dc] transition shadow-sm">
                    <div
                      onClick={() =>
                        onSelectChat(chat.id, {
                          id: chat.partnerId,
                          ...chat.partner,
                        })
                      }
                      className="flex-1 text-left cursor-pointer"
                    >
                      <div>{chat.partner.name || chat.partner.email}</div>
                      <div className="text-xs text-[#c16a95] mt-1">
                        {chat.lastTimestamp?.toDate
                          ? format(chat.lastTimestamp.toDate(), "HH:mm")
                          : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {chat.unread > 0 && (
                        <span className="text-sm bg-red-500 text-white rounded-full px-2 py-0.5 shadow">
                          {chat.unread}
                        </span>
                      )}
                      <button
                        onClick={() => softDeleteChat(chat.id)}
                        className="px-3 py-2 text-base text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
