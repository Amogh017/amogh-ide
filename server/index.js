// index.js — Amogh IDE backend (RapidAPI -> Judge0 CE) [NO /v1]

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import morgan from "morgan";
import cors from "cors";
import axios from "axios";
import { LRUCache } from "lru-cache";

const app = express();
app.use(cors()); // tighten in prod
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

const PORT = Number(process.env.PORT || 3001);
const JUDGE0 = process.env.JUDGE0_URL || "https://judge0-ce.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "judge0-ce.p.rapidapi.com";
const TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 3600);

// Debug boot info
console.log("[BOOT] JUDGE0:", JUDGE0);
console.log("[BOOT] HOST:", RAPIDAPI_HOST);
console.log("[BOOT] KEY length:", RAPIDAPI_KEY.length);

const cache = new LRUCache({ max: 1000, ttl: TTL_SECONDS * 1000 });

// RapidAPI base URL has NO version segment.
// Endpoints we call: "/languages", "/submissions", "/submissions/{token}"
const ax = axios.create({
  baseURL: JUDGE0,
  headers: {
    "X-RapidAPI-Key": RAPIDAPI_KEY,
    "X-RapidAPI-Host": RAPIDAPI_HOST,
  },
  timeout: 15000,
});

// GET /languages (cached)
app.get("/languages", async (_req, res) => {
  const key = "languages";
  const hit = cache.get(key);
  if (hit) return res.json(hit);

  try {
    const { data } = await ax.get("/languages");
    cache.set(key, data);
    res.json(data);
  } catch (e) {
    console.error("[/languages] ERROR:", e.response?.status, e.response?.data || e.message);
    res.status(502).json({ error: "Judge0 languages fetch failed" });
  }
});

// POST /run
app.post("/run", async (req, res) => {
  const {
    language_id, source_code, stdin = "",
    compiler_options = "", command_line_arguments = "",
    time_limit = 5, memory_limit = 256000,
  } = req.body || {};

  if (!language_id || !source_code) {
    return res.status(400).json({ error: "language_id and source_code are required" });
  }

  const TL = Math.min(Number(time_limit) || 5, 10);
  const ML = Math.min(Number(memory_limit) || 256000, 512000);

  const payload = {
    language_id,
    source_code: Buffer.from(source_code).toString("base64"),
    stdin: Buffer.from(stdin).toString("base64"),
    compiler_options,
    command_line_arguments,
    time_limit: TL,
    memory_limit: ML,
    redirect_stderr_to_stdout: true,
  };

  try {
    // Create submission (async)
    const create = await ax.post("/submissions?base64_encoded=true&wait=false", payload);
    const token = create.data.token;

    // Poll for result
    const start = Date.now();
    const deadline = 15000;
    let result;

    while (Date.now() - start < deadline) {
      const { data } = await ax.get(`/submissions/${token}?base64_encoded=true`);
      if (data.status && data.status.id >= 3) { result = data; break; }
      await new Promise(r => setTimeout(r, 600));
    }

    if (!result) return res.status(504).json({ error: "Execution timed out" });

    const dec = v => (v ? Buffer.from(v, "base64").toString("utf8") : "");
    res.json({
      stdout: dec(result.stdout),
      stderr: dec(result.stderr),
      compile_output: dec(result.compile_output),
      message: dec(result.message),
      status: result.status,
      time: result.time,
      memory: result.memory,
    });
  } catch (e) {
    console.error("[/run] ERROR:", e.response?.status, e.response?.data || e.message);
    res.status(502).json({ error: "Judge0 submission failed" });
  }
});

app.listen(PORT, () => console.log("API on", PORT));
