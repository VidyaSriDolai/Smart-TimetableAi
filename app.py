from flask import Flask, request, jsonify, send_file, session, redirect
from flask_cors import CORS
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from datetime import datetime, timedelta
import pytz
import os
import json
import urllib.parse
import uuid


app = Flask(__name__)
CORS(app, origins=["https://smart-timetableai.onrender.com", "https://smart-time-tableai.netlify.app", "http://127.0.0.1:3000", "http://localhost:3000"])
app.secret_key = "smart_timetable_session_secret_key"

# Enable dynamic insecure OAuth transport for local development (so HTTP loopback redirect works)
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

# -----------------------------------
# CONFIGURATION LOAD
# -----------------------------------
app_config = {}
try:
    if os.path.exists("config.json"):
        with open("config.json", "r", encoding="utf-8") as config_file:
            app_config = json.load(config_file)
except Exception as e:
    print(f"Failed to load config.json: {e}", flush=True)

# -----------------------------------
# MONGODB SETUP
# -----------------------------------
try:
    from pymongo import MongoClient
    # Connects to MongoDB Atlas instance (loads from env or config.json)
    mongo_uri = os.environ.get("MONGODB_URI") or app_config.get("MONGODB_URI")
    if not mongo_uri:
        raise Exception("MONGODB_URI not configured in environment or config.json")
    mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=15000)
    db = mongo_client["smart_timetable"]
    # Quick connectivity test
    mongo_client.server_info()
    print("Connected to MongoDB Atlas Cloud!")
except Exception as e:
    print("MongoDB Atlas connection failed, falling back to local memory. Error:", e)
    db = None

# Fallback in-memory storage if MongoDB is not running
fallback_assignments = []
fallback_events = []
in_memory_profiles = {}
user_tokens = {}
fallback_users = {}
fallback_goals = []

TIMEZONE = pytz.timezone("Asia/Kolkata")

# Google Calendar Event Color Mapping
COLOR_MAP = {
    "Lavender": "1",
    "Sage": "2",
    "Grape": "3",
    "Flamingo": "4",
    "Banana": "5",
    "Tangerine": "6",
    "Peacock": "7",
    "Graphite": "8",
    "Blueberry": "9",
    "Basil": "10",
    "Tomato": "11",
    "Default colour": None
}

REVERSE_COLOR_MAP = {v: k for k, v in COLOR_MAP.items() if v is not None}

# -----------------------------------
# DYNAMIC MULTI-USER GOOGLE CALENDAR
# -----------------------------------
def get_google_service(username):
    if not username:
        return None
        
    creds_dict = None
    # 1. Try to fetch from MongoDB
    if db is not None:
        try:
            user_doc = db.users.find_one({"username": username})
            if user_doc and "google_token" in user_doc:
                creds_dict = user_doc["google_token"]
        except Exception as e:
            pass
            
    # 2. Try to fetch from fallback in-memory
    if not creds_dict:
        creds_dict = user_tokens.get(username)
        
    if not creds_dict:
        return None
        
    try:
        SCOPES = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/user.birthday.read',
            'https://www.googleapis.com/auth/user.gender.read',
            'openid'
        ]
        
        creds = Credentials.from_authorized_user_info(creds_dict, SCOPES)
        
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            # Save refreshed credentials
            new_token_dict = json.loads(creds.to_json())
            if db is not None:
                db.users.update_one({"username": username}, {"$set": {"google_token": new_token_dict}})
            else:
                user_tokens[username] = new_token_dict
                
        return build('calendar', 'v3', credentials=creds)
    except Exception as e:
        return None

def run_completed_events_cleanup(username):
    if not username:
        return
    
    user_service = get_google_service(username)
    if not user_service:
        return
        
    now_utc = datetime.utcnow()
    
    # 1. Clean up Completed Assignments (older than 24h)
    assignments_to_clean = []
    if db is not None:
        try:
            cursor = db.assignments.find({
                "username": username,
                "completed": True,
                "completed_at": {"$ne": None},
                "google_event_id": {"$ne": None},
                "deleted_from_gcal": {"$ne": True}
            })
            assignments_to_clean = list(cursor)
        except Exception as e:
            pass
    else:
        for a in fallback_assignments:
            if (a.get("username") == username and 
                a.get("completed") is True and 
                a.get("completed_at") is not None and 
                a.get("google_event_id") is not None and 
                a.get("deleted_from_gcal") is not True):
                assignments_to_clean.append(a)
                
    for a in assignments_to_clean:
        comp_time = a.get("completed_at")
        if isinstance(comp_time, str):
            try:
                comp_time = datetime.fromisoformat(comp_time.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                continue
        
        if comp_time and (now_utc - comp_time).total_seconds() >= 0:
            g_id = a.get("google_event_id")
            try:
                user_service.events().delete(calendarId="primary", eventId=g_id).execute()
            except Exception as e:
                pass
            
            if db is not None:
                db.assignments.update_one(
                    {"username": username, "id": a["id"]},
                    {"$set": {"deleted_from_gcal": True, "google_event_id": None}}
                )
            else:
                a["deleted_from_gcal"] = True
                a["google_event_id"] = None

    # 2. Clean up Past Scheduled Events (older than 24h after end time)
    events_to_clean = []
    if db is not None:
        try:
            cursor = db.events.find({
                "username": username,
                "google_event_id": {"$ne": None},
                "deleted_from_gcal": {"$ne": True}
            })
            events_to_clean = list(cursor)
        except Exception as e:
            pass
    else:
        for e in fallback_events:
            if (e.get("username") == username and 
                e.get("google_event_id") is not None and 
                e.get("deleted_from_gcal") is not True):
                events_to_clean.append(e)

    for e in events_to_clean:
        try:
            date_str = e.get("date")
            end_str = e.get("end") or "23:59"
            event_end_dt = datetime.strptime(f"{date_str}T{end_str}", "%Y-%m-%dT%H:%M")
            event_end_tz = TIMEZONE.localize(event_end_dt)
            now_tz = datetime.now(TIMEZONE)
            
            if (now_tz - event_end_tz).total_seconds() >= 0:
                g_id = e.get("google_event_id")
                try:
                    user_service.events().delete(calendarId="primary", eventId=g_id).execute()
                except Exception as e:
                    pass
                
                if db is not None:
                    db.events.update_one(
                        {"username": username, "id": e["id"]},
                        {"$set": {"deleted_from_gcal": True, "google_event_id": None}}
                    )
                else:
                    e["deleted_from_gcal"] = True
                    e["google_event_id"] = None
        except Exception as ex:
            pass

# -----------------------------------
# HELPER FUNCTIONS
# -----------------------------------
def detect_date(query):
    today = datetime.today().date()
    if "tomorrow" in query:
        return today + timedelta(days=1)
    if "yesterday" in query:
        return today - timedelta(days=1)
    return today

def get_events_for_date_by_user(selected_date, username):
    user_service = get_google_service(username)
    if not user_service:
        return []
    start_of_day = TIMEZONE.localize(datetime.combine(selected_date, datetime.min.time()))
    end_of_day = TIMEZONE.localize(datetime.combine(selected_date, datetime.max.time()))
    
    try:
        events_result = user_service.events().list(
            calendarId="primary",
            timeMin=start_of_day.isoformat(),
            timeMax=end_of_day.isoformat(),
            timeZone="Asia/Kolkata",
            singleEvents=True,
            orderBy="startTime",
        ).execute()
        return events_result.get("items", [])
    except Exception as e:
        return []

def has_conflict(new_start, new_end, events):
    for event in events:
        if "dateTime" not in event["start"]:
            continue
        existing_start = datetime.fromisoformat(event["start"]["dateTime"])
        existing_end = datetime.fromisoformat(event["end"]["dateTime"])
        if new_start < existing_end and new_end > existing_start:
            return True
    return False

def find_free_time(selected_date, events):
    if len(events) == 0:
        return ["You are free all day!"]
    
    free_slots = []
    work_start = TIMEZONE.localize(datetime.combine(selected_date, datetime.strptime("09:00", "%H:%M").time()))
    work_end = TIMEZONE.localize(datetime.combine(selected_date, datetime.strptime("18:00", "%H:%M").time()))
    current = work_start

    for event in events:
        if "dateTime" not in event["start"]:
            continue
        start = datetime.fromisoformat(event["start"]["dateTime"])
        end = datetime.fromisoformat(event["end"]["dateTime"])
        
        if current < start:
            free_slots.append(f"{current.strftime('%H:%M')} - {start.strftime('%H:%M')}")
        current = max(current, end)

    if current < work_end:
        free_slots.append(f"{current.strftime('%H:%M')} - {work_end.strftime('%H:%M')}")
    
    return free_slots

# -----------------------------------
# GOOGLE OAUTH ROUTES
# -----------------------------------
SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/user.birthday.read',
    'https://www.googleapis.com/auth/user.gender.read',
    'openid'
]

def get_google_client_config():
    """Build Google OAuth client config from env vars or credentials.json file."""
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    if client_id and client_secret:
        return {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "redirect_uris": [get_redirect_uri()]
            }
        }
    # Fallback to local file for local development
    with open('credentials.json', 'r') as f:
        return json.load(f)

def get_redirect_uri():
    """Return the correct redirect URI based on environment."""
    render_url = os.environ.get("RENDER_EXTERNAL_URL")
    if render_url:
        return f"{render_url}/oauth2callback"
    return 'http://127.0.0.1:3000/oauth2callback'

@app.route("/login/google")
def login_google():
    flow = Flow.from_client_config(
        get_google_client_config(),
        scopes=SCOPES,
        redirect_uri=get_redirect_uri()
    )
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    
    session['state'] = state
    session['code_verifier'] = flow.code_verifier
    return redirect(authorization_url)

