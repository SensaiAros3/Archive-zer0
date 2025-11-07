// terminal.js — ARCHIVE-ZER0 TERMINAL SYSTEM (v3.2 Optimized)
// Font: Consolas

// ===== DOM Elements =====
const terminal = document.getElementById("terminal");
const input = document.getElementById("command");

// ===== State Variables =====
let devMode = false;
let loginAttempts = 0;
let loginDisabled = false;
let activeTrace = false;

const traceLog = {};
const sectorIndex = {};
const knownArchives = [
  "Z-001",
  "Z-002",
  "Z-003",
  "Z-004",
  "Z-005",
  "Z-006",
  "Z-007",
  "Z-008",
  "Z-009",
  "Z-010"
];

// ===== Command History =====
let commandHistory = [];
let historyIndex = -1;
let reverseSearchActive = false;
let reverseSearchQuery = "";
let reverseSearchMatch = "";

// ===== Utility Functions =====
function print(text, cls = "") {
  const p = document.createElement("p");
  p.innerHTML = cls ? `<span class="${cls}">${text}</span>` : text;
  terminal.appendChild(p);
  terminal.scrollTop = terminal.scrollHeight;
}

function resetTerminal() {
  terminal.innerHTML =
    "<p>ARCHIVE-ZER0 SYSTEM v0.3</p><p>Type <b>help</b> to view available commands.</p>";
}

function parseCommandParts(cmd) {
  return cmd.split(" ").filter(Boolean);
}

function indexTargetInSector(target, sector) {
  if (!sectorIndex[sector]) sectorIndex[sector] = [];
  if (!sectorIndex[sector].includes(target))
    sectorIndex[sector].push(target);
}

function removeTargetFromSector(target, prevSector) {
  if (!prevSector) return;
  const arr = sectorIndex[prevSector];
  if (!arr) return;
  const idx = arr.indexOf(target);
  if (idx !== -1) arr.splice(idx, 1);
  if (arr.length === 0) delete sectorIndex[prevSector];
}

async function traceProgress(target) {
  const totalSteps = 10;
  for (let i = 1; i <= totalSteps; i++) {
    const progress = "▓".repeat(i) + "░".repeat(totalSteps - i);
    print(`Tracing ${target} [${progress}] ${i * 10}%`);
    await new Promise((res) => setTimeout(res, 120));
  }
}

