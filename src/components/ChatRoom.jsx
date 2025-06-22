import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { getMessages, removeMessage, sendMessage } from "../api/messages";
import { getConversationKey } from "../api/keys";
import {
  decryptRSA,
  encryptAESGCM,
  decryptAESGCM,
  importAESKeyFromBuffer,
  decryptEncryptedPrivateKey,
} from "../tools/encryption";
import { useCallback } from "react";

export default function ChatRoom({ user, chatId, chatPartner, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [aesKey, setAesKey] = useState(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // const fetchMessages = async (limit = 50) => {
  //   try {
  //     const { data } = await getMessages(chatId, limit);
  //     const decryptedMessages = await Promise.all(
  //       data.map(async (message) => {
  //         try {
  //           const decryptedContent = await decryptAESGCM(
  //             message.content,
  //             aesKey,
  //           );
  //           return {
  //             ...message,
  //             content: decryptedContent,
  //           };
  //         } catch (error) {
  //           console.error(
  //             `Decryption failed for message ID ${message.id}:`,
  //             error,
  //           );
  //           return message;
  //         }
  //       }),
  //     );
  //     setMessages(decryptedMessages);
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

  const fetchKeys = async () => {
    try {
      const encryptedPrivateKey = localStorage.getItem("private_key");
      const password = localStorage.getItem("password");
      if (encryptedPrivateKey === null || encryptedPrivateKey === "") {
        console.error("PEM or password is missing.");
        return;
      }
      const { data } = await getConversationKey(chatId);
      console.log("conversation: " + data.id);
      console.log("PEM starts with:", encryptedPrivateKey.slice(0, 40));
      const decryptedPrivateKey = await decryptEncryptedPrivateKey(
        encryptedPrivateKey,
        password,
      );
      const encryptedKey = data.keyValue;
      const aesKeyBuffer = await decryptRSA(encryptedKey, decryptedPrivateKey);
      const decyrptedSymetricKey = await importAESKeyFromBuffer(aesKeyBuffer);
      setAesKey(decyrptedSymetricKey);
      fetchMessages();
    } catch (err) {
      console.log(err);
    }
  };

  const fetchMessages = useCallback(
    async (limit = 50) => {
      if (!aesKey) return; // ① wait for key
      try {
        const { data } = await getMessages(chatId, limit);
        const decrypted = await Promise.all(
          data.map(async (m) => {
            try {
              const plain = await decryptAESGCM(m.content, aesKey);
              return { ...m, content: plain };
            } catch {
              return { ...m, content: "[failed to decrypt]" };
            }
          }),
        );
        const ok = decrypted.filter((i) => i.content !== "[failed to decrypt]");
        ok.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        setMessages(ok);
        /* scroll to bottom after messages load */
        queueMicrotask(() =>
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }),
        );
      } catch (e) {
        console.error("fetchMessages →", e);
      }
    },
    [aesKey, chatId],
  );

  useEffect(() => {
    const pem = localStorage.getItem("private_key");
    const password = localStorage.getItem("password");
    if (!pem || !password) return;

    (async () => {
      try {
        /* ‣ decrypt user’s RSA private key */
        const rsaKey = await decryptEncryptedPrivateKey(
          pem.replace(/\\n/g, "\n"),
          password,
        );

        /* ‣ download & decrypt the chat’s symmetric AES key */
        const { data } = await getConversationKey(chatId);
        const aesBuf = await decryptRSA(data.keyValue, rsaKey);
        const symKey = await importAESKeyFromBuffer(aesBuf); // now ["encrypt","decrypt"]
        setAesKey(symKey);
      } catch (e) {
        console.error("key-setup →", e);
      }
    })();
  }, [chatId]);

  useEffect(() => {
    if (aesKey) fetchMessages();
  }, [aesKey, fetchMessages]);

  // useEffect(() => {
  //   if (!aesKey) return;

  //   fetchMessages();

  //   setTimeout(() => {
  //     textareaRef.current?.focus();
  //     scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  //   }, 100);
  // }, [aesKey]);

  // useEffect(() => {
  //   fetchKeys();

  //   setTimeout(() => {
  //     textareaRef.current?.focus();
  //   }, 300);

  //   // TODO implement effect for setting up synchronizing for messages
  //   setTimeout(
  //     () =>
  //       scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }),
  //     100,
  //   );
  // }, [chatId, user]);

  const handleSend = async () => {
    const text = newMsg.trim();
    if (!text) return;
    const content = await encryptAESGCM(text, aesKey);
    try {
      await sendMessage(content, chatId);
    } catch (err) {
      console.log(err);
    }
    fetchMessages();
    textareaRef.current?.focus();
  };

  const deleteMessage = async (id) => {
    if (window.confirm("Delete this message?")) {
      try {
        await removeMessage(id);
        setMessages((prev) => prev.filter((m) => m.id !== id));
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleInput = (e) => {
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    setNewMsg(e.target.value);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-[#fff0f6] font-sans">
      <div className="flex-shrink-0 p-3 sm:p-4 bg-[#ffb6d9] border-b border-[#ff80c9] shadow-md flex justify-between items-center">
        <h2 className="text-lg sm:text-xl font-bold text-[#9b1859] truncate mr-2">
          {chatPartner.name}
        </h2>
        <button
          onClick={onBack}
          className="text-white bg-[#ff5ca2] px-3 py-1 rounded-full hover:bg-[#ff3d94] transition flex-shrink-0"
        >
          ← Back
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-[#fff0f6] min-h-0"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`relative max-w-xs px-4 py-2 rounded-2xl shadow-md text-sm whitespace-pre-wrap ${
              msg.author.id === user.id
                ? "bg-[#ff5ca2] text-white self-end ml-auto"
                : "bg-[#fff5fa] text-[#9b1859] self-start"
            }`}
          >
            <div>{msg.content}</div>
            <div className="text-xs mt-1 text-right opacity-70">
              {msg.timestamp
                ? format(new Date(msg.timestamp), "d MMM HH:mm")
                : ""}
            </div>
            {msg.author.id === user.id && (
              <button
                onClick={() => deleteMessage(msg.id)}
                className="absolute top-1 right-2 px-3 py-2 text-base text-white/70 hover:text-white/90"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex-shrink-0 p-3 sm:p-4 bg-white border-t border-[#ff80c9] flex gap-2 items-end"
      >
        <textarea
          ref={textareaRef}
          className="flex-1 border border-[#ff80c9] bg-[#fff5fa] text-[#d63384] rounded-full px-4 py-2 placeholder-[#ff80c9] focus:outline-none resize-none overflow-hidden min-h-[40px] max-h-[120px]"
          value={newMsg}
          onChange={handleInput}
          onKeyDown={onKeyDown}
          placeholder="Type something sweet..."
          rows={1}
        />
        <button
          type="submit"
          className="bg-[#ff5ca2] hover:bg-[#ff3d94] text-white px-4 sm:px-5 py-2 rounded-full font-semibold transition flex-shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  );
}