@app.route("/oauth2callback")
def oauth2callback():
    state = session.get('state')
    
    flow = Flow.from_client_config(
        get_google_client_config(),
        scopes=SCOPES,
        state=state,
        redirect_uri=get_redirect_uri()
    )
    
    flow.code_verifier = session.get('code_verifier')
    
    try:
        flow.fetch_token(authorization_response=request.url)
    except Exception as e:
        return redirect("/?login_success=false&error=invalid_grant")
        
    creds = flow.credentials
    
    try:
        # Call Google People API to get user profile details
        people_service = build('people', 'v1', credentials=creds)
        profile = people_service.people().get(
            resourceName='people/me',
            personFields='names,emailAddresses,birthdays,genders'
        ).execute()
        
        name = ""
        if 'names' in profile and len(profile['names']) > 0:
            name = profile['names'][0].get('displayName', '')
            
        email = ""
        if 'emailAddresses' in profile and len(profile['emailAddresses']) > 0:
            email = profile['emailAddresses'][0].get('value', '')
            
        dob = "N/A"
        if 'birthdays' in profile and len(profile['birthdays']) > 0:
            bday = profile['birthdays'][0].get('date', {})
            year = bday.get('year')
            month = bday.get('month')
            day = bday.get('day')
            if year and month and day:
                dob = f"{year:04d}-{month:02d}-{day:02d}"
            elif month and day:
                dob = f"--{month:02d}-{day:02d}"
                
        gender = "N/A"
        if 'genders' in profile and len(profile['genders']) > 0:
            gender = profile['genders'][0].get('formattedValue', 'N/A')
            
        age = "N/A"
        if dob != "N/A" and "--" not in dob:
            try:
                birth_date = datetime.strptime(dob, "%Y-%m-%d").date()
                today = datetime.today().date()
                age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            except Exception as e:
                pass
                

        # Save credentials and profile info
        google_token = json.loads(creds.to_json())
        user_data = {
            "username": email,
            "name": name,
            "email": email,
            "dob": dob,
            "gender": gender,
            "age": str(age),
            "google_token": google_token
        }
        
        if db is not None:
            db.users.update_one(
                {"username": email},
                {
                    "$set": user_data,
                    "$setOnInsert": {
                        "theme": "light",
                        "activeTab": "dashboard"
                    }
                },
                upsert=True
            )
        else:
            user_tokens[email] = google_token
            # Preserve existing theme and activeTab in memory if they exist
            existing = in_memory_profiles.get(email, {})
            user_data["theme"] = existing.get("theme", "light")
            user_data["activeTab"] = existing.get("activeTab", "dashboard")
            in_memory_profiles[email] = user_data
            
        # Encode parameters for redirect to React frontend
        params = urllib.parse.urlencode({
            "login_success": "true",
            "name": name,
            "email": email,
            "dob": dob,
            "gender": gender,
            "age": str(age)
        })
        return redirect(f"/?{params}")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return f"Authentication failed: {str(e)}", 500

# -----------------------------------
# LOCAL AUTHENTICATION ENDPOINTS
# -----------------------------------
import random
import smtplib
from email.mime.text import MIMEText

# In-memory OTP storage
# Format: {email: {"otp": "1234", "expires_at": datetime, "purpose": "signup" or "forgot_password", "verified": bool}}
active_otps = {}

smtp_config = app_config

def generate_otp():
    return f"{random.randint(1000, 9999)}"

def send_otp_email(email, otp, purpose="signup"):
    subject = "Verification Code" if purpose == "signup" else "Password Reset OTP"
    body = f"""
========================================
Verification Code: {otp}
This code will expire in 5 minutes.
========================================
"""
    
    # Visible console banner for development fallback
    
    try:
        smtp_host = os.environ.get("SMTP_HOST") or smtp_config.get("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.environ.get("SMTP_PORT") or smtp_config.get("SMTP_PORT", 587))
        smtp_user = os.environ.get("SMTP_USER") or smtp_config.get("SMTP_USER", "")
        smtp_pass = os.environ.get("SMTP_PASS") or smtp_config.get("SMTP_PASS", "")
        sender = os.environ.get("SMTP_SENDER") or smtp_config.get("SMTP_SENDER") or smtp_user or "noreply@smarttimetable.local"
        
        if not smtp_user or not smtp_pass:
            return True
            
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = sender
        msg['To'] = email
        
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(sender, [email], msg.as_string())
        server.quit()
        return True
    except Exception as e:
        return True

@app.route("/api/send-otp", methods=["POST"])
def api_send_otp():
    data = request.json or {}
    email = data.get("email", "").strip()
    purpose = data.get("purpose", "signup").strip() # signup or forgot_password
    
    if not email:
        return jsonify({"message": "Email is required!"}), 400
        
    if purpose == "forgot_password":
        user_exists = False
        if db is not None:
            user_exists = db.users.find_one({"email": email}) is not None
        else:
            user_exists = email in fallback_users or any(u.get("email") == email for u in fallback_users.values())
        if not user_exists:
            return jsonify({"message": "No account found with this email address!"}), 404
            
    otp = generate_otp()
    expires_at = datetime.now() + timedelta(minutes=5)
    
    active_otps[email] = {
        "otp": otp,
        "expires_at": expires_at,
        "purpose": purpose,
        "verified": False
    }
    
    send_otp_email(email, otp, purpose)
    return jsonify({"message": "Verification code sent to your email!"}), 200

@app.route("/api/verify-otp", methods=["POST"])
def api_verify_otp():
    data = request.json or {}
    email = data.get("email", "").strip()
    otp = data.get("otp", "").strip()
    purpose = data.get("purpose", "signup").strip()
    
    if not email or not otp:
        return jsonify({"message": "Email and OTP code are required!"}), 400
        
    otp_entry = active_otps.get(email)
    if not otp_entry:
        return jsonify({"message": "No code requested for this email!"}), 400
        
    if otp_entry["purpose"] != purpose:
        return jsonify({"message": "Invalid verification context!"}), 400
        
    if datetime.now() > otp_entry["expires_at"]:
        active_otps.pop(email, None)
        return jsonify({"message": "Verification code has expired! Please request a new one."}), 400
        
    if otp_entry["otp"] != otp:
        return jsonify({"message": "Incorrect verification code!"}), 400
        
    otp_entry["verified"] = True
    return jsonify({"message": "Code verified successfully!"}), 200

@app.route("/api/reset-password", methods=["POST"])
def api_reset_password():
    data = request.json or {}
    email = data.get("email", "").strip()
    otp = data.get("otp", "").strip()
    new_password = data.get("password", "").strip()
    
    if not email or not otp or not new_password:
        return jsonify({"message": "All fields are required!"}), 400
        
    otp_entry = active_otps.get(email)
    if not otp_entry or otp_entry["otp"] != otp or not otp_entry.get("verified") or otp_entry["purpose"] != "forgot_password":
        return jsonify({"message": "OTP verification is invalid or expired!"}), 400
        
    active_otps.pop(email, None)
    
    user_data = None
    if db is not None:
        try:
            db.users.update_one({"email": email}, {"$set": {"password": new_password}})
            user_data = db.users.find_one({"email": email})
        except Exception as e:
            return jsonify({"message": f"Database error: {str(e)}"}), 500
    else:
        # Fallback memory
        for key, user in fallback_users.items():
            if user.get("email") == email or key == email:
                user["password"] = new_password
                user_data = user
                break
                
    if not user_data:
        return jsonify({"message": "User not found!"}), 404
        
    return jsonify({
        "message": "Password reset successful!",
        "user": {
            "username": user_data.get("username"),
            "name": user_data.get("name"),
            "email": user_data.get("email"),
            "dob": user_data.get("dob", "N/A"),
            "gender": user_data.get("gender", "N/A"),
            "age": user_data.get("age", "N/A"),
            "theme": user_data.get("theme", "light"),
            "activeTab": user_data.get("activeTab", "dashboard")
        }
    }), 200

@app.route("/api/signup", methods=["POST"])
def api_signup():
    data = request.json
    username = data.get("username", "").strip()
    full_name = data.get("fullName", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    if not username or not full_name or not email or not password:
        return jsonify({"message": "All fields are required!"}), 400

    # Verify that the OTP has been successfully verified
    otp_entry = active_otps.get(email)
    if not otp_entry or not otp_entry.get("verified") or otp_entry["purpose"] != "signup":
        return jsonify({"message": "Please verify your email via OTP first!"}), 400
        
    # Consume OTP entry
    active_otps.pop(email, None)

    global fallback_users
    if 'fallback_users' not in globals():
        fallback_users = {}

    if db is not None:
        try:
            existing_user = db.users.find_one({"$or": [{"username": username}, {"email": email}]})
            if existing_user:
                return jsonify({"message": "Username or Email already registered!"}), 400
            
            user_doc = {
                "username": username,
                "name": full_name,
                "email": email,
                "password": password,
                "dob": "N/A",
                "gender": "N/A",
                "age": "N/A",
                "theme": "light",
                "activeTab": "dashboard",
                "is_local": True
            }
            db.users.insert_one(user_doc)
            return jsonify({"message": "Registration successful!", "user": {
                "username": username,
                "name": full_name,
                "email": email,
                "dob": "N/A",
                "gender": "N/A",
                "age": "N/A",
                "theme": "light",
                "activeTab": "dashboard"
            }}), 200
        except Exception as e:
            return jsonify({"message": f"Database error: {str(e)}"}), 500
    else:
        if username in fallback_users or any(u.get("email") == email for u in fallback_users.values()):
            return jsonify({"message": "Username or Email already registered!"}), 400
        
        user_doc = {
            "username": username,
            "name": full_name,
            "email": email,
            "password": password,
            "dob": "N/A",
            "gender": "N/A",
            "age": "N/A",
            "theme": "light",
            "activeTab": "dashboard",
            "is_local": True
        }
        fallback_users[username] = user_doc
        return jsonify({"message": "Registration successful!", "user": {
            "username": username,
            "name": full_name,
            "email": email,
            "dob": "N/A",
            "gender": "N/A",
            "age": "N/A",
            "theme": "light",
            "activeTab": "dashboard"
        }}), 200

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"message": "Username and password are required!"}), 400

    global fallback_users
    if 'fallback_users' not in globals():
        fallback_users = {}

    if db is not None:
        try:
            user_doc = db.users.find_one({"$or": [{"username": username}, {"email": username}]})
            if not user_doc:
                friendly_name = username.split("@")[0].capitalize()
                user_doc = {
                    "username": username,
                    "name": friendly_name,
                    "email": username if "@" in username else f"{username}@local.com",
                    "password": password,
                    "dob": "N/A",
                    "gender": "N/A",
                    "age": "N/A",
                    "theme": "light",
                    "activeTab": "dashboard",
                    "is_local": True
                }
                db.users.insert_one(user_doc)
                return jsonify({
                    "message": "Your account is created!",
                    "user": {
                        "username": user_doc.get("username"),
                        "name": user_doc.get("name"),
                        "email": user_doc.get("email"),
                        "dob": user_doc.get("dob", "N/A"),
                        "gender": user_doc.get("gender", "N/A"),
                        "age": user_doc.get("age", "N/A"),
                        "theme": user_doc.get("theme", "light"),
                        "activeTab": user_doc.get("activeTab", "dashboard")
                    }
                }), 200
            
            if user_doc.get("password") != password:
                return jsonify({"message": "Incorrect password! Please try again."}), 401
                
            return jsonify({
                "message": "Login successful!",
                "user": {
                    "username": user_doc.get("username"),
                    "name": user_doc.get("name"),
                    "email": user_doc.get("email"),
                    "dob": user_doc.get("dob", "N/A"),
                    "gender": user_doc.get("gender", "N/A"),
                    "age": user_doc.get("age", "N/A"),
                    "theme": user_doc.get("theme", "light"),
                    "activeTab": user_doc.get("activeTab", "dashboard")
                }
            }), 200
        except Exception as e:
            return jsonify({"message": f"Database error: {str(e)}"}), 500
    else:
        user_doc = fallback_users.get(username) or next((u for u in fallback_users.values() if u.get("email") == username), None)
        if not user_doc:
            friendly_name = username.split("@")[0].capitalize()
            user_doc = {
                "username": username,
                "name": friendly_name,
                "email": username if "@" in username else f"{username}@local.com",
                "password": password,
                "dob": "N/A",
                "gender": "N/A",
                "age": "N/A",
                "theme": "light",
                "activeTab": "dashboard",
                "is_local": True
            }
            fallback_users[username] = user_doc
            return jsonify({
                "message": "Your account is created!",
                "user": {
                    "username": user_doc.get("username"),
                    "name": user_doc.get("name"),
                    "email": user_doc.get("email"),
                    "dob": user_doc.get("dob", "N/A"),
                    "gender": user_doc.get("gender", "N/A"),
                    "age": user_doc.get("age", "N/A"),
                    "theme": user_doc.get("theme", "light"),
                    "activeTab": user_doc.get("activeTab", "dashboard")
                }
            }), 200
            
        if user_doc.get("password") != password:
            return jsonify({"message": "Incorrect password! Please try again."}), 401
            
        return jsonify({
            "message": "Login successful!",
            "user": {
                "username": user_doc.get("username"),
                "name": user_doc.get("name"),
                "email": user_doc.get("email"),
                "dob": user_doc.get("dob", "N/A"),
                "gender": user_doc.get("gender", "N/A"),
                "age": user_doc.get("age", "N/A"),
                "theme": user_doc.get("theme", "light"),
                "activeTab": user_doc.get("activeTab", "dashboard")
            }
        }), 200

