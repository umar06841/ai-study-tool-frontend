import { useState } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider, db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

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

export default function Auth({ user, setUser }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userData = result.user;

      // Create user document in Firestore
      const userRef = doc(db, "users", userData.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // New user - free tier
        await setDoc(userRef, {
          email: userData.email,
          name: userData.displayName,
          photo: userData.photoURL,
          tier: "free",
          usesThisMonth: 0,
          usesThisDay: 0,
          lastResetDay: new Date().toDateString(),
          createdAt: new Date(),
          country: "IN", // Will be detected
        });
      }

      setUser(userData);
    } catch (error) {
      console.error("Sign in error:", error);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (user) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 20px",
        background: COLORS.card,
        borderRadius: 100,
        border: `1px solid ${COLORS.border}`,
      }}>
        <img src={user.photoURL} alt="profile" style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
        }} />
        <span style={{ color: COLORS.text, fontFamily: "DM Sans" }}>
          {user.displayName}
        </span>
        <button onClick={handleSignOut} style={{
          background: "transparent",
          border: "none",
          color: COLORS.muted,
          cursor: "pointer",
          fontFamily: "Syne",
          fontWeight: 700,
        }}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <button onClick={handleGoogleSignIn} disabled={loading} style={{
      padding: "12px 24px",
      background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
      color: "#0a0a0f",
      border: "none",
      borderRadius: 100,
      cursor: loading ? "not-allowed" : "pointer",
      fontFamily: "Syne",
      fontWeight: 700,
      boxShadow: `0 0 20px ${COLORS.accent}55`,
    }}>
      {loading ? "Signing in..." : "Sign in with Google"}
    </button>
  );
}