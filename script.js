/* OPTIONAL IMPROVEMENT 4: Prevent horizontal swipe on mobile */
if (window.innerWidth <= 768) {
    document.body.style.overscrollBehaviorX = "none";
}
/* =============================== CONFIGURATION ================================ */
// ⚠️ REPLACE WITH YOUR ACTUAL FIREBASE CONFIG KEYS
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    appId: "YOUR_APP_ID"
};

// =============================== MOCK DB (For Demo Only) ================================
const MOCK_USERS = {
    "student@test.com": { role: "Student" },
    "faculty@test.com": { role: "Faculty" },
    "admin@test.com": { role: "Admin" }
};

// MOCK ROOM DATA
const ROOMS = [
    { id: "A-101", capacity: 60, features: ["Projector"] },
    { id: "A-102", capacity: 60, features: ["Projector"] },
    { id: "B-201", capacity: 45, features: ["Smartboard"] },
    { id: "L-301", capacity: 30, features: ["Computers"] } // Lab
];

// =============================== TIMETABLE DATA ================================

const DEFAULT_SCHEDULE_DATA = {
    "Monday": {
        "8": { subject: "Java", room: "ICT 201", type: "Lecture" },
        "9": { subject: "DBMS", room: "ICT 201", type: "Lecture" },
        "10": { subject: "OS", room: "ICT 201", type: "Lecture" },
        "13": { subject: "Java Lab", room: "LAB 2", type: "Lab" },
        "14": { subject: "Mentoring", room: "ICT 101", type: "Lecture" }
    },
    "Tuesday": {
        "8": { subject: "Maths", room: "ICT 302", type: "Lecture" },
        "9": { subject: "DBMS", room: "ICT 302", type: "Lecture" },
        "10": { subject: "OS", room: "ICT 302", type: "Lecture" },
        "11": { subject: "AI", room: "ICT 302", type: "Lecture" },
        "14": { subject: "AI", room: "ICT 105", type: "Lecture" }
    },
    "Wednesday": {
        "8": { subject: "Java", room: "ICT 423", type: "Lecture" },
        "9": { subject: "Java", room: "ICT 423", type: "Lecture" },
        "10": { subject: "DBMS", room: "ICT 201", type: "Lecture" },
        "13": { subject: "OS", room: "ICT 201", type: "Lecture" },
        "15": { subject: "Project", room: "Lab", type: "Lab" }
    },
    "Thursday": {
        "9": { subject: "AI", room: "ICT 415", type: "Lecture" },
        "10": { subject: "Maths", room: "ICT 415", type: "Lecture" },
        "11": { subject: "OS", room: "ICT 415", type: "Lecture" },
        "13": { subject: "DBMS", room: "ICT 201", type: "Lecture" }
    },
    "Friday": {
        "8": { subject: "OS", room: "ICT 302", type: "Lecture" },
        "9": { subject: "Java", room: "ICT 302", type: "Lecture" },
        "10": { subject: "AI", room: "ICT 302", type: "Lecture" },
        "14": { subject: "Maths", room: "ICT 101", type: "Lecture" }
    },
    "Saturday": {
        "9": { subject: "Project", room: "Lab", type: "Lab" },
        "10": { subject: "Project", room: "Lab", type: "Lab" },
        "13": { subject: "Mentoring", room: "Cabin", type: "Meeting" }
    }
};

const DEFAULT_TIMETABLE = {
    "Default": DEFAULT_SCHEDULE_DATA,
    "Set 1": JSON.parse(JSON.stringify(DEFAULT_SCHEDULE_DATA)),
    "Set 2": {}
};

function initializeTimetable() {
    if (!localStorage.getItem("master_timetable")) {
        localStorage.setItem("master_timetable", JSON.stringify(DEFAULT_TIMETABLE));
    }
}

function getTimetableData() {
    // Returns the entire Set Map
    return JSON.parse(localStorage.getItem("master_timetable")) || DEFAULT_TIMETABLE;
}

function getTimetableSet(setName) {
    const master = getTimetableData();
    return master[setName] || master["Default"] || {};
}

function updateTimetableSlot(day, time, subject, room, setName = "Default") {
    const master = getTimetableData();

    if (!master[setName]) master[setName] = {};
    if (!master[setName][day]) master[setName][day] = {};

    if (subject === "") {
        delete master[setName][day][time]; // Clear slot
    } else {
        master[setName][day][time] = { subject, room, type: "Lecture" };
    }

    localStorage.setItem("master_timetable", JSON.stringify(master));
    return true;
}

function createNewSet() {
    const name = prompt("Enter Name for New Set (e.g. 'Batch A'):");
    if (!name) return;

    const master = getTimetableData();
    if (master[name]) {
        alert("Set name already exists!");
        return;
    }

    // Initialize with copy of default or empty? Let's do copy of Default for convenience
    master[name] = JSON.parse(JSON.stringify(master["Default"] || {}));
    localStorage.setItem("master_timetable", JSON.stringify(master));

    // Update UI dropdowns
    updateSetDropdowns();
    alert(`Set '${name}' created!`);
}

function updateSetDropdowns() {
    const master = getTimetableData();
    const sets = Object.keys(master);

    // Update Admin Editor Dropdown
    const ttSet = document.getElementById("ttSet");
    if (ttSet) {
        const currentVal = ttSet.value;
        ttSet.innerHTML = sets.map(s => `<option value="${s}">${s}</option>`).join("");
        if (sets.includes(currentVal)) ttSet.value = currentVal;
    }

    // Update New User Dropdown
    const userSet = document.getElementById("newUserSet");
    if (userSet) {
        userSet.innerHTML = sets.map(s => `<option value="${s}">${s}</option>`).join("");
    }
}

// Check if Firebase is configured
let isFirebaseConfigured = false;
let auth, db;

try {
    // Basic check to see if keys are placeholders
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        isFirebaseConfigured = true;
    } else {
        console.warn("⚠️ Firebase is not configured. Running in Demo Mode with Mock Data.");
    }
} catch (e) {
    console.warn("Firebase Init Error:", e);
}


/* =============================== LOGIN LOGIC ================================ */
function openLoginModal() {
    const modal = document.getElementById("loginModal");
    if (modal) modal.classList.add("active");
}

