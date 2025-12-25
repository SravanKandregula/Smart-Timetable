from flask import Flask, render_template, request, redirect, session
import mysql.connector

app = Flask(__name__)
app.secret_key = "secret123"

def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Danger369.",
        database="timetable_db"
    )

def has_conflict(cur, faculty_id, section_id, room_id, slot_id):
    cur.execute("""
        SELECT 1 FROM timetable
        WHERE slot_id = %s
          AND (faculty_id = %s
               OR section_id = %s
               OR room_id = %s)
        LIMIT 1
    """, (slot_id, faculty_id, section_id, room_id))
    return cur.fetchone() is not None


@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"].strip()
        password = request.form["password"].strip()
        role = request.form["role"]

        db = get_db()
        cur = db.cursor(dictionary=True)

        # ADMIN LOGIN (hardcoded for now)
        if role == "admin":
            if username == "admin" and password == "admin":
                session["role"] = "admin"
                return redirect("/admin")
            return "Invalid Admin Login"

        # STUDENT LOGIN
        if role == "student":
            cur.execute(
                "SELECT * FROM students WHERE UPPER(roll_no)=UPPER(%s)",
                (username, )
            )
            user = cur.fetchone()
            print("DB USER:", user)
            if user and user["password"] == password:
                session["role"] = "student"
                session["section_id"] = user["section_id"]
                return redirect("/student")
            else:
                return "Invalid Student Login"

        # FACULTY LOGIN
        if role == "faculty":
            cur.execute(
                "SELECT * FROM faculty WHERE name=%s AND password=%s",
                (username, password)
            )
            user = cur.fetchone()
            if user:
                session["role"] = "faculty"
                session["faculty_id"] = user["faculty_id"]
                return redirect("/faculty")

        return "Invalid Login"

    return render_template("login.html")

@app.route("/admin")
def admin():
    return render_template("admin.html")

@app.route("/student")
def student():
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute("""
        SELECT
            ts.day,
            ts.start_time,
            ts.end_time,
            sub.subject_name,
            r.room_no
        FROM timetable t
        JOIN time_slots ts ON t.slot_id = ts.slot_id
        JOIN subjects sub ON t.subject_id = sub.subject_id
        JOIN rooms r ON t.room_id = r.room_id
        WHERE t.section_id = %s
        ORDER BY ts.day, ts.start_time
    """, (session["section_id"],))

    rows = cur.fetchall()

    # 🔥 STEP A: Collect days & times DIRECTLY from DB
    days = sorted({r["day"] for r in rows})
    times = sorted({f"{r['start_time']}-{r['end_time']}" for r in rows})

    # 🔥 STEP B: Create grid safely
    timetable = {}
    for d in days:
        timetable[d] = {t: "-" for t in times}

    # 🔥 STEP C: Fill grid (NO KeyError possible)
    for r in rows:
        time_key = f"{r['start_time']}-{r['end_time']}"
        cell_value = f"{r['subject_name']} - {r['room_no']}"
        timetable[r["day"]][time_key] = cell_value

    return render_template(
        "student.html",
        timetable=timetable,
        days=days,
        times=times
    )


@app.route("/faculty")
def faculty():
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute("""
        SELECT
            ts.day,
            ts.start_time,
            ts.end_time,
            sub.subject_name,
            sec.section_name,
            r.room_no
        FROM timetable t
        JOIN time_slots ts ON t.slot_id = ts.slot_id
        JOIN subjects sub ON t.subject_id = sub.subject_id
        JOIN sections sec ON t.section_id = sec.section_id
        JOIN rooms r ON t.room_id = r.room_id
        WHERE t.faculty_id = %s
        ORDER BY ts.day, ts.start_time
    """, (session["faculty_id"],))

    data = cur.fetchall()
    return render_template("faculty.html", data=data)

@app.route("/generate", methods=["GET", "POST"])
def generate_timetable():
    db = get_db()
    cur = db.cursor(dictionary=True)

    # Clear old timetable
    cur.execute("DELETE FROM timetable")
    db.commit()

    # Fetch base data
    cur.execute("SELECT * FROM faculty_subject_map")
    mappings = cur.fetchall()

    cur.execute("SELECT room_id FROM rooms")
    rooms = [r["room_id"] for r in cur.fetchall()]

    cur.execute("SELECT slot_id FROM time_slots")
    slots = [s["slot_id"] for s in cur.fetchall()]

    inserted = 0

    for m in mappings:
        faculty_id = m["faculty_id"]
        subject_id = m["subject_id"]

        # Sections that study this subject
        cur.execute("""
            SELECT DISTINCT st.section_id
            FROM student_subject_map sm
            JOIN students st ON sm.student_id = st.student_id
            WHERE sm.subject_id = %s
        """, (subject_id,))
        sections = cur.fetchall()

        for sec in sections:
            section_id = sec["section_id"]

            placed = False
            for slot_id in slots:
                for room_id in rooms:
                    if not has_conflict(cur, faculty_id, section_id, room_id, slot_id):
                        cur.execute("""
                            INSERT INTO timetable
                            (subject_id, faculty_id, section_id, room_id, slot_id)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (subject_id, faculty_id, section_id, room_id, slot_id))
                        db.commit()
                        inserted += 1
                        placed = True
                        break
                if placed:
                    break

    return f"TIMETABLE GENERATED WITH CONFLICT CHECKS: {inserted} rows"


app.run(debug=True)

def has_conflict(cur, faculty_id, section_id, room_id, slot_id):
    cur.execute("""
        SELECT * FROM timetable
        WHERE slot_id=%s AND
        (faculty_id=%s OR section_id=%s OR room_id=%s)
    """, (slot_id, faculty_id, section_id, room_id))
    return cur.fetchone() is not None
from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login", methods=["POST"])
def login():
    username = request.form.get("username")
    password = request.form.get("password")
    role = request.form.get("role")

    if not username or not password or not role:
        return "Missing data", 400

    # 🔐 SIMPLE DEMO LOGIC (hackathon)
    if role == "Admin":
        return f"Welcome ADMIN {username}"
    elif role == "Student":
        return f"Welcome STUDENT {username}"
    elif role == "Faculty":
        return f"Welcome FACULTY {username}"

    return "Invalid role", 400


if __name__ == "__main__":
    app.run(debug=True)
