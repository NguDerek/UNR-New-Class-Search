import { useEffect, useState } from "react";

function App() {
  const [courses, setCourses] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/courses")
      .then((r) => r.json())
      .then((json) => setCourses(json.courses))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>UNR Course Search Test Page</h1>

      {courses ? (
        <ul>
          {courses.map(c => (
            <li key={c.id}>
              {c.code} — {c.name} ({c.credits} credits)
            </li>
          ))}
        </ul>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default App;