function closeLoginModal() {
    const modal = document.getElementById("loginModal");
    if (modal) modal.classList.remove("active");
}

function emailLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Enter email and password");
        return;
    }

    if (isFirebaseConfigured) {
        // 1️⃣ Firebase Authentication
        auth.signInWithEmailAndPassword(email, password)
            .then(userCred => {
                const userEmail = userCred.user.email;
                // 2️⃣ Firestore role lookup
                return db.collection("users").doc(userEmail).get();
            })
            .then(doc => {
                if (!doc.exists) {
                    alert("No role assigned. Contact admin.");
                    auth.signOut();
                    return;
                }
                const role = doc.data().role;
                completeLogin(role, doc.id);
            })
            .catch(err => alert(err.message));
    } else {
        // 🚨 MOCK LOGIN (Fallback)
        updateLoginMock(); // Ensure latest users are loaded
        console.log("Attempting mock login for:", email);
        if (MOCK_USERS[email]) {
            completeLogin(MOCK_USERS[email].role, email);
        } else {
            alert("Invalid Credentials. Try student@test.com");
        }
    }
}

function completeLogin(role, userId) {
    localStorage.setItem("role", role);
    localStorage.setItem("user", userId);

    closeLoginModal();
    // Show shark loader
    const loader = document.getElementById("sharkLoader");
    if (loader) loader.classList.add("visible");

    setTimeout(() => {
        if (role === "Student") location.href = "student.html";
        else if (role === "Faculty") location.href = "faculty.html";
        else if (role === "Admin") location.href = "admin.html";
    }, 1500);
}

function logout() {
    if (isFirebaseConfigured && auth) {
        auth.signOut().then(() => {
            clearSession();
        });
    } else {
        clearSession();
    }
}

function clearSession() {
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    // Keep 'theme', 'admin_faculty', 'admin_students' so data persists
    location.href = "index.html";
}

// --- SIGN UP LOGIC ---
function openSignUpModal() {
    closeLoginModal();
    const modal = document.getElementById("signUpModal");
    if (modal) modal.classList.add("active");
}

function closeSignUpModal() {
    const modal = document.getElementById("signUpModal");
    if (modal) modal.classList.remove("active");
}

function openLoginModalFromSignUp() {
    closeSignUpModal();
    openLoginModal();
}

function toggleRegFields() {
    const role = document.getElementById("regRole").value;
    const extraField = document.getElementById("regExtraField");
    const infoInput = document.getElementById("regInfo");

    if (role === "Student") {
        extraField.style.display = "block";
        infoInput.placeholder = "Course (e.g., B.Tech CSE)";
    } else if (role === "Faculty") {
        extraField.style.display = "block";
        infoInput.placeholder = "Department (e.g., Computer Science)";
    } else {
        extraField.style.display = "none";
    }
}

function registerUser() {
    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const role = document.getElementById("regRole").value;
    const info = document.getElementById("regInfo").value;

    if (!name || !email || !password || !role || !info) {
        alert("Please fill all fields.");
        return;
    }

    // Generate simulated ID
    const prefix = role === "Student" ? "S-" : "F-";
    const randomId = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    const id = prefix + randomId;

    // Check if user exists in mock
    updateLoginMock(); // ensure latest loaded
    if (MOCK_USERS[email]) {
        alert("User already exists with this email.");
        return;
    }

    // Add to LocalStorage admin lists (so they appear in Admin Panel)
    const storageKey = role === "Student" ? "admin_students" : "admin_faculty";
    const users = JSON.parse(localStorage.getItem(storageKey)) || [];

    const newUser = role === "Student"
        ? { id, name, email, course: info, timetableSet: "Pending" }
        : { id, name, email, dept: info };

    users.push(newUser);
    localStorage.setItem(storageKey, JSON.stringify(users));

    // Update global mock for login
    updateLoginMock();

    alert(`Account created successfully! Your ID is: ${id}`);

    // Auto Login
    completeLogin(role, email);
}


/* =============================== SHARED REDIRECT ================================ */
// Redirect if already logged in (only on index.html)
const currentPath = location.pathname;
const role = localStorage.getItem("role");

if (role && (currentPath.endsWith("index.html") || currentPath === "/" || currentPath.endsWith("/"))) {
    if (role === "Student") location.href = "student.html";
    if (role === "Faculty") location.href = "faculty.html";
    if (role === "Admin") location.href = "admin.html";
}

// Role Protection
if (currentPath.includes("student.html") && role !== "Student") location.href = "index.html";
if (currentPath.includes("faculty.html") && role !== "Faculty") location.href = "index.html";
if (currentPath.includes("admin.html") && role !== "Admin") location.href = "index.html";


/* =============================== UI/THEME ================================ */

/* Theme toggle removed */

function goHome() {
    // If Admin Page and managing TT, revert to dashboard
    const ttSection = document.getElementById("ttManagementSection");
    if (ttSection && ttSection.style.display !== 'none') {
        // Hide TT Section
        ttSection.style.display = 'none';

        // Show Dashboard Cards
        const cards = document.querySelectorAll('.cards-container .card, .cards-container .glass-panel');
        cards.forEach(c => {
            if (!c.closest('#ttManagementSection')) {
                c.style.display = 'block'; // Or flex/grid depending on CSS, but block usually works for cards
            }
        });

        // Reset Nav
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const homeLink = Array.from(document.querySelectorAll('.nav-link')).find(l => l.innerHTML.includes('🏠'));
        if (homeLink) homeLink.classList.add('active');

        return;
    }

    // Default behavior for other pages or if already on dashboard
    window.location.href = "index.html";
}


/* =============================== STUDENT DASHBOARD LOGIC ================================ */

function loadStudentNotifications() {
    // ... existing logic ...
}

function highlightTableRows(day, hour, minute) {
    // Clear previous
    document.querySelectorAll(".current-class").forEach(el => el.classList.remove("current-class"));

    // Find the cell corresponding to current active class
    // Only highlight if it IS the class time (minute < 50)
    if (minute >= 50) return;

    document.querySelectorAll("#studentTimetable tbody tr").forEach(row => {
        if (row.dataset.day === day) {
            row.querySelectorAll(`td[data-time='${hour}']`).forEach(cell => {
                // Check if cell has content (not empty dash)
                if (cell.innerText.trim() !== "—") {
                    cell.classList.add("current-class");
                }
            });
        }
    });
}

