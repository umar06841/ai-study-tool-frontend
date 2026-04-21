import { useState, useRef, useCallback } from "react";

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

const style = {
  fontFace: `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');`,
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
    <div onClick={() => setFlipped(f => !f)} style={{
      cursor: "pointer",
      perspective: 1000,
      height: 180,
      borderRadius: 16,
    }}>
      <div style={{
        position: "relative",
        width: "100%",
        height: "100%",
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
          boxShadow: `0 4px 24px #6ee7b711`,
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
          boxShadow: `0 4px 24px #6ee7b722`,
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

  const score = submitted
    ? questions.filter((q, i) => answers[i] === q.correct).length
    : null;

  return (
    <div>
      {questions.map((q, i) => (
        <div key={i} style={{
          background: COLORS.card,
          border: `1px solid ${submitted
            ? answers[i] === q.correct ? "#6ee7b744" : "#f4728744"
            : COLORS.border}`,
          borderRadius: 14,
          padding: "20px 24px",
          marginBottom: 16,
          transition: "border 0.3s",
        }}>
          <p style={{ color: COLORS.text, fontFamily: "DM Sans", fontWeight: 500, margin: "0 0 14px", fontSize: 15 }}>
            <span style={{ color: COLORS.accent2, fontFamily: "Syne", fontWeight: 700, marginRight: 8 }}>Q{i + 1}.</span>
            {q.question}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {q.options.map((opt, j) => {
              const isSelected = answers[i] === j;
              const isCorrect = j === q.correct;
              let bg = "transparent";
              let border = `1px solid ${COLORS.border}`;
              let color = COLORS.muted;
              if (submitted) {
                if (isCorrect) { bg = "#6ee7b711"; border = `1px solid ${COLORS.accent}`; color = COLORS.accent; }
                else if (isSelected && !isCorrect) { bg = "#f4728711"; border = "1px solid #f47287"; color = "#f47287"; }
              } else if (isSelected) {
                bg = "#818cf811"; border = `1px solid ${COLORS.accent2}`; color = COLORS.accent2;
              }
              return (
                <button key={j} disabled={submitted} onClick={() => setAnswers(a => ({ ...a, [i]: j }))}
                  style={{
                    background: bg, border, color,
                    borderRadius: 10, padding: "10px 16px",
                    fontFamily: "DM Sans", fontSize: 14,
                    cursor: submitted ? "default" : "pointer",
                    textAlign: "left", transition: "all 0.2s",
                  }}>
                  <span style={{ fontWeight: 700, marginRight: 10 }}>{String.fromCharCode(65 + j)}.</span>{opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!submitted ? (
        <button onClick={() => setSubmitted(true)} style={{
          background: COLORS.accent2, color: "#0a0a0f",
          border: "none", borderRadius: 100,
          padding: "12px 32px", fontFamily: "Syne",
          fontWeight: 700, fontSize: 15, cursor: "pointer",
          boxShadow: `0 0 24px ${COLORS.accent2}55`,
        }}>Submit Answers</button>
      ) : (
        <div style={{
          background: `linear-gradient(135deg, #13131a, #1a132e)`,
          border: `1px solid ${COLORS.accent2}44`,
          borderRadius: 14, padding: "20px 24px",
          textAlign: "center",
        }}>
          <p style={{ color: COLORS.accent2, fontFamily: "Syne", fontWeight: 800, fontSize: 28, margin: "0 0 4px" }}>
            {score}/{questions.length}
          </p>
          <p style={{ color: COLORS.muted, fontFamily: "DM Sans", margin: 0, fontSize: 14 }}>
            {score === questions.length ? "🎉 Perfect score!" : score >= questions.length / 2 ? "Good job! Keep going 💪" : "Keep studying, you've got this! 📚"}
          </p>
        </div>
      )}
    </div>
  );
}

export default function StudyTool() {
  const [inputType, setInputType] = useState("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("flashcards");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

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

  const generate = async () => {
    if (inputType === "text" && !text.trim()) { setError("Please paste some text first."); return; }
    if (inputType === "file" && !file) { setError("Please upload a file first."); return; }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("https://ai-study-tool-api.onrender.com/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: inputType === "text" ? text : file.name }),
      });

      const data = await res.json();
      setResult(data);
      setTab("flashcards");
    } catch (e) {
      setError("Failed to generate. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "DM Sans, sans-serif", padding: "0 0 60px" }}>
      <style>{`
        ${style.fontFace}
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        textarea { resize: vertical; }
      `}</style>

      <div style={{ textAlign: "center", padding: "52px 24px 32px" }}>
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
                  transition: "all 0.2s",
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
                outline: "none",
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
                transition: "all 0.2s",
              }}>
              <input ref={fileRef} type="file" accept=".pdf,.txt,image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
              {file ? (
                <div>
                  {fileType === "image" && filePreview && (
                    <img src={filePreview} alt="preview" style={{ maxHeight: 120, borderRadius: 10, marginBottom: 12, maxWidth: "100%" }} />
                  )}
                  <p style={{ color: COLORS.accent, fontFamily: "Syne", fontWeight: 700, margin: "0 0 4px" }}>{file.name}</p>
                  <p style={{ color: COLORS.muted, fontFamily: "DM Sans", fontSize: 13, margin: 0 }}>Click to change file</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
                  <p style={{ color: COLORS.text, fontFamily: "Syne", fontWeight: 700, margin: "0 0 6px", fontSize: 16 }}>Drop your file here</p>
                  <p style={{ color: COLORS.muted, fontFamily: "DM Sans", fontSize: 13, margin: 0 }}>Supports PDF, TXT and images (JPG, PNG)</p>
                </div>
              )}
            </div>
          )}

          {error && <p style={{ color: "#f47287", fontFamily: "DM Sans", fontSize: 14, margin: "12px 0 0" }}>{error}</p>}

          <button onClick={generate} disabled={loading} style={{
            marginTop: 20, width: "100%",
            background: loading ? COLORS.border : `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
            color: loading ? COLORS.muted : "#0a0a0f",
            border: "none", borderRadius: 14,
            padding: "16px 32px", fontFamily: "Syne",
            fontWeight: 800, fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            boxShadow: loading ? "none" : `0 0 32px ${COLORS.accent}44`,
            transition: "all 0.3s",
          }}>
            {loading ? <><Spinner /> Generating your study materials...</> : "✨ Generate Study Materials"}
          </button>
        </div>

        {result && (
          <div style={{ animation: "fadeUp 0.5s ease" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
              <TabBtn active={tab === "flashcards"} onClick={() => setTab("flashcards")} color={COLORS.accent}>🃏 Flashcards</TabBtn>
              <TabBtn active={tab === "quiz"} onClick={() => setTab("quiz")} color={COLORS.accent2}>📝 Quiz</TabBtn>
              <TabBtn active={tab === "summary"} onClick={() => setTab("summary")} color={COLORS.accent3}>📋 Summary</TabBtn>
            </div>

            {tab === "flashcards" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {result.flashcards?.map((fc, i) => <Flashcard key={i} front={fc.front} back={fc.back} index={i} />)}
              </div>
            )}

            {tab === "quiz" && <QuizSection questions={result.quiz} />}

            {tab === "summary" && (
              <div style={{
                background: COLORS.card, border: `1px solid ${COLORS.accent3}33`,
                borderRadius: 16, padding: "28px 28px",
                boxShadow: `0 0 32px ${COLORS.accent3}11`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 22 }}>📋</span>
                  <span style={{ color: COLORS.accent3, fontFamily: "Syne", fontWeight: 700, letterSpacing: 1, fontSize: 13 }}>KEY SUMMARY</span>
                </div>
                <p style={{ color: COLORS.text, fontFamily: "DM Sans", fontSize: 16, lineHeight: 1.8, margin: 0 }}>{result.summary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}