import { useState, useEffect, useRef, useCallback } from "react";
import { auth, db } from "./firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
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

function Spinner() {
  return (
    <div style={{
      width: 36, height: 36,
      border: `3px solid ${COLORS.border}`,
      borderTop: `3px solid ${COLORS.accent}`,
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
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
      fontFamily: "Syne",
      fontWeight: 700,
      fontSize: 14,
      background: active ? color : "transparent",
      color: active ? "#0a0a0f" : COLORS.muted,
      boxShadow: active ? `0 0 20px ${color}55` : "none",
    }}>{children}</button>
  );
}

function Flashcard({ front, back, index }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div onClick={() => setFlipped(f => !f)} style={{
      cursor: "pointer",
      height: 180,
      borderRadius: 16,
      perspective: 1000,
    }}>
      <div style={{
        position: "relative",
        width: "100%",
        height: "100%",
        transformStyle: "preserve-3d",
        transition: "transform 0.5s",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>
        <div style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backfaceVisibility: "hidden",
          background: `linear-gradient(135deg, #13131a, #1a1a2e)`,
          border: `1px solid ${COLORS.accent}33`,
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          boxSizing: "border-box",
        }}>
          <p style={{ color: COLORS.text, textAlign: "center", margin: 0, fontSize: 15 }}>{front}</p>
        </div>
        <div style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          background: `linear-gradient(135deg, #0f1a13, #13231a)`,
          border: `1px solid ${COLORS.accent}66`,
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          boxSizing: "border-box",
        }}>
          <p style={{ color: COLORS.accent, textAlign: "center", margin: 0, fontSize: 15 }}>{back}</p>
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
          border: `1px solid ${COLORS.border}`,
          borderRadius: 14,
          padding: "20px",
          marginBottom: 16,
        }}>
          <p style={{ color: COLORS.text, margin: "0 0 12px", fontSize: 15 }}>
            <strong>Q{i + 1}.</strong> {q.question}
          </p>
          {q.options.map((opt, j) => (
            <button key={j} disabled={submitted} onClick={() => setAnswers(a => ({ ...a, [i]: j }))}
              style={{
                width: "100%",
                background: answers[i] === j ? COLORS.accent2 : "transparent",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: "10px",
                marginBottom: 8,
                color: answers[i] === j ? "#0a0a0f" : COLORS.muted,
                cursor: "pointer",
                textAlign: "left",
              }}>
              {String.fromCharCode(65 + j)}. {opt}
            </button>
          ))}
        </div>
      ))}
      {!submitted ? (
        <button onClick={() => setSubmitted(true)} style={{
          background: COLORS.accent2,
          color: "#0a0a0f",
          border: "none",
          borderRadius: 100,
          padding: "12px 32px",
          fontWeight: 700,
          cursor: "pointer",
        }}>
          Submit
        </button>
      ) : (
        <div style={{ background: COLORS.card, borderRadius: 14, padding: "20px", textAlign: "center" }}>
          <p style={{ color: COLORS.accent2, fontSize: 28, fontWeight: 800, margin: "0 0 4px" }}>
            {score}/{questions.length}
          </p>
        </div>
      )}
    </div>
  );
}