// Start the clock loop
setInterval(updateDashboardStatus, 60000); // Update every minute
// Initial call (will be called by script load, but let's ensure it runs after DOM content too)
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(updateDashboardStatus, 1000);
});




/* =============================== FACULTY DASHBOARD LOGIC ================================ */
let facultyCurrentCell = null;

// Merged Logic: Handles both Student and Faculty Status Updates
function updateDashboardStatus() {
    const studentBox = document.getElementById("currentClassBox");
    const facultyBox = document.getElementById("facultyCurrentClass");

    if (!studentBox && !facultyBox) return;

    const isFaculty = !!facultyBox;
    const box = isFaculty ? facultyBox : studentBox;

    // 1. Determine Timetable Set
    let setName = "Default";
    const userRole = localStorage.getItem("role");
    const userEmail = localStorage.getItem("user");

    if (!isFaculty && userRole === "Student" && userEmail) { // Student Specifc Set
        const students = JSON.parse(localStorage.getItem("admin_students")) || [];
        const student = students.find(s => s.email === userEmail);
        if (student && student.timetableSet) {
            setName = student.timetableSet;
        }
    }
    // Faculty currently sees "Default" (based on existing renderTimetable logic)
    // Future: Could lookup faculty specific schedule here if implemented.

    const master = JSON.parse(localStorage.getItem("master_timetable")) || {};
    const timetable = master[setName] || master["Default"] || {};

    // 2. Get Current Time
    const now = new Date();
    const day = now.toLocaleString("en-US", { weekday: "long" });
    const hour = now.getHours();
    const minute = now.getMinutes();

    const dayData = timetable[day] || {};

    let statusText = isFaculty ? "No active session" : "🎉 No class right now";
    let statusColor = "var(--text-muted)";

    // Clear previous faculty cell reference
    if (isFaculty) facultyCurrentCell = null;

    // 3. CHECK CURRENT (Min 0-49)
    if (dayData[hour] && minute < 50) {
        const cls = dayData[hour];
        // NEW TEXT FORMAT: "Subject (Room)" (No prefix)
        statusText = `${cls.subject} (${cls.room})`;
        statusColor = "var(--accent-color)";
    }
    // 4. CHECK NEXT (Approaching within 10 mins)
    else {
        // Look ahead logic
        const startTimes = [8, 9, 10, 11, 13, 14, 15];
        let upcomingClass = null;

        for (let startH of startTimes) {
            const diff = (startH * 60) - (hour * 60 + minute);

            // Within 10 mins
            if (diff > 0 && diff <= 10) {
                if (dayData[startH]) {
                    upcomingClass = { ...dayData[startH], time: startH };
                    break;
                }
            }
        }

        if (upcomingClass) {
            statusText = `Next: ${upcomingClass.subject} (${upcomingClass.room})`;
            statusColor = "#f59e0b"; // Warning/Pending
        }
    }

    // 5. Update UI
    box.innerText = statusText;
    box.style.color = statusColor;

    // 6. Highlight Table Logic & Update Faculty Cell Global
    highlightTableRows(day, hour, minute, isFaculty);
}

function highlightTableRows(day, hour, minute, isFaculty) {
    // Clear previous
    document.querySelectorAll(".current-class").forEach(el => el.classList.remove("current-class"));

    // Only highlight if properly in session (Minute 0-50)
    if (minute >= 50) return;

    const tableId = isFaculty ? "facultyTimetable" : "studentTimetable";

    document.querySelectorAll(`#${tableId} tbody tr`).forEach(row => {
        if (row.dataset.day === day) {
            row.querySelectorAll(`td[data-time='${hour}']`).forEach(cell => {
                if (cell.innerText.trim() !== "—") {
                    cell.classList.add("current-class");
                    // Update global for faculty actions
                    if (isFaculty) facultyCurrentCell = cell;
                }
            });
        }
    });
}


function markCompleted() {
    if (!facultyCurrentCell) {
        alert("No active class right now.");
        return;
    }
    facultyCurrentCell.style.background = "#bbf7d0";
    facultyCurrentCell.style.color = "#000";
    alert("Class marked as completed.");
}

function markAbsent() {
    const now = new Date();
    const day = now.toLocaleString("en-US", { weekday: "long" });
    const hour = now.getHours();

    const status = JSON.parse(localStorage.getItem("classStatus")) || {};
    // Key format: "Monday-10"
    status[`${day}-${hour}`] = "cancelled";
    localStorage.setItem("classStatus", JSON.stringify(status));

    addNotification("Class cancelled due to faculty absence.");
    alert("Class marked as cancelled.");

    // Refresh visual state if needed
    location.reload();
}

// --- NEW: SLOT TRANSFER LOGIC ---
function openTransferModal() {
    const modal = document.getElementById("transferModal");
    if (modal) modal.classList.add("active");
}

function closeTransferModal() {
    const modal = document.getElementById("transferModal");
    if (modal) modal.classList.remove("active");
}

function confirmTransfer() {
    const faculty = document.getElementById("transferFaculty").value;
    const reason = document.getElementById("transferReason").value;

    if (!faculty || !reason) {
        alert("Please select a colleague and provide a reason.");
        return;
    }

    addNotification(`Your slot has been transferred to ${faculty}. Reason: ${reason}`);
    alert(`Transfer request sent to ${faculty} successfully!`);
    closeTransferModal();
}


/* =============================== ADMIN LOGIC ================================ */
// Mock storage for files
let uploadedFiles = [
    { name: "S1_Data.csv", date: "2024-12-20", size: "45 KB" },
    { name: "Faculty_List.csv", date: "2024-12-18", size: "12 KB" }
];

function uploadDataset() {
    const fileInput = document.getElementById("datasetUpload");
    const status = document.getElementById("uploadStatus");

    if (!fileInput || !fileInput.files.length) {
        if (status) status.innerText = "❌ Please select a CSV file.";
        return;
    }

    const file = fileInput.files[0];
    if (status) status.innerText = `✅ ${file.name} uploaded successfully.`;

    // Add to mock list
    uploadedFiles.unshift({
        name: file.name,
        date: new Date().toISOString().split('T')[0],
        size: (file.size / 1024).toFixed(1) + " KB"
    });

    renderUploadedFiles();
}

