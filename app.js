/* ============================================
   Toastmasters Timer — Application Logic
   ============================================ */

// ─── Constants & Configuration ─────────────────────────────────────

/** Preset timing configurations (values in seconds) */
const PRESETS = {
    "Speech (5-7 min)":       { green: 300, yellow: 360, red: 420, dq: 450 },
    "Table Topics (1-2 min)": { green: 60,  yellow: 90,  red: 120, dq: 150 },
    "Evaluation (2-3 min)":   { green: 120, yellow: 150, red: 180, dq: 210 },
    "Custom":                 { green: 2,   yellow: 4,   red: 6,   dq: 7   }
};

/** Maps preset names to their save category */
const PRESET_TO_CATEGORY = {
    "Speech (5-7 min)":       "Speech",
    "Table Topics (1-2 min)": "Table Topics",
    "Evaluation (2-3 min)":   "Evaluation",
    "Custom":                 null
};

/** Available result categories */
const CATEGORIES = ["Speech", "Table Topics", "Evaluation"];

/** Default thresholds per category (used in results status display) */
const CATEGORY_THRESHOLDS = {
    "Table Topics": { green: 60,  yellow: 90,  red: 120, dq: 150 },
    "Evaluation":   { green: 120, yellow: 150, red: 180, dq: 210 },
    "Speech":       { green: 300, yellow: 360, red: 420, dq: 450 }
};

// ─── Application State ─────────────────────────────────────────────

let currentPreset = "Speech (5-7 min)";
let thresholds    = { ...PRESETS[currentPreset] };
let elapsed       = 0;
let running       = false;
let hideTimer     = false;
let savedTimes    = { "Table Topics": [], "Evaluation": [], "Speech": [] };
let timerInterval = null;
let startTime     = null;
let elapsedAtStart = 0;
let displayWindow = null;

// ─── BroadcastChannel (syncs state to display window) ──────────────

const channel = new BroadcastChannel("toastmasters-timer");

/** Sends current timer state to the display window via BroadcastChannel */
function broadcastState() {
    channel.postMessage({
        elapsed,
        running,
        thresholds,
        hideTimer,
        speakerName: document.getElementById("speakerName").value,
        preset: currentPreset
    });
}

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Formats seconds into MM:SS string
 * @param {number} s - Total seconds
 * @returns {string} Formatted time string (e.g. "05:30")
 */
