import { useState } from "react";
import { confirmPasswordReset, getAuth } from "firebase/auth";
import { useSearchParams } from "react-router-dom";

export default function ResetPassword() {
  const auth = getAuth();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const [newPassword, setNewPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setConfirmed(true);
    } catch (err) {
      setError(err.message);
    }
  };

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff0f6]">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-pink-300">
          <h1 className="text-2xl font-bold text-pink-700 mb-2">Success 🎉</h1>
          <p className="text-pink-600">Your password has been reset.</p>
          <a
            href="/"
            className="mt-4 inline-block text-white bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-full"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fff0f6]">
      <form
        onSubmit={handleReset}
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md border border-pink-300"
      >
        <h2 className="text-2xl font-bold text-pink-700 mb-4">
          Reset Password 🔒
        </h2>

        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          className="w-full px-4 py-2 border border-pink-300 rounded-full mb-4 focus:outline-none focus:ring-2 focus:ring-pink-300"
        />

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <button
          type="submit"
          className="w-full bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-full"
        >
          Reset Password
        </button>
      </form>
    </div>
  );
}