function renderUploadedFiles() {
    const list = document.getElementById("fileList");
    if (!list) return;

    if (uploadedFiles.length === 0) {
        list.innerHTML = '<li style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; color: var(--text-muted); text-align: center;">No files uploaded yet.</li>';
        return;
    }

    list.innerHTML = uploadedFiles.map(file => `
        <li style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.2rem;">📄</span>
                <div>
                    <div style="font-weight: 500; color: white;">${file.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${file.date} • ${file.size}</div>
                </div>
            </div>
            <button style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.1rem; padding: 5px;" onclick="deleteFile('${file.name}')">🗑</button>
        </li>
    `).join("");
}

function deleteFile(fileName) {
    if (confirm(`Delete ${fileName}?`)) {
        uploadedFiles = uploadedFiles.filter(f => f.name !== fileName);
        renderUploadedFiles();
    }
}



function resolveVulnerable() {
    // Mock AI optimization
    alert("AI Optimization Started...\n\n- Detected 2 conflicts.\n- Moved CS-101 to Room B-201.\n- Resolved overlap for Dr. Smith.");
    addNotification("System auto-resolved schedule vulnerabilities.");
}

function overrideAI() {
    const confirmOverride = confirm("Are you sure you want to force an override? This may create new conflicts.");
    if (confirmOverride) {
        addNotification("Admin overrode AI timetable decision.");
        alert("AI decision overridden. Manual control enabled.");
    }
}

// --- NEW: ROOM SEARCH LOGIC ---
function searchRooms() {
    const day = document.getElementById("searchDay").value;
    const time = document.getElementById("searchTime").value;
    const resultsDiv = document.getElementById("roomSearchResults");

    if (!resultsDiv) return;

    // Simulate search delay
    resultsDiv.style.display = "block";
    resultsDiv.innerHTML = "<p style='color:white;'>Searching database...</p>";

    setTimeout(() => {
        // Simple mock availability: Randomly hide 1 room
        const availableRooms = ROOMS.filter(() => Math.random() > 0.3);

        if (availableRooms.length === 0) {
            resultsDiv.innerHTML = "<p style='color:#ef4444;'>No rooms available for this slot!</p>";
            return;
        }

        let html = `<p style="color:#a78bfa; margin-bottom:8px;">Available Rooms for ${day} @ ${time}:00</p><ul style="list-style:none; padding:0;">`;
        availableRooms.forEach(room => {
            html += `<li style="background:rgba(255,255,255,0.1); margin-bottom:5px; padding:8px; border-radius:6px; display:flex; justify-content:space-between;">
                        <span><strong>${room.id}</strong> <small>(${room.capacity} cap)</small></span>
                        <span style="font-size:0.8rem; background:#4f46e5; padding:2px 6px; border-radius:4px;">${room.features[0]}</span>
                     </li>`;
        });
        html += "</ul>";
        resultsDiv.innerHTML = html;
    }, 800);
}


/* =============================== SHARED UTILS ================================ */
function addNotification(message) {
    const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
    notifications.unshift({
        message,
        time: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString()
    });
    localStorage.setItem("notifications", JSON.stringify(notifications));
}

// --- TIMETABLE RENDERING ---
function renderTimetable(tableId, viewType = 'full') {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;

    // Determine which Set to render
    let setName = "Default";

    // IF STUDENT: View their assigned set
    const userRole = localStorage.getItem("role");
    const userEmail = localStorage.getItem("user");

    if (userRole === "Student" && userEmail) {
        // Try to find in MOCK_USERS first? Or admin_students localstorage?
        // We really should unify this. Let's check admin_students first as that's where we add new ones.
        const students = JSON.parse(localStorage.getItem("admin_students")) || [];
        const student = students.find(s => s.email === userEmail);
        if (student && student.timetableSet) {
            setName = student.timetableSet;
        }
    }
    // IF ADMIN: View selected set from dropdown (if on admin page)
    else if (document.getElementById("ttSet")) {
        setName = document.getElementById("ttSet").value;
    }

    const timetable = getTimetableSet(setName);

    const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let daysToRender = allDays;

    if (viewType === 'today') {
        const todayIndex = new Date().getDay(); // 0=Sun, 1=Mon...

        if (todayIndex === 0) {
            // Sunday
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 3rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🏖️</div>
                        <h3 style="color: var(--text-main); margin-bottom: 0.5rem;">It's Sunday!</h3>
                        <p style="color: var(--text-muted);">No classes today. Enjoy your holiday.</p>
                    </td>
                </tr>
            `;
            return;
        }

        const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][todayIndex];
        daysToRender = [dayName];
    }

    // Structure: <tr> <td>Day</td> <td time=8>...</td> <td time=9>...</td> </tr>

    let html = "";
    daysToRender.forEach(day => {
        const dayData = timetable[day] || {};

        let rowHtml = `<tr data-day="${day}">`;

        // Day Cell
        rowHtml += `<td><span class="badge badge-purple">${day}</span></td>`;

        // Time Cells: 8, 9, 10, 11, 13 (1PM), 14 (2PM), 15 (3PM)
        const times = [8, 9, 10, 11, 13, 14, 15];

        times.forEach(time => {
            const slot = dayData[time];
            const timeStr = time > 12 ? (time - 12) + ":00" : time + ":00";

            if (slot) {
                rowHtml += `<td data-time="${time}">
                    <span class="mobile-time">${timeStr}</span>
                    <div class="slot-data">
                        <span class="slot-subject">${slot.subject}</span>
                        <span class="slot-room">${slot.room || ''}</span>
                    </div>
                </td>`;
            } else {
                rowHtml += `<td data-time="${time}" style="color: var(--text-muted);">
                    <span class="mobile-time">${timeStr}</span>
                    <div class="slot-data" style="justify-content: flex-end;">
                        ―
                    </div>
                </td>`;
            }
        });

        rowHtml += "</tr>";
        html += rowHtml;
    });

    tbody.innerHTML = html;

    // Re-apply highlights after render
    if (tableId.includes("student")) applyClassHighlights(tableId);
}

function applyClassHighlights(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const status = JSON.parse(localStorage.getItem("classStatus")) || {};

    document.querySelectorAll(`#${tableId} td[data-time]`).forEach(cell => {
        const row = cell.parentElement;
        if (!row.dataset.day) return;

        const key = `${row.dataset.day}-${cell.dataset.time}`;

        if (status[key] === "cancelled") {
            cell.classList.add("cancelled-class");
            cell.innerHTML = "<span style='text-decoration: line-through; opacity: 0.7;'>" + cell.innerText + "</span><br><span style='color: #ef4444; font-weight: bold;'>CANCELLED</span>";
            cell.style.background = "rgba(239, 68, 68, 0.15)";
        }
    });
}