function fmt(s) {
    const m   = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/**
 * Returns a status emoji based on elapsed time vs thresholds
 * @param {number} seconds - Elapsed seconds
 * @param {object} th - Threshold object { green, yellow, red, dq }
 * @returns {string} Status emoji
 */
function getStatusEmoji(seconds, th) {
    if (seconds >= th.dq)     return "❌";
    if (seconds >= th.red)    return "🔴";
    if (seconds >= th.yellow) return "🟡";
    if (seconds >= th.green)  return "🟢";
    return "⚪";
}

// ─── Timer Card Images ──────────────────────────────────────────────

/** Maps threshold stages to their JPG image files */
const TIMER_CARD_IMAGES = {
    green:  "green.jpg",
    yellow: "yellow.jpg",
    red:    "red.jpg",
    dq:     "red.jpg"
};

// ─── UI Update Functions ────────────────────────────────────────────

/** Updates the main timer display text */
function updateTimerDisplay() {
    const el = document.getElementById("timerDisplay");
    const textNode = el.childNodes[0];

    if (hideTimer) {
        textNode.textContent = "██:██\n";
        el.classList.add("hidden-timer");
    } else {
        textNode.textContent = fmt(elapsed) + "\n";
        el.classList.remove("hidden-timer");
    }
}

/** Updates the timer card image based on current elapsed time */
function updateTimerCard() {
    const el = document.getElementById("timerCard");

    let stage = null;
    if (elapsed >= thresholds.dq)          stage = "dq";
    else if (elapsed >= thresholds.red)    stage = "red";
    else if (elapsed >= thresholds.yellow) stage = "yellow";
    else if (elapsed >= thresholds.green)  stage = "green";

    if (stage) {
        el.innerHTML = `<img src="${TIMER_CARD_IMAGES[stage]}" alt="${stage} card" class="timer-card-img">`;
    } else {
        el.innerHTML = "";
    }
}

/** Shows/hides the save buttons based on timer state */
function updateSaveButtons() {
    const show = !running && elapsed > 0;
    document.getElementById("saveContainer").classList.toggle("hidden", !show);
    document.getElementById("saveContainer2").classList.toggle("hidden", !show);
}

/** Master update — refreshes all UI elements and broadcasts state */
function updateAll() {
    updateTimerDisplay();
    updateTimerCard();
    updateSaveButtons();
    broadcastState();
}

// ─── Threshold Management ───────────────────────────────────────────

/** Populates the threshold input fields from current thresholds object */
function setThresholdInputs() {
    document.getElementById("green-min").value  = Math.floor(thresholds.green / 60);
    document.getElementById("green-sec").value  = thresholds.green % 60;
    document.getElementById("yellow-min").value = Math.floor(thresholds.yellow / 60);
    document.getElementById("yellow-sec").value = thresholds.yellow % 60;
    document.getElementById("red-min").value    = Math.floor(thresholds.red / 60);
    document.getElementById("red-sec").value    = thresholds.red % 60;
    document.getElementById("dq-min").value     = Math.floor(thresholds.dq / 60);
    document.getElementById("dq-sec").value     = thresholds.dq % 60;
}

/** Called when user manually edits a threshold input */
function onThresholdChange() {
    const g = (parseInt(document.getElementById("green-min").value) || 0) * 60
            + (parseInt(document.getElementById("green-sec").value) || 0);
    const y = (parseInt(document.getElementById("yellow-min").value) || 0) * 60
            + (parseInt(document.getElementById("yellow-sec").value) || 0);
    const r = (parseInt(document.getElementById("red-min").value) || 0) * 60
            + (parseInt(document.getElementById("red-sec").value) || 0);
    const d = (parseInt(document.getElementById("dq-min").value) || 0) * 60
            + (parseInt(document.getElementById("dq-sec").value) || 0);

    thresholds = { green: g, yellow: y, red: r, dq: d };

    // Auto-switch to Custom preset if user edits thresholds manually
    if (currentPreset !== "Custom") {
        currentPreset = "Custom";
        renderPresets();
    }

    updateAll();
}

// ─── Preset Management ──────────────────────────────────────────────

/** Renders the preset radio buttons in the sidebar */
function renderPresets() {
    const group = document.getElementById("presetGroup");
    group.innerHTML = "";

    Object.keys(PRESETS).forEach(p => {
        const label = document.createElement("label");
        label.className = p === currentPreset ? "active" : "";
        label.onclick = () => selectPreset(p);

        const checkedClass = p === currentPreset ? "checked" : "";
        label.innerHTML = `
            <div class="radio-dot ${checkedClass}">
                <div class="radio-dot-inner"></div>
            </div>
            ${p}`;

        group.appendChild(label);
    });

    // Show custom category dropdown only when "Custom" preset is active
    const customGroup = document.getElementById("customCategoryGroup");
    customGroup.style.display = currentPreset === "Custom" ? "" : "none";
}

/** Selects a preset and applies its thresholds */
function selectPreset(p) {
    currentPreset = p;
    thresholds = { ...PRESETS[p] };
    setThresholdInputs();
    renderPresets();
    updateAll();
}

// ─── Timer Controls ─────────────────────────────────────────────────

/** Starts the timer (no-op if already running) */
function startTimer() {
    if (running) return;

    running = true;
    startTime = Date.now();
    elapsedAtStart = elapsed;

    timerInterval = setInterval(() => {
        const delta = Math.floor((Date.now() - startTime) / 1000);
        elapsed = elapsedAtStart + delta;
        updateAll();
    }, 100);

    updateSaveButtons();
}

/** Pauses the timer */
function pauseTimer() {
    running = false;
    clearInterval(timerInterval);
    updateAll();
}

/** Resets the timer back to 00:00 */
function resetTimer() {
    running = false;
    clearInterval(timerInterval);
    elapsed = 0;
    updateAll();
}

/** Toggles hiding/showing the timer display */
function toggleHide() {
    hideTimer = !hideTimer;
    document.getElementById("btnToggle").textContent = hideTimer ? "👁 Show" : "🙈 Hide";
    updateAll();
}

/** Saves the current time to the appropriate category */
function saveTime() {
    const category = currentPreset === "Custom"
        ? document.getElementById("customCategory").value
        : PRESET_TO_CATEGORY[currentPreset];

    const nameInput = document.getElementById("speakerName");
    const name = nameInput.value.trim() || `Speaker ${savedTimes[category].length + 1}`;

    savedTimes[category].push({ name, seconds: elapsed });

    // Show confirmation message
    const msg = document.getElementById("saveMessage");
    msg.textContent = `Saved ${name}: ${fmt(elapsed)} to ${category}`;
    msg.classList.remove("hidden");
    setTimeout(() => msg.classList.add("hidden"), 3000);

    // Reset timer for next speaker
    elapsed = 0;
    running = false;
    clearInterval(timerInterval);
    nameInput.value = "";
    updateAll();
}

// ─── Display Window ─────────────────────────────────────────────────

/** Opens (or focuses) the secondary display window for projectors */
function openDisplayWindow() {
    if (displayWindow && !displayWindow.closed) {
        displayWindow.focus();
        return;
    }

    displayWindow = window.open("", "TMDisplay", "width=800,height=1000");
    displayWindow.document.write(getDisplayHTML());
    displayWindow.document.close();
}

/** Generates the full HTML for the display window */
function getDisplayHTML() {
    // Compute base URL so relative image paths resolve correctly
    const baseURL = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Toastmasters Timer — Display</title>
    <base href="${baseURL}">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Montserrat', sans-serif;
            background: #004165;
            color: #fff;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            overflow: hidden;
        }
        #speaker {
            font-size: 48px;
            font-weight: 700;
            color: #F2A900;
            margin-bottom: 40px;
            min-height: 58px;
            letter-spacing: 0.5px;
            text-align: center;
        }
        #card {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
            width: 100%;
        }
        #card img {
            max-width: 90vw;
            max-height: 70vh;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
            object-fit: contain;
        }
        .watermark {
            position: fixed;
            bottom: 20px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.15);
            letter-spacing: 1px;
        }
    </style>
