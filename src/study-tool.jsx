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

function PricingSidebar({ user, userTier, country, onClose }) {
  const [loading, setLoading] = useState(false);
  const currency = country === "IN" ? "INR" : "USD";

  const plans = [
    {
      name: "Monthly",
      price: currency === "INR" ? 399 : 5,
      period: "per month",
      features: ["5 generations/day", "Email support", "Cancel anytime"],
      id: "monthly",
      color: COLORS.accent2,
    },
    {
      name: "Yearly",
      price: currency === "INR" ? 3999 : 50,
      period: "per year",
      savings: currency === "INR" ? "Save ₹799" : "Save $10",
      features: ["5 generations/day", "Priority support", "Best value"],
      id: "yearly",
      color: COLORS.accent3,
    },
  ];

  const handlePayment = async (plan) => {
    if (!user) {
      alert("Please sign in first");
      return;
    }

    setLoading(true);
    try {
      const amount = plan.price;
      
      const orderRes = await fetch("https://ai-study-tool-api.onrender.com/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          amount,
          currency,
          userId: user.uid,
          planId: plan.id,
        }),
      });

      if (!orderRes.ok) throw new Error("Failed to create order");
      const orderData = await orderRes.json();

      const options = {
        key: "rzp_live_SgRCJHE3X4t4U4",
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        description: `LearnOva Pro - ${plan.name}`,
        prefill: {
          email: user.email,
          name: user.displayName || "",
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("https://ai-study-tool-api.onrender.com/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: orderData.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                userId: user.uid,
                planId: plan.id,
              }),
            });

            if (verifyRes.ok) {
              // Update user tier in Firebase
              await updateDoc(doc(db, "users", user.uid), {
                tier: "pro",
                proUntil: plan.id === "yearly" 
                  ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                  : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              });
              
              alert("🎉 Payment successful! You're now a Pro member!");
              onClose();
            } else {
              alert("Payment verified but there was an issue updating your account. Please contact support.");
            }
          } catch (e) {
            alert("Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to initiate payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      width: "100%",
      maxWidth: 420,
      height: "100vh",
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderLeft: `2px solid ${COLORS.accent3}`,
      overflowY: "auto",
      zIndex: 999,
      animation: "slideIn 0.3s ease",
      padding: 28,
      boxSizing: "border-box",
    }}>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <h2 style={{ color: COLORS.text, fontFamily: "Syne", fontWeight: 800, fontSize: 24, margin: 0 }}>
          Plans
        </h2>
        <button onClick={onClose} style={{
          background: "transparent",
          border: "none",
          color: COLORS.muted,
          cursor: "pointer",
          fontSize: 24,
          padding: 0,
        }}>×</button>
      </div>

      {userTier === "pro" && (
        <div style={{
          background: `${COLORS.accent}15`,
          border: `1px solid ${COLORS.accent}44`,
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
        }}>
          <p style={{ color: COLORS.accent, fontFamily: "Syne", fontWeight: 700, margin: 0, fontSize: 14 }}>
            ✨ You're a Pro member!
          </p>
          <p style={{ color: COLORS.muted, fontSize: 13, margin: "6px 0 0" }}>
            Enjoy unlimited generations
          </p>
        </div>
      )}

      {plans.map((plan) => (
        <div key={plan.id} style={{
          background: COLORS.bg,
          border: `2px solid ${userTier === "pro" ? plan.color : COLORS.border}`,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          opacity: userTier === "pro" ? 0.6 : 1,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h3 style={{ color: COLORS.text, fontFamily: "Syne", fontWeight: 800, fontSize: 18, margin: "0 0 4px" }}>
                {plan.name}
              </h3>
              {plan.savings && (
                <span style={{ color: COLORS.accent, fontFamily: "Syne", fontWeight: 700, fontSize: 12 }}>
                  {plan.savings}
                </span>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: plan.color, fontFamily: "Syne", fontWeight: 800, fontSize: 28, margin: "0 0 4px" }}>
                {currency === "INR" ? "₹" : "$"}{plan.price}
              </div>
              <span style={{ color: COLORS.muted, fontSize: 12 }}>{plan.period}</span>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            {plan.features.map((feature, i) => (
              <p key={i} style={{ color: COLORS.muted, fontSize: 13, margin: "8px 0", display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: plan.color }}>✓</span> {feature}
              </p>
            ))}
          </div>

          <button
            onClick={() => handlePayment(plan)}
            disabled={loading || userTier === "pro"}
            style={{
              width: "100%",
              background: userTier === "pro" ? COLORS.border : plan.color,
              color: userTier === "pro" ? COLORS.muted : "#0a0a0f",
              border: "none",
              borderRadius: 10,
              padding: 12,
              fontFamily: "Syne",
              fontWeight: 700,
              fontSize: 14,
              cursor: userTier === "pro" ? "default" : loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? <><Spinner small /> Processing...</> : userTier === "pro" ? "Current Plan" : `Get ${plan.name}`}
          </button>
        </div>
      ))}

      <div style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 16,
        marginTop: 24,
      }}>
        <p style={{ color: COLORS.text, fontFamily: "Syne", fontWeight: 700, fontSize: 13, margin: "0 0 8px" }}>
          🎁 Free tier
        </p>
        <p style={{ color: COLORS.muted, fontSize: 12, margin: 0 }}>
          1 generation without login, 5/day after signup
        </p>
      </div>
    </div>
  );
}

