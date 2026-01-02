from flask import Flask, request, jsonify, render_template
import ollama
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime, timezone
import uuid

# Load environment variables
load_dotenv()

# MongoDB Connection & Mock Fallback
class MockCollection:
    def __init__(self):
        self.data = {} # session_id -> document
    def find_one(self, query):
        for doc in self.data.values():
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None
    def insert_one(self, doc):
        self.data[doc['session_id']] = doc
    def update_one(self, query, update):
        doc = self.find_one(query)
        if doc:
            if "$set" in update:
                doc.update(update["$set"])
            if "$push" in update:
                for k, v in update["$push"].items():
                    if "$each" in v:
                        doc[k].extend(v["$each"])
                    else:
                        doc[k].append(v)
    def delete_one(self, query):
        doc = self.find_one(query)
        if doc:
            del self.data[doc['session_id']]
    def find(self, query):
        results = []
        for doc in self.data.values():
            # Handle simple NE (not equal) queries for sidebar
            match = True
            for k, v in query.items():
                if isinstance(v, dict) and "$ne" in v:
                    if doc.get(k) == v["$ne"]: match = False
                elif doc.get(k) != v:
                    match = False
            if match: results.append(doc)
        
        # Mock Cursor with sort/limit
        class MockCursor:
            def __init__(self, items): self.items = items
            def sort(self, key, direction=-1):
                # Safe sort that handles missing keys (defaulting to 0/min) to avoid TypeError
                self.items.sort(key=lambda x: x.get(key, 0), reverse=(direction<0))
                return self
            def limit(self, n):
                self.items = self.items[:n]
                return self
            def __iter__(self): return iter(self.items)
            def __list__(self): return self.items
        return MockCursor(results)

try:
    # Using tlsAllowInvalidCertificates=True to bypass SSL errors (Likely environment issue)
    mongo_client = MongoClient(os.getenv("MONGO_URI"), tlsAllowInvalidCertificates=True)
    # Trigger a connection to verify
    mongo_client.admin.command('ping')
    print("MongoDB connected")
    db = mongo_client.chatbot_db
    sessions_collection = db.sessions
except Exception as e:
    print(f"MongoDB Connection Error: {e}")
    print("Using In-Memory Mock Database (Fallback)")
    sessions_collection = MockCollection()

# Groq API key is no longer needed, but keeping the load_dotenv for other env vars
# api_key = os.getenv("GROQ_API_KEY") 


from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# --- Helper Functions ---

def get_session(session_id):
    if sessions_collection is None: return None
    return sessions_collection.find_one({"session_id": session_id})

def create_session():
    try:
        if sessions_collection is None: 
            return str(uuid.uuid4()) # Fallback
        
        session_id = str(uuid.uuid4())
        new_session = {
            "session_id": session_id,
            "title": "New Chat",
            "messages": [{"role": "system", "content": "You are Aurora, a professional AI assistant. Respond clearly and concisely. Use **bold** for key points and bullet points for lists. Always be helpful and professional."}],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "is_pinned": False,
            "is_archived": False
        }
        sessions_collection.insert_one(new_session)
        return session_id
    except Exception as e:
        print(f"Error creating session: {e}")
        return str(uuid.uuid4())

def update_session_messages(session_id, new_messages):
    if sessions_collection is None: return
    
    update_data = {
        "$push": {"messages": {"$each": new_messages}},
        "$set": {"updated_at": datetime.now(timezone.utc)}
    }
    
    current = sessions_collection.find_one({"session_id": session_id})
    if current and current.get('title') == "New Chat":
        for msg in new_messages:
            if msg['role'] == 'user':
                update_data["$set"]["title"] = msg['content'][:30] + "..." if len(msg['content']) > 30 else msg['content']
                break
                
    sessions_collection.update_one({"session_id": session_id}, update_data)