# -----------------------------------
# USER SETTINGS SYNC ENDPOINTS
# -----------------------------------
@app.route("/api/user/profile", methods=["GET"])
def get_user_profile():
    username = request.args.get("username", "").strip()
    if not username:
        return jsonify({"message": "Username parameter is required"}), 400
        
    if db is not None:
        try:
            user_doc = db.users.find_one({"$or": [{"username": username}, {"email": username}]})
            if user_doc:
                return jsonify({
                    "name": user_doc.get("name", "Administrator"),
                    "email": user_doc.get("email", ""),
                    "dob": user_doc.get("dob", "N/A"),
                    "gender": user_doc.get("gender", "N/A"),
                    "age": user_doc.get("age", "N/A"),
                    "theme": user_doc.get("theme", "light"),
                    "activeTab": user_doc.get("activeTab", "dashboard"),
                    "googleConnected": "google_token" in user_doc,
                    "aiEngine": user_doc.get("aiEngine", "keyword"),
                    "aiModel": user_doc.get("aiModel", ""),
                    "openrouterKey": user_doc.get("openrouterKey", ""),
                    "huggingfaceToken": user_doc.get("huggingfaceToken", "")
                }), 200
        except Exception as e:
            return jsonify({"message": f"Database error: {str(e)}"}), 500
    else:
        # Fallback in memory profiles
        user_doc = in_memory_profiles.get(username) or fallback_users.get(username)
        if not user_doc:
            user_doc = next((u for u in fallback_users.values() if u.get("email") == username), None)
        if user_doc:
            return jsonify({
                "name": user_doc.get("name", "Administrator"),
                "email": user_doc.get("email", ""),
                "dob": user_doc.get("dob", "N/A"),
                "gender": user_doc.get("gender", "N/A"),
                "age": user_doc.get("age", "N/A"),
                "theme": user_doc.get("theme", "light"),
                "activeTab": user_doc.get("activeTab", "dashboard"),
                "googleConnected": "google_token" in user_doc or not user_doc.get("is_local", False),
                "aiEngine": user_doc.get("aiEngine", "keyword"),
                "aiModel": user_doc.get("aiModel", ""),
                "openrouterKey": user_doc.get("openrouterKey", ""),
                "huggingfaceToken": user_doc.get("huggingfaceToken", "")
            }), 200

    return jsonify({"message": "User not found"}), 404

@app.route("/api/user/settings", methods=["POST"])
def post_user_settings():
    data = request.json or {}
    username = data.get("username", "").strip()
    theme = data.get("theme")
    active_tab = data.get("activeTab")
    
    if not username:
        return jsonify({"message": "Username is required"}), 400
        
    update_fields = {}
    if theme is not None:
        update_fields["theme"] = theme
    if active_tab is not None:
        update_fields["activeTab"] = active_tab
        
    if not update_fields:
        return jsonify({"message": "No settings to update"}), 200
        
    if db is not None:
        try:
            result = db.users.update_one(
                {"$or": [{"username": username}, {"email": username}]},
                {"$set": update_fields}
            )
            if result.matched_count > 0:
                return jsonify({"message": "Settings updated successfully"}), 200
        except Exception as e:
            return jsonify({"message": f"Database error: {str(e)}"}), 500
    else:
        # Fallback memory
        updated = False
        for doc in [in_memory_profiles.get(username), fallback_users.get(username)]:
            if doc:
                doc.update(update_fields)
                updated = True
        user_doc = next((u for u in fallback_users.values() if u.get("email") == username), None)
        if user_doc:
            user_doc.update(update_fields)
            updated = True
        if updated:
            return jsonify({"message": "Settings updated successfully (fallback memory)"}), 200
            
    return jsonify({"message": "User not found"}), 404
 
@app.route("/api/user/ai-settings", methods=["POST"])
def post_user_ai_settings():
    data = request.json or {}
    username = data.get("username", "").strip()
    ai_engine = data.get("aiEngine", "keyword")
    ai_model = data.get("aiModel", "")
    openrouter_key = data.get("openrouterKey", "")
    huggingface_token = data.get("huggingfaceToken", "")
    
    if not username:
        return jsonify({"message": "Username is required"}), 400
        
    update_fields = {
        "aiEngine": ai_engine,
        "aiModel": ai_model,
        "openrouterKey": openrouter_key,
        "huggingfaceToken": huggingface_token
    }
    
    if db is not None:
        try:
            result = db.users.update_one(
                {"$or": [{"username": username}, {"email": username}]},
                {"$set": update_fields}
            )
            return jsonify({"message": "AI settings updated successfully", "success": True}), 200
        except Exception as e:
            return jsonify({"message": f"Database error: {str(e)}"}), 500
    else:
        # Fallback memory
        updated = False
        for doc in [in_memory_profiles.get(username), fallback_users.get(username)]:
            if doc:
                doc.update(update_fields)
                updated = True
        user_doc = next((u for u in fallback_users.values() if u.get("email") == username), None)
        if user_doc:
            user_doc.update(update_fields)
            updated = True
        if updated:
            return jsonify({"message": "AI settings updated successfully (fallback memory)", "success": True}), 200
            
    return jsonify({"message": "User not found"}), 404

@app.route("/api/ai/ollama-models", methods=["GET"])
def get_ollama_models():
    import requests
    try:
        res = requests.get("http://localhost:11434/api/tags", timeout=0.5)
        if res.status_code == 200:
            models_data = res.json()
            models_list = [m["name"] for m in models_data.get("models", [])]
            return jsonify({"connected": True, "models": models_list})
    except Exception:
        pass
    return jsonify({"connected": False, "models": []})

# -----------------------------------
# API ROUTES
# -----------------------------------

@app.route("/")
def home():
    response = send_file("index.html")
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response

@app.after_request
def add_header(response):
    if request.path.startswith('/static/'):
        response.headers['Cache-Control'] = 'public, max-age=31536000'
    return response

