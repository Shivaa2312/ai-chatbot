from flask import Flask, request, jsonify, render_template
from openai import OpenAI
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = Flask(__name__)

# Simple in-memory history (Global list - resets on restart)
chat_history = [
    {"role": "system", "content": "You are a helpful chatbot."}
]

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message")
    
    # Add user message to history
    chat_history.append({"role": "user", "content": user_message})

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=chat_history
        )
        
        reply = response.choices[0].message.content
        
        # Add AI reply to history
        chat_history.append({"role": "assistant", "content": reply})
        
        return jsonify({
            "reply": reply
        })
    except Exception as e:
        # If API fails (Quota exceeded or no internet), fall back to simple offline mode
        print(f"API Error: {e}")
        
        user_input = user_message.lower()
        if "hello" in user_input or "hi" in user_input:
            reply = "Hello! I am currently working in offline mode because the OpenAI API key has no credits. How can I help you locally?"
        elif "who are you" in user_input:
            reply = "I am a simple Python chatbot."
        elif "bye" in user_input:
            reply = "Goodbye! Have a nice day."
        else:
            reply = "I am currently offline (API Quota Exceeded). I can't generate smart answers right now, but I can hear you! Try checking your OpenAI billing."
            
        chat_history.append({"role": "assistant", "content": reply})
        return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(debug=True)
