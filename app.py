from flask import Flask, render_template_string, jsonify, request, session, redirect, url_for
from flask_cors import CORS
import random
from datetime import datetime
import json
import os
import hashlib
import base64

app = Flask(__name__)
app.secret_key = 'your-secret-key-here-change-in-production-12345'
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def read_asset(filename):
    with open(os.path.join(BASE_DIR, filename), 'r', encoding='utf-8') as f:
        return f.read()

# User database (in-memory for demo - use a real database in production)
users_db = {}
user_profiles = {}

# Knowledge Database
knowledge_data = {
    "daily_facts": [

        {"title": "Honey Never Spoils", "content": "Archaeologists found 3,000-year-old honey in Egyptian tombs that was still perfectly edible.", "category": "Daily Facts", "emoji": "🍯"},
        {"title": "Octopuses Have Three Hearts", "content": "Two hearts pump blood to the gills, while the third circulates it to the rest of the body.", "category": "Daily Facts", "emoji": "🐙"},
        {"title": "Bananas Are Berries", "content": "Botanically speaking, bananas qualify as berries because they develop from a single flower with one ovary.", "category": "Daily Facts", "emoji": "🍌"},
        {"title": "Your Brain Uses 20% of Your Oxygen", "content": "Despite being only 2% of your body weight, your brain consumes about 20% of your body's oxygen.", "category": "Daily Facts", "emoji": "🧠"},
        {"title": "The Eiffel Tower Grows in Summer", "content": "Due to thermal expansion, the Eiffel Tower can grow up to 15 cm taller during summer.", "category": "Daily Facts", "emoji": "🗼"},
        {"title": "A Day on Venus is Longer Than a Year", "content": "Venus takes 243 Earth days to rotate on its axis but only 225 Earth days to orbit the Sun.", "category": "Daily Facts", "emoji": "🪐"},
        {"title": "Cows Have Best Friends", "content": "Cows form strong bonds with other cows and become stressed when separated from their best friends.", "category": "Daily Facts", "emoji": "🐄"},
        {"title": "The Human Nose Can Detect 1 Trillion Scents", "content": "The human nose can detect approximately 1 trillion different scents.", "category": "Daily Facts", "emoji": "👃"},
        {"title": "Sharks Are Older Than Trees", "content": "Sharks have existed for over 400 million years, while trees appeared about 350 million years ago.", "category": "Daily Facts", "emoji": "🦈"},
        {"title": "You Shed 600,000 Skin Particles Per Hour", "content": "Your body sheds about 600,000 particles of skin every hour.", "category": "Daily Facts", "emoji": "✨"}
    ],
    "life_skills": [
        {"title": "Active Listening", "content": "Practice active listening by maintaining eye contact, nodding, and summarizing what the speaker says.", "category": "Life Skills", "emoji": "👂"},
        {"title": "The 5-Second Rule", "content": "When you feel the urge to do something, count down 5-4-3-2-1 and take action.", "category": "Life Skills", "emoji": "⏰"},
        {"title": "Saying No Gracefully", "content": "Learn to say no without guilt. Use the formula: 'I appreciate you asking, but I can't commit to that right now.'", "category": "Life Skills", "emoji": "🙅"},
        {"title": "The Pomodoro Technique", "content": "Work in 25-minute focused intervals followed by 5-minute breaks.", "category": "Life Skills", "emoji": "🍅"},
        {"title": "The Two-Minute Rule", "content": "If a task takes less than two minutes, do it immediately.", "category": "Life Skills", "emoji": "⚡"},
        {"title": "Emotional Intelligence", "content": "Practice self-awareness, self-regulation, motivation, empathy, and social skills.", "category": "Life Skills", "emoji": "❤️"},
        {"title": "Growth Mindset", "content": "Embrace challenges, persist in the face of setbacks, and see effort as the path to mastery.", "category": "Life Skills", "emoji": "🌱"},
        {"title": "Mindfulness Meditation", "content": "Practice being present in the moment. Start with 5 minutes of daily meditation.", "category": "Life Skills", "emoji": "🧘"}
    ],
    "career_tips": [
        {"title": "The 80/20 Rule at Work", "content": "80% of your results come from 20% of your efforts. Focus on what matters most.", "category": "Career Tips", "emoji": "📊"},
        {"title": "Networking Effectively", "content": "Focus on building genuine relationships. Follow up within 48 hours and offer value first.", "category": "Career Tips", "emoji": "🤝"},
        {"title": "Professional Email Tips", "content": "Keep emails under 5 sentences. Use a clear subject line and always proofread.", "category": "Career Tips", "emoji": "✉️"},
        {"title": "The First 90 Days", "content": "Spend the first 90 days learning the culture, building relationships, and delivering quick wins.", "category": "Career Tips", "emoji": "🚀"},
        {"title": "Public Speaking Confidence", "content": "Prepare by practicing in front of a mirror. Focus on your message, not your nervousness.", "category": "Career Tips", "emoji": "🎤"},
        {"title": "Personal Branding", "content": "Define what makes you unique and communicate it consistently across platforms.", "category": "Career Tips", "emoji": "🌟"},
        {"title": "Continuous Learning", "content": "Dedicate 1 hour daily to learning new skills. Lifelong learning is essential for career growth.", "category": "Career Tips", "emoji": "📚"},
        {"title": "Work-Life Balance", "content": "Set clear boundaries between work and personal time. Schedule breaks and disconnect.", "category": "Career Tips", "emoji": "⚖️"}
    ],
    "money_tips": [
        {"title": "The 50/30/20 Rule", "content": "Allocate 50% of your income to needs, 30% to wants, and 20% to savings.", "category": "Money Tips", "emoji": "💰"},
        {"title": "Compound Interest Magic", "content": "Even small regular investments can grow significantly over time due to compound returns.", "category": "Money Tips", "emoji": "📈"},
        {"title": "Emergency Fund Basics", "content": "Save 3-6 months of living expenses in an easily accessible account.", "category": "Money Tips", "emoji": "🏦"},
        {"title": "The Latte Effect", "content": "Small daily expenses add up. A $5 coffee daily becomes $1,825 annually.", "category": "Money Tips", "emoji": "☕"},
        {"title": "Debt Snowball Method", "content": "List debts from smallest to largest and pay minimum on all except the smallest.", "category": "Money Tips", "emoji": "❄️"},
        {"title": "Dollar Cost Averaging", "content": "Invest a fixed amount regularly regardless of market conditions.", "category": "Money Tips", "emoji": "📉"},
        {"title": "The 24-Hour Rule", "content": "Wait 24 hours before making any significant purchase to avoid impulse buying.", "category": "Money Tips", "emoji": "⏳"},
        {"title": "Multiple Income Streams", "content": "Build diverse income streams through investments, side hustles, or passive income.", "category": "Money Tips", "emoji": "💎"}
    ],
    "health_awareness": [
        {"title": "Hydration Matters", "content": "Drink water even before feeling thirsty. Aim for 8 glasses daily.", "category": "Health Awareness", "emoji": "💧"},
        {"title": "Sleep Importance", "content": "7-9 hours of quality sleep boosts immune function and reduces stress.", "category": "Health Awareness", "emoji": "😴"},
        {"title": "Stand Up Every Hour", "content": "Stand up and stretch for 2 minutes every hour to improve circulation.", "category": "Health Awareness", "emoji": "🧍"},
        {"title": "Deep Breathing Benefits", "content": "Practice deep breathing: inhale for 4, hold for 4, exhale for 4.", "category": "Health Awareness", "emoji": "🌬️"},
        {"title": "Sunscreen Daily", "content": "Apply SPF 30+ sunscreen daily, even on cloudy days.", "category": "Health Awareness", "emoji": "☀️"},
        {"title": "Gut Health", "content": "Eat fermented foods and fiber-rich plants to support gut health.", "category": "Health Awareness", "emoji": "🦠"},
        {"title": "Exercise Benefits", "content": "Aim for at least 150 minutes of moderate exercise weekly.", "category": "Health Awareness", "emoji": "🏃"},
        {"title": "Mental Health Matters", "content": "Check in with your mental health regularly. Seek support when needed.", "category": "Health Awareness", "emoji": "🧠"}
    ],
    "technology_updates": [
        {"title": "AI Revolution", "content": "AI is expected to contribute $15.7 trillion to the global economy by 2030.", "category": "Technology Updates", "emoji": "🤖"},
        {"title": "5G Technology", "content": "5G offers speeds up to 100 times faster than 4G, enabling new possibilities.", "category": "Technology Updates", "emoji": "📶"},
        {"title": "Cybersecurity Basics", "content": "Use 2-factor authentication, create unique passwords, and avoid phishing.", "category": "Technology Updates", "emoji": "🔐"},
        {"title": "Quantum Computing", "content": "Quantum computers use qubits to process complex calculations at unprecedented speeds.", "category": "Technology Updates", "emoji": "⚛️"},
        {"title": "Web3 Fundamentals", "content": "Web3 focuses on decentralization, blockchain, and user ownership of data.", "category": "Technology Updates", "emoji": "🌐"},
        {"title": "Green Technology", "content": "Solar power, electric vehicles, and smart grids are creating a sustainable future.", "category": "Technology Updates", "emoji": "🌱"},
        {"title": "Space Technology", "content": "Private space companies are revolutionizing space exploration with reusable rockets.", "category": "Technology Updates", "emoji": "🚀"},
        {"title": "Biotechnology", "content": "CRISPR gene editing and personalized medicine are transforming healthcare.", "category": "Technology Updates", "emoji": "🧬"}
    ],

    "books_reading": [
        {"title": "Read 10 Pages a Day", "content": "A small daily habit beats occasional long sessions. Aim for 10 pages—consistency builds momentum.", "category": "Books Reading", "emoji": "📘"},
        {"title": "Preview Before You Dive In", "content": "Scan the table of contents and headings first. You’ll read faster because you know where you’re going.", "category": "Books Reading", "emoji": "🔎"},
        {"title": "Keep a ‘Notes’ Notebook", "content": "Write 1–3 key takeaways per chapter. Review notes once a week to lock in learning.", "category": "Books Reading", "emoji": "📝"},
        {"title": "Use the ‘1 Question’ Method", "content": "Before reading, ask: ‘What problem is this book trying to solve?’ Then look for answers as you go.", "category": "Books Reading", "emoji": "❓"},
        {"title": "Schedule a Reading Window", "content": "Pick a daily time and protect it like an appointment. Your brain adapts to routine quickly.", "category": "Books Reading", "emoji": "⏰"},
        {"title": "Don’t Finish—Understand", "content": "If a section feels confusing, pause and re-read. Understanding is the real win, not just finishing pages.", "category": "Books Reading", "emoji": "🧠"}
    ],

    "book_quotes": [
        {"title": "‘Read to Learn, Not to Prove’", "content": "Choose curiosity over ego. Reading is for gaining perspective—every page adds context.", "category": "Book Quotes", "emoji": "💬"},
        {"title": "‘Small Steps, Big Progress’", "content": "Consistency compounds. Even 10 minutes a day builds a powerful knowledge base over time.", "category": "Book Quotes", "emoji": "🌱"},
        {"title": "‘Notes Turn Reading into Memory’", "content": "If it’s worth reading, it’s worth summarizing—your own words create retention.", "category": "Book Quotes", "emoji": "📌"},
        {"title": "‘Your Future Self Thanks You’", "content": "Today’s reading becomes tomorrow’s clarity, decisions, and confidence.", "category": "Book Quotes", "emoji": "🚀"}
    ],

    "reading_challenges": [
        {"title": "7-Day Micro Challenge", "content": "Day 1: 10 pages. Day 2: 10 pages + 1 note. Continue until Day 7. Stop only when the streak is broken.", "category": "Reading Challenges", "emoji": "🎯"},
        {"title": "Focus Sprint (20 Min)", "content": "Set a 20-minute timer and read without switching apps. End with a 2-sentence summary.", "category": "Reading Challenges", "emoji": "⏱️"},
        {"title": "Active Recall Practice", "content": "After each chapter, close the book and explain the key idea out loud. Then check what you missed.", "category": "Reading Challenges", "emoji": "🧩"},
        {"title": "One Quote, One Lesson", "content": "Pick one quote per session. Write: ‘The lesson for me is…’ and make it actionable.", "category": "Reading Challenges", "emoji": "📚"}
    ]
}


