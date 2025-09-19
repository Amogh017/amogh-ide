// ---- CONFIG ----
const API_BASE = "http://localhost:3001";

// Monaco boot via AMD loader
let editor, monacoRef;
require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs' }});
require(['vs/editor/editor.main'], async () => {
  monacoRef = monaco;
  initUI();
  await loadLanguages();
  setTheme(document.getElementById('theme').value);
});

// ---- Language helpers ----
const languageSamples = {
  "C++": `#include <bits/stdc++.h>
using namespace std;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);
  int n; if(!(cin>>n)) return 0; cout<<n*n<<"\\n"; return 0;
}`,
  "C (GCC": `#include <stdio.h>
int main(){int n; if(scanf("%d",&n)!=1) return 0; printf("%d\\n", n*n); return 0;}`,
  "Python": `print("Hi from Python!")\nprint(int(input() or 0)**2)`,
  "Java (": `import java.util.*; class Main{
  public static void main(String[] a){ Scanner sc=new Scanner(System.in);
    int n=sc.hasNextInt()?sc.nextInt():0; System.out.println(n*n);
  }
}`,
  "JavaScript": `const fs=require('fs');
(async()=>{const data=await new Promise(r=>{let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>r(s.trim()))});
const n=+data||0; console.log(n*n);})();`,
  "Go (": `package main
import "fmt"
func main(){var n int; fmt.Scan(&n); fmt.Println(n*n)}`,
  "Rust (": `use std::io::{self, Read};
fn main(){let mut s=String::new(); io::stdin().read_to_string(&mut s).unwrap();
let n:i64=s.trim().parse().unwrap_or(0); println!("{}", n*n);}`,
  "PHP": `<?php $n = intval(trim(fgets(STDIN))); echo ($n*$n)."\\n";`
};

function guessMonacoLang(name) {
  if (name.includes("C++")) return "cpp";
  if (name.startsWith("C (")) return "c";
  if (name.startsWith("Java (" ) || name.startsWith("JavaFX")) return "java";
  if (name.startsWith("JavaScript")) return "javascript";
  if (name.startsWith("TypeScript")) return "typescript";
  if (name.startsWith("Python")) return "python";
  if (name.startsWith("Go (")) return "go";
  if (name.startsWith("Rust (")) return "rust";
  if (name.startsWith("PHP")) return "php";
  return "plaintext";
}

function sampleFor(name) {
  const key = Object.keys(languageSamples).find(k => name.includes(k));
  return key ? languageSamples[key] : `// ${name}\n// Write code here`;
}

// ---- UI init ----
function initUI() {
  const editorEl = document.getElementById('editor');
  editor = monacoRef.editor.create(editorEl, {
    value: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){ cout<<"Hello Judge0!\\n"; }\n`,
    language: 'cpp',
    automaticLayout: true,
    theme: 'vs-dark',
    fontSize: 14,
    minimap: { enabled: false },
    roundedSelection: false,
    scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 }
  });

  // Tabs
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Theme
  document.getElementById('theme').addEventListener('change', (e) => setTheme(e.target.value));

  // Run
  document.getElementById('runBtn').addEventListener('click', runCode);

  // Reset
  document.getElementById('resetBtn').addEventListener('click', () => {
    const langSel = document.getElementById('language');
    const name = langSel.options[langSel.selectedIndex]?.dataset.name || "";
    editor.setValue(sampleFor(name));
    setStatus('Idle');
    setMeta('—');
    setOutput('', '');
  });
}

function setTheme(theme) {
  monacoRef.editor.setTheme(theme);
}

function setStatus(text) {
  document.getElementById('status').textContent = text;
}

function setMeta(text) {
  document.getElementById('metaStatus').textContent = text;
}

function setOutput(stdout, stderr, compile_output = "") {
  document.getElementById('stdout').textContent = stdout || "";
  document.getElementById('stderr').textContent = (compile_output || "") + (stderr ? (compile_output ? "\n" : "") + stderr : "");
}

// ---- Load languages from backend ----
async function loadLanguages() {
  setStatus('Loading languages…');
  try {
    const res = await fetch(`${API_BASE}/languages`);
    const langs = await res.json();
    const sel = document.getElementById('language');
    sel.innerHTML = "";

    // Prefer some modern ones on top
    const preferredIds = new Set([105,103,100,109,97,101,91,106,108,98]);
    const preferred = langs.filter(l => preferredIds.has(l.id));
    const others = langs.filter(l => !preferredIds.has(l.id));
    const merged = [...preferred, ...others];

    merged.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.id;
      opt.textContent = `${l.id} — ${l.name}`;
      opt.dataset.name = l.name;
      sel.appendChild(opt);
    });

    // Set default sample + language mode
    const firstName = merged[0]?.name || "Plain Text";
    editor.setValue(sampleFor(firstName));
    monacoRef.editor.setModelLanguage(editor.getModel(), guessMonacoLang(firstName));

    // Change handler
    sel.addEventListener('change', () => {
      const name = sel.options[sel.selectedIndex].dataset.name || "";
      monacoRef.editor.setModelLanguage(editor.getModel(), guessMonacoLang(name));
      editor.setValue(sampleFor(name));
    });

    setStatus('Ready');
    setMeta('—');
  } catch (e) {
    setStatus('Error');
    setMeta('Failed to load languages. Is the backend (3001) running?');
  }
}

// ---- Run code ----
async function runCode() {
  const sel = document.getElementById('language');
  const language_id = Number(sel.value);
  const source_code = editor.getValue();
  const stdin = document.getElementById('stdin').value;

  setStatus('Running…');
  setMeta('Submitting to Judge0…');
  setOutput('', '');

  try {
    const res = await fetch(`${API_BASE}/run`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        language_id,
        source_code,
        stdin,
        time_limit: 5,
        memory_limit: 256000
      })
    });
    const data = await res.json();

    setOutput(data.stdout, data.stderr, data.compile_output);
    const status = data.status?.description || 'Unknown';
    setStatus(status);
    setMeta(`${status} • time ${data.time ?? "—"}s • mem ${data.memory ?? "—"} KB`);
    // Auto-switch to Output tab on success/failure
    document.querySelector('.tab[data-tab="stdout"]').click();
    if (data.compile_output || data.stderr) {
      document.querySelector('.tab[data-tab="stderr"]').click();
    }
  } catch (e) {
    setStatus('Error');
    setMeta('Run failed. Check backend logs.');
  }
}