# ADD EVENT
@app.route("/addEvent", methods=["POST"])
def add_event():
    data = request.json
    username = data.get("username")
    name = data.get("name")
    date_str = data.get("date")
    start_str = data.get("start")
    end_str = data.get("end")
    priority = data.get("priority", "Medium")
    description = data.get("description", "")
    color = data.get("color", "Default colour")
    category = data.get("category", "General")
    reminders = data.get("reminders", [])

    if not name or not date_str or not start_str or not end_str:
        return jsonify({"message": "Missing event fields!"}), 400

    try:
        selected_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        start_time = datetime.strptime(start_str, "%H:%M").time()
        end_time = datetime.strptime(end_str, "%H:%M").time()
        
        new_start = TIMEZONE.localize(datetime.combine(selected_date, start_time))
        new_end = TIMEZONE.localize(datetime.combine(selected_date, end_time))

        # Restrict back-dated events
        today = datetime.now(TIMEZONE).date()
        if selected_date < today:
            return jsonify({"message": "Cannot schedule events in the past!"}), 400

        events = get_events_for_date_by_user(selected_date, username)
        if has_conflict(new_start, new_end, events):
            return jsonify({"message": "Conflict detected!"}), 200

        google_event_id = None
        user_service = get_google_service(username)
        if user_service:
            # Sync priority into description for native calendar readers if custom description is empty
            desc_val = description
            if not desc_val:
                desc_val = f"Priority: {priority}"
            else:
                desc_val = f"{description}\n\nPriority: {priority}"

            event_body = {
                "summary": name,
                "description": desc_val,
                "start": {
                    "dateTime": new_start.isoformat(),
                    "timeZone": "Asia/Kolkata",
                },
                "end": {
                    "dateTime": new_end.isoformat(),
                    "timeZone": "Asia/Kolkata",
                },
            }
            g_color_id = COLOR_MAP.get(color)
            if g_color_id:
                event_body["colorId"] = g_color_id

            event_body["reminders"] = {
                "useDefault": False,
                "overrides": [{"method": "popup", "minutes": int(mins)} for mins in reminders if str(mins).isdigit()]
            }
            
            try:
                gevent = user_service.events().insert(calendarId="primary", body=event_body).execute()
                google_event_id = gevent.get("id")
            except Exception as e:
                pass

        # Cache in MongoDB or local memory
        event_doc = {
            "id": str(uuid.uuid4()),
            "username": username,
            "name": name,
            "date": date_str,
            "start": start_str,
            "end": end_str,
            "priority": priority,
            "category": category,
            "description": description,
            "color": color,
            "reminders": reminders,
            "google_event_id": google_event_id,
            "created_at": datetime.utcnow()
        }
        if db is not None:
            db.events.insert_one(event_doc)
        else:
            fallback_events.append(event_doc)

        return jsonify({"message": "Event added successfully", "success": True})

    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


# GET EVENTS
@app.route("/events", methods=["GET"])
def get_events():
    username = request.args.get("username")
    try:
        if username:
            try:
                run_completed_events_cleanup(username)
            except Exception as e:
                pass

        # 1. Fetch all local events from DB or fallback list
        local_events = []
        if username:
            if db is not None:
                local_events = list(db.events.find({"username": username}))
            else:
                local_events = [e for e in fallback_events if e.get("username") == username]

        # Structure local events in a dict
        merged_events = {}
        for le in local_events:
            # Map ObjectIDs and IDs for UI stability
            if "_id" in le:
                le["_id"] = str(le["_id"])
            if "id" not in le:
                le["id"] = str(uuid.uuid4())
                
            g_id = le.get("google_event_id")
            key = g_id if g_id else le.get("id")
            
            merged_events[key] = {
                "id": le.get("id"),
                "name": le.get("name", "No Title"),
                "date": le.get("date"),
                "start": le.get("start"),
                "end": le.get("end"),
                "priority": le.get("priority", "Medium"),
                "description": le.get("description", ""),
                "color": le.get("color", "Default colour"),
                "reminders": le.get("reminders", []),
                "google_event_id": g_id,
                "deleted_from_gcal": le.get("deleted_from_gcal", False)
            }

        # 2. Fetch upcoming events from Google Calendar (if connected)
        user_service = get_google_service(username)
        if user_service:
            try:
                today_date = datetime.now(TIMEZONE).date()
                start_of_today = TIMEZONE.localize(datetime.combine(today_date, datetime.min.time()))
                time_min_str = start_of_today.isoformat()
                
                events_result = user_service.events().list(
                    calendarId="primary",
                    timeMin=time_min_str,
                    timeZone="Asia/Kolkata",
                    maxResults=100,
                    singleEvents=True,
                    orderBy="startTime",
                ).execute()
                google_events = events_result.get("items", [])
                
                for event in google_events:
                    start = event["start"].get("dateTime") or event["start"].get("date")
                    end = event["end"].get("dateTime") or event["end"].get("date")
                    
                    if not start or "T" not in start:
                        continue
                    
                    desc = event.get("description", "")
                    priority = "Medium"
                    custom_desc = desc
                    if "Priority:" in desc:
                        try:
                            parts = desc.split("Priority:")
                            priority = parts[1].strip().split("\n")[0].strip()
                            clean_parts = [line for line in desc.split("\n") if "Priority:" not in line]
                            custom_desc = "\n".join(clean_parts).strip()
                        except Exception:
                            pass
                    
                    color_id = event.get("colorId")
                    color = REVERSE_COLOR_MAP.get(color_id, "Default colour")

                    reminders = []
                    g_reminders = event.get("reminders", {}).get("overrides", [])
                    for r in g_reminders:
                        reminders.append(r.get("minutes"))

                    g_id = event.get("id")
                    
                    # Check if this GCal event is already cached in our local database
                    existing_le = None
                    for le in local_events:
                        if le.get("google_event_id") == g_id:
                            existing_le = le
                            break

                    # If not cached, cache it locally so it is permanently visible in app calendar, dashboard, and analytics
                    if not existing_le:
                        new_id = str(uuid.uuid4())
                        new_doc = {
                            "id": new_id,
                            "username": username,
                            "name": event.get("summary", "No Title"),
                            "date": start.split("T")[0],
                            "start": start.split("T")[1][:5],
                            "end": end.split("T")[1][:5],
                            "priority": priority,
                            "description": custom_desc,
                            "color": color,
                            "reminders": reminders,
                            "google_event_id": g_id,
                            "deleted_from_gcal": False
                        }
                        if db is not None:
                            try:
                                db.events.insert_one(new_doc)
                            except Exception as db_err:
                                pass
                        else:
                            fallback_events.append(new_doc)
                        
                        local_id = new_id
                    else:
                        local_id = existing_le.get("id")
                        # Sync updates from GCal to local DB if fields changed
                        if db is not None:
                            try:
                                db.events.update_one(
                                    {"username": username, "google_event_id": g_id},
                                    {"$set": {
                                        "name": event.get("summary", "No Title"),
                                        "date": start.split("T")[0],
                                        "start": start.split("T")[1][:5],
                                        "end": end.split("T")[1][:5],
                                        "priority": priority,
                                        "description": custom_desc,
                                        "color": color,
                                        "reminders": reminders
                                    }}
                                )
                            except Exception as db_err:
                                pass
                        else:
                            existing_le["name"] = event.get("summary", "No Title")
                            existing_le["date"] = start.split("T")[0]
                            existing_le["start"] = start.split("T")[1][:5]
                            existing_le["end"] = end.split("T")[1][:5]
                            existing_le["priority"] = priority
                            existing_le["description"] = custom_desc
                            existing_le["color"] = color
                            existing_le["reminders"] = reminders

                    merged_events[g_id] = {
                        "id": local_id,
                        "name": event.get("summary", "No Title"),
                        "date": start.split("T")[0],
                        "start": start.split("T")[1][:5],
                        "end": end.split("T")[1][:5],
                        "priority": priority,
                        "description": custom_desc,
                        "color": color,
                        "reminders": reminders,
                        "google_event_id": g_id,
                        "deleted_from_gcal": False
                    }
            except Exception as e:
                pass

        formatted_list = list(merged_events.values())
        return jsonify(formatted_list)

    except Exception as e:
        return jsonify([])


# ADD ASSIGNMENT
@app.route("/addAssignment", methods=["POST"])
def add_assignment():
    data = request.json
    username = data.get("username")
    name = data.get("name")
    subject = data.get("subject")
    deadline = data.get("deadline")

    if not name or not deadline:
        return jsonify({"message": "Name and deadline are required!"}), 400

    # Sync with Google Calendar if connected
    google_event_id = None
    user_service = get_google_service(username)
    if user_service:
        try:
            deadline_dt = datetime.strptime(deadline, "%Y-%m-%d")
            next_day_dt = deadline_dt + timedelta(days=1)
            next_day_str = next_day_dt.strftime("%Y-%m-%d")
            
            title = f"[Assignment] ({subject}) {name}" if subject else f"[Assignment] {name}"
            event_body = {
                "summary": title,
                "description": f"Assignment: {name}\nSubject: {subject if subject else 'None'}\nStatus: Pending",
                "start": {
                    "date": deadline,
                },
                "end": {
                    "date": next_day_str,
                },
                "colorId": "6" # Tangerine (6) for assignments
            }
            
            gevent = user_service.events().insert(calendarId="primary", body=event_body).execute()
            google_event_id = gevent.get("id")
        except Exception as e:
            pass

    assignment_doc = {
        "id": str(uuid.uuid4()),
        "completed": False,
        "completed_at": None,
        "username": username,
        "name": name,
        "subject": subject,
        "deadline": deadline,
        "google_event_id": google_event_id,
        "deleted_from_gcal": False,
        "created_at": datetime.utcnow()
    }

    if db is not None:
        db.assignments.insert_one(assignment_doc)
    else:
        fallback_assignments.append(assignment_doc)

    return jsonify({"message": "Assignment Added"})

# GET ASSIGNMENTS
@app.route("/assignments", methods=["GET"])
def get_assignments():
    username = request.args.get("username")
    try:
        if username:
            try:
                run_completed_events_cleanup(username)
            except Exception as e:
                pass

        if db is not None:
            assignments = list(db.assignments.find({"username": username}))
        else:
            assignments = [a for a in fallback_assignments if a.get("username") == username]

        today = datetime.today().date()
        for a in assignments:
            # Dynamic Migration: ensure old records have an ID and a completed status
            if "id" not in a or a["id"] is None:
                a["id"] = str(uuid.uuid4())
                if db is not None:
                    db.assignments.update_one({"_id": a["_id"]}, {"$set": {"id": a["id"]}})
            if "completed" not in a:
                a["completed"] = False
                if db is not None:
                    db.assignments.update_one({"_id": a["_id"]}, {"$set": {"completed": False}})
            if "completed_at" not in a:
                a["completed_at"] = None
                if db is not None:
                    db.assignments.update_one({"_id": a["_id"]}, {"$set": {"completed_at": None}})
            if "google_event_id" not in a:
                a["google_event_id"] = None
            if "deleted_from_gcal" not in a:
                a["deleted_from_gcal"] = False
            
            # Remove MongoDB ObjectID for serialization
            if "_id" in a:
                del a["_id"]

            try:
                deadline_date = datetime.strptime(a["deadline"], "%Y-%m-%d").date()
                diff = (deadline_date - today).days
                if diff <= 1 and diff >= 0:
                    a["warning"] = "Due Soon!"
            except Exception:
                pass
        return jsonify(assignments)
    except Exception as e:
        return jsonify([])