# User preferences
user_preferences = {
    "daily_facts": True,
    "life_skills": True,
    "career_tips": True,
    "money_tips": True,
    "health_awareness": True,
    "technology_updates": True,
    "dark_mode": True,
    "auto_rotate": True,
    "rotation_interval": 60
}

daily_knowledge_history = []

@app.route('/')
def index():
    return render_template_string(read_asset('index.html'))

@app.route('/style.css')
def serve_css():
    return read_asset('style.css'), 200, {
        'Content-Type': 'text/css; charset=utf-8',
        'Cache-Control': 'no-store'
    }

@app.route('/main.js')
def serve_js():
    return read_asset('main.js'), 200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store'
    }

# ============= AUTHENTICATION ROUTES =============

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    
    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password required'})
    
    if username in users_db:
        return jsonify({'success': False, 'message': 'Username already exists'})
    
    # Hash password (simple hash for demo)
    hashed = hashlib.sha256(password.encode()).hexdigest()
    users_db[username] = {
        'password': hashed,
        'email': email,
        'created_at': datetime.now().isoformat()
    }
    
    # Create profile
    user_profiles[username] = {
        'name': username,
        'phone': '',
        'email': email or '',
        'address': '',
        'photo': ''
    }
    
    return jsonify({'success': True, 'message': 'Registration successful'})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password required'})
    
    if username not in users_db:
        return jsonify({'success': False, 'message': 'User not found'})
    
    hashed = hashlib.sha256(password.encode()).hexdigest()
    if users_db[username]['password'] != hashed:
        return jsonify({'success': False, 'message': 'Incorrect password'})
    
    session['username'] = username
    session['logged_in'] = True
    
    return jsonify({
        'success': True,
        'message': 'Login successful',
        'username': username,
        'profile': user_profiles.get(username, {})
    })

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    if session.get('logged_in'):
        username = session.get('username')
        return jsonify({
            'success': True,
            'logged_in': True,
            'username': username,
            'profile': user_profiles.get(username, {})
        })
    return jsonify({
        'success': True,
        'logged_in': False
    })