// --- ADMIN TIMETABLE EDITOR ---
function initAdminTimetableEditor() {
    updateSetDropdowns(); // populate from storage
    loadTimetableSlotInfo();
}

function loadTimetableSlotInfo() {
    const day = document.getElementById("ttDay").value;
    const time = document.getElementById("ttTime").value;
    const setName = document.getElementById("ttSet").value; // Pick selected set

    const timetable = getTimetableSet(setName);
    const statusDiv = document.getElementById("ttCurrentStatus");

    // Clear inputs first
    document.getElementById("ttSubject").value = "";
    document.getElementById("ttRoom").value = "";

    if (timetable[day] && timetable[day][time]) {
        const slot = timetable[day][time];
        statusDiv.innerHTML = `<strong>${slot.subject}</strong> <span style="opacity:0.7">(${slot.room})</span>`;
        // Pre-fill inputs
        document.getElementById("ttSubject").value = slot.subject;
        document.getElementById("ttRoom").value = slot.room;
    } else {
        statusDiv.innerHTML = "<span style='opacity:0.5'>Empty Slot</span>";
    }
}

function saveTimetableSlot() {
    const day = document.getElementById("ttDay").value;
    const time = document.getElementById("ttTime").value;
    const subject = document.getElementById("ttSubject").value;
    const room = document.getElementById("ttRoom").value;
    const setName = document.getElementById("ttSet").value; // Pick selected set

    if (!subject || !room) {
        alert("Please enter both Subject and Room.");
        return;
    }

    updateTimetableSlot(day, time, subject, room, setName);
    loadTimetableSlotInfo(); // Refresh display
    if (typeof renderClassDensityGraph === 'function') renderClassDensityGraph();
    alert(`Updated ${day} @ ${time}:00 successfully.`);
}

function clearTimetableSlot() {
    const day = document.getElementById("ttDay").value;
    const time = document.getElementById("ttTime").value;
    const setName = document.getElementById("ttSet").value;

    if (confirm(`Clear schedule for ${day} @ ${time}:00 in ${setName}?`)) {
        updateTimetableSlot(day, time, "", "", setName);
        loadTimetableSlotInfo();
        if (typeof renderClassDensityGraph === 'function') renderClassDensityGraph();
        alert("Slot cleared.");
    }
}

// --- DELETE SET LOGIC ---
function deleteSet() {
    const setName = document.getElementById("ttSet").value;

    if (setName === "Default") {
        alert("You cannot delete the Default Set.");
        return;
    }

    if (confirm(`Are you sure you want to PERMANENTLY DELETE "${setName}"?\n\nThis will remove all classes in this set and move assigned students back to Default.`)) {
        // 1. Remove from timetable data
        const timetable = JSON.parse(localStorage.getItem("master_timetable")) || {};
        if (timetable[setName]) {
            delete timetable[setName];
            localStorage.setItem("master_timetable", JSON.stringify(timetable));
        }

        // 2. Remove from Set Lists if custom stored? 
        // We rely on 'timetable' keys for dropdowns usually, but let's check updateSetDropdowns

        // 3. Reset Students
        const students = JSON.parse(localStorage.getItem("admin_students")) || [];
        let updatedCount = 0;
        students.forEach(s => {
            if (s.timetableSet === setName) {
                s.timetableSet = "Default";
                updatedCount++;
            }
        });
        localStorage.setItem("admin_students", JSON.stringify(students));

        // 4. Update UI
        alert(`Deleted "${setName}". merged ${updatedCount} students back to Default.`);
        updateSetDropdowns(); // Refresh dropdown
        // Reset selection to Default
        const dropdown = document.getElementById("ttSet");
        dropdown.value = "Default";
        loadTimetableSlotInfo();
    }
}




// --- BULK ASSIGNMENT LOGIC ---
function openAssignmentModal() {
    const setName = document.getElementById("ttSet").value;
    document.getElementById("assignModalTitle").innerText = `Assign Students to: ${setName}`;

    document.getElementById("assignmentModal").classList.add("active");

    renderAssignmentList(setName);
}

function closeAssignmentModal() {
    document.getElementById("assignmentModal").classList.remove("active");
}

function renderAssignmentList(setName) {
    const list = document.getElementById("assignStudentList");
    const students = JSON.parse(localStorage.getItem("admin_students")) || [];

    if (students.length === 0) {
        list.innerHTML = "<p style='text-align:center; color:gray;'>No students found.</p>";
        return;
    }

    list.innerHTML = students.map(s => {
        // Check if student belongs to THIS set
        const isAssigned = s.timetableSet === setName;
        const assignedText = s.timetableSet && s.timetableSet !== "Default" && s.timetableSet !== setName
            ? `<span style='font-size:0.75rem; color:#f59e0b; margin-left:5px;'>(Currently in ${s.timetableSet})</span>`
            : "";

        return `
        <li style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: space-between;">
            <div>
                <strong style="color: white;">${s.name}</strong> <span style="color: gray; font-size: 0.85rem;">(${s.id})</span>
                ${assignedText}
            </div>
            <input type="checkbox" class="assign-checkbox" value="${s.id}" ${isAssigned ? "checked" : ""} style="transform: scale(1.5);">
        </li>
        `;
    }).join("");
}

function filterAssignmentList() {
    const query = document.getElementById("assignSearch").value.toLowerCase();
    const items = document.querySelectorAll("#assignStudentList li");

    items.forEach(item => {
        const text = item.innerText.toLowerCase();
        item.style.display = text.includes(query) ? "flex" : "none";
    });
}