# UPDATE ASSIGNMENT
@app.route("/updateAssignment", methods=["POST"])
def update_assignment():
    data = request.json
    username = data.get("username")
    assignment_id = data.get("id")
    name = data.get("name")
    subject = data.get("subject")
    deadline = data.get("deadline")

    if not assignment_id:
        return jsonify({"message": "Assignment ID is required!"}), 400

    if not name or not deadline:
        return jsonify({"message": "Name and deadline are required!"}), 400

    # 1. Fetch current assignment to get completed status and google_event_id
    current_assign = None
    if db is not None:
        current_assign = db.assignments.find_one({"username": username, "id": assignment_id})
    else:
        for a in fallback_assignments:
            if a.get("username") == username and a.get("id") == assignment_id:
                current_assign = a
                break

    completed = False
    google_event_id = None
    if current_assign:
        completed = current_assign.get("completed", False)
        google_event_id = current_assign.get("google_event_id")

    # 2. Update on Google Calendar if connected
    user_service = get_google_service(username)
    if user_service and google_event_id:
        try:
            deadline_dt = datetime.strptime(deadline, "%Y-%m-%d")
            next_day_dt = deadline_dt + timedelta(days=1)
            next_day_str = next_day_dt.strftime("%Y-%m-%d")

            status_str = "Completed" if completed else "Pending"
            prefix = "[Completed] " if completed else ""
            title = f"{prefix}[Assignment] ({subject}) {name}" if subject else f"{prefix}[Assignment] {name}"

            event_body = {
                "summary": title,
                "description": f"Assignment: {name}\nSubject: {subject if subject else 'None'}\nStatus: {status_str}",
                "start": {
                    "date": deadline,
                },
                "end": {
                    "date": next_day_str,
                },
                "colorId": "6"
            }
            user_service.events().update(calendarId="primary", eventId=google_event_id, body=event_body).execute()
        except Exception as e:
            pass

    # 3. Update local DB
    update_doc = {
        "name": name,
        "subject": subject,
        "deadline": deadline
    }

    try:
        if db is not None:
            db.assignments.update_one({"username": username, "id": assignment_id}, {"$set": update_doc})
        else:
            for a in fallback_assignments:
                if a.get("username") == username and a.get("id") == assignment_id:
                    a.update(update_doc)
        return jsonify({"message": "Assignment updated successfully", "success": True})
    except Exception as e:
        return jsonify({"message": f"Error updating assignment: {str(e)}", "success": False}), 500

# DELETE ASSIGNMENT
@app.route("/deleteAssignment", methods=["POST"])
def delete_assignment():
    global fallback_assignments
    data = request.json
    username = data.get("username")
    assignment_id = data.get("id")

    if not assignment_id:
        return jsonify({"message": "Assignment ID is required!"}), 400

    # 1. Fetch current assignment to get google_event_id
    current_assign = None
    if db is not None:
        current_assign = db.assignments.find_one({"username": username, "id": assignment_id})
    else:
        for a in fallback_assignments:
            if a.get("username") == username and a.get("id") == assignment_id:
                current_assign = a
                break

    google_event_id = None
    if current_assign:
        google_event_id = current_assign.get("google_event_id")

    # 2. Delete from Google Calendar
    user_service = get_google_service(username)
    if user_service and google_event_id:
        try:
            user_service.events().delete(calendarId="primary", eventId=google_event_id).execute()
        except Exception as e:
            pass

    try:
        if db is not None:
            db.assignments.delete_many({"username": username, "id": assignment_id})
        else:
            fallback_assignments = [
                a for a in fallback_assignments
                if not (a.get("username") == username and a.get("id") == assignment_id)
            ]
        return jsonify({"message": "Assignment deleted successfully", "success": True})
    except Exception as e:
        return jsonify({"message": f"Error deleting assignment: {str(e)}", "success": False}), 500

# TOGGLE ASSIGNMENT COMPLETION
@app.route("/toggleAssignmentComplete", methods=["POST"])
def toggle_assignment_complete():
    data = request.json
    username = data.get("username")
    assignment_id = data.get("id")
    completed = data.get("completed")

    if not assignment_id:
        return jsonify({"message": "Assignment ID is required!"}), 400

    # 1. Fetch current assignment details
    current_assign = None
    if db is not None:
        current_assign = db.assignments.find_one({"username": username, "id": assignment_id})
    else:
        for a in fallback_assignments:
            if a.get("username") == username and a.get("id") == assignment_id:
                current_assign = a
                break

    if not current_assign:
        return jsonify({"message": "Assignment not found!"}), 404

    # Determine next completed state
    new_completed = completed if completed is not None else not current_assign.get("completed", False)
    completed_at = datetime.utcnow() if new_completed else None

    # 2. Update Google Calendar event
    google_event_id = current_assign.get("google_event_id")
    user_service = get_google_service(username)
    if user_service and google_event_id:
        try:
            name = current_assign.get("name")
            subject = current_assign.get("subject")
            deadline = current_assign.get("deadline")
            
            deadline_dt = datetime.strptime(deadline, "%Y-%m-%d")
            next_day_dt = deadline_dt + timedelta(days=1)
            next_day_str = next_day_dt.strftime("%Y-%m-%d")

            status_str = "Completed" if new_completed else "Pending"
            prefix = "[Completed] " if new_completed else ""
            title = f"{prefix}[Assignment] ({subject}) {name}" if subject else f"{prefix}[Assignment] {name}"

            event_body = {
                "summary": title,
                "description": f"Assignment: {name}\nSubject: {subject if subject else 'None'}\nStatus: {status_str}",
                "start": {
                    "date": deadline,
                },
                "end": {
                    "date": next_day_str,
                },
                "colorId": "6"
            }
            user_service.events().update(calendarId="primary", eventId=google_event_id, body=event_body).execute()
        except Exception as e:
            pass

    try:
        update_fields = {"completed": new_completed, "completed_at": completed_at}
        if not new_completed:
            update_fields["deleted_from_gcal"] = False

        if db is not None:
            db.assignments.update_one({"username": username, "id": assignment_id}, {"$set": update_fields})
        else:
            for a in fallback_assignments:
                if a.get("username") == username and a.get("id") == assignment_id:
                    a.update(update_fields)
        return jsonify({"message": "Assignment completion status toggled", "success": True, "completed": new_completed})
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}", "success": False}), 500

def run_keyword_fallback(question, username):
    question_lower = question.lower()
    selected_date = detect_date(question_lower)
    events = get_events_for_date_by_user(selected_date, username)

    if "event" in question_lower or "meeting" in question_lower:
        if not events:
            return f"No events scheduled for {selected_date}."
        else:
            replies = [f"- {e.get('summary', 'No title')}" for e in events]
            return "Here are your events:\n" + "\n".join(replies)
            
    elif "free" in question_lower:
        slots = find_free_time(selected_date, events)
        replies = [f"- Free slot: {s}" for s in slots]
        return "Here is your free time:\n" + "\n".join(replies)
        
    elif "assignment" in question_lower:
        if db is not None:
            assignments = list(db.assignments.find({"username": username, "deadline": selected_date.isoformat()}, {"_id": 0}))
        else:
            assignments = [a for a in fallback_assignments if a.get("username") == username and a["deadline"] == selected_date.isoformat()]
            
        if not assignments:
            return f"No assignments due on {selected_date}."
        else:
            replies = [f"- {a['name']} ({a.get('subject', 'N/A')})" for a in assignments]
            return "Here are your assignments:\n" + "\n".join(replies)
            
    else:
        return "Try asking: 'free time tomorrow', 'today events', or 'tomorrow assignments'. Note: You can unlock state-of-the-art Llama 3 or Mistral AI by selecting OpenRouter or Ollama in the settings sidebar!"

# GOALS ENDPOINTS
@app.route("/goals", methods=["GET"])
def get_goals():
    username = request.args.get("username", "").strip()
    if not username:
        return jsonify([])
    try:
        if db is not None:
            goals = list(db.goals.find({"username": username}))
            for g in goals:
                if "_id" in g:
                    g["_id"] = str(g["_id"])
            return jsonify(goals)
        else:
            goals = [g for g in fallback_goals if g.get("username") == username]
            return jsonify(goals)
    except Exception as e:
        return jsonify([])

@app.route("/addGoal", methods=["POST"])
def add_goal():
    data = request.json or {}
    username = data.get("username", "").strip()
    name = data.get("name", "").strip() or data.get("goal", "").strip()
    progress = int(data.get("progress", 0))

    if not username or not name:
        return jsonify({"message": "Goal name and username are required!"}), 400

    goal_doc = {
        "id": str(uuid.uuid4()),
        "username": username,
        "goal": name,
        "progress": progress,
        "created_at": datetime.utcnow()
    }
    try:
        if db is not None:
            db.goals.insert_one(goal_doc)
        else:
            fallback_goals.append(goal_doc)
        return jsonify({"message": "Goal added successfully", "success": True})
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

@app.route("/updateGoal", methods=["POST"])
def update_goal():
    data = request.json or {}
    username = data.get("username", "").strip()
    goal_id = data.get("id")
    name = data.get("name", "").strip() or data.get("goal", "").strip()
    progress = int(data.get("progress", 0))

    if not goal_id or not username:
        return jsonify({"message": "Goal ID and username are required!"}), 400

    try:
        update_fields = {"progress": progress}
        if name:
            update_fields["goal"] = name

        if db is not None:
            db.goals.update_one({"username": username, "id": goal_id}, {"$set": update_fields})
        else:
            for g in fallback_goals:
                if g.get("username") == username and g.get("id") == goal_id:
                    g.update(update_fields)
        return jsonify({"message": "Goal updated successfully", "success": True})
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500

@app.route("/deleteGoal", methods=["POST"])
def delete_goal():
    global fallback_goals
    data = request.json or {}
    username = data.get("username", "").strip()
    goal_id = data.get("id")

    if not goal_id or not username:
        return jsonify({"message": "Goal ID and username are required!"}), 400

    try:
        if db is not None:
            db.goals.delete_many({"username": username, "id": goal_id})
        else:
            fallback_goals = [g for g in fallback_goals if not (g.get("username") == username and g.get("id") == goal_id)]
        return jsonify({"message": "Goal deleted successfully", "success": True})
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