# ============= PROFILE ROUTES =============

@app.route('/api/profile', methods=['GET', 'POST'])
def profile():
    if not session.get('logged_in'):
        return jsonify({'success': False, 'message': 'Please login first'})
    
    username = session.get('username')
    
    if request.method == 'POST':
        data = request.json
        if username not in user_profiles:
            user_profiles[username] = {}
        
        # Update profile
        user_profiles[username].update({
            'name': data.get('name', ''),
            'phone': data.get('phone', ''),
            'email': data.get('email', ''),
            'address': data.get('address', ''),
            'photo': data.get('photo', '')
        })
        
        return jsonify({
            'success': True,
            'message': 'Profile updated',
            'profile': user_profiles[username]
        })
    else:
        return jsonify({
            'success': True,
            'profile': user_profiles.get(username, {})
        })

# ============= KNOWLEDGE ROUTES =============

@app.route('/api/get_daily', methods=['GET'])
def get_daily():
    daily_digest = []
    for category, items in knowledge_data.items():
        if user_preferences.get(category, True) and items:
            selected = random.choice(items)
            daily_digest.append(selected)
    
    daily_knowledge_history.append({
        'date': datetime.now().strftime('%Y-%m-%d'),
        'items': daily_digest
    })
    
    return jsonify({
        'success': True,
        'data': daily_digest,
        'date': datetime.now().strftime('%Y-%m-%d')
    })