function saveAssignment() {
    const setName = document.getElementById("ttSet").value;
    const checkboxes = document.querySelectorAll(".assign-checkbox");
    let students = JSON.parse(localStorage.getItem("admin_students")) || [];
    let updatedCount = 0;

    checkboxes.forEach(cb => {
        const studentId = cb.value;
        const studentIndex = students.findIndex(s => s.id === studentId);

        if (studentIndex !== -1) {
            const student = students[studentIndex];

            if (cb.checked) {
                // If checked, assign to current set
                if (student.timetableSet !== setName) {
                    student.timetableSet = setName;
                    updatedCount++;
                }
            } else {
                // If unchecked AND was previously in this set, remove (set to Default)
                // If they were in a DIFFERENT set, don't touch them (unless the user explicitly checked them first, which is handled above)
                if (student.timetableSet === setName) {
                    student.timetableSet = "Default";
                    updatedCount++;
                }
            }
        }
    });

    localStorage.setItem("admin_students", JSON.stringify(students));
    updateLoginMock(); // ensure permissions updated

    // Also update the User Table UI if visible
    if (document.getElementById("studentListSection").style.display !== "none") {
        renderUserTable('student');
    }

    alert(`Updated assignments for ${updatedCount} students.`);
    closeAssignmentModal();
}


// --- GRAPH & CALCULATOR LOGIC ---

function openTTManagement() {
    // Hide standard cards
    const cards = document.querySelectorAll('.cards-container .card, .cards-container .glass-panel:not(#ttManagementSection .glass-panel)');
    cards.forEach(c => c.style.display = 'none');

    // Show TT Management section
    const section = document.getElementById("ttManagementSection");
    if (section) {
        section.style.display = 'block';
        renderClassDensityGraph();
    }

    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    // Find the icon with TT Management (tool icon) and make it active
    const ttLink = Array.from(document.querySelectorAll('.nav-link')).find(l => l.innerHTML.includes('🛠️'));
    if (ttLink) ttLink.classList.add('active');
}

