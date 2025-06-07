import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, provider, db } from "../firebase";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";

export default function Login({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isRegistering) {
      if (password !== confirmPass) {
        alert("Passwords do not match");
        return;
      }

      // Check username uniqueness
      const q = query(collection(db, "users"), where("name", "==", username));
      const result = await getDocs(q);
      if (!username || !result.empty) {
        alert("Username must be unique and not empty.");
        return;
      }

      try {
        const { user } = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          name: username,
        });
        onLogin(user);
        navigate("/");
      } catch (err) {
        alert(err.message);
      }
    } else {
      try {
        const { user } = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        onLogin(user);
        navigate("/");
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await setDoc(
        doc(db, "users", user.uid),
        {
          email: user.email,
          name: user.displayName || "",
        },
        { merge: true },
      );
      onLogin(user);
      navigate("/");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      alert("Enter your email to reset password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent.");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fff0f6] p-4 font-sans">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-[#ff80c9]">
        <h1 className="text-3xl font-bold mb-6 text-center text-[#9b1859]">
          Short n’ Sweet 💋
        </h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegistering && (
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="border border-[#ff80c9] bg-[#fff5fa] placeholder-[#ff80c9] text-[#9b1859] rounded-full px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#ff5ca2]"
            />
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="border border-[#ff80c9] bg-[#fff5fa] placeholder-[#ff80c9] text-[#9b1859] rounded-full px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#ff5ca2]"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="border border-[#ff80c9] bg-[#fff5fa] placeholder-[#ff80c9] text-[#9b1859] rounded-full px-4 py-2 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-[#ff5ca2]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2 text-sm text-[#9b1859]"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {isRegistering && (
            <input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Confirm Password"
              className="border border-[#ff80c9] bg-[#fff5fa] placeholder-[#ff80c9] text-[#9b1859] rounded-full px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#ff5ca2]"
            />
          )}

          <div className="flex justify-between items-center text-sm text-[#9b1859]">
            {!isRegistering && (
              <button
                type="button"
                onClick={handleForgot}
                className="hover:underline"
              >
                Forgot password?
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="hover:underline ml-auto"
            >
              {isRegistering ? "I already have an account" : "Create account"}
            </button>
          </div>

          <button
            type="submit"
            className="bg-[#ff5ca2] hover:bg-[#ff3d94] text-white px-4 py-2 rounded-full w-full transition"
          >
            {isRegistering ? "Register" : "Login"}
          </button>
        </form>

        <hr className="my-4 border-[#ff80c9]" />

        <button
          onClick={handleGoogle}
          className="bg-white border border-[#ffd166] text-[#d97706] px-4 py-2 w-full rounded-full hover:bg-yellow-50 transition"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