export default function StudyTool() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("none"); // none, login, signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [inputType, setInputType] = useState("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("summary");
  const fileRef = useRef();

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      if (authMode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
        const userRef = doc(db, "users", auth.currentUser.uid);
        await setDoc(userRef, {
          email: auth.currentUser.email,
          tier: "free",
          usesThisDay: 0,
          createdAt: new Date(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      setAuthMode("none");
      setEmail("");
      setPassword("");
    } catch (err) {
      setAuthError(err.message);
    }
    
    setAuthLoading(false);
  };

  const handleFile = useCallback((f) => {
    if (!f) return;
    setFile(f);
    setFileType(f.type === "application/pdf" ? "pdf" : "image");
  }, []);

  const toBase64 = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
  });

  const generate = async () => {
    if (!user) {
      setAuthMode("login");
      return;
    }

    if (!text.trim() && !file) {
      setError("Add text or file first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let payload = { content: text || "file", userId: user.uid, tier: "free" };

      if (file && fileType === "pdf") {
        const base64 = await toBase64(file);
        payload.pdfBase64 = base64;
      }

      const res = await fetch("https://ai-study-tool-api.onrender.com/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResult(data);
      setLoading(false);
      setTab("summary");
    } catch (e) {
      setError("Generation failed");
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{
        minHeight: "100vh",
        background: COLORS.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        <div style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 20,
          padding: 40,
          maxWidth: 400,
          width: "100%",
        }}>
          <h1 style={{ color: COLORS.text, fontFamily: "Syne", fontSize: 28, textAlign: "center", margin: "0 0 30px" }}>
            LearnOva
          </h1>

          {authMode === "none" ? (
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setAuthMode("login")} style={{
                flex: 1,
                background: COLORS.accent,
                color: "#0a0a0f",
                border: "none",
                borderRadius: 10,
                padding: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}>Sign In</button>
              <button onClick={() => setAuthMode("signup")} style={{
                flex: 1,
                background: "transparent",
                border: `1px solid ${COLORS.accent}`,
                color: COLORS.accent,
                borderRadius: 10,
                padding: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}>Sign Up</button>
            </div>
          ) : (
            <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                  padding: "12px",
                  color: COLORS.text,
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                  padding: "12px",
                  color: COLORS.text,
                }}
              />
              {authError && <p style={{ color: "#f47287", fontSize: 12, margin: 0 }}>{authError}</p>}
              <button type="submit" disabled={authLoading} style={{
                background: COLORS.accent,
                color: "#0a0a0f",
                border: "none",
                borderRadius: 10,
                padding: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}>
                {authLoading ? <Spinner /> : "Continue"}
              </button>
              <button type="button" onClick={() => { setAuthMode("none"); setAuthError(""); }} style={{
                background: "transparent",
                border: "none",
                color: COLORS.muted,
                cursor: "pointer",
              }}>Back</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, padding: "0 0 60px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; } }
      `}</style>

      <div style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ color: COLORS.text, fontFamily: "Syne", fontSize: 28, margin: 0 }}>LearnOva</h1>
        <button onClick={async () => { await signOut(auth); setUser(null); }} style={{
          background: "transparent",
          border: `1px solid ${COLORS.border}`,
          color: COLORS.muted,
          borderRadius: 8,
          padding: "8px 16px",
          cursor: "pointer",
        }}>Logout</button>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 28, marginBottom: 24 }}>

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste text here..."
            style={{
              width: "100%",
              minHeight: 180,
              background: COLORS.bg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 14,
              padding: 18,
              color: COLORS.text,
              outline: "none",
              fontFamily: "DM Sans",
            }}
          />

          {error && <p style={{ color: "#f47287", marginTop: 12, marginBottom: 0 }}>{error}</p>}

          <button onClick={generate} disabled={loading} style={{
            marginTop: 20,
            width: "100%",
            background: loading ? COLORS.border : `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
            color: loading ? COLORS.muted : "#0a0a0f",
            border: "none",
            borderRadius: 14,
            padding: "16px",
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}>
            {loading ? <><Spinner /> Generating...</> : "✨ Generate"}
          </button>
        </div>

        {result && (
          <div style={{ animation: "fadeUp 0.5s ease" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              <TabBtn active={tab === "summary"} onClick={() => setTab("summary")} color={COLORS.accent3}>📋 Summary</TabBtn>
              <TabBtn active={tab === "flashcards"} onClick={() => setTab("flashcards")} color={COLORS.accent}>🃏 Flashcards</TabBtn>
              <TabBtn active={tab === "quiz"} onClick={() => setTab("quiz")} color={COLORS.accent2}>📝 Quiz</TabBtn>
            </div>

            {tab === "summary" && (
              <div style={{ background: COLORS.card, borderRadius: 16, padding: 28 }}>
                <p style={{ color: COLORS.text, lineHeight: 1.8, margin: 0 }}>{result.summary}</p>
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
