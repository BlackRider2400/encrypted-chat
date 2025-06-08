import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import ChatApp from "./components/ChatApp";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="h-dvh bg-[#fff0f6]">
      <Router basename="/chatapp">
        <Routes>
          <Route
            path="/"
            element={user ? <ChatApp user={user} /> : <Navigate to="/login" />}
          />
          <Route path="/login" element={<Login onLogin={setUser} />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>
      </Router>
    </div>
  );
}