# --- Routes ---

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_message = data.get("message")
    session_id = data.get("session_id")

    if not session_id:
        session_id = create_session()

    session = get_session(session_id)
    if not session:
        session_id = create_session()
        session = get_session(session_id)
    
    # If session is still None (fallback mode), use empty list
    history = session.get("messages", []) if session else []
    
    messages_for_api = [{"role": m["role"], "content": m["content"]} for m in history]
    messages_for_api.append({"role": "user", "content": user_message})

    update_session_messages(session_id, [{"role": "user", "content": user_message}])
    
    try:
        model_name = os.getenv("OLLAMA_MODEL", "phi:latest")
        response = ollama.chat(
            model=model_name,
            messages=messages_for_api
        )
        
        reply = response['message']['content']
        
        update_session_messages(session_id, [{"role": "assistant", "content": reply}])
        
        return jsonify({
            "reply": reply,
            "session_id": session_id
        })

    except Exception as e:
        print(f"API Error: {e}")
        msg = "I am currently offline or encountered an error."
        update_session_messages(session_id, [{"role": "assistant", "content": msg}])
        return jsonify({"reply": msg, "session_id": session_id})

@app.route("/new_chat", methods=["POST"])
def new_chat():
    session_id = create_session()
    return jsonify({"session_id": session_id})

@app.route("/get_chat_history", methods=["GET"])
def get_chat_history():
    session_id = request.args.get("session_id")
    if not session_id:
        return jsonify({"error": "No session_id"}), 400
        
    session = get_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
        
    return jsonify({"messages": session.get("messages", [])})

@app.route("/pin_chat", methods=["POST"])
def pin_chat():
    session_id = request.json.get("session_id")
    if sessions_collection is None or not session_id: return jsonify({"status": "error"})
    
    session = sessions_collection.find_one({"session_id": session_id})
    if session:
        new_state = not session.get("is_pinned", False)
        sessions_collection.update_one({"session_id": session_id}, {"$set": {"is_pinned": new_state}})
        return jsonify({"status": "ok", "is_pinned": new_state})
    return jsonify({"status": "error", "message": "Session not found"})

@app.route("/archive_chat", methods=["POST"])
def archive_chat():
    session_id = request.json.get("session_id")
    if sessions_collection is None or not session_id: return jsonify({"status": "error"})
    
    session = sessions_collection.find_one({"session_id": session_id})
    if session:
        new_state = not session.get("is_archived", False)
        sessions_collection.update_one({"session_id": session_id}, {"$set": {"is_archived": new_state}})
        return jsonify({"status": "ok", "is_archived": new_state})
    return jsonify({"status": "error"})

@app.route("/delete_chat", methods=["POST"])
def delete_chat():
    session_id = request.json.get("session_id")
    if sessions_collection is None or not session_id: return jsonify({"status": "error"})
    
    sessions_collection.delete_one({"session_id": session_id})
    return jsonify({"status": "ok"})

@app.route("/get_sidebar_data", methods=["GET"])
def get_sidebar_data():
    if sessions_collection is None:
        return jsonify({"recent": [], "pinned": [], "archived": []})
        
    def fmt(s):
        return {"session_id": s["session_id"], "title": s.get("title", "New Chat")}

    pinned = list(sessions_collection.find({"is_pinned": True}).sort("updated_at", -1))
    archived = list(sessions_collection.find({"is_archived": True}).sort("updated_at", -1))
    
    # Recent: not pinned (ne True means False or Null), not archived (ne True)
    recent_cursor = sessions_collection.find({
        "is_archived": {"$ne": True}, 
        "is_pinned": {"$ne": True}
    }).sort("updated_at", -1).limit(15)
    
    recent = list(recent_cursor)
    
    return jsonify({
        "pinned": [fmt(x) for x in pinned],
        "archived": [fmt(x) for x in archived],
        "recent": [fmt(x) for x in recent]
    })

if __name__ == "__main__":
    # Disable debug mode for stability in production-like environment
    app.run(host='0.0.0.0', port=5000, debug=False)
