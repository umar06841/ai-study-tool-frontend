import { useState, useEffect, useRef, useCallback } from "react";
import { auth, db, googleProvider } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const COLORS = {
  bg: "#0a0a0f",
  card: "#13131a",
  border: "#1e1e2e",
  accent: "#6ee7b7",
  accent2: "#818cf8",
  accent3: "#f472b6",
  text: "#e2e8f0",
  muted: "#64748b",
};

function Spinner({ small }) {
  return (
    <div style={{
      width: small ? 18 : 36,
      height: small ? 18 : 36,
      border: `3px solid ${COLORS.border}`,
      borderTop: `3px solid ${COLORS.accent}`,
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
      flexShrink: 0,
    }} />
  );
}

function TabBtn({ active, onClick, children, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 22px",
      borderRadius: 100,
      border: "none",
      cursor: "pointer",
      fontFamily: "Syne, sans-serif",
      fontWeight: 700,
      fontSize: 14,
      letterSpacing: 0.5,
      transition: "all 0.2s",
      background: active ? color : "transparent",
      color: active ? "#0a0a0f" : COLORS.muted,
      boxShadow: active ? `0 0 20px ${color}55` : "none",
    }}>{children}</button>
  );
}

function Flashcard({ front, back, index }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div onClick={() => setFlipped(f => !f)} style={{ cursor: "pointer", height: 180, borderRadius: 16, perspective: 1000 }}>
      <div style={{
        position: "relative", width: "100%", height: "100%",
        transformStyle: "preserve-3d",
        transition: "transform 0.5s cubic-bezier(.4,2,.6,1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>
        <div style={{
          position: "absolute", width: "100%", height: "100%",
          backfaceVisibility: "hidden",
          background: `linear-gradient(135deg, #13131a, #1a1a2e)`,
          border: `1px solid ${COLORS.accent}33`,
          borderRadius: 16,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "20px 24px", boxSizing: "border-box",
        }}>
          <span style={{ fontSize: 11, color: COLORS.accent, fontFamily: "Syne", fontWeight: 700, letterSpacing: 2, marginBottom: 12, opacity: 0.7 }}>Q {index + 1} · TAP TO FLIP</span>
          <p style={{ color: COLORS.text, fontFamily: "DM Sans", fontSize: 15, textAlign: "center", margin: 0, lineHeight: 1.6 }}>{front}</p>
        </div>
        <div style={{
          position: "absolute", width: "100%", height: "100%",
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          background: `linear-gradient(135deg, #0f1a13, #13231a)`,
          border: `1px solid ${COLORS.accent}66`,
          borderRadius: 16,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "20px 24px", boxSizing: "border-box",
        }}>
          <span style={{ fontSize: 11, color: COLORS.accent, fontFamily: "Syne", fontWeight: 700, letterSpacing: 2, marginBottom: 12, opacity: 0.7 }}>ANSWER</span>
          <p style={{ color: COLORS.accent, fontFamily: "DM Sans", fontSize: 15, textAlign: "center", margin: 0, lineHeight: 1.6 }}>{back}</p>
        </div>
      </div>
    </div>
  );
}

function QuizSection({ questions }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  if (!questions || questions.length === 0) return null;
  const score = submitted ? questions.filter((q, i) => answers[i] === q.correct).length : null;
  return (
    <div>
      {questions.map((q, i) => (
        <div key={i} style={{
          background: COLORS.card,
          border: `1px solid ${submitted ? answers[i] === q.correct ? "#6ee7b744" : "#f4728744" : COLORS.border}`,
          borderRadius: 14, padding: "20px 24px", marginBottom: 16,
        }}>
          <p style={{ color: COLORS.text, fontFamily: "DM Sans", fontWeight: 500, margin: "0 0 14px", fontSize: 15 }}>
            <span style={{ color: COLORS.accent2, fontFamily: "Syne", fontWeight: 700, marginRight: 8 }}>Q{i + 1}.</span>{q.question}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {q.options.map((opt, j) => {
              const isSelected = answers[i] === j;
              const isCorrect = j === q.correct;
              let bg = "transparent", border = `1px solid ${COLORS.border}`, color = COLORS.muted;
              if (submitted) {
                if (isCorrect) { bg = "#6ee7b711"; border = `1px solid ${COLORS.accent}`; color = COLORS.accent; }
                else if (isSelected) { bg = "#f4728711"; border = "1px solid #f47287"; color = "#f47287"; }
              } else if (isSelected) { bg = "#818cf811"; border = `1px solid ${COLORS.accent2}`; color = COLORS.accent2; }
              return (
                <button key={j} disabled={submitted} onClick={() => setAnswers(a => ({ ...a, [i]: j }))}
                  style={{ background: bg, border, color, borderRadius: 10, padding: "10px 16px", fontFamily: "DM Sans", fontSize: 14, cursor: submitted ? "default" : "pointer", textAlign: "left" }}>
                  <span style={{ fontWeight: 700, marginRight: 10 }}>{String.fromCharCode(65 + j)}.</span>{opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!submitted ? (
        <button onClick={() => setSubmitted(true)} style={{ background: COLORS.accent2, color: "#0a0a0f", border: "none", borderRadius: 100, padding: "12px 32px", fontFamily: "Syne", fontWeight: 700, cursor: "pointer" }}>Submit Answers</button>
      ) : (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.accent2}44`, borderRadius: 14, padding: "20px", textAlign: "center" }}>
          <p style={{ color: COLORS.accent2, fontFamily: "Syne", fontWeight: 800, fontSize: 28, margin: "0 0 4px" }}>{score}/{questions.length}</p>
          <p style={{ color: COLORS.muted, fontFamily: "DM Sans", margin: 0, fontSize: 14 }}>
            {score === questions.length ? "🎉 Perfect score!" : score >= questions.length / 2 ? "Good job! 💪" : "Keep studying! 📚"}
          </p>
        </div>
      )}
    </div>
  );
}

// AUTH MODAL
function AuthModal({ onClose }) {
  const [mode, setMode] = useState("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, "users", result.user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          email: result.user.email,
          name: result.user.displayName,
          tier: "free",
          usesThisDay: 0,
          createdAt: new Date(),
        });
      }
      onClose();
    } catch (err) {
      setError("Google sign-in failed. Try email instead.");
    }
    setGoogleLoading(false);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", result.user.uid), {
          email: result.user.email,
          tier: "free",
          usesThisDay: 0,
          createdAt: new Date(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace(/\(auth.*\)\.?/, "").trim());
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 20, padding: 32,
        maxWidth: 400, width: "100%",
        animation: "fadeUp 0.3s ease",
      }}>
        {mode === "main" && (
          <>
            <h2 style={{ color: COLORS.text, fontFamily: "Syne", fontWeight: 800, fontSize: 22, margin: "0 0 8px", textAlign: "center" }}>
              Sign in to continue
            </h2>
            <p style={{ color: COLORS.muted, fontFamily: "DM Sans", fontSize: 14, textAlign: "center", margin: "0 0 24px" }}>
              Create a free account to keep generating
            </p>

            <button onClick={handleGoogleLogin} disabled={googleLoading} style={{
              width: "100%", background: "#fff", border: "none", borderRadius: 12,
              padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "center",
              gap: 10, cursor: googleLoading ? "not-allowed" : "pointer",
              fontFamily: "Syne", fontWeight: 700, fontSize: 15, marginBottom: 12,
            }}>
              {googleLoading ? <Spinner small /> : (
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.3 0 24 0 14.8 0 6.9 5.4 3.1 13.3l7.8 6.1C12.8 13 17.9 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.4c-.5 2.8-2.1 5.2-4.5 6.8l7 5.5c4.1-3.8 6.2-9.3 6.2-16.3z"/>
                  <path fill="#FBBC05" d="M10.9 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.8-6.1C1.1 16.6 0 20.2 0 24s1.1 7.4 3.1 10.7l7.8-6.1z"/>
                  <path fill="#34A853" d="M24 48c6.3 0 11.6-2.1 15.5-5.7l-7-5.5c-2.1 1.5-4.9 2.4-8.5 2.4-6.1 0-11.2-3.5-13.1-9l-7.8 6.1C6.9 42.6 14.8 48 24 48z"/>
                </svg>
              )}
              {googleLoading ? "Signing in..." : "Continue with Google"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
              <div style={{ flex: 1, height: 1, background: COLORS.border }} />
              <span style={{ color: COLORS.muted, fontFamily: "DM Sans", fontSize: 13 }}>or</span>
              <div style={{ flex: 1, height: 1, background: COLORS.border }} />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => { setMode("signup"); setError(""); }} style={{
                flex: 1, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
                color: "#0a0a0f", border: "none", borderRadius: 10,
                padding: "12px", fontFamily: "Syne", fontWeight: 700, cursor: "pointer",
              }}>Sign Up Free</button>
              <button onClick={() => { setMode("login"); setError(""); }} style={{
                flex: 1, background: "transparent",
                border: `1px solid ${COLORS.border}`, color: COLORS.text,
                borderRadius: 10, padding: "12px", fontFamily: "Syne", fontWeight: 700, cursor: "pointer",
              }}>Sign In</button>
            </div>

            {error && <p style={{ color: "#f47287", fontSize: 13, margin: "12px 0 0", textAlign: "center" }}>{error}</p>}

            <button onClick={onClose} style={{
              marginTop: 16, width: "100%", background: "transparent",
              border: "none", color: COLORS.muted, cursor: "pointer",
              fontFamily: "DM Sans", fontSize: 13,
            }}>Maybe later</button>
          </>
        )}

        {(mode === "login" || mode === "signup") && (
          <>
            <button onClick={() => { setMode("main"); setError(""); }} style={{
              background: "transparent", border: "none", color: COLORS.muted,
              cursor: "pointer", fontFamily: "Syne", fontWeight: 700, marginBottom: 16, padding: 0,
            }}>← Back</button>

            <h2 style={{ color: COLORS.text, fontFamily: "Syne", fontWeight: 800, fontSize: 22, margin: "0 0 24px" }}>
              {mode === "signup" ? "Create Free Account" : "Welcome Back"}
            </h2>

            <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input type="email" placeholder="Email address" value={email}
                onChange={e => setEmail(e.target.value)} required
                style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "13px 16px", color: COLORS.text, fontFamily: "DM Sans", fontSize: 14, outline: "none" }}
              />
              <input type="password" placeholder="Password (min 6 characters)" value={password}
                onChange={e => setPassword(e.target.value)} required minLength={6}
                style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "13px 16px", color: COLORS.text, fontFamily: "DM Sans", fontSize: 14, outline: "none" }}
              />
              {error && <p style={{ color: "#f47287", fontSize: 13, margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading} style={{
                background: loading ? COLORS.border : `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
                color: loading ? COLORS.muted : "#0a0a0f",
                border: "none", borderRadius: 10, padding: "13px",
                fontFamily: "Syne", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15,
              }}>
                {loading ? <><Spinner small /> Please wait...</> : mode === "signup" ? "Create Account" : "Sign In"}
              </button>
            </form>

            <p style={{ color: COLORS.muted, fontFamily: "DM Sans", fontSize: 13, textAlign: "center", marginTop: 16 }}>
              {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
              <span onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }}
                style={{ color: COLORS.accent, cursor: "pointer", fontWeight: 700 }}>
                {mode === "signup" ? "Sign In" : "Sign Up"}
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function StudyTool() {
  const [user, setUser] = useState(null);
  const [userTier, setUserTier] = useState("free");
  const [usesThisDay, setUsesThisDay] = useState(0);
  const [authReady, setAuthReady] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [country, setCountry] = useState("IN");
  const [inputType, setInputType] = useState("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("summary");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(d => setCountry(d.country_code))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setShowAuth(false); // Auto close modal on login
        setLoading(false);  // Stop any loading
        try {
          const snap = await getDoc(doc(db, "users", currentUser.uid));
          if (snap.exists()) {
            setUserTier(snap.data().tier || "free");
            setUsesThisDay(snap.data().usesThisDay || 0);
          }
        } catch (e) {}
      } else {
        setUser(null);
      }
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  const handleFile = useCallback((f) => {
    if (!f) return;
    const isPDF = f.type === "application/pdf";
    const isImage = f.type.startsWith("image/");
    if (!isPDF && !isImage) { setError("Please upload a PDF or image file."); return; }
    setFile(f);
    setFileType(isPDF ? "pdf" : "image");
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setFilePreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const toBase64 = (f) => new Promise((resolve) => {
    const r = new FileReader();
    r.readAsDataURL(f);
    r.onload = () => resolve(r.result.split(",")[1]);
  });

  const generate = async () => {
    if (inputType === "text" && !text.trim()) { setError("Please paste some text first."); return; }
    if (inputType === "file" && !file) { setError("Please upload a file first."); return; }

    // Check guest uses (1 free without login)
    const guestUses = parseInt(localStorage.getItem("learnova_guest") || "0");
    if (!user && guestUses >= 1) {
      setError("Sign in to keep generating for free!");
      setShowAuth(true);
      return;
    }

    if (user && userTier === "free" && usesThisDay >= 5) {
      setError("Daily limit reached! Upgrade to Pro for unlimited uses.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let payload = { content: text || file.name, userId: user?.uid || "guest", tier: userTier };
      if (inputType === "file" && fileType === "pdf") {
        payload.pdfBase64 = await toBase64(file);
      }

      const res = await fetch("https://ai-study-tool-api.onrender.com/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      setLoading(false);
      setResult(data);
      setTab("summary");

      // Track guest uses
      if (!user) {
        localStorage.setItem("learnova_guest", String(guestUses + 1));
      }

      // Update logged in user usage
      if (user) {
        try {
          await updateDoc(doc(db, "users", user.uid), { usesThisDay: usesThisDay + 1 });
          setUsesThisDay(u => u + 1);
        } catch (e) {}
      }

    } catch (e) {
      setError("Generation failed. Please try again.");
      setLoading(false);
    }
  };

  if (!authReady) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "DM Sans, sans-serif", padding: "0 0 60px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        textarea { resize: vertical; outline: none; }
        input { outline: none; }
      `}</style>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "20px 40px", gap: 12, flexWrap: "wrap" }}>
        {user ? (
          <>
            {userTier === "free" && (
              <button style={{
                padding: "10px 22px",
                background: `linear-gradient(135deg, ${COLORS.accent3}, #ec4899)`,
                color: "#0a0a0f", border: "none", borderRadius: 100,
                fontFamily: "Syne", fontWeight: 800, fontSize: 13, cursor: "pointer",
                boxShadow: `0 0 20px ${COLORS.accent3}44`,
              }}>
                ✨ Upgrade to Pro ({country === "IN" ? "₹399" : "$5"}/mo)
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 100, padding: "8px 16px" }}>
              {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: "50%" }} />}
              <span style={{ color: COLORS.muted, fontSize: 12, fontFamily: "DM Sans" }}>
                {userTier === "free" ? `${5 - usesThisDay}/5 left` : "Pro ✨"}
              </span>
              <button onClick={async () => { await signOut(auth); setUser(null); }} style={{
                background: "transparent", border: "none", color: COLORS.muted, cursor: "pointer", fontFamily: "Syne", fontWeight: 700, fontSize: 12,
              }}>Logout</button>
            </div>
          </>
        ) : (
          <button onClick={() => setShowAuth(true)} style={{
            padding: "10px 22px",
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
            color: "#0a0a0f", border: "none", borderRadius: 100,
            fontFamily: "Syne", fontWeight: 700, fontSize: 14, cursor: "pointer",
            boxShadow: `0 0 20px ${COLORS.accent}44`,
          }}>Sign In</button>
        )}
      </div>

      {/* HERO */}
      <div style={{ textAlign: "center", padding: "40px 24px 32px" }}>
        <div style={{ display: "inline-block", background: `${COLORS.accent}15`, border: `1px solid ${COLORS.accent}33`, borderRadius: 100, padding: "6px 18px", marginBottom: 20 }}>
          <span style={{ color: COLORS.accent, fontFamily: "Syne", fontWeight: 700, fontSize: 12, letterSpacing: 2 }}>AI STUDY TOOL — BY LEARNOVA</span>
        </div>
        <h1 style={{ color: COLORS.text, fontFamily: "Syne", fontWeight: 800, fontSize: "clamp(28px, 5vw, 48px)", margin: "0 0 12px", lineHeight: 1.1 }}>
          Turn Any Content Into<br />
          <span style={{ background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accent2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Flashcards & Quizzes
          </span>
        </h1>
        <p style={{ color: COLORS.muted, fontFamily: "DM Sans", fontSize: 16, margin: 0 }}>
          Upload a PDF, image, or paste text — get instant study materials
        </p>
      </div>

      {/* MAIN */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 28, marginBottom: 24 }}>

          <div style={{ display: "flex", gap: 8, marginBottom: 24, background: COLORS.bg, borderRadius: 100, padding: 4, width: "fit-content" }}>
            {[["text", "✏️ Text"], ["file", "📎 PDF / Image"]].map(([val, label]) => (
              <button key={val} onClick={() => { setInputType(val); setError(""); }}
                style={{
                  padding: "8px 20px", borderRadius: 100, border: "none",
                  cursor: "pointer", fontFamily: "Syne", fontWeight: 700, fontSize: 13,
                  background: inputType === val ? COLORS.text : "transparent",
                  color: inputType === val ? COLORS.bg : COLORS.muted,
                }}>{label}</button>
            ))}
          </div>

          {inputType === "text" ? (
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your notes, textbook chapter, article, or any study material here..."
              style={{
                width: "100%", minHeight: 180,
                background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                borderRadius: 14, padding: 18,
                color: COLORS.text, fontFamily: "DM Sans", fontSize: 15, lineHeight: 1.7,
              }}
            />
          ) : (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current.click()}
              style={{
                border: `2px dashed ${dragOver ? COLORS.accent : COLORS.border}`,
                borderRadius: 14, padding: "36px 24px",
                textAlign: "center", cursor: "pointer",
                background: dragOver ? `${COLORS.accent}08` : COLORS.bg,
              }}>
              <input ref={fileRef} type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
              {file ? (
                <div>
                  {fileType === "image" && filePreview && <img src={filePreview} alt="" style={{ maxHeight: 120, borderRadius: 10, marginBottom: 12, maxWidth: "100%" }} />}
                  <p style={{ color: COLORS.accent, fontFamily: "Syne", fontWeight: 700, margin: "0 0 4px" }}>{file.name}</p>
                  <p style={{ color: COLORS.muted, fontSize: 13, margin: 0 }}>Click to change</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
                  <p style={{ color: COLORS.text, fontFamily: "Syne", fontWeight: 700, margin: "0 0 6px", fontSize: 16 }}>Drop your file here</p>
                  <p style={{ color: COLORS.muted, fontSize: 13, margin: 0 }}>Supports PDF and images</p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#f4728711", border: "1px solid #f4728744", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <p style={{ color: "#f47287", fontSize: 14, margin: 0 }}>{error}</p>
              {!user && error.includes("Sign in") && (
                <button onClick={() => setShowAuth(true)} style={{
                  background: COLORS.accent, color: "#0a0a0f", border: "none",
                  borderRadius: 8, padding: "6px 14px", fontFamily: "Syne",
                  fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap",
                }}>Sign In →</button>
              )}
            </div>
          )}

          <button onClick={generate} disabled={loading} style={{
            marginTop: 20, width: "100%",
            background: loading ? COLORS.border : `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
            color: loading ? COLORS.muted : "#0a0a0f",
            border: "none", borderRadius: 14,
            padding: "16px 32px", fontFamily: "Syne",
            fontWeight: 800, fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            boxShadow: loading ? "none" : `0 0 32px ${COLORS.accent}44`,
          }}>
            {loading ? <><Spinner small /> Generating your study materials...</> : "✨ Generate Study Materials"}
          </button>

          {/* Guest notice */}
          {!user && (
            <p style={{ color: COLORS.muted, fontFamily: "DM Sans", fontSize: 12, textAlign: "center", margin: "12px 0 0" }}>
              🎁 Try 1 time for free · Sign up for 5/day free
            </p>
          )}
        </div>

        {result && (
          <div style={{ animation: "fadeUp 0.5s ease" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
              <TabBtn active={tab === "summary"} onClick={() => setTab("summary")} color={COLORS.accent3}>📋 Summary</TabBtn>
              <TabBtn active={tab === "flashcards"} onClick={() => setTab("flashcards")} color={COLORS.accent}>🃏 Flashcards</TabBtn>
              <TabBtn active={tab === "quiz"} onClick={() => setTab("quiz")} color={COLORS.accent2}>📝 Quiz</TabBtn>
            </div>

            {tab === "summary" && (
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.accent3}33`, borderRadius: 16, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 22 }}>📋</span>
                  <span style={{ color: COLORS.accent3, fontFamily: "Syne", fontWeight: 700, letterSpacing: 1, fontSize: 13 }}>KEY SUMMARY</span>
                </div>
                <p style={{ color: COLORS.text, fontFamily: "DM Sans", fontSize: 16, lineHeight: 1.8, margin: 0 }}>{result.summary}</p>
              </div>
            )}

            {tab === "flashcards" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {result.flashcards?.map((fc, i) => <Flashcard key={i} front={fc.front} back={fc.back} index={i} />)}
              </div>
            )}

            {tab === "quiz" && <QuizSection questions={result.quiz} />}
          </div>
        )}
      </div>
    </div>
  );
}
