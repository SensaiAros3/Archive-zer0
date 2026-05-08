// ===== SUPABASE =====
const supabaseUrl = "https://gqgyaigsieynxgxgzdvm.supabase.co"
const supabaseKey = "YOUR_ANON_KEY"

const supabaseClient = supabase.createClient(
  supabaseUrl,
  supabaseKey
)

// ===== DOM =====
const terminal = document.getElementById("terminal")
const input = document.getElementById("command")

// ===== STATE =====
let ARCHIVES = []

// ===== UI =====
function print(text, cls = "") {
  const p = document.createElement("p")
  p.className = cls
  p.textContent = text
  terminal.appendChild(p)
  terminal.scrollTop = terminal.scrollHeight
}

function resetTerminal() {
  terminal.innerHTML = `
    <p>ARCHIVE-ZER0 SYSTEM v3.2</p>
    <p>Type help to view available commands.</p>
  `
}

// ===== LOAD DATABASE =====
async function loadArchives() {
  const { data, error } = await supabaseClient
    .from("anomalies")
    .select("code_name")

  if (error) {
    print("[DB ERROR] " + error.message, "error")
    return
  }

  ARCHIVES = data.map(a => a.code_name.toLowerCase())

  print(`[SYSTEM] ${ARCHIVES.length} anomalies loaded.`, "success")
}

// ===== COMMAND HANDLER =====
async function handleCommand(cmd) {
  cmd = cmd.trim().toLowerCase()

  // HELP
  if (cmd === "help") {
    print("help")
    print("clear")
    print("archives")
    print("view <id>")
    return
  }

  // CLEAR
  if (cmd === "clear") {
    resetTerminal()
    return
  }

  // ARCHIVES
  if (cmd === "archives") {
    print(ARCHIVES.join(", "))
    return
  }

  // VIEW
  if (cmd.startsWith("view ")) {
    const id = cmd.split(" ")[1]

    if (!id) {
      print("Usage: view <id>", "error")
      return
    }

    const { data, error } = await supabaseClient
      .from("anomalies")
      .select("*")
      .eq("code_name", id.toLowerCase())
      .single()

    if (error || !data) {
      print("[ERROR] Archive not found", "error")
      return
    }

    print("ACCESSING ARCHIVE...", "warning")

    setTimeout(() => {
      print(`=== ${data.code_name.toUpperCase()} ===`)
      print(`ARCHIVE: ${data.archive}`)
      print(`STATUS: ${data.status}`)
      print(`THREAT: ${data.threat_level}`)
      print(`INFO: ${data.description}`)
    }, 500)

    return
  }

  print("Unknown command", "error")
}

// ===== INPUT =====
input.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const value = input.value
    input.value = ""

    print("> " + value)
    await handleCommand(value)
  }
})

// ===== START =====
resetTerminal()
loadArchives()
