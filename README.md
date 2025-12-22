# AI Assistant Chatbot

A modern, secure AI chatbot built with Python (Flask) and OpenAI's GPT-4o-mini.

## Features
- 🔒 **Secure**: API keys are stored safely in environment variables.
- 🎨 **Modern UI**: Dark-mode friendly, responsive chat interface.
- 🧠 **Smart Context**: Keeps track of your conversation history.
- 🔌 **Offline Mode**: Gracefully handles connection errors with a simulation mode.

## Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd chatbot
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure API Key**
   - Create a file named `.env` in the root directory.
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your-key-here
     ```

4. **Run the App**
   ```bash
   python chatbot.py
   ```
   Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser.

## Technologies
- Python 3
- Flask
- OpenAI API
- HTML/CSS/JS
