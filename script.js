// ===== SUPABASE =====
const supabaseUrl = "https://gqgyaigsieynxgxgzdvm.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxZ3lhaWdzaWV5bnhneGd6ZHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjczNDYsImV4cCI6MjA5Mjk0MzM0Nn0.UkTumgRaj7ModAUeE_Fg5vTA2VL0Hug-4lo_DUSgRNM"

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey)

function isAdmin() {
  return sessionStorage.getItem("role") === "admin"
}

// ===== DOM =====
const terminal = document.getElementById("terminal")
const input = document.getElementById("command")

// ===== STATE =====
let ARCHIVES = []

// ===== UI =====
function print(text, cls = "") {
  const p = document.createElement("p")
  if (cls) p.className = cls
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

  ARCHIVES = (data || []).map(a => a.code_name.toLowerCase())
  print(`[SYSTEM] ${ARCHIVES.length} anomalies loaded.`, "success")
}

// ===== COMMAND HANDLER =====
async function handleCommand(cmdRaw) {
  const cmd = cmdRaw.trim().toLowerCase()

  if (!cmd) return

  // HELP
  if (cmd === "help") {
    print("help")
    print("clear")
    print("archives")
    print("view <id>")
    print("login")
    print("signup")
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

  // SIGNUP
  if (cmd === "signup") {
    const username = prompt("Username")
    const password = prompt("Password")

    const { error } = await supabaseClient
      .from("users")
      .insert([{ username, password, role: "user" }])

    if (error) print("[SIGNUP FAILED]", "error")
    else print("[ACCOUNT CREATED]", "success")

    return
  }

  // LOGIN
  if (cmd === "login") {
    const username = prompt("Username")
    const password = prompt("Password")

    const { data, error } = await supabaseClient
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)

    const user = data?.[0]

    if (error || data.length === 0) {
      print("[ACCESS DENIED]", "error")
      console.log(data)
      return
    }

    const user = data[0]

    sessionStorage.setItem("role", user.role)
    sessionStorage.setItem("user", user.username)

    print(`[LOGIN SUCCESS] ${user.username}`, "success")
    return
  }

  // CREATE
  if (cmd === "create") {
    if (!isAdmin()) return print("[NO ACCESS]", "error")

    const code = prompt("Code name (Z-001)")
    const desc = prompt("Description")

    const { error } = await supabaseClient
      .from("anomalies")
      .insert([{
        code_name: code.toLowerCase(),
        description: desc,
        status: "ACTIVE",
        locked: false
      }])

    if (error) print("[CREATE FAILED] " + error.message, "error")
    else {
      print("[CREATED]", "success")
      loadArchives()
    }

    return
  }

  // DELETE
  if (cmd.startsWith("delete ")) {
    if (!isAdmin()) return print("[NO ACCESS]", "error")

    const id = cmd.split(" ")[1]?.toLowerCase()

    const { error } = await supabaseClient
      .from("anomalies")
      .delete()
      .eq("code_name", id)

    if (error) print("[DELETE FAILED]", "error")
    else {
      print("[DELETED]", "success")
      loadArchives()
    }

    return
  }

  // EDIT
  if (cmd.startsWith("edit ")) {
    if (!isAdmin()) return print("[NO ACCESS]", "error")

    const id = cmd.split(" ")[1]?.toLowerCase()
    const desc = prompt("New description")

    const { error } = await supabaseClient
      .from("anomalies")
      .update({ description: desc })
      .eq("code_name", id)

    if (error) print("[EDIT FAILED]", "error")
    else print("[UPDATED]", "success")

    return
  }

  // LOCK
  if (cmd.startsWith("lock ")) {
    if (!isAdmin()) return print("[NO ACCESS]", "error")

    const id = cmd.split(" ")[1]?.toLowerCase()

    await supabaseClient
      .from("anomalies")
      .update({ locked: true })
      .eq("code_name", id)

    print("[LOCKED]", "success")
    return
  }

  // UNLOCK
  if (cmd.startsWith("unlock ")) {
    if (!isAdmin()) return print("[NO ACCESS]", "error")

    const id = cmd.split(" ")[1]?.toLowerCase()

    await supabaseClient
      .from("anomalies")
      .update({ locked: false })
      .eq("code_name", id)

    print("[UNLOCKED]", "success")
    return
  }

  // VIEW
  if (cmd.startsWith("view ")) {
    const id = cmd.split(" ")[1]?.toLowerCase()

    const { data } = await supabaseClient
      .from("anomalies")
      .select("locked")
      .eq("code_name", id)
      .single()

    if (data?.locked && !isAdmin()) {
      print("[LOCKED FILE]", "error")
      return
    }

    window.location.href = `template.html?id=${id}`
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
