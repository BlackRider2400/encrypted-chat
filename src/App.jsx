import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./components/Login";
import ChatList from "./components/ChatList";
import ChatRoom from "./components/ChatRoom";

function App() {
  const [user, setUser] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatPartner, setChatPartner] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsub();
  }, []);

  const logout = () => {
    signOut(auth);
    setUser(null);
    setActiveChatId(null);
  };

  return (
    <div className="min-h-screen bg-[#fff0f6] font-sans">
      {!user ? (
        <Login onLogin={(u) => setUser(u)} />
      ) : !activeChatId ? (
        <>
          <div className="flex justify-between items-center p-4 bg-[#ffb6d9] border-b border-[#ff80c9] shadow-md">
            <h1 className="text-2xl font-bold text-[#9b1859] tracking-wide">
              Short n’ Sweet 💋
            </h1>
            <button
              onClick={logout}
              className="text-white bg-[#ff5ca2] px-4 py-1 rounded-full font-medium hover:bg-[#ff3d94] transition"
            >
              Logout
            </button>
          </div>
          <ChatList
            user={user}
            onSelectChat={(chatId, otherUser) => {
              setActiveChatId(chatId);
              setChatPartner(otherUser);
            }}
          />
        </>
      ) : (
        <ChatRoom
          user={user}
          chatId={activeChatId}
          chatPartner={chatPartner}
          onBack={() => setActiveChatId(null)}
        />
      )}
    </div>
  );
}

export default App;
