import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import ChatApp from "./components/ChatApp";
import { me } from "./api/encryption.js";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState("");

  const onLogin = async (token, password) => {
    localStorage.setItem("token", token);
    try {
      const { data } = await me();
      setUser(data.name);
      localStorage.setItem("id", data.id);
      localStorage.setItem("name", data.name);
      localStorage.setItem("public_key", data.publicKey);
      localStorage.setItem("private_key", data.privateKey);
    } catch (err) {
      alert(err);
    }
  };

  useEffect(() => {
    setLoading(false);
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
          <Route path="/login" element={<Login onLogin={onLogin} />} />
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>
      </Router>
    </div>
  );
}