function renderClassDensityGraph() {
    const container = document.getElementById("densityGraphContainer");
    if (!container) return;

    const timetable = getTimetableData();
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let max = 0;
    const counts = days.map(d => {
        const count = timetable[d] ? Object.keys(timetable[d]).length : 0;
        if (count > max) max = count;
        return count;
    });

    // Fallback if empty
    if (max === 0) max = 5;

    let html = "";
    counts.forEach((count, i) => {
        const heightPct = (count / max) * 100;
        const color = count >= 4 ? "#ef4444" : (count >= 2 ? "#f59e0b" : "#10b981"); // High, Med, Low

        html += `
            <div style="display: flex; flex-direction: column; align-items: center; width: 10%;">
                <div style="height: ${heightPct}%; width: 100%; background: ${color}; border-radius: 4px 4px 0 0; min-height: 4px; transition: height 0.5s;"></div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// SHARED CALCULATOR LOGIC
// SHARED CALCULATOR LOGIC
function performCalc(targetId, presentId, totalId, resultId, titleId, descId) {
    let R = parseFloat(document.getElementById(targetId).value);
    const P = parseFloat(document.getElementById(presentId).value);
    const T = parseFloat(document.getElementById(totalId).value);

    // Normalize R to percentage (e.g. 0.75 -> 75)
    if (R < 1) R = R * 100;

    const resultDiv = document.getElementById(resultId);
    const titleEl = document.getElementById(titleId);
    const descEl = document.getElementById(descId);

    // Validation
    if (isNaN(P) || isNaN(T) || P < 0 || T <= 0) {
        alert("Please enter valid positive numbers.");
        return;
    }
    if (P > T) {
        alert("Present classes cannot be greater than Total classes!");
        return;
    }

    const current = (P / T) * 100;
    resultDiv.style.display = "block";

    if (current >= R) {
        // CASE 1: Eligible - Calculate Bunkable Days
        // Formula: (100*P - R*T) / R
        const bunkDays = Math.floor((100 * P - R * T) / R);

        // Projected if bunked
        const newTotal = T + bunkDays;
        const newPct = (P / newTotal) * 100;

        titleEl.innerHTML = `✅ On Track!`;
        titleEl.style.color = "#10b981"; // Green
        descEl.innerHTML = `
            <strong>Current: ${current.toFixed(2)}%</strong><br>
            You can bunk <strong>${bunkDays}</strong> more classes.<br>
            <span style="font-size:0.85rem; opacity:0.8;">(Attendance will drop to ${newPct.toFixed(2)}%)</span>
        `;
    } else {
        // CASE 2: Shortfall - Calculate Needed Classes
        // Formula: (R*T - 100*P) / (100 - R)
        if (R >= 100) {
            // Impossible if R is 100 and current < 100, unless we can retake past? Assuming simple future model.
            titleEl.innerHTML = `❌ Impossible`;
            titleEl.style.color = "#ef4444";
            descEl.innerHTML = `You need 100% but have missed classes.`;
            return;
        }

        const needed = Math.ceil((R * T - 100 * P) / (100 - R));

        // Projected if attended
        const newPresent = P + needed;
        const newTotal = T + needed;
        const newPct = (newPresent / newTotal) * 100;

        titleEl.innerHTML = `⚠️ Action Needed`;
        titleEl.style.color = "#f59e0b"; // Warning Orange
        descEl.innerHTML = `
            <strong>Current: ${current.toFixed(2)}%</strong><br>
            You need to attend <strong>${needed}</strong> more classes.<br>
            <span style="font-size:0.85rem; opacity:0.8;">(Attendance will rise to ${newPct.toFixed(2)}%)</span>
        `;
    }
}

function calculateAttendance() {
    performCalc("calcTarget", "calcPresent", "calcTotal", "calcResult", "calcResultTitle", "calcResultDesc");
}

function calculateStudentAttendance() {
    performCalc("studCalcTarget", "studCalcPresent", "studCalcTotal", "studCalcResult", "studCalcResultTitle", "studCalcResultDesc");
}

function openStudentCalc() {
    document.getElementById("studentCalcModal").classList.add("active");
}

function closeStudentCalc() {
    document.getElementById("studentCalcModal").classList.remove("active");
}


// --- USER MANAGEMENT LOGIC ---
const DEFAULT_FACULTY = [
    { id: "F-101", name: "Prof. Smith", email: "faculty@test.com", dept: "Computer Science" },
    { id: "F-102", name: "Dr. Jones", email: "jones@test.com", dept: "OS" }
];

const DEFAULT_STUDENTS = [
    { id: "S-201", name: "John Doe", email: "student@test.com", course: "B.Tech CSE" },
    { id: "S-202", name: "Jane Doe", email: "jane@test.com", course: "B.Tech IT" }
];

function loadUsers() {
    if (!localStorage.getItem("admin_faculty")) {
        localStorage.setItem("admin_faculty", JSON.stringify(DEFAULT_FACULTY));
    }
    if (!localStorage.getItem("admin_students")) {
        localStorage.setItem("admin_students", JSON.stringify(DEFAULT_STUDENTS));
    }

    // Also update main login mock
    updateLoginMock();
}

function updateLoginMock() {
    const faculty = JSON.parse(localStorage.getItem("admin_faculty")) || [];
    const students = JSON.parse(localStorage.getItem("admin_students")) || [];

    // Mix them into the MOCK_USERS object used by login
    faculty.forEach(f => {
        MOCK_USERS[f.email] = { role: "Faculty", id: f.id };
    });
    students.forEach(s => {
        MOCK_USERS[s.email] = { role: "Student", id: s.id };
    });
}

function switchUserTab(type) {
    const fSection = document.getElementById("facultyListSection");
    const sSection = document.getElementById("studentListSection");
    const fBtn = document.getElementById("btnFaculty");
    const sBtn = document.getElementById("btnStudent");

    if (type === 'faculty') {
        fSection.style.display = "block";
        sSection.style.display = "none";
        fBtn.classList.add("active");
        fBtn.style.opacity = "1";
        fBtn.style.background = "linear-gradient(135deg, #8b5cf6, #7c3aed)";
        sBtn.classList.remove("active");
        sBtn.style.opacity = "0.6";
        sBtn.style.background = "transparent";
        renderUserTable('faculty');
    } else {
        fSection.style.display = "none";
        sSection.style.display = "block";
        fBtn.classList.remove("active");
        fBtn.style.opacity = "0.6";
        fBtn.style.background = "transparent";
        sBtn.classList.add("active");
        sBtn.style.opacity = "1";
        sBtn.style.background = "linear-gradient(135deg, #8b5cf6, #7c3aed)";
        renderUserTable('student');
    }
}

function renderUserTable(type) {
    const tbody = document.getElementById(type === 'faculty' ? "facultyTableBody" : "studentTableBody");
    const data = JSON.parse(localStorage.getItem(type === 'faculty' ? "admin_faculty" : "admin_students")) || [];

    if (!tbody) return;

    tbody.innerHTML = data.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${type === 'faculty' ? user.dept : user.course}</td>
            <td>${type === 'student' ? (user.timetableSet || "Default") : "—"}</td>
            <td>
                <button onclick="removeUser('${type}', '${user.id}')" style="background:none; border:none; cursor:pointer; color:#ef4444;">🗑</button>
            </td>
        </tr>
    `).join("");
}

function addNewUser() {
    const id = document.getElementById("newUserId").value;
    const name = document.getElementById("newUserName").value;
    const email = document.getElementById("newUserEmail").value;
    const info = document.getElementById("newUserDept").value; // Dept or Course

    if (!id || !name || !email || !info) {
        alert("Please fill all fields.");
        return;
    }

    // Determine type based on active tab
    const isFaculty = document.getElementById("facultyListSection").style.display !== "none";
    const type = isFaculty ? "faculty" : "student";
    const storageKey = isFaculty ? "admin_faculty" : "admin_students";

    const users = JSON.parse(localStorage.getItem(storageKey)) || [];

    // Check dupe
    if (users.some(u => u.id === id || u.email === email)) {
        alert("User with this ID or Email already exists!");
        return;
    }

    const newUser = isFaculty
        ? { id, name, email, dept: info }
        : { id, name, email, course: info };

    users.push(newUser);
    localStorage.setItem(storageKey, JSON.stringify(users));

    updateLoginMock(); // IMPORTANT: Update login capability
    renderUserTable(type);

    // Clear inputs
    document.getElementById("newUserId").value = "";
    document.getElementById("newUserName").value = "";
    document.getElementById("newUserEmail").value = "";
    document.getElementById("newUserDept").value = "";

    addNotification(`Added new ${type}: ${name}`);
}

function removeUser(type, id) {
    if (!confirm("Are you sure?")) return;

    const storageKey = type === 'faculty' ? "admin_faculty" : "admin_students";
    let users = JSON.parse(localStorage.getItem(storageKey)) || [];
    users = users.filter(u => u.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(users));

    updateLoginMock(); // Refresh login list
    renderUserTable(type);
}

/* =============================== FIRST TIME SETUP LOGIC ================================ */
let tempSetupData = {}; // Stores { Day: { Time: { subject, room } } }

function checkFirstTimeSetup() {
    // Only for students
    if (!location.pathname.includes("student.html")) return;

    const userEmail = localStorage.getItem("user");
    if (!userEmail) return;

    const students = JSON.parse(localStorage.getItem("admin_students")) || [];
    const student = students.find(s => s.email === userEmail);

    if (student && student.timetableSet === "Pending") {
        document.getElementById("setupModal").classList.add("active");
        renderSetupList();
    }
}

function addSetupClass() {
    const day = document.getElementById("setupDay").value;
    const time = document.getElementById("setupTime").value;
    const subject = document.getElementById("setupSubject").value;
    const room = document.getElementById("setupRoom").value;

    if (!subject || !room) {
        alert("Please enter Subject and Room.");
        return;
    }

    if (!tempSetupData[day]) tempSetupData[day] = {};
    tempSetupData[day][time] = { subject, room, type: "Lecture" };

    // Clear inputs
    document.getElementById("setupSubject").value = "";
    document.getElementById("setupRoom").value = "";

    renderSetupList();
}

function renderSetupList() {
    const list = document.getElementById("setupClassList");
    if (!list) return;

    let html = "";
    let count = 0;

    Object.keys(tempSetupData).forEach(day => {
        Object.keys(tempSetupData[day]).forEach(time => {
            const slot = tempSetupData[day][time];
            count++;
            html += `
                <div style="background: rgba(255,255,255,0.05); padding: 8px; margin-bottom: 5px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: white; font-size: 0.9rem;">
                        <strong style="color: #a78bfa;">${day} ${time}:00</strong> - ${slot.subject} (${slot.room})
                    </span>
                    <button onclick="removeSetupClass('${day}', '${time}')" style="background: none; border: none; color: #ef4444; cursor: pointer;">✕</button>
                </div>
            `;
        });
    });

    if (count === 0) {
        list.innerHTML = '<p style="color: gray; text-align: center; font-size: 0.9rem;">No classes added yet.</p>';
    } else {
        list.innerHTML = html;
    }
}

function removeSetupClass(day, time) {
    if (tempSetupData[day] && tempSetupData[day][time]) {
        delete tempSetupData[day][time];
        if (Object.keys(tempSetupData[day]).length === 0) delete tempSetupData[day];
        renderSetupList();
    }
}

function finishSetup() {
    const userEmail = localStorage.getItem("user");
    if (!userEmail) return;

    // 1. Check Matching Set
    const master = JSON.parse(localStorage.getItem("master_timetable")) || {};
    let assignedSet = null;

    // Convert tempSetupData to string for loose comparison (or deep compare)
    const newSignature = JSON.stringify(tempSetupData);

    // Look for exact match (ignoring empty sets if any)
    for (const [setName, setContent] of Object.entries(master)) {
        // We clean the setContent to ensure structure match (ignoring empty days if our temp doesn't have them)
        // But for exact match, let's just match the keys we have.
        // Actually, easiest is: Does setContent contain exactly what tempSetupData has?
        // Let's rely on JSON stringify of sorted User Input vs Set Input. 
        // NOTE: This simple check implies exact identical object structure.
        if (JSON.stringify(setContent) === newSignature) {
            assignedSet = setName;
            break;
        }
    }

    // 2. If No Match, Create New Set
    if (!assignedSet) {
        const students = JSON.parse(localStorage.getItem("admin_students")) || [];
        const student = students.find(s => s.email === userEmail);
        const nameInitial = student ? student.name.charAt(0).toUpperCase() : "S";

        // Find next serial for this initial
        // e.g. Match "S-1", "S-2"
        let maxSerial = 0;
        const regex = new RegExp(`^${nameInitial}-(\\d+)$`);

        Object.keys(master).forEach(key => {
            const match = key.match(regex);
            if (match) {
                const num = parseInt(match[1]);
                if (num > maxSerial) maxSerial = num;
            }
        });

        assignedSet = `${nameInitial}-${maxSerial + 1}`;

        // Save to Master
        master[assignedSet] = tempSetupData;
        localStorage.setItem("master_timetable", JSON.stringify(master));
    }

    // 3. Assign User to Set
    const students = JSON.parse(localStorage.getItem("admin_students")) || [];
    const studentIdx = students.findIndex(s => s.email === userEmail);
    if (studentIdx !== -1) {
        students[studentIdx].timetableSet = assignedSet;
        localStorage.setItem("admin_students", JSON.stringify(students));
    }

    alert(`Setup Complete!\nYou have been assigned to set: ${assignedSet}`);
    document.getElementById("setupModal").classList.remove("active");
    location.reload();
}

/* =============================== INITIALIZATION ================================ */
document.addEventListener("DOMContentLoaded", () => {
    // Theme load removed
    initializeTimetable(); // Ensure data exists

    // Shared
    const card = document.getElementById("timetableCard");
    if (card) {
        card.addEventListener("click", () => window.location.href = "timetable.html");
    }

    // Page Specific
    if (currentPath.includes("student.html")) {
        checkFirstTimeSetup(); // Check if new user
        renderTimetable("studentTimetable", "today");
        updateDashboardStatus();
    }

    if (currentPath.includes("faculty.html")) {
        renderTimetable("facultyTimetable");
        updateDashboardStatus(); // Replaces detectFacultyCurrentClass
    }

    if (currentPath.includes("timetable.html")) {
        renderTimetable("mainTimetable");
    }

    if (currentPath.includes("admin.html")) {
        renderUploadedFiles();
        loadUsers();
        renderUserTable('faculty');
        renderClassDensityGraph(); // Render graph on main dashboard
        initAdminTimetableEditor(); // We'll add this next
    }

    // Live Clock
    setInterval(updateClock, 1000);
    updateClock();

    // User Profile
    updateSidebarUser();
});

// --- USER PROFILE & POPUP ---
function updateSidebarUser() {
    const userEmail = localStorage.getItem("user") || "User";
    // Derived Name
    let name = userEmail.split("@")[0];
    name = name.charAt(0).toUpperCase() + name.slice(1);

    // Update all instances
    document.querySelectorAll(".sidebar-user-name").forEach(el => el.innerText = name);
}

function toggleLogoutPopup() {
    const popup = document.getElementById("logoutPopup");
    if (popup) {
        popup.style.display = (popup.style.display === "block") ? "none" : "block";
    }
}

// Close popup when clicking outside
document.addEventListener("click", (e) => {
    const popup = document.getElementById("logoutPopup");
    const section = document.querySelector(".profile-section");

    // If popup is open, and click is NOT inside profile section (which includes popup)
    if (popup && popup.style.display === "block" && section && !section.contains(e.target)) {
        popup.style.display = "none";
    }
});

function updateClock() {
    const clockElement = document.getElementById("liveClock");
    if (clockElement) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        const dateString = now.toLocaleDateString('en-US', options);
        const timeString = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });

        clockElement.innerHTML = `
            <div style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 2px;">${dateString}</div>
            <div style="font-size: 1.2rem; font-weight: 600; color: var(--accent-color); letter-spacing: 0.5px;">${timeString}</div>
        `;
    }
}

/* =========================================
   MOBILE SIDEBAR LOGIC
   ========================================= */
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (sidebar) {
        sidebar.classList.toggle('active');
    }
    if (overlay) {
        overlay.classList.toggle('active');
    }
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function (event) {
    const sidebar = document.querySelector('.sidebar');
    const hamburger = document.querySelector('.hamburger-menu');

    // Only run if elements exist
    if (!sidebar || !hamburger) return;

    // If sidebar is active and click is NOT on sidebar AND NOT on hamburger
    if (sidebar.classList.contains('active') &&
        !sidebar.contains(event.target) &&
        !hamburger.contains(event.target)) {
        sidebar.classList.remove('active');
    }
});

// Close sidebar when a nav link is clicked (optional, but good UX)
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) sidebar.classList.remove('active');
            }
        });
    });
});

