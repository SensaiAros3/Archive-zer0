// terminal.js — ARCHIVE-ZER0 TERMINAL SYSTEM (Full Edition)
// Font: Consolas
// Version: 3.0 — Merged with full Linux-style controls

// ===== DOM Elements =====
const terminal = document.getElementById("terminal");
const input = document.getElementById("command");

// ===== State Variables =====
let devMode = false;
let loginAttempts = 0;
let loginDisabled = false;

const traceLog = {};
const sectorIndex = {};

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

    case cmd === "controls":
      print(`=== TERMINAL CONTROLS ===`);
      print("/ — focus input");
      print("↑ / ↓ — navigate command history");
      print("Tab — autocomplete commands");
      print("Ctrl + L — clear screen");
      print("Ctrl + C — cancel current line");
      print("Ctrl + U — clear current input");
      print("Ctrl + A — move cursor to start");
      print("Ctrl + E — move cursor to end");
      print("Ctrl + R — reverse search history");
      print("Click anywhere — focus input");
      break;

    case cmd === "clear":
      resetTerminal();
      break;

    case cmd === "archives":
  const totalArchives = 22; // change this to your total
  let list = "";
  for (let i = 1; i <= totalArchives; i++) {
    list += `Z-${String(i).padStart(3, "0")}<br>`;
  }
  print(`ARCHIVE FILES SUMMARY:<br>${list}`);
  break;

    case cmd.startsWith("view "):
      const parts = parseCommandParts(cmd);
      const id = parts[1]?.toUpperCase();
      if (!id) return print("Usage: view <ID>");
      print(`Opening ${id}...`);
      setTimeout(() => {
        window.location.href = `${id.toLowerCase()}.html`;
      }, 800);
      break;

    case cmd === "random":
      const anomalies = [
        "z-001.html",
        "z-002.html",
        "z-003.html",
        "z-004.html",
        "z-005.html",
        "z-006.html",
        "z-007.html",
        "z-008.html",
        "z-009.html",
      ];
      (async () => {
        const existing = [];
        for (const file of anomalies) {
          try {
            const res = await fetch(file, { method: "HEAD" });
            if (res.ok) existing.push(file);
          } catch {}
        }
        if (existing.length > 0) {
          const randomFile =
            existing[Math.floor(Math.random() * existing.length)];
          print(`Opening ${randomFile.toUpperCase().replace(".HTML", "")}...`);
          setTimeout(() => {
            window.location.href = randomFile;
          }, 800);
        } else print("[ERROR] No accessible anomalies found.");
      })();
      break;

    case cmd === "report":
      print("https://forms.gle/3kxyMfkSWtN33vG46");
      break;

    case cmd.startsWith("scan "):
      const sectorParts = parseCommandParts(cmd);
      const sector = sectorParts[1]?.toUpperCase();
      if (!sector) return print("Usage: scan <sector>");
      const sectorKey = sector.padStart(2, "0");
      print(`Initiating scan on ${sectorKey}...`);
      setTimeout(() => {
        const found = sectorIndex[sectorKey];
        if (found && found.length > 0) {
          print(`[SCAN COMPLETE] Detected ${found.length} object(s) in ${sectorKey}:`);
          found.forEach((t) => {
            const info = traceLog[t];
            if (info)
              print(
                ` - ${t} (last traced on ${info.scanner} scanners at ${new Date(
                  info.ts
                ).toUTCString()})`
              );
            else print(` - ${t} (unknown metadata)`);
          });
        } else print(`[SCAN COMPLETE] No anomalies detected in ${sectorKey}.`);
      }, 1200);
      break;

    case cmd.startsWith("decrypt "):
      const decParts = parseCommandParts(cmd);
      const decId = decParts[1]?.toUpperCase();
      if (!decId) return print("Usage: decrypt <ID>");
      print(`[DECRYPT] Attempting to unlock ${decId}...`);
      setTimeout(
        () =>
          print(
            `[ERROR] File ${decId} is locked with level-4 clearance.`,
            "error"
          ),
        1200
      );
      break;

    case cmd === "status":
      print(
        "HQ STATUS:<br>Active anomalies: 6<br>Pending reports: 2<br>New alerts: 1 (Crimson)<br>System Integrity: STABLE"
      );
      break;

    case cmd === "alerts":
      print(
        "<span class='error'>[ALERT] Z-003 activity spike detected in SEC-07</span>"
      );
      break;

    case cmd === "time":
      print(`Current system time: ${new Date().toUTCString()}`);
      break;

   case cmd.startsWith("trace "):
  const targetRaw = cmd.substring(6).trim().toUpperCase();
  if (!targetRaw) return print("Usage: trace <target>");

  // Only allow valid archives Z-001 → Z-021
  const validArchives = Array.from({ length: 21 }, (_, i) =>
    `Z-${String(i + 1).padStart(3, "0")}`
  );

  if (!validArchives.includes(targetRaw)) {
    return print(`[ERROR] ${targetRaw} is not a recognized archive.`, "error");
  }

  const sectors = [
    "01","02","03","04","05","06","07","08","09","10","11","12"
  ];
  const scanners = [
    "thermal","spectral","quantum","neural","infrared","gravimetric"
  ];
  const randomSector = sectors[Math.floor(Math.random() * sectors.length)];
  const randomScanner = scanners[Math.floor(Math.random() * scanners.length)];

  await traceProgress(targetRaw);

  const success = Math.random() > 0.3;
  if (success) {
    removeTargetFromSector(targetRaw, traceLog[targetRaw]?.sector);
    traceLog[targetRaw] = {
      sector: randomSector,
      scanner: randomScanner,
      ts: Date.now(),
    };
    indexTargetInSector(targetRaw, randomSector);
    print(
      `[TRACE COMPLETE] ${targetRaw} last detected near Sector-${randomSector} on ${randomScanner} scanners.`
    );
  } else print(`[TRACE FAILED] ${targetRaw} signal lost during scan.`, "error");
  break;


    case cmd.startsWith("echo "):
      print(cmd.substring(5));
      break;

    case cmd === "create":
      print("=== Field Report Creation ===");
      print("Title> _ (Not implemented in this demo)", "warning");
      break;

    case cmd === "login":
      const user = prompt("Username:");
      const pass = prompt("Password:");
      if (user === "admin" && pass === "Az19882010@") {
        devMode = true;
        print("[ACCESS GRANTED] Developer clearance active.", "success");
      } else {
        loginAttempts++;
        print("[ACCESS DENIED] Invalid credentials.", "error");
        if (loginAttempts >= 3) {
          loginDisabled = true;
          print("[HQ ALERT] Multiple failed login attempts detected.", "error");
          print("Login command disabled for this session.", "warning");
        }
      }
      break;

    case cmd.startsWith("add ") ||
      cmd.startsWith("remove ") ||
      cmd.startsWith("lock ") ||
      cmd.startsWith("unlock "):
      if (!devMode)
        return print(
          "[ERROR] Command restricted: insufficient clearance.",
          "error"
        );
      const devParts = parseCommandParts(cmd);
      print(
        `[DEV] ${devParts[0].toUpperCase()} command executed for ${
          devParts[1]?.toUpperCase() || "UNKNOWN"
        }.`,
        "success"
      );
      break;

    case cmd === "sectors":
      if (!devMode)
        return print(
          "[ERROR] Command restricted: insufficient clearance.",
          "error"
        );
      print("KNOWN SECTORS (occupied):");
      const keys = Object.keys(sectorIndex).sort();
      if (keys.length === 0) print(" - No sectors currently indexed.");
      else
        keys.forEach((k) =>
          sectorIndex[k].forEach((t) => {
            const info = traceLog[t];
            print(
              `Sector-${k}: ${t} (scanner: ${info.scanner}, traced: ${new Date(
                info.ts
              ).toUTCString()})`
            );
          })
        );
      break;

    case cmd.startsWith("relocate "):
      if (!devMode)
        return print(
          "[ERROR] Command restricted: insufficient clearance.",
          "error"
        );
      const relocateParts = parseCommandParts(cmd);
      if (relocateParts.length < 3)
        return print("Usage: relocate <target> <sector>");
      const rTarget = relocateParts[1].toUpperCase();
      const rSector = relocateParts[2].padStart(2, "0");
      removeTargetFromSector(rTarget, traceLog[rTarget]?.sector);
      traceLog[rTarget] = { sector: rSector, scanner: "manual", ts: Date.now() };
      indexTargetInSector(rTarget, rSector);
      print(`[DEV] ${rTarget} relocated to Sector-${rSector}.`, "success");
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
      setTimeout(() => {
        window.location.href = "index.html";
      }, 800);
      break;

    default:
      print("Unknown command.", "error");
  }
}

