import { useState } from "react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = async () => {
    try {
      if (isRegister) {
        if (!name.trim()) return alert("Please enter your name!");
        if (password !== confirmPassword)
          return alert("Passwords do not match!");

        // 🔍 Check if username is unique
        const existing = await getDocs(
          query(collection(db, "users"), where("name", "==", name.trim())),
        );
        if (!existing.empty) return alert("That username is already taken 💔");
      }

      let userCredential;
      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
      }

      const user = userCredential.user;

      await setDoc(
        doc(db, "users", user.uid),
        {
          email: user.email,
          ...(isRegister ? { name: name.trim() } : {}),
        },
        { merge: true },
      );

      onLogin(user);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await setDoc(
        doc(db, "users", user.uid),
        {
          email: user.email,
          name: user.displayName,
        },
        { merge: true },
      );

      onLogin(user);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) return alert("Enter your email first!");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset link sent 💌");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fff0f6] p-4 font-sans">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-[#ff80c9]">
        <h1 className="text-3xl font-bold mb-6 text-center text-[#9b1859]">
          Short n’ Sweet 💋
        </h1>

        {isRegister && (
          <input
            className="border border-[#ff80c9] bg-[#fff5fa] placeholder-[#ff80c9] text-[#9b1859] rounded-full px-4 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-[#ff5ca2]"
            type="text"
            placeholder="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <input
          className="border border-[#ff80c9] bg-[#fff5fa] placeholder-[#ff80c9] text-[#9b1859] rounded-full px-4 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-[#ff5ca2]"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative w-full mb-3">
          <input
            className="border border-[#ff80c9] bg-[#fff5fa] placeholder-[#ff80c9] text-[#9b1859] rounded-full px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#ff5ca2]"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2 text-sm text-[#ff5ca2] hover:underline"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {isRegister && (
          <input
            className="border border-[#ff80c9] bg-[#fff5fa] placeholder-[#ff80c9] text-[#9b1859] rounded-full px-4 py-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-[#ff5ca2]"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        )}

        <button
          onClick={handleEmailLogin}
          className={`${
            isRegister
              ? "bg-[#ffd166] hover:bg-[#ffc400] text-[#9b1859]"
              : "bg-[#ff5ca2] hover:bg-[#ff3d94] text-white"
          } px-4 py-2 rounded-full w-full transition mb-3`}
        >
          {isRegister ? "Register" : "Login"}
        </button>

        {!isRegister && (
          <div className="flex justify-between text-sm text-[#d63384] mb-4">
            <button onClick={handleResetPassword} className="hover:underline">
              Forgot password?
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className="hover:underline"
            >
              Don’t have an account?
            </button>
          </div>
        )}

        {isRegister && (
          <div className="text-sm text-center text-[#d63384] mb-4">
            <button
              onClick={() => setIsRegister(false)}
              className="hover:underline"
            >
              Already have an account? Log in
            </button>
          </div>
        )}

        <hr className="my-4 border-[#ff80c9]" />

        <button
          onClick={handleGoogleLogin}
          className="bg-white border border-[#ffd166] text-[#d97706] px-4 py-2 w-full rounded-full hover:bg-yellow-50 transition"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