// AUTH MODAL (same as before but improved)
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
      setGoogleLoading(false);
      onClose();
    } catch (err) {
      setError("Google sign-in failed. Try email instead.");
      setGoogleLoading(false);
    }
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
      setLoading(false);
      onClose();
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace(/\(auth.*\)\.?/, "").trim());
      setLoading(false);
    }
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
      }}>
        {mode === "main" && (
          <>
            <h2 style={{ color: COLORS.text, fontFamily: "Syne", fontWeight: 800, fontSize: 22, margin: "0 0 8px" }}>
              Sign in to continue
            </h2>
            <p style={{ color: COLORS.muted, fontFamily: "DM Sans", fontSize: 14, margin: "0 0 24px" }}>
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
              }}>Sign Up</button>
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
              {mode === "signup" ? "Create Account" : "Welcome Back"}
            </h2>

            <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input type="email" placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)} required
                style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px", color: COLORS.text, fontFamily: "DM Sans", fontSize: 14 }}
              />
              <input type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)} required minLength={6}
                style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px", color: COLORS.text, fontFamily: "DM Sans", fontSize: 14 }}
              />
              {error && <p style={{ color: "#f47287", fontSize: 13, margin: 0 }}>{error}</p>}
              <button type="submit" disabled={loading} style={{
                background: loading ? COLORS.border : `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
                color: loading ? COLORS.muted : "#0a0a0f",
                border: "none", borderRadius: 10, padding: "12px",
                fontFamily: "Syne", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                {loading ? <><Spinner small /> Please wait...</> : mode === "signup" ? "Create Account" : "Sign In"}
              </button>
            </form>

            <p style={{ color: COLORS.muted, fontFamily: "DM Sans", fontSize: 13, textAlign: "center", marginTop: 16 }}>
              {mode === "signup" ? "Already have an account? " : "Don't have one? "}
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

// MAIN APP
export default function StudyTool() {
  const [user, setUser] = useState(null);
  const [userTier, setUserTier] = useState("free");
  const [usesThisDay, setUsesThisDay] = useState(0);
  const [country, setCountry] = useState("IN");
  const [authReady, setAuthReady] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
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
      .then(d => setCountry(d.country_code || "IN"))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setShowAuth(false);
        setLoading(false);
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
    if (!isPDF && !isImage) { setError("PDF or image only"); return; }
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
    if (inputType === "text" && !text.trim()) { setError("Paste text first"); return; }
    if (inputType === "file" && !file) { setError("Upload file first"); return; }

    const guestUses = parseInt(localStorage.getItem("learnova_guest") || "0");
    if (!user && guestUses >= 1) {
      setError("Sign in to continue!"); 
      setShowAuth(true);
      return;
    }

    if (user && userTier === "free" && usesThisDay >= 5) { setError("Daily limit! Upgrade to Pro."); return; }

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

      if (!user) {
        localStorage.setItem("learnova_guest", String(guestUses + 1));
      } else {
        try {
          await updateDoc(doc(db, "users", user.uid), { usesThisDay: usesThisDay + 1 });
          setUsesThisDay(u => u + 1);
        } catch (e) {}
      }
    } catch (e) {
      setError("Generation failed");
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
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "DM Sans, sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; } }
        * { box-sizing: border-box; }
        textarea, input { outline: none; }
      `}</style>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showPricing && <PricingSidebar user={user} userTier={userTier} country={country} onClose={() => setShowPricing(false)} />}

      {/* SIDEBAR TOGGLE & NAV */}
      <div style={{ padding: "20px 24px", borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "100vh", position: "relative", zIndex: 100 }}>
        <div>
          <h1 style={{ color: COLORS.text, fontFamily: "Syne", fontWeight: 800, fontSize: 20, margin: "0 0 32px" }}>
            LearnOva
          </h1>

          <button onClick={() => setShowPricing(true)} style={{
            width: "100%",
            padding: "12px 16px",
            background: `linear-gradient(135deg, ${COLORS.accent3}, #ec4899)`,
            color: "#0a0a0f",
            border: "none",
            borderRadius: 12,
            fontFamily: "Syne",
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 12,
            boxShadow: `0 0 20px ${COLORS.accent3}44`,
          }}>
            {userTier === "pro" ? "✨ Pro Member" : "Join Plans"}
          </button>

          {user && (
            <div style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              padding: 12,
              fontSize: 12,
              color: COLORS.muted,
            }}>
              {user.displayName || user.email?.split("@")[0]}
              <br />{userTier === "free" ? `${5 - usesThisDay}/5 left` : "Pro ✨"}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {user ? (
            <button onClick={async () => { await signOut(auth); setUser(null); }} style={{
              width: "100%",
              padding: "10px 16px",
              background: "transparent",
              border: `1px solid ${COLORS.border}`,
              color: COLORS.muted,
              borderRadius: 10,
              cursor: "pointer",
              fontFamily: "Syne",
              fontWeight: 700,
              fontSize: 13,
            }}>
              Logout
            </button>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{
              width: "100%",
              padding: "10px 16px",
              background: COLORS.accent,
              color: "#0a0a0f",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontFamily: "Syne",
              fontWeight: 700,
              fontSize: 13,
            }}>
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "40px 60px", overflowY: "auto", maxWidth: "calc(100% - 200px)" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-block", background: `${COLORS.accent}15`, border: `1px solid ${COLORS.accent}33`, borderRadius: 100, padding: "6px 18px", marginBottom: 20 }}>
            <span style={{ color: COLORS.accent, fontFamily: "Syne", fontWeight: 700, fontSize: 11, letterSpacing: 2 }}>AI STUDY TOOL</span>
          </div>
          <h1 style={{ color: COLORS.text, fontFamily: "Syne", fontWeight: 800, fontSize: "clamp(32px, 5vw, 56px)", margin: "0 0 16px", lineHeight: 1.1 }}>
            Turn Any Content Into<br />
            <span style={{ background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accent2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Flashcards & Quizzes
            </span>
          </h1>
          <p style={{ color: COLORS.muted, fontFamily: "DM Sans", fontSize: 16, margin: 0 }}>
            Upload a PDF, image, or paste text — get instant study materials
          </p>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: 32, marginBottom: 32 }}>
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
                placeholder="Paste your material here..."
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
                    {fileType === "image" && filePreview && <img src={filePreview} alt="" style={{ maxHeight: 100, borderRadius: 10, marginBottom: 12 }} />}
                    <p style={{ color: COLORS.accent, fontFamily: "Syne", fontWeight: 700, margin: "0 0 4px" }}>{file.name}</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
                    <p style={{ color: COLORS.text, fontFamily: "Syne", fontWeight: 700, margin: "0 0 6px", fontSize: 16 }}>Drop file here</p>
                  </div>
                )}
              </div>
            )}

            {error && <p style={{ color: "#f47287", fontSize: 13, margin: "12px 0 0" }}>{error}</p>}

            <button onClick={generate} disabled={loading} style={{
              marginTop: 20, width: "100%",
              background: loading ? COLORS.border : `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
              color: loading ? COLORS.muted : "#0a0a0f",
              border: "none", borderRadius: 14,
              padding: "16px", fontFamily: "Syne",
              fontWeight: 800, fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            }}>
              {loading ? <><Spinner /> Generating...</> : "✨ Generate"}
            </button>
          </div>

          {result && (
            <div style={{ animation: "fadeUp 0.5s ease" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                <button onClick={() => setTab("summary")} style={{
                  padding: "10px 22px", borderRadius: 100, border: "none",
                  cursor: "pointer", fontFamily: "Syne", fontWeight: 700, fontSize: 13,
                  background: tab === "summary" ? COLORS.accent3 : "transparent",
                  color: tab === "summary" ? "#0a0a0f" : COLORS.muted,
                }}>📋 Summary</button>
                <button onClick={() => setTab("flashcards")} style={{
                  padding: "10px 22px", borderRadius: 100, border: "none",
                  cursor: "pointer", fontFamily: "Syne", fontWeight: 700, fontSize: 13,
                  background: tab === "flashcards" ? COLORS.accent : "transparent",
                  color: tab === "flashcards" ? "#0a0a0f" : COLORS.muted,
                }}>🃏 Flashcards</button>
              </div>

              {tab === "summary" && (
                <div style={{ background: COLORS.card, borderRadius: 16, padding: 28 }}>
                  <p style={{ color: COLORS.text, lineHeight: 1.8, margin: 0 }}>{result.summary}</p>
                </div>
              )}

              {tab === "flashcards" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                  {result.flashcards?.slice(0, 6).map((fc, i) => (
                    <div key={i} onClick={() => {}} style={{
                      cursor: "pointer", height: 160,
                      background: COLORS.card, border: `1px solid ${COLORS.accent}33`,
                      borderRadius: 14, padding: 20, display: "flex",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <p style={{ color: COLORS.text, textAlign: "center", margin: 0, fontSize: 14 }}>{fc.front}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}