</head>
<body>
    <div id="speaker"></div>
    <div id="card"></div>
    <div class="watermark">Where to start, Where to break and let go. Where to change where to look and to grow</div>

    <script>
        const images = {
            green:  "green.jpg",
            yellow: "yellow.jpg",
            red:    "red.jpg",
            dq:     "red.jpg"
        };

        const channel = new BroadcastChannel("toastmasters-timer");

        channel.onmessage = (e) => {
            const { elapsed, thresholds, speakerName } = e.data;

            // Speaker name
            document.getElementById("speaker").textContent = speakerName || "";

            // Determine which card to show
            const cardEl = document.getElementById("card");
            let stage = null;

            if (elapsed >= thresholds.dq)          stage = "dq";
            else if (elapsed >= thresholds.red)    stage = "red";
            else if (elapsed >= thresholds.yellow) stage = "yellow";
            else if (elapsed >= thresholds.green)  stage = "green";

            if (stage) {
                cardEl.innerHTML = '<img src="' + images[stage] + '" alt="' + stage + ' card">';
            } else {
                cardEl.innerHTML = '';
            }
        };
    <\/script>
</body>
</html>`;
}

// ─── Page Navigation ────────────────────────────────────────────────

/** Switches between Timer, Results, and About pages */
function switchPage(p) {
    document.querySelectorAll(".page").forEach(el => el.classList.remove("active"));
    document.getElementById("page-" + p).classList.add("active");

    // Swap sidebar content based on active page
    document.getElementById("sidebarTimer").style.display = p === "timer" ? "" : "none";
    document.getElementById("sidebarResults").style.display = p === "results" ? "" : "none";

    if (p === "results") {
        selectedResultsCategory = "All";
        renderResultsCategoryGroup();
        renderResults();
    }

    closeSidebar();
}

// ─── Results Page ───────────────────────────────────────────────────

let selectedResultsCategory = "All";

/** Renders the category filter radio buttons in the results sidebar */
function renderResultsCategoryGroup() {
    const group = document.getElementById("resultsCategoryGroup");
    group.innerHTML = "";

    const options = ["All", ...CATEGORIES];

    options.forEach(cat => {
        const label = document.createElement("label");
        label.className = cat === selectedResultsCategory ? "active" : "";
        label.onclick = () => {
            selectedResultsCategory = cat;
            renderResultsCategoryGroup();
            renderResults();
        };

        const checkedClass = cat === selectedResultsCategory ? "checked" : "";
        label.innerHTML = `
            <div class="radio-dot ${checkedClass}">
                <div class="radio-dot-inner"></div>
            </div>
            ${cat}`;

        group.appendChild(label);
    });
}

/** Renders the results tables, filtered by selected category */
function renderResults() {
    const container = document.getElementById("resultsContent");
    const categoriesToShow = selectedResultsCategory === "All"
        ? CATEGORIES
        : [selectedResultsCategory];

    const hasAny = categoriesToShow.some(c => savedTimes[c].length > 0);

    if (!hasAny) {
        const msg = selectedResultsCategory === "All"
            ? "No saved times yet. Go to Timer page and save some times!"
            : `No saved times for ${selectedResultsCategory} yet.`;
        container.innerHTML = `<div class="no-results">${msg}</div>`;
        document.getElementById("clearSection").style.display = "none";
        return;
    }

    let html = "";

    categoriesToShow.forEach(cat => {
        const times = savedTimes[cat];
        if (times.length === 0) return;

        const th = CATEGORY_THRESHOLDS[cat];

        html += `<div class="category-section">
            <h2>${cat}</h2>
            <table class="results-table">
                <thead>
                    <tr>
                        <th style="width:60px">Status</th>
                        <th>Name</th>
                        <th style="width:100px;text-align:right">Time</th>
                    </tr>
                </thead>
                <tbody>`;

        times.forEach(entry => {
            html += `<tr>
                <td>${getStatusEmoji(entry.seconds, th)}</td>
                <td>${entry.name}</td>
                <td style="text-align:right;font-variant-numeric:tabular-nums;font-weight:600;">
                    ${fmt(entry.seconds)}
                </td>
            </tr>`;
        });

        html += `</tbody></table></div>`;
    });

    container.innerHTML = html;
    document.getElementById("clearSection").style.display = "";
}

/** Clears saved times for a single category */
function clearCategory() {
    const cat = document.getElementById("clearCatSelect").value;
    savedTimes[cat] = [];
    renderResults();
}

/** Clears all saved times across all categories */
function clearAll() {
    savedTimes = { "Table Topics": [], "Evaluation": [], "Speech": [] };
    renderResults();
}

// ─── Mobile Sidebar ─────────────────────────────────────────────────

/** Toggles the mobile sidebar open/closed */
function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("open");
    document.getElementById("sidebarOverlay").classList.toggle("active");
}

/** Closes the mobile sidebar */
function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("active");
}

// ─── Initialization ─────────────────────────────────────────────────

renderPresets();
setThresholdInputs();
updateAll();
