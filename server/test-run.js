import fetch from "node-fetch";

// Simple Python program to test execution
const payload = {
  language_id: 100, // Python 3.12.5 (you can use any id from /languages)
  source_code: "print('Hello from Judge0!')",
  stdin: ""
};

const run = async () => {
  try {
    const res = await fetch("http://localhost:3001/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("Run result:", data);
  } catch (err) {
    console.error("Error running code:", err);
  }
};

run();