@app.route('/api/get_knowledge', methods=['GET'])
def get_knowledge():
    category = request.args.get('category')
    
    if category and category in knowledge_data:
        items = knowledge_data[category]
        selected = random.choice(items) if items else None
        return jsonify({
            'success': True,
            'data': selected,
            'category': category
        })
    
    all_items = []
    for items in knowledge_data.values():
        all_items.extend(items)
    
    if all_items:
        selected = random.choice(all_items)
        return jsonify({
            'success': True,
            'data': selected,
            'category': 'Random'
        })
    
    return jsonify({'success': False, 'message': 'No knowledge items available'})

@app.route('/api/history', methods=['GET'])
def get_history():
    return jsonify({
        'success': True,
        'history': daily_knowledge_history[-7:]
    })

@app.route('/api/preferences', methods=['GET', 'POST'])
def preferences():
    global user_preferences
    
    if request.method == 'POST':
        data = request.json
        for key in user_preferences.keys():
            if key in data:
                user_preferences[key] = data[key]
        return jsonify({'success': True, 'preferences': user_preferences})
    else:
        return jsonify({'success': True, 'preferences': user_preferences})

@app.route('/api/search', methods=['GET'])
def search_knowledge():
    query = request.args.get('q', '').lower()
    results = []
    
    for category, items in knowledge_data.items():
        for item in items:
            if query in item['title'].lower() or query in item['content'].lower():
                results.append(item)
    
    return jsonify({
        'success': True,
        'data': results,
        'count': len(results)
    })

@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = []
    for key, items in knowledge_data.items():
        if items:
            categories.append({
                'id': key,
                'name': items[0]['category'],
                'count': len(items)
            })
    return jsonify({'success': True, 'categories': categories})

if __name__ == '__main__':
    print("\n🚀 Starting One Minute Knowledge Server...")
    print("📁 Files loaded successfully")
    print("\n🌐 Server running at: http://localhost:5000")
    print("Press Ctrl+C to stop\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