# ANALYTICS ENDPOINT
@app.route("/api/analytics/data", methods=["GET"])
def get_analytics_data():
    username = request.args.get("username", "").strip()
    if not username:
        return jsonify({"message": "Username parameter is required"}), 400

    try:
        # Fetch events
        events = []
        if db is not None:
            events = list(db.events.find({"username": username}))
        else:
            events = [e for e in fallback_events if e.get("username") == username]

        # Fetch assignments
        assignments = []
        if db is not None:
            assignments = list(db.assignments.find({"username": username}))
        else:
            assignments = [a for a in fallback_assignments if a.get("username") == username]

        # Fetch goals
        goals = []
        if db is not None:
            goals = list(db.goals.find({"username": username}))
        else:
            goals = [g for g in fallback_goals if g.get("username") == username]

        # Aggregate stats
        total_events = len(events)
        total_assignments = len(assignments)
        total_goals = len(goals)
        completed_goals = len([g for g in goals if int(g.get("progress", 0)) >= 100])

        productivity = min(
            100,
            (total_events * 5) + (total_assignments * 3) + (completed_goals * 15)
        )

        # Event category aggregation
        cat_counts = {}
        for e in events:
            cat = e.get("category") or "General"
            cat_counts[cat] = cat_counts.get(cat, 0) + 1

        # Event priority aggregation
        epri_counts = {"High": 0, "Medium": 0, "Low": 0}
        for e in events:
            pri = e.get("priority") or "Medium"
            if pri in epri_counts:
                epri_counts[pri] += 1
            else:
                epri_counts[pri] = epri_counts.get(pri, 0) + 1

        # Assignment priority/urgency aggregation
        apri_counts = {"High": 0, "Medium": 0, "Low": 0}
        for a in assignments:
            pri = a.get("priority") or "Medium"
            if pri in apri_counts:
                apri_counts[pri] += 1
            else:
                apri_counts[pri] = apri_counts.get(pri, 0) + 1

        # Goals progress summary
        goals_summary = []
        for g in goals:
            goals_summary.append({
                "id": g.get("id"),
                "goal": g.get("goal"),
                "progress": int(g.get("progress", 0))
            })

        # Upcoming deadlines
        today = datetime.now(TIMEZONE).date()
        upcoming = []
        for a in assignments:
            if a.get("completed"):
                continue
            try:
                deadline_str = a.get("deadline")
                due = datetime.strptime(deadline_str, "%Y-%m-%d").date()
                days_left = (due - today).days
                if days_left <= 7:
                    upcoming.append({
                        "id": a.get("id"),
                        "name": a.get("name"),
                        "subject": a.get("subject", ""),
                        "deadline": deadline_str,
                        "daysLeft": days_left,
                        "status": "urgent" if days_left <= 2 else "warning"
                    })
            except Exception as ex:
                pass

        # Sort upcoming by days left
        upcoming = sorted(upcoming, key=lambda x: x["daysLeft"])

        # Compile weekly trend: events per day for the last 7 days or matching events
        trend_counts = {}
        for e in events:
            d_str = e.get("date")
            if d_str:
                trend_counts[d_str] = trend_counts.get(d_str, 0) + 1

        return jsonify({
            "summary": {
                "totalEvents": total_events,
                "totalAssignments": total_assignments,
                "totalGoals": total_goals,
                "completedGoals": completed_goals,
                "productivity": productivity
            },
            "eventCategories": cat_counts,
            "eventPriorities": epri_counts,
            "assignmentUrgency": apri_counts,
            "goals": goals_summary,
            "upcomingDeadlines": upcoming,
            "weeklyTrend": trend_counts
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"Server error aggregating analytics: {str(e)}"}), 500


# AI SCHEDULER ENDPOINT
@app.route("/api/ai/schedule", methods=["POST"])
def api_ai_schedule():
    data = request.json or {}
    username = data.get("username", "").strip()
    duration = int(data.get("duration", 7))
    study_hours = int(data.get("studyHours", 4))
    schedule_type = data.get("scheduleType", "Balanced Study Plan")
    intensity = data.get("intensity", "Moderate")

    if not username:
        return jsonify({"message": "Username is required!"}), 400

    # Load stored AI settings as fallbacks
    stored_engine = "keyword"
    stored_model = ""
    stored_or_key = ""
    stored_hf_token = ""

    if db is not None:
        try:
            user_doc = db.users.find_one({"$or": [{"username": username}, {"email": username}]})
            if user_doc:
                stored_engine = user_doc.get("aiEngine", "keyword")
                stored_model = user_doc.get("aiModel", "")
                stored_or_key = user_doc.get("openrouterKey", "")
                stored_hf_token = user_doc.get("huggingfaceToken", "")
        except Exception:
            pass
    else:
        user_doc = in_memory_profiles.get(username) or fallback_users.get(username)
        if not user_doc:
            user_doc = next((u for u in fallback_users.values() if u.get("email") == username), None)
        if user_doc:
            stored_engine = user_doc.get("aiEngine", "keyword")
            stored_model = user_doc.get("aiModel", "")
            stored_or_key = user_doc.get("openrouterKey", "")
            stored_hf_token = user_doc.get("huggingfaceToken", "")

    ai_engine = data.get("aiEngine") or stored_engine
    ai_model = data.get("aiModel") or stored_model
    or_key = data.get("openrouterKey") or stored_or_key
    hf_token = data.get("huggingfaceToken") or stored_hf_token

    env_or_key = os.environ.get("OPENROUTER_API_KEY") or app_config.get("OPENROUTER_API_KEY", "")
    env_hf_token = os.environ.get("HUGGINGFACE_TOKEN") or app_config.get("HUGGINGFACE_TOKEN", "")

    active_or_key = or_key or env_or_key
    active_hf_token = hf_token or env_hf_token

    # Gather context
    user_events = []
    if db is not None:
        try:
            user_events = list(db.events.find({"username": username}))
        except Exception:
            pass
    else:
        user_events = [e for e in fallback_events if e.get("username") == username]

    user_assigns = []
    if db is not None:
        try:
            user_assigns = list(db.assignments.find({"username": username}))
        except Exception:
            pass
    else:
        user_assigns = [a for a in fallback_assignments if a.get("username") == username]

    user_goals = []
    if db is not None:
        try:
            user_goals = list(db.goals.find({"username": username}))
        except Exception:
            pass
    else:
        user_goals = [g for g in fallback_goals if g.get("username") == username]

    # Format summaries
    events_summary = []
    for e in user_events:
        events_summary.append(
            f"- {e.get('name')} on {e.get('date')} from {e.get('start')} to {e.get('end')} (Priority: {e.get('priority', 'Medium')})"
        )
    events_text = "\n".join(events_summary) if events_summary else "No scheduled events."

    assign_summary = []
    for a in user_assigns:
        status = "Completed" if a.get("completed") else "Pending"
        assign_summary.append(
            f"- Subject: {a.get('subject', 'General')}, Assignment: {a.get('name')}, Deadline: {a.get('deadline')}, Priority: {a.get('priority', 'Medium')}, Status: {status}"
        )
    assignments_text = "\n".join(assign_summary) if assign_summary else "No assignments."

    goals_summary = []
    for g in user_goals:
        goals_summary.append(
            f"- Goal: {g.get('goal')}, Progress: {g.get('progress', 0)}% completed"
        )
    goals_text = "\n".join(goals_summary) if goals_summary else "No specific goals set."

    # Rules-based offline schedule generator fallback helper
    def generate_rules_based_fallback():
        plan_lines = []
        plan_lines.append(f"# {schedule_type} (Offline / Rule-Based Fallback)")
        plan_lines.append(f"Generated for: **{username}** | Intensity: **{intensity}** | Target: **{study_hours} hrs/day**\n")
        plan_lines.append(">  **Tip:** Configure Ollama locally or insert your OpenRouter API Key in the settings panel to unlock advanced AI scheduling customized dynamically down to the hour!\n")

        today = datetime.now(TIMEZONE).date()

        pending_assigns = [a for a in user_assigns if not a.get("completed")]
        high_priority_assigns = [a for a in pending_assigns if a.get("priority") == "High"]
        other_assigns = [a for a in pending_assigns if a.get("priority") != "High"]

        tasks_pool = []
        for h in high_priority_assigns:
            tasks_pool.append(f"Work on High-Priority Assignment: **{h.get('name')}** (Subject: {h.get('subject', 'General')})")
        for g in user_goals:
            if int(g.get("progress", 0)) < 100:
                tasks_pool.append(f"Focus on Goal: **{g.get('goal')}** (Progress: {g.get('progress', 0)}%)")
        for o in other_assigns:
            tasks_pool.append(f"Review Assignment: **{o.get('name')}**")

        if not tasks_pool:
            tasks_pool.append("Self-study: Revise recently completed assignments and projects.")
            tasks_pool.append("Skill Building: Read academic resources or watch educational tutorials.")

        for day_idx in range(duration):
            curr_date = today + timedelta(days=day_idx)
            curr_date_str = curr_date.strftime("%A, %B %d, %Y")

            plan_lines.append(f"###  Day {day_idx + 1}: {curr_date_str}")

            day_events = [e for e in user_events if e.get("date") == curr_date.isoformat()]
            if day_events:
                plan_lines.append("  *Note: Existing events scheduled for today:*")
                for de in day_events:
                    plan_lines.append(f"  -  **{de.get('name')}** ({de.get('start')} - {de.get('end')})")

            slot_duration = max(1, study_hours // 2)
            task_today = tasks_pool[day_idx % len(tasks_pool)]

            plan_lines.append(f"  -  **Morning Study Session** (09:00 - {9 + slot_duration:02d}:00): {task_today} ({slot_duration} hrs)")
            plan_lines.append("  -  **Break / Active Rest** (30 mins): Take a short walk, hydrate.")

            if study_hours > slot_duration:
                rem_hours = study_hours - slot_duration
                next_task = tasks_pool[(day_idx + 1) % len(tasks_pool)]
                plan_lines.append(f"  -  **Evening Study Session** (16:00 - {16 + rem_hours:02d}:00): {next_task} ({rem_hours} hrs)")

            plan_lines.append("  -  **Daily Review**: Spend 15 minutes reviewing today's progress and planning for tomorrow.\n")

        return "\n".join(plan_lines)

    if ai_engine == "keyword":
        return jsonify({"plan": generate_rules_based_fallback(), "engine": "fallback"})

    system_prompt = "You are an expert academic counselor and schedule optimizer."

    user_prompt = f"""
Student Username/Name: {username}

EXISTING CALENDAR EVENTS:
{events_text}

ASSIGNMENTS TO COMPLETE:
{assignments_text}

STUDY GOALS TO TRACK:
{goals_text}

SCHEDULING PREFERENCES:
- Schedule Duration: {duration} days
- Daily Study Hours: {study_hours} hours per day
- Schedule Type: {schedule_type}
- Intensity: {intensity}

RULES:
1. Prioritize high-priority assignments and upcoming deadlines.
2. Respect and avoid scheduling during the user's existing calendar events.
3. Include structured study slots, revision blocks, and regular active rest breaks (e.g. Pomodoro breaks).
4. Keep the workload manageable and balanced according to the specified intensity ('Light' = lighter topics, more breaks; 'Moderate' = balanced study and reviews; 'Intensive' = core study sessions, shorter revision times).
5. Suggest the best times of day to study based on events.
6. Return the plan in a clean, day-by-day formatted Markdown structure with headers and bullet points. Use bolding to emphasize tasks.
"""

    import requests

    if ai_engine == "ollama":
        ollama_model = ai_model or "llama3"
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        try:
            res = requests.post(
                "http://localhost:11434/api/chat",
                json={
                    "model": ollama_model,
                    "messages": messages,
                    "stream": False
                },
                timeout=15
            )
            if res.status_code == 200:
                reply = res.json()["message"]["content"]
                return jsonify({"plan": reply, "engine": "ollama"})
            else:
                raise Exception(f"Ollama returned status code {res.status_code}")
        except Exception as e:
            tip = f"**[System Alert: Unable to reach local Ollama on http://localhost:11434. Fallback generated below]**\n\n" + generate_rules_based_fallback()
            return jsonify({"plan": tip, "engine": "fallback"})

    elif ai_engine == "openrouter":
        openrouter_model = ai_model or "openrouter/free"

        is_fake_key = not active_or_key or active_or_key.strip().lower() in ["", "none", "null", "test_sk_key_123"] or active_or_key.startswith("test_")
        if is_fake_key:
            tip = f"**[System Alert: OpenRouter selected, but no API key is configured. Open settings to paste your API key. Fallback generated below]**\n\n" + generate_rules_based_fallback()
            return jsonify({"plan": tip, "engine": "fallback"})

        headers = {
            "Authorization": f"Bearer {active_or_key.strip()}",
            "HTTP-Referer": "http://127.0.0.1:3000",
            "X-Title": "Smart Timetable AI Scheduler",
            "Content-Type": "application/json"
        }
        payload = {
            "model": openrouter_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        }
        try:
            res = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=25
            )
            if res.status_code == 200:
                reply = res.json()["choices"][0]["message"]["content"]
                return jsonify({"plan": reply, "engine": "openrouter"})
            else:
                raise Exception(f"API Error {res.status_code}: {res.text}")
        except Exception as e:
            tip = f"**[System Alert: OpenRouter connection failed ({str(e)}). Fallback generated below]**\n\n" + generate_rules_based_fallback()
            return jsonify({"plan": tip, "engine": "fallback"})

    elif ai_engine == "huggingface":
        hf_model = ai_model or "meta-llama/Meta-Llama-3-8B-Instruct"

        if not active_hf_token:
            tip = f"**[System Alert: Hugging Face selected, but no token configured. Fallback generated below]**\n\n" + generate_rules_based_fallback()
            return jsonify({"plan": tip, "engine": "fallback"})

        headers = {
            "Authorization": f"Bearer {active_hf_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": hf_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "max_tokens": 1024
        }
        try:
            res = requests.post(
                f"https://api-inference.huggingface.co/models/{hf_model}/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=25
            )
            if res.status_code == 200:
                reply = res.json()["choices"][0]["message"]["content"]
                return jsonify({"plan": reply, "engine": "huggingface"})
            else:
                raise Exception(f"API Error {res.status_code}: {res.text}")
        except Exception as e:
            tip = f"**[System Alert: Hugging Face connection failed ({str(e)}). Fallback generated below]**\n\n" + generate_rules_based_fallback()
            return jsonify({"plan": tip, "engine": "fallback"})

    return jsonify({"plan": generate_rules_based_fallback(), "engine": "fallback"})