// ===== Command Handlers =====
async function handleCommand(cmd) {
  if (loginDisabled && cmd.startsWith("login")) {
    print("[ALERT] Login system temporarily disabled.", "error");
    return;
  }

  switch (true) {
    case cmd === "help":
      print(
        `Available commands:<br>
        random - opens a random entity<br>
        system - shows active status<br>
        help — show available commands<br>
        login — authenticate<br>
        create — create new field report<br>
        archives — show archive summaries<br>
        view &lt;ID&gt; — open archive/log<br>
        report — list submitted reports<br>
        scan &lt;sector&gt; — simulate sector scan<br>
        decrypt &lt;ID&gt; — attempt decrypt<br>
        status — show HQ/terminal status<br>
        alerts — list active alerts<br>
        time — show in-universe time<br>
        trace &lt;target&gt; — trace anomaly<br>
        echo &lt;msg&gt; — output message<br>
        clear — clear terminal<br>
        controls — list all keyboard shortcuts`
      );
      if (devMode) {
        print(
          `<br><b>Developer Commands:</b><br>
          add &lt;ID&gt; — add new archive<br>
          remove &lt;ID&gt; — remove archive<br>
          lock &lt;ID&gt; — lock file<br>
          unlock &lt;ID&gt; — unlock file<br>
          sectors — reveal occupied sectors<br>
          relocate &lt;target&gt; &lt;sector&gt; — move target to new sector`
        );
      }
      break;

    case cmd === "clear":
      resetTerminal();
      break;

    case cmd === "archives":
      print(
        "ARCHIVE FILES SUMMARY:<br>" + knownArchives.join("<br>")
      );
      break;

    case cmd.startsWith("view "):
      const parts = parseCommandParts(cmd);
      const id = parts[1]?.toUpperCase();
      if (!id) return print("Usage: view <ID>");
      if (!knownArchives.includes(id))
        return print(`[ERROR] ${id} not found in database.`, "error");
      print(`Opening ${id}...`);
      setTimeout(() => {
        window.location.href = `${id.toLowerCase()}.html`;
      }, 800);
      break;

    case cmd === "random":
      const existing = [];
      for (const file of knownArchives.map(a => a.toLowerCase() + ".html")) {
        try {
          const res = await fetch(file, { method: "HEAD" });
          if (res.ok) existing.push(file);
        } catch {}
      }
      if (existing.length > 0) {
        const randomFile = existing[Math.floor(Math.random() * existing.length)];
        print(`Opening ${randomFile.toUpperCase().replace(".HTML", "")}...`);
        setTimeout(() => window.location.href = randomFile, 800);
      } else print("[ERROR] No accessible anomalies found.");
      break;

    case cmd.startsWith("trace "): {
      const target = cmd.substring(6).trim().toUpperCase();
      if (!target) return print("Usage: trace <target>");
      if (!knownArchives.includes(target))
        return print(`[TRACE FAILED] Target "${target}" not found in archives.`, "error");
      if (activeTrace) return print("A trace is already running...", "warn");
      
      activeTrace = true;
      const sectors = ["01","02","03","04","05","06","07","08","09","10","11","12"];
      const scanners = ["thermal","spectral","quantum","neural","infrared","gravimetric"];
      const randomSector = sectors[Math.floor(Math.random() * sectors.length)];
      const randomScanner = scanners[Math.floor(Math.random() * scanners.length)];
      
      await traceProgress(target);
      removeTargetFromSector(target, traceLog[target]?.sector);
      traceLog[target] = {
        sector: randomSector,
        scanner: randomScanner,
        ts: Date.now()
      };
      indexTargetInSector(target, randomSector);
      print(`[TRACE COMPLETE] ${target} last detected near Sector-${randomSector} on ${randomScanner} scanners.`, "success");
      activeTrace = false;
      break;
    }

    case cmd.startsWith("scan "):
      const sec = parseCommandParts(cmd)[1]?.toUpperCase();
      if (!sec) return print("Usage: scan <sector>");
      print(`Initiating scan on ${sec}...`);
      setTimeout(() => {
        const found = sectorIndex[sec];
        if (found?.length) {
          print(`[SCAN COMPLETE] Detected ${found.length} object(s) in ${sec}:`);
          found.forEach((t) => {
            const info = traceLog[t];
            print(` - ${t} (${info.scanner}, ${new Date(info.ts).toUTCString()})`);
          });
        } else print(`[SCAN COMPLETE] No anomalies detected in ${sec}.`);
      }, 1000);
      break;

    case cmd === "system":
      print("ARCHIVE-ZER0 SYSTEM INFO:");
      print("OS Build: A0-Terminal v0.3");
      print("Database: Connected");
      print("Security Layer: Active");
      print("Network Sync: Stable");
      break;

    case cmd === "home":
      print("Returning to home directory...");
      setTimeout(() => (window.location.href = "index.html"), 800);
      break;

    default:
      print("Unknown command.", "error");
  }
}

// ===== Input Listener =====
input.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const command = input.value.trim();
    if (!command) return;
    print("> " + command);
    await handleCommand(command.toLowerCase());
    commandHistory.push(command);
    historyIndex = commandHistory.length;
    input.value = "";
  }
});

// ===== Shortcuts =====
document.addEventListener("keydown", (e) => {
  if (e.key === "/") {
    e.preventDefault();
    input.focus();
  } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    if (e.key === "ArrowUp" && historyIndex > 0) historyIndex--;
    else if (e.key === "ArrowDown" && historyIndex < commandHistory.length - 1)
      historyIndex++;
    input.value = commandHistory[historyIndex] || "";
  }
});

document.addEventListener("click", () => input.focus());
window.onload = () => input.focus();

resetTerminal();
