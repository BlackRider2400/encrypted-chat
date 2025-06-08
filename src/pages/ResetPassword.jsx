import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "../firebase";

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const code = sp.get("oobCode");
  const nav = useNavigate();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const go = async (e) => {
    e.preventDefault();
    setErr("");
    if (pw1 !== pw2) return setErr("Passwords don’t match");
    try {
      await confirmPasswordReset(auth, code, pw1);
      setMsg("Password reset! Redirecting…");
      setTimeout(() => nav("/login"), 2500);
    } catch (e) {
      setErr(e.message);
    }
  };

  if (!code) return <p className="p-4 text-red-500">Invalid link</p>;

  const input =
    "w-full px-4 py-2 border border-pink-300 rounded-full mb-3 focus:outline-none";

  return (
    <div className="flex items-center justify-center h-dvh bg-pink-50 p-4">
      <form
        onSubmit={go}
        className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md border border-pink-300"
      >
        <h2 className="text-xl font-bold mb-4 text-pink-700 text-center">
          Reset Password
        </h2>
        <input
          type="password"
          className={input}
          placeholder="New password"
          value={pw1}
          onChange={(e) => setPw1(e.target.value)}
        />
        <input
          type="password"
          className={input}
          placeholder="Confirm password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
        />
        {err && <p className="text-red-500 text-sm mb-2">{err}</p>}
        {msg && <p className="text-green-600 text-sm mb-2">{msg}</p>}
        <button className="w-full bg-pink-500 hover:bg-pink-600 text-white py-2 rounded-full">
          Reset
        </button>
      </form>
    </div>
  );
}