# AI ASSISTANT
@app.route("/askAI", methods=["POST"])
def ask_ai():
    data = request.json or {}
    username = data.get("username")
    question = data.get("question", "")
    
    if not question:
        return jsonify({"reply": "Please ask a valid question!"})

    # 1. Load stored AI settings as fallbacks
    stored_engine = "keyword"
    stored_model = ""
    stored_or_key = ""
    stored_hf_token = ""
    
    if db is not None:
        try:
            user_doc = db.users.find_one({"$or": [{"username": username}, {"email": username}]})
            if user_doc:
                stored_engine = user_doc.get("aiEngine", "keyword")
                stored_model = user_doc.get("aiModel", "")
                stored_or_key = user_doc.get("openrouterKey", "")
                stored_hf_token = user_doc.get("huggingfaceToken", "")
        except Exception:
            pass
    else:
        user_doc = in_memory_profiles.get(username) or fallback_users.get(username)
        if not user_doc:
            user_doc = next((u for u in fallback_users.values() if u.get("email") == username), None)
        if user_doc:
            stored_engine = user_doc.get("aiEngine", "keyword")
            stored_model = user_doc.get("aiModel", "")
            stored_or_key = user_doc.get("openrouterKey", "")
            stored_hf_token = user_doc.get("huggingfaceToken", "")

    # Merge request payload parameters with stored profile configurations
    ai_engine = data.get("aiEngine") or stored_engine
    ai_model = data.get("aiModel") or stored_model
    or_key = data.get("openrouterKey") or stored_or_key
    hf_token = data.get("huggingfaceToken") or stored_hf_token
    
    # Environment variable/config file fallbacks for zero-setup deployment
    env_or_key = os.environ.get("OPENROUTER_API_KEY") or app_config.get("OPENROUTER_API_KEY", "")
    env_hf_token = os.environ.get("HUGGINGFACE_TOKEN") or app_config.get("HUGGINGFACE_TOKEN", "")
    
    active_or_key = or_key or env_or_key
    active_hf_token = hf_token or env_hf_token

    # If simple keyword parser is selected, route instantly to save CPU/network
    if ai_engine == "keyword":
        return jsonify({"reply": run_keyword_fallback(question, username)})

    # 2. Gather LIVE schedule context
    user_events = []
    if db is not None:
        try:
            user_events = list(db.events.find({"username": username}))
        except Exception:
            pass
    else:
        user_events = [e for e in fallback_events if e.get("username") == username]

    user_assigns = []
    if db is not None:
        try:
            user_assigns = list(db.assignments.find({"username": username}))
        except Exception:
            pass
    else:
        user_assigns = [a for a in fallback_assignments if a.get("username") == username]

    # Format summaries for events and assignments
    events_summary = []
    for e in user_events:
        events_summary.append(
            f"- {e.get('name')} on {e.get('date')} from {e.get('start')} to {e.get('end')} (Priority: {e.get('priority', 'Medium')}, Description: {e.get('description', '')})"
        )
    events_text = "\n".join(events_summary) if events_summary else "No scheduled events."

    assign_summary = []
    for a in user_assigns:
        status = "Completed" if a.get("completed") else "Pending"
        overdue_str = ""
        if not a.get("completed"):
            try:
                deadline_dt = datetime.strptime(a["deadline"], "%Y-%m-%d").date()
                if deadline_dt < datetime.today().date():
                     overdue_str = " [OVERDUE!]"
            except Exception:
                pass
        assign_summary.append(
            f"- Subject: {a.get('subject', 'General')}, Assignment: {a.get('name')}, Deadline: {a.get('deadline')}, Status: {status}{overdue_str}"
        )
    assignments_text = "\n".join(assign_summary) if assign_summary else "No assignments."

    # Parse productivity metrics passed by frontend
    metrics = data.get("metrics") or {}
    streak = metrics.get("streak", 0)
    active_days = metrics.get("activeDays", 0)
    duration_map = metrics.get("durationMap", {})

    now_local = datetime.now(TIMEZONE)
    now_local_str = now_local.strftime("%A, %B %d, %Y, %I:%M %p")

    # 3. Construct System Prompt
    system_prompt = f"""You are the ultimate Smart Timetable AI Assistant. You have complete real-time awareness of the user's schedule, assignments, productivity streak, and app active usage metrics.
Today's local date and time: {now_local_str} (Asia/Kolkata).

USER PRODUCTIVITY METRICS:
- Active Streak: {streak} Days
- Active Days (Heatmap cells): {active_days} / 35 Days
- App Usage active durations by day: {json.dumps(duration_map)}

USER CALENDAR EVENTS:
{events_text}

USER ASSIGNMENTS:
{assignments_text}

INSTRUCTIONS:
1. Analyze the user's question with full calendar-awareness.
2. Identify conflicts, summarize daily schedules, recommend free blocks, and provide encouraging action plans to tackle overdue or pending assignments.
3. Be highly actionable, professional, and supportive.
4. Format responses cleanly in markdown with concise bullet points, bold key highlights, and bold warnings for overdue deadlines.
5. Address the user directly and keep responses engaging and clear.
"""

    # 4. Query the chosen AI Engine
    import requests
    
    # A. OLLAMA LOCAL ENGINE
    if ai_engine == "ollama":
        ollama_model = ai_model or "llama3"
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ]
        try:
            res = requests.post(
                "http://localhost:11434/api/chat",
                json={
                    "model": ollama_model,
                    "messages": messages,
                    "stream": False
                },
                timeout=12
            )
            if res.status_code == 200:
                reply = res.json()["message"]["content"]
                return jsonify({"reply": reply})
            else:
                raise Exception(f"Ollama returned status code {res.status_code}")
        except Exception as e:
            keyword_reply = run_keyword_fallback(question, username)
            tip = f"[System Alert: Unable to reach local Ollama on http://localhost:11434. Make sure Ollama is running and model '{ollama_model}' is pulled (run `ollama pull {ollama_model}`). Offline fallback response follows:]\n\n{keyword_reply}"
            return jsonify({"reply": tip})

    # B. OPENROUTER CLOUD ENGINE
    elif ai_engine == "openrouter":
        openrouter_model = ai_model or "openrouter/free"
        
        # Guard against empty, unconfigured, or obvious mock/test keys
        is_fake_key = not active_or_key or active_or_key.strip().lower() in ["", "none", "null", "test_sk_key_123"] or active_or_key.startswith("test_")
        if is_fake_key:
            keyword_reply = run_keyword_fallback(question, username)
            tip = f"[System Alert: OpenRouter selected, but no valid API key is configured. Open the Settings panel ( Configure) in the sidebar to paste a free OpenRouter key, or set an environment key on the server. Offline fallback response follows:]\n\n{keyword_reply}"
            return jsonify({"reply": tip})
            
        headers = {
            "Authorization": f"Bearer {active_or_key.strip()}",
            "HTTP-Referer": "http://127.0.0.1:3000",
            "X-Title": "Smart Timetable Deployed AI",
            "Content-Type": "application/json"
        }
        payload = {
            "model": openrouter_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ]
        }
        try:
            res = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=18
            )
            if res.status_code == 200:
                reply = res.json()["choices"][0]["message"]["content"]
                return jsonify({"reply": reply})
            elif res.status_code == 401:
                keyword_reply = run_keyword_fallback(question, username)
                tip = f"[System Alert: OpenRouter rejected your API key (API Error 401: Unauthorized). Please check that your key is valid and has not expired, or clear the API Key box in the settings sidebar to use the server's default shared key if configured. Offline fallback response follows:]\n\n{keyword_reply}"
                return jsonify({"reply": tip})
            elif res.status_code == 429:
                keyword_reply = run_keyword_fallback(question, username)
                tip = f"[System Alert: This specific free model is currently experiencing high global traffic and is rate-limited (API Error 429: Rate Limit). Please switch to a different model in the settings dropdown (like Google Gemma 2 9B or Mistral 7B) which will respond instantly! Offline fallback response follows:]\n\n{keyword_reply}"
                return jsonify({"reply": tip})
            else:
                err_text = res.text
                try:
                    err_json = res.json()
                    err_text = err_json.get("error", {}).get("message", res.text)
                except Exception:
                    pass
                raise Exception(f"API Error {res.status_code}: {err_text}")
        except Exception as e:
            keyword_reply = run_keyword_fallback(question, username)
            tip = f"[System Alert: OpenRouter connection failed ({str(e)}). Offline fallback response follows:]\n\n{keyword_reply}"
            return jsonify({"reply": tip})

    # C. HUGGING FACE SERVERLESS ENGINE
    elif ai_engine == "huggingface":
        hf_model = ai_model or "meta-llama/Meta-Llama-3-8B-Instruct"
        
        if not active_hf_token:
            keyword_reply = run_keyword_fallback(question, username)
            tip = f"[System Alert: Hugging Face selected, but no User Access Token is configured. Open the Settings in your AI sidebar to paste your free token. Offline fallback response follows:]\n\n{keyword_reply}"
            return jsonify({"reply": tip})
            
        headers = {
            "Authorization": f"Bearer {active_hf_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": hf_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            "max_tokens": 512
        }
        try:
            res = requests.post(
                f"https://api-inference.huggingface.co/models/{hf_model}/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=18
            )
            if res.status_code == 200:
                reply = res.json()["choices"][0]["message"]["content"]
                return jsonify({"reply": reply})
            else:
                raise Exception(f"API Error {res.status_code}: {res.text}")
        except Exception as e:
            keyword_reply = run_keyword_fallback(question, username)
            tip = f"[System Alert: Hugging Face connection failed ({str(e)}). Offline fallback response follows:]\n\n{keyword_reply}"
            return jsonify({"reply": tip})

    # Default fallback
    return jsonify({"reply": run_keyword_fallback(question, username)})

