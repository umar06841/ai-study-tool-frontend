import { useState } from "react";

export default function StudyTool() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const generate = async () => {
    if (!text.trim()) {
      setError("Please paste some text");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Sending request...");
      const response = await fetch("https://ai-study-tool-api.onrender.com/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: text }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      setResult(data);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "50px auto", padding: 20, fontFamily: "Arial" }}>
      <h1>AI Study Tool</h1>
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your study material here..."
        style={{
          width: "100%",
          height: 200,
          padding: 10,
          fontSize: 14,
          borderRadius: 8,
          border: "1px solid #ccc",
        }}
      />

      <button
        onClick={generate}
        disabled={loading}
        style={{
          marginTop: 20,
          padding: "12px 24px",
          fontSize: 16,
          backgroundColor: loading ? "#ccc" : "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 20, padding: 20, backgroundColor: "#f0f0f0", borderRadius: 8 }}>
          <h2>Summary</h2>
          <p>{result.summary}</p>

          <h2>Flashcards</h2>
          {result.flashcards?.map((fc, i) => (
            <div key={i} style={{ marginBottom: 10, padding: 10, backgroundColor: "white", borderRadius: 4 }}>
              <p><strong>Q{i + 1}:</strong> {fc.front}</p>
              <p><strong>A:</strong> {fc.back}</p>
            </div>
          ))}

          <h2>Quiz</h2>
          {result.quiz?.map((q, i) => (
            <div key={i} style={{ marginBottom: 15, padding: 10, backgroundColor: "white", borderRadius: 4 }}>
              <p><strong>Q{i + 1}:</strong> {q.question}</p>
              {q.options?.map((opt, j) => (
                <p key={j} style={{ marginLeft: 20 }}>
                  {String.fromCharCode(65 + j)}) {opt}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}