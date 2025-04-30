from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import requests
import uuid
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', os.urandom(24))

# Database configuration from environment variables
db_user = os.getenv('POSTGRES_USER', 'seachatuser')
db_password = os.getenv('POSTGRES_PASSWORD', 'securepassword')
db_host = os.getenv('POSTGRES_HOST', 'postgres')
db_port = os.getenv('POSTGRES_PORT', '5432')
db_name = os.getenv('POSTGRES_DB', 'seachat')

app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

db = SQLAlchemy(app)


# Initialize login manager - ADDED THIS SECTION
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'

# Ollama API endpoint
OLLAMA_API_URL = "http://localhost:11434/api/generate"

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    chats = db.relationship('Chat', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Chat(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    messages = db.relationship('Message', backref='chat', lazy=True, cascade='all, delete-orphan')

class Message(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    content = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    chat_id = db.Column(db.String(36), db.ForeignKey('chat.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Authentication routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user, remember=True)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('index'))
        else:
            flash('Invalid username or password')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Check if username or email already exists
        user_exists = User.query.filter_by(username=username).first()
        email_exists = User.query.filter_by(email=email).first()
        
        if user_exists:
            flash('Username already exists')
        elif email_exists:
            flash('Email already exists')
        else:
            new_user = User(username=username, email=email)
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()
            
            # Log the user in after registration
            login_user(new_user)
            return redirect(url_for('index'))
    
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

# Main application routes
@app.route('/')
@login_required
def index():
    return render_template('index.html')

# Chat API routes
@app.route('/api/chats', methods=['GET'])
@login_required
def get_chats():
    """Retrieve all chats for the current user."""
    user_chats = current_user.chats
    chats_data = [{
        'id': chat.id,
        'title': chat.title,
        'created_at': chat.created_at.isoformat()
    } for chat in user_chats]
    
    return jsonify(chats_data)

@app.route('/api/chats', methods=['POST'])
@login_required
def create_chat():
    """Create a new chat."""
    chat_id = str(uuid.uuid4())
    title = request.json.get('title', f"New Chat {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    
    new_chat = Chat(
        id=chat_id,
        title=title,
        user_id=current_user.id
    )
    
    db.session.add(new_chat)
    db.session.commit()
    
    return jsonify({
        'id': new_chat.id,
        'title': new_chat.title,
        'created_at': new_chat.created_at.isoformat()
    })

@app.route('/api/chats/<chat_id>', methods=['GET'])
@login_required
def get_chat(chat_id):
    """Retrieve a specific chat with its messages."""
    chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first()
    
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404
    
    messages = [{
        'id': message.id,
        'content': message.content,
        'role': message.role,
        'timestamp': message.timestamp.isoformat()
    } for message in chat.messages]
    
    return jsonify({
        'id': chat.id,
        'title': chat.title,
        'messages': messages,
        'created_at': chat.created_at.isoformat()
    })

@app.route('/api/chats/<chat_id>', methods=['DELETE'])
@login_required
def delete_chat(chat_id):
    """Delete a specific chat."""
    chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first()
    
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404
    
    db.session.delete(chat)
    db.session.commit()
    
    return jsonify({'status': 'success'})

@app.route('/api/chats/<chat_id>/messages', methods=['POST'])
@login_required
def send_message(chat_id):
    """Send a message to the Ollama model and get a response."""
    chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first()
    
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404
    
    user_message = request.json.get('message', '')
    if not user_message:
        return jsonify({'error': 'Message is required'}), 400
    
    # Save user message
    message_id = str(uuid.uuid4())
    user_message_obj = Message(
        id=message_id,
        content=user_message,
        role='user',
        chat_id=chat.id
    )
    
    db.session.add(user_message_obj)
    db.session.commit()
    
    # Prepare context for Ollama - improved formatting for better context
    conversation_context = "The following is a conversation with an AI assistant named Gemma. The assistant is helpful, friendly, and knowledgeable.\n\n"
    
    # Format the entire conversation history in a structured way
    for message in chat.messages:
        role_prefix = "Human: " if message.role == 'user' else "Gemma: "
        # Add message with clear formatting
        conversation_context += f"{role_prefix}{message.content}\n"
    
    # Add the final assistant prompt
    conversation_context += "Gemma:"
    
    # Call Ollama API
    try:
        response = requests.post(
            OLLAMA_API_URL,
            json={
                "model": "gemma3:1b",
                "prompt": conversation_context,
                "stream": False
            }
        )
        
        if response.status_code == 200:
            ai_response = response.json().get('response', 'Sorry, I could not generate a response.')
            
            # Save AI message
            ai_message_id = str(uuid.uuid4())
            ai_message_obj = Message(
                id=ai_message_id,
                content=ai_response,
                role='assistant',
                chat_id=chat.id
            )
            
            db.session.add(ai_message_obj)
            
            # Update chat title if it's the first interaction
            if len(chat.messages) == 1:  # Only the user message exists (before we commit the AI message)
                # Extract a title from the first few words of the user's message
                title_words = user_message.split()[:3]
                title = " ".join(title_words) + "..."
                chat.title = title
            
            db.session.commit()
            
            return jsonify({
                'user_message': {
                    'id': user_message_obj.id,
                    'content': user_message_obj.content,
                    'role': user_message_obj.role,
                    'timestamp': user_message_obj.timestamp.isoformat()
                },
                'ai_message': {
                    'id': ai_message_obj.id,
                    'content': ai_message_obj.content,
                    'role': ai_message_obj.role,
                    'timestamp': ai_message_obj.timestamp.isoformat()
                }
            })
        else:
            return jsonify({'error': f'Ollama API Error: {response.text}'}), 500
    
    except Exception as e:
        return jsonify({'error': f'Error: {str(e)}'}), 500

@app.route('/api/chats/<chat_id>/messages/<message_id>', methods=['DELETE'])
@login_required
def delete_message(chat_id, message_id):
    """Delete a specific message from a chat."""
    chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first()
    
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404
    
    message = Message.query.filter_by(id=message_id, chat_id=chat.id).first()
    
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    
    db.session.delete(message)
    db.session.commit()
    
    return jsonify({'status': 'success'})

@app.route('/api/chats/<chat_id>/rename', methods=['POST'])
@login_required
def rename_chat(chat_id):
    """Rename a specific chat."""
    chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first()
    
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404
    
    new_title = request.json.get('title')
    if not new_title:
        return jsonify({'error': 'Title is required'}), 400
    
    chat.title = new_title
    db.session.commit()
    
    return jsonify({
        'id': chat.id,
        'title': chat.title,
        'created_at': chat.created_at.isoformat()
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create tables if they don't exist
    app.run(debug=True)