# DELETE EVENT
@app.route("/deleteEvent", methods=["POST"])
def delete_event():
    data = request.json
    username = data.get("username")
    event_id = data.get("id")
    google_event_id = data.get("google_event_id")

    if not event_id and not google_event_id:
        return jsonify({"message": "Event ID is required!"}), 400

    try:
        # 1. Delete from Google Calendar if connected
        user_service = get_google_service(username)
        if user_service and google_event_id:
            try:
                user_service.events().delete(calendarId="primary", eventId=google_event_id).execute()
            except Exception as e:
                pass

        # 2. Delete from MongoDB or local cache
        deleted = False
        if db is not None:
            from bson import ObjectId
            query = {}
            if google_event_id:
                query["google_event_id"] = google_event_id
            elif event_id:
                try:
                    query["_id"] = ObjectId(event_id)
                except Exception:
                    query["id"] = event_id
            
            res = db.events.delete_many({"username": username, **query})
            deleted = res.deleted_count > 0
        else:
            global fallback_events
            length_before = len(fallback_events)
            fallback_events = [
                e for e in fallback_events 
                if not (e.get("username") == username and 
                        (e.get("google_event_id") == google_event_id if google_event_id else e.get("id") == event_id))
            ]
            deleted = len(fallback_events) < length_before

        return jsonify({"message": "Event deleted successfully", "success": True})
    except Exception as e:
        return jsonify({"message": f"Error deleting event: {str(e)}", "success": False}), 500


# UPDATE EVENT
@app.route("/updateEvent", methods=["POST"])
def update_event():
    data = request.json
    username = data.get("username")
    event_id = data.get("id")
    google_event_id = data.get("google_event_id")

    name = data.get("name")
    date_str = data.get("date")
    start_str = data.get("start")
    end_str = data.get("end")
    priority = data.get("priority", "Medium")
    description = data.get("description", "")
    color = data.get("color", "Default colour")
    category = data.get("category", "General")
    reminders = data.get("reminders", [])

    if not event_id and not google_event_id:
        return jsonify({"message": "Event ID is required!"}), 400

    if not name or not date_str or not start_str or not end_str:
        return jsonify({"message": "Missing event fields!"}), 400

    try:
        selected_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        start_time = datetime.strptime(start_str, "%H:%M").time()
        end_time = datetime.strptime(end_str, "%H:%M").time()
        
        new_start = TIMEZONE.localize(datetime.combine(selected_date, start_time))
        new_end = TIMEZONE.localize(datetime.combine(selected_date, end_time))

        # Check date (past validation)
        today = datetime.now(TIMEZONE).date()
        if selected_date < today:
            return jsonify({"message": "Cannot schedule events in the past!"}), 400

        # Check conflict (excluding current event if possible)
        events = get_events_for_date_by_user(selected_date, username)
        other_events = [e for e in events if e.get("id") != google_event_id and e.get("id") != event_id]
        if has_conflict(new_start, new_end, other_events):
            return jsonify({"message": "Conflict detected with another event!"}), 200

        # 1. Update in Google Calendar if connected
        user_service = get_google_service(username)
        if user_service and google_event_id:
            try:
                # Sync priority into description for native calendar readers if custom description is empty
                desc_val = description
                if not desc_val:
                    desc_val = f"Priority: {priority}"
                else:
                    desc_val = f"{description}\n\nPriority: {priority}"

                event_body = {
                    "summary": name,
                    "description": desc_val,
                    "start": {
                        "dateTime": new_start.isoformat(),
                        "timeZone": "Asia/Kolkata",
                    },
                    "end": {
                        "dateTime": new_end.isoformat(),
                        "timeZone": "Asia/Kolkata",
                    },
                }
                g_color_id = COLOR_MAP.get(color)
                if g_color_id:
                    event_body["colorId"] = g_color_id

                event_body["reminders"] = {
                    "useDefault": False,
                    "overrides": [{"method": "popup", "minutes": int(mins)} for mins in reminders if str(mins).isdigit()]
                }
                user_service.events().update(calendarId="primary", eventId=google_event_id, body=event_body).execute()
            except Exception as e:
                pass

        # 2. Update local DB / cache
        update_doc = {
            "name": name,
            "date": date_str,
            "start": start_str,
            "end": end_str,
            "priority": priority,
            "category": category,
            "description": description,
            "color": color,
            "reminders": reminders
        }

        if db is not None:
            from bson import ObjectId
            query = {}
            if google_event_id:
                query["google_event_id"] = google_event_id
            elif event_id:
                try:
                    query["_id"] = ObjectId(event_id)
                except Exception:
                    query["id"] = event_id

            db.events.update_one({"username": username, **query}, {"$set": update_doc})
        else:
            for e in fallback_events:
                if e.get("username") == username and (e.get("google_event_id") == google_event_id if google_event_id else e.get("id") == event_id):
                    e.update(update_doc)

        return jsonify({"message": "Event updated successfully", "success": True})
    except Exception as e:
        return jsonify({"message": f"Error updating event: {str(e)}", "success": False}), 500


# BACKGROUND CLEANUP ENGINE
import threading
import time

def background_cleanup_loop():
    while True:
        try:
            # Run every 10 minutes
            time.sleep(600)
            
            # Fetch all unique users
            users_to_clean = []
            if db is not None:
                users_to_clean = db.users.distinct("username")
            else:
                users_to_clean = list(user_tokens.keys())
                
            for username in users_to_clean:
                run_completed_events_cleanup(username)
        except Exception as e:
            pass

# Start cleanup thread
cleanup_thread = threading.Thread(target=background_cleanup_loop, daemon=True)
cleanup_thread.start()

# RUN SERVER
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    debug = os.environ.get("RENDER") is None  # disable debug on Render
    app.run(host="0.0.0.0", port=port, debug=debug)