// ===== Input Listener =====
input.addEventListener("keydown", async function (e) {
  // ENTER
  if (e.key === "Enter") {
    e.preventDefault();
    const command = input.value.trim();
    if (!command) return;
    print("> " + command);
    await handleCommand(command.toLowerCase());
    commandHistory.push(command);
    historyIndex = commandHistory.length;
    input.value = "";
    reverseSearchActive = false;
  }

  // TAB autocomplete
  else if (e.key === "Tab") {
    e.preventDefault();
    const cmds = [
      "help",
      "login",
      "create",
      "archives",
      "view",
      "report",
      "scan",
      "decrypt",
      "status",
      "alerts",
      "time",
      "trace",
      "echo",
      "clear",
      "controls",
      "system",
      "random",
      "home",
    ];
    const match = cmds.find((c) => c.startsWith(input.value));
    if (match) input.value = match;
  }

  // CTRL shortcuts
  else if (e.ctrlKey) {
    switch (e.key.toLowerCase()) {
      case "l":
        e.preventDefault();
        resetTerminal();
        break;
      case "c":
        e.preventDefault();
        print("^C");
        input.value = "";
        break;
      case "u":
        e.preventDefault();
        input.value = "";
        break;
      case "a":
        e.preventDefault();
        input.selectionStart = input.selectionEnd = 0;
        break;
      case "e":
        e.preventDefault();
        input.selectionStart = input.selectionEnd = input.value.length;
        break;
      case "r":
        e.preventDefault();
        reverseSearchActive = true;
        reverseSearchQuery = "";
        reverseSearchMatch = "";
        print("(reverse-i-search)`': ");
        break;
    }
  }

  // REVERSE SEARCH
  else if (reverseSearchActive) {
    if (e.key === "Escape") {
      reverseSearchActive = false;
      print("");
    } else if (e.key === "Backspace") {
      e.preventDefault();
      reverseSearchQuery = reverseSearchQuery.slice(0, -1);
    } else if (e.key.length === 1) {
      e.preventDefault();
      reverseSearchQuery += e.key;
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (reverseSearchMatch) input.value = reverseSearchMatch;
      reverseSearchActive = false;
    }

    // Find matching command
    if (reverseSearchActive) {
      const match = commandHistory
        .slice()
        .reverse()
        .find((cmd) => cmd.includes(reverseSearchQuery));
      reverseSearchMatch = match || "";
      const searchDisplay = `(reverse-i-search)\`${reverseSearchQuery}': ${reverseSearchMatch}`;
      print(searchDisplay);
    }
  }
});

// ===== Global Shortcuts =====
document.addEventListener("keydown", (e) => {
  if (e.key === "/") {
    e.preventDefault();
    input.focus();
  }
  if (e.key === "ArrowUp") {
    if (historyIndex > 0) {
      historyIndex--;
      input.value = commandHistory[historyIndex] || "";
    }
    e.preventDefault();
  } else if (e.key === "ArrowDown") {
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      input.value = commandHistory[historyIndex] || "";
    } else {
      historyIndex = commandHistory.length;
      input.value = "";
    }
    e.preventDefault();
  }
});

document.addEventListener("click", () => input.focus());
window.onload = () => input.focus();

// ===== Initialize =====
resetTerminal();
