from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
import requests
import uuid
import os
from datetime import datetime
from dotenv import load_dotenv
import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import io

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', os.urandom(24))

# Email configuration
GMAIL_USERNAME = os.getenv('GMAIL_USERNAME')
GMAIL_PASSWORD = os.getenv('GMAIL_PASSWORD')

# Database configuration from environment variables
db_user = os.getenv('POSTGRES_USER', 'seachatuser')
db_password = os.getenv('POSTGRES_PASSWORD', 'securepassword')
db_host = os.getenv('POSTGRES_HOST', 'postgres')
db_port = os.getenv('POSTGRES_PORT', '5432')
db_name = os.getenv('POSTGRES_DB', 'seachat')

app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

# Check if email configuration is available
if not GMAIL_USERNAME or not GMAIL_PASSWORD:
    app.logger.warning("GMAIL_USERNAME or GMAIL_PASSWORD not set in environment variables. Email features will not work.")

db = SQLAlchemy(app)

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize login manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'

# Ollama API endpoint
OLLAMA_API_URL = "http://localhost:11434/api/generate"

# Kokoro API config
KOKORO_BASE_URL = os.getenv("KOKORO_API_URL", "http://localhost:8880")
KOKORO_TTS_URL = f"{KOKORO_BASE_URL}/v1/audio/speech"
DEFAULT_TTS_VOICE = "af_bella"
DEFAULT_TTS_FORMAT = "mp3"

# Function to get language-specific prompt instructions
def get_language_prompt(language_code):
    """Generate language-specific instructions for the LLM."""
    prompts = {
        'en': "You MUST ALWAYS respond ONLY in English, regardless of what language the user inputs in. If the user asks a question in another language, translate it mentally but ALWAYS respond in English only.\n",
        'it': "Devi SEMPRE rispondere SOLO in italiano, indipendentemente dalla lingua in cui l'utente scrive. Se l'utente pone una domanda in un'altra lingua, traducila mentalmente ma rispondi SEMPRE e SOLO in italiano.\n",
        'fr': "Vous DEVEZ TOUJOURS répondre UNIQUEMENT en français, quelle que soit la langue utilisée par l'utilisateur. Si l'utilisateur pose une question dans une autre langue, traduisez-la mentalement mais répondez TOUJOURS et UNIQUEMENT en français.\n",
        'es': "DEBES SIEMPRE responder SOLO en español, independientemente del idioma en que escriba el usuario. Si el usuario hace una pregunta en otro idioma, tradúcela mentalmente pero responde SIEMPRE y ÚNICAMENTE en español.\n",
        'de': "Du MUSST IMMER NUR auf Deutsch antworten, unabhängig davon, in welcher Sprache der Benutzer schreibt. Wenn der Benutzer eine Frage in einer anderen Sprache stellt, übersetze sie gedanklich, aber antworte IMMER und NUR auf Deutsch.\n"
    }
    return prompts.get(language_code, prompts['en'])  # Default to English if language not supported

# Import STT/TTS functions
from kokoro_test import process_audio, kokoro_tts

# Store active audio streams per client
active_streams = {}

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    gender = db.Column(db.String(20), nullable=True)
    country = db.Column(db.String(50), nullable=True)
    birth_date = db.Column(db.Date, nullable=True)
    preferred_language = db.Column(db.String(20), nullable=True)
    interaction_mode = db.Column(db.String(10), nullable=True)
    interests = db.Column(db.String(200), nullable=True)
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
    role = db.Column(db.String(20), nullable=False)
    chat_id = db.Column(db.String(36), db.ForeignKey('chat.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# Add new Event model for shared calendar
class Event(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    start = db.Column(db.DateTime, nullable=False)
    end = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Add relationship to User model
    user = db.relationship('User', backref=db.backref('events', lazy=True))

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

def send_otp_email(recipient, otp):
    try:
        subject = "BRIDGE - Verify Your Email"
        html_content = f"""
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    color: #333333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                }}
                .header {{
                    background-color: #1E88E5;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }}
                .content {{
                    padding: 20px;
                    text-align: center;
                }}
                .otp-code {{
                    font-size: 28px;
                    font-weight: bold;
                    padding: 15px;
                    margin: 15px 0;
                    background-color: #f0f7ff;
                    border-radius: 8px;
                    border: 1px dashed #1E88E5;
                    color: #1E88E5;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>BRIDGE - Email Verification</h1>
                </div>
                <div class="content">
                    <p>Thank you for registering with BRIDGE. Use the verification code below:</p>
                    <div class="otp-code">{otp}</div>
                    <p>This code will expire in 10 minutes.</p>
                </div>
            </div>
        </body>
        </html>
        """
        text_content = f"""
        BRIDGE - Email Verification

        Thank you for registering with BRIDGE. Use the verification code below:
        
        {otp}
        
        This code will expire in 10 minutes.
        """
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = GMAIL_USERNAME
        msg['To'] = recipient
        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        msg.attach(part1)
        msg.attach(part2)
        smtp = smtplib.SMTP("smtp.gmail.com", 587)
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()
        smtp.login(GMAIL_USERNAME, GMAIL_PASSWORD)
        smtp.sendmail(GMAIL_USERNAME, recipient, msg.as_string())
        smtp.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

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
        user_exists = User.query.filter_by(username=username).first()
        email_exists = User.query.filter_by(email=email).first()
        if user_exists:
            flash('Username already exists')
        elif email_exists:
            flash('Email already exists')
        else:
            otp = str(random.randint(100000, 999999))
            session['pending_user'] = {
                'username': username,
                'email': email,
                'password': password,
                'otp': otp
            }
            try:
                if send_otp_email(email, otp):
                    flash('We have sent a verification code to your email.')
                    return redirect(url_for('verify_otp'))
                else:
                    flash('Error sending verification email. Please try again later.')
            except Exception as e:
                flash(f'Error sending verification email: {str(e)}')
    return render_template('register.html')

@app.route('/verify-otp', methods=['GET', 'POST'])
def verify_otp():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    pending = session.get('pending_user')
    if not pending:
        flash('Session expired or missing data. Please register again.')
        return redirect(url_for('register'))
    if request.method == 'POST':
        otp_input = request.form.get('otp')
        if otp_input == pending['otp']:
            flash('OTP verified successfully! Please complete your profile.')
            return redirect(url_for('complete_profile'))
        else:
            flash('Invalid OTP code. Please try again.')
    return render_template('verify_otp.html', email=pending['email'])

@app.route('/complete-profile', methods=['GET', 'POST'])
def complete_profile():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    pending = session.get('pending_user')
    if not pending:
        flash('Session expired or missing data. Please register again.')
        return redirect(url_for('register'))
    if request.method == 'POST':
        gender = request.form.get('gender')
        country = request.form.get('country')
        birth_date_str = request.form.get('birth_date')
        preferred_language = request.form.get('preferred_language')
        interaction_mode = request.form.get('interaction_mode')
        interests_list = request.form.getlist('interests')
        if not (gender and country and birth_date_str and preferred_language and interaction_mode and interests_list):
            flash('All fields are required')
            return render_template('complete_profile.html')
        try:
            birth_date = datetime.strptime(birth_date_str, '%Y-%m-%d').date()
            new_user = User(
                username=pending['username'],
                email=pending['email'],
                gender=gender,
                country=country,
                birth_date=birth_date,
                preferred_language=preferred_language,
                interaction_mode=interaction_mode,
                interests=','.join(interests_list)
            )
            new_user.set_password(pending['password'])
            db.session.add(new_user)
            db.session.commit()
            login_user(new_user)
            session.pop('pending_user', None)
            flash('Profile completed successfully! Welcome to Sea Chat.')
            return redirect(url_for('index'))
        except Exception as e:
            flash(f'Error creating user: {str(e)}')
            return render_template('complete_profile.html')
    return render_template('complete_profile.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/')
@login_required
def index():
    return render_template('index.html')

@app.route('/api/chats', methods=['GET'])
@login_required
def get_chats():
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
    chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first()
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404
    db.session.delete(chat)
    db.session.commit()
    return jsonify({'status': 'success'})

@app.route('/api/chats/<chat_id>/messages', methods=['POST'])
@login_required
def send_message(chat_id):
    chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first()
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404
    user_message = request.json.get('message', '')
    language = request.json.get('language', 'en')  # Get language preference, default to English
    if not user_message:
        return jsonify({'error': 'Message is required'}), 400
    message_id = str(uuid.uuid4())
    user_message_obj = Message(
        id=message_id,
        content=user_message,
        role='user',
        chat_id=chat.id
    )
    db.session.add(user_message_obj)
    db.session.commit()
    
    # Create the conversation context with language instructions
    conversation_context = get_language_prompt(language)
    conversation_context += "The following is a conversation with an AI assistant named Gemma. The assistant is helpful, friendly, and knowledgeable.\n\n"
    for message in chat.messages:
        role_prefix = "Human: " if message.role == 'user' else "Gemma: "
        conversation_context += f"{role_prefix}{message.content}\n"
    conversation_context += "Gemma:"
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
            ai_message_id = str(uuid.uuid4())
            ai_message_obj = Message(
                id=ai_message_id,
                content=ai_response,
                role='assistant',
                chat_id=chat.id
            )
            db.session.add(ai_message_obj)
            if len(chat.messages) == 1:
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

@app.route('/api/chats/<chat_id>/set-language', methods=['POST'])
@login_required
def set_chat_language(chat_id):
    """Imposta la preferenza di lingua per una chat specifica."""
    chat = Chat.query.filter_by(id=chat_id, user_id=current_user.id).first()
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404
        
    language = request.json.get('language', 'en')
    
    # Se necessario, si potrebbe aggiungere una colonna 'language' alla tabella Chat
    # per salvare permanentemente la lingua preferita per ogni chat
    # Per ora, memorizziamo la preferenza nella sessione utente
    if 'chat_languages' not in session:
        session['chat_languages'] = {}
    
    session['chat_languages'][chat_id] = language
    session.modified = True
    
    # Aggiungiamo un messaggio di sistema che indica il cambio di lingua
    # Questo messaggio sarà visibile solo al modello, non all'utente
    system_message = f"Language settings updated to: {language}. All future responses will be in this language."
    message_id = str(uuid.uuid4())
    
    # Creiamo un messaggio di sistema invisibile che non verrà mostrato nel frontend
    # ma che servirà come istruzione per il modello nelle prossime risposte
    # Usato solo per il debug, commentarlo in produzione
    # system_message_obj = Message(
    #     id=message_id,
    #     content=system_message,
    #     role='system',
    #     chat_id=chat.id
    # )
    # db.session.add(system_message_obj)
    # db.session.commit()
    
    return jsonify({
        'success': True,
        'language': language,
        'chat_id': chat_id
    })

@app.route('/api/events', methods=['GET'])
@login_required
def get_events():
    """Get all events for the shared calendar"""
    # Convert date parameter to datetime if provided
    date_str = request.args.get('date')
    
    if date_str:
        try:
            # Parse date string to date object with more flexible handling
            # Strip any timezone info or extra characters that might cause issues
            date_str = date_str.strip()
            
            # Log the received date string for debugging
            app.logger.debug(f"Received date parameter: {date_str}")
            
            # Parse date string to date object
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            
            # Create datetime objects for start and end of day
            start_of_day = datetime.combine(date_obj, datetime.min.time())
            end_of_day = datetime.combine(date_obj, datetime.max.time())
            
            app.logger.debug(f"Querying events between {start_of_day} and {end_of_day}")
            
            # Query events that overlap with this day
            events = Event.query.filter(
                Event.start <= end_of_day,
                Event.end >= start_of_day
            ).all()
            
            app.logger.debug(f"Found {len(events)} events for {date_str}")
            
        except ValueError as e:
            app.logger.error(f"Date parsing error: {str(e)} for input '{date_str}'")
            return jsonify({'error': f'Invalid date format. Use YYYY-MM-DD. Error: {str(e)}'}), 400
        except Exception as e:
            app.logger.error(f"Error retrieving events: {str(e)}")
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    else:
        # If no date provided, return all events
        try:
            events = Event.query.all()
            app.logger.debug(f"Returning all events: {len(events)} found")
        except Exception as e:
            app.logger.error(f"Error retrieving all events: {str(e)}")
            return jsonify({'error': f'Server error: {str(e)}'}), 500
    
    try:
        events_data = [{
            'id': event.id,
            'title': event.title,
            'start': event.start.isoformat(),
            'end': event.end.isoformat(),
            'location': event.location,
            'user_id': event.user_id,
            'username': db.session.get(User, event.user_id).username,
            'created_at': event.created_at.isoformat()
        } for event in events]
        
        return jsonify(events_data)
    except Exception as e:
        app.logger.error(f"Error formatting events data: {str(e)}")
        return jsonify({'error': f'Error formatting event data: {str(e)}'}), 500

@app.route('/api/events', methods=['POST'])
@login_required
def create_event():
    """Create a new event in the shared calendar"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['title', 'start', 'end', 'location']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Parse datetime strings
        start_time = datetime.fromisoformat(data['start'].replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(data['end'].replace('Z', '+00:00'))
        
        # Create new event
        new_event = Event(
            id=str(uuid.uuid4()),
            title=data['title'],
            start=start_time,
            end=end_time,
            location=data['location'],
            user_id=current_user.id
        )
        
        db.session.add(new_event)
        db.session.commit()
        
        return jsonify({
            'id': new_event.id,
            'title': new_event.title,
            'start': new_event.start.isoformat(),
            'end': new_event.end.isoformat(),
            'location': new_event.location,
            'user_id': new_event.user_id,
            'username': current_user.username,
            'created_at': new_event.created_at.isoformat()
        })
    
    except ValueError as e:
        return jsonify({'error': f'Invalid datetime format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error creating event: {str(e)}'}), 500

@app.route('/api/events/<event_id>', methods=['DELETE'])
@login_required
def delete_event(event_id):
    """Delete an event from the shared calendar"""
    event = db.session.get(Event, event_id)
    
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Only allow the event creator or admin to delete
    if event.user_id != current_user.id:
        return jsonify({'error': 'Permission denied - You can only delete your own events'}), 403
    
    try:
        db.session.delete(event)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Event deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error deleting event: {str(e)}'}), 500

@app.route('/api/events/<event_id>', methods=['PUT'])
@login_required
def update_event(event_id):
    """Update an existing event in the shared calendar"""
    event = db.session.get(Event, event_id)
    
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Only allow the event creator to update
    if event.user_id != current_user.id:
        return jsonify({'error': 'Permission denied - You can only update your own events'}), 403
    
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['title', 'start', 'end', 'location']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Parse datetime strings
        start_time = datetime.fromisoformat(data['start'].replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(data['end'].replace('Z', '+00:00'))
        
        # Update event fields
        event.title = data['title']
        event.start = start_time
        event.end = end_time
        event.location = data['location']
        
        db.session.commit()
        
        return jsonify({
            'id': event.id,
            'title': event.title,
            'start': event.start.isoformat(),
            'end': event.end.isoformat(),
            'location': event.location,
            'user_id': event.user_id,
            'username': current_user.username,
            'created_at': event.created_at.isoformat()
        })
    
    except ValueError as e:
        return jsonify({'error': f'Invalid datetime format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error updating event: {str(e)}'}), 500

# API endpoint to get events for an entire month
@app.route('/api/events/month/<int:year>/<string:month>', methods=['GET'])
@login_required
def get_events_for_month(year, month):
    """Get all events for a specific month"""
    try:
        # Construct start and end dates for the month
        start_date = f"{year}-{month}-01"
        
        # Determine the last day of the month
        if month == '12':
            end_date = f"{year + 1}-01-01"
        else:
            next_month = int(month) + 1
            end_date = f"{year}-{str(next_month).zfill(2)}-01"
        
        # Query events within the month
        events = Event.query.filter(
            Event.start >= start_date,
            Event.start < end_date
        ).all()
        
        event_list = []
        for event in events:
            event_list.append({
                'id': event.id,
                'title': event.title,
                'start': event.start.isoformat(),
                'end': event.end.isoformat(),
                'location': event.location,
                'user_id': event.user_id,
                'username': db.session.get(User, event.user_id).username
            })
        
        return jsonify(event_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/events/month/<string:yearmonth>', methods=['GET'])
@login_required
def get_events_by_month_string(yearmonth):
    """Get all events for a specific month (format: YYYY-MM)"""
    try:
        # Parse year and month
        year, month = yearmonth.split('-')
        
        # Construct start and end dates for the month
        start_date = f"{year}-{month}-01"
        
        # Determine the last day of the month
        if month == '12':
            end_date = f"{int(year) + 1}-01-01"
        else:
            next_month = int(month) + 1
            end_date = f"{year}-{str(next_month).zfill(2)}-01"
        
        # Query events within the month
        events = Event.query.filter(
            Event.start >= start_date,
            Event.start < end_date
        ).all()
        
        event_list = []
        for event in events:
            event_list.append({
                'id': event.id,
                'title': event.title,
                'start': event.start.isoformat(),
                'end': event.end.isoformat(),
                'location': event.location,
                'user_id': event.user_id,
                'username': db.session.get(User, event.user_id).username
            })
        
        # Log for debugging
        print(f"API: Found {len(event_list)} events for {yearmonth}")
        return jsonify(event_list)
    except Exception as e:
        print(f"API Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Endpoint to find matching events (same date and city) with other users
@app.route('/api/events/matches', methods=['GET'])
@login_required
def get_matching_events():
    """Find events that match the current user's events by date and location"""
    try:
        # Get current user's events
        user_events = Event.query.filter_by(user_id=current_user.id).all()
        
        # Create a set of tuples with date and location for current user's events
        user_event_keys = set()
        for event in user_events:
            # Extract just the date portion without time
            event_date = event.start.date().isoformat()
            user_event_keys.add((event_date, event.location))
        
        # Find matching events from other users
        matches = []
        
        # For each user event key (date, location), find matching events from other users
        for event_date, location in user_event_keys:
            # Convert date string back to date object for querying
            date_obj = datetime.strptime(event_date, '%Y-%m-%d').date()
            
            # Create datetime objects for start and end of day
            start_of_day = datetime.combine(date_obj, datetime.min.time())
            end_of_day = datetime.combine(date_obj, datetime.max.time())
            
            # Find events from other users on the same day and location
            matching_events = Event.query.filter(
                Event.user_id != current_user.id,
                Event.location == location,
                Event.start <= end_of_day,
                Event.end >= start_of_day
            ).all()
            
            # Add matching events to the result
            for event in matching_events:
                user = db.session.get(User, event.user_id)
                matches.append({
                    'event_id': event.id,
                    'title': event.title,
                    'date': event_date,
                    'location': location,
                    'user_id': event.user_id,
                    'username': user.username if user else 'Unknown User',
                    'start_time': event.start.strftime('%H:%M'),
                    'end_time': event.end.strftime('%H:%M')
                })
        
        app.logger.info(f"Found {len(matches)} matching events for user {current_user.id}")
        return jsonify(matches)
        
    except Exception as e:
        app.logger.error(f"Error finding matching events: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


# Endpoint to get LLM-generated suggestions based on matching events
@app.route('/api/events/matches/suggestions', methods=['GET'])
@login_required
def get_event_match_suggestions():
    """Get LLM-generated suggestions based on matching events"""
    try:
        # Get current user's events
        user_events = Event.query.filter_by(user_id=current_user.id).all()
        
        # Create a dictionary of user events by date and location
        user_events_by_key = {}
        for event in user_events:
            event_date = event.start.date().isoformat()
            key = (event_date, event.location)
            if key not in user_events_by_key:
                user_events_by_key[key] = []
            
            user_events_by_key[key].append({
                'title': event.title,
                'start_time': event.start.strftime('%H:%M'),
                'end_time': event.end.strftime('%H:%M')
            })
        
        # Find matching events from other users
        matches_by_key = {}
        suggestions = []
        
        # For each user event key (date, location), find matching events from other users
        for (event_date, location), user_event_list in user_events_by_key.items():
            # Convert date string back to date object for querying
            date_obj = datetime.strptime(event_date, '%Y-%m-%d').date()
            
            # Create datetime objects for start and end of day
            start_of_day = datetime.combine(date_obj, datetime.min.time())
            end_of_day = datetime.combine(date_obj, datetime.max.time())
            
            # Find events from other users on the same day and location
            matching_events = Event.query.filter(
                Event.user_id != current_user.id,
                Event.location == location,
                Event.start <= end_of_day,
                Event.end >= start_of_day
            ).all()
            
            # Group matching events by date and location
            if not matching_events:
                continue
                
            matches_by_key[(event_date, location)] = []
            
            # Add matching events to the result
            for event in matching_events:
                user = db.session.get(User, event.user_id)
                matches_by_key[(event_date, location)].append({
                    'title': event.title,
                    'username': user.username if user else 'Unknown User',
                    'email': user.email if user else '',
                    'start_time': event.start.strftime('%H:%M'),
                    'end_time': event.end.strftime('%H:%M')
                })
        
        # Generate suggestions using LLM for each group of matching events
        for (event_date, location), matches in matches_by_key.items():
            date_obj = datetime.strptime(event_date, '%Y-%m-%d').date()
            formatted_date = date_obj.strftime('%A, %B %d, %Y')  # e.g., "Monday, May 28, 2025"
            
            user_events_text = ""
            for i, event in enumerate(user_events_by_key.get((event_date, location), [])):
                user_events_text += f"- {event['title']} from {event['start_time']} to {event['end_time']}\n"
            
            matches_text = ""
            users_involved = set()
            for match in matches:
                matches_text += f"- {match['username']} has event '{match['title']}' from {match['start_time']} to {match['end_time']}\n"
                users_involved.add(match['username'])
            
            # Create prompt for LLM
            prompt = f"""You are an assistant helping to coordinate meetings between users who have events in the same location on the same day.
            
Current user ({current_user.username}) has the following events in {location} on {formatted_date}:
{user_events_text}

Other users have the following events in the same location and day:
{matches_text}

Based on this information, create a friendly, brief suggestion for {current_user.username} about potentially coordinating or meeting with {', '.join(users_involved)}. 
Include a specific suggestion about when and where they might meet considering their schedules.
Keep the suggestion concise (maximum 3-4 sentences) and focus on the social opportunity.
"""
            
            # Call Ollama API
            try:
                response = requests.post(
                    OLLAMA_API_URL,
                    json={
                        "model": "gemma3:1b",
                        "prompt": prompt,
                        "stream": False
                    }
                )
                
                if response.status_code == 200:
                    suggestion_text = response.json().get('response', 'Sorry, I could not generate a suggestion.')
                    
                    # Clean up the text (remove any excess newlines/formatting)
                    suggestion_text = suggestion_text.strip()
                    
                    suggestions.append({
                        'date': event_date,
                        'formatted_date': formatted_date,
                        'location': location,
                        'user_events': user_events_by_key.get((event_date, location), []),
                        'matching_events': matches,
                        'users_involved': list(users_involved),
                        'suggestion': suggestion_text
                    })
                else:
                    app.logger.error(f"Ollama API error: {response.text}")
                    suggestions.append({
                        'date': event_date,
                        'location': location,
                        'error': f"Could not generate suggestion: API error"
                    })
            except Exception as e:
                app.logger.error(f"Error calling Ollama API: {str(e)}")
                suggestions.append({
                    'date': event_date,
                    'location': location,
                    'error': f"Could not generate suggestion: {str(e)}"
                })
        
        return jsonify(suggestions)
        
    except Exception as e:
        app.logger.error(f"Error generating event suggestions: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# Add alternative endpoint format for compatibility
@app.route('/api/events/month/<int:year>/<string:month>', methods=['GET'])
@login_required
def get_events_by_year_and_month(year, month):
    """Alternative endpoint for getting events by year and month separately"""
    return get_events_by_month_string(f"{year}-{month}")

# Add new API endpoint to get current user info
@app.route('/api/user/current', methods=['GET'])
@login_required
def get_current_user():
    """Get current user information for client-side use"""
    return jsonify({
        'id': current_user.id,
        'username': current_user.username
    })

@app.route('/api/events/all', methods=['GET'])
@login_required
def get_all_events():
    """Get all events from all users for the analytics feature"""
    try:
        # Query all events from the database, including user information
        events_query = db.session.query(
            Event, 
            User.id.label('user_id'),
            User.username.label('username')
        ).join(
            User, User.id == Event.user_id
        ).all()
        
        events_list = []
        for event_data in events_query:
            event, user_id, username = event_data
            events_list.append({
                'id': event.id,
                'title': event.title,
                'start': event.start.isoformat(),
                'end': event.end.isoformat(),
                'location': event.location,
                'user_id': user_id,
                'username': username
            })
        
        return jsonify(events_list)
    except Exception as e:
        app.logger.error(f"Error retrieving all events: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@socketio.on('connect')
@login_required
def handle_connect():
    user_id = current_user.id
    print(f'Client connected: {request.sid}, User: {user_id}')
    active_streams[request.sid] = {
        'user_id': user_id,
        'chat_id': None,
        'audio_chunks': [],
        'is_streaming': False
    }

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')
    if request.sid in active_streams:
        del active_streams[request.sid]

@socketio.on('start_voice_interaction')
@login_required
def handle_start_voice(data):
    chat_id = data.get('chat_id')
    user_id = current_user.id
    sid = request.sid
    print(f'User {user_id} starting voice interaction for chat {chat_id} (SID: {sid})')
    chat = Chat.query.filter_by(id=chat_id, user_id=user_id).first()
    if not chat:
        print(f'Error: Chat {chat_id} not found or not owned by user {user_id}')
        emit('voice_error', {'error': 'Chat not found or access denied.'}, room=sid)
        return
    if sid in active_streams:
        active_streams[sid]['chat_id'] = chat_id
        active_streams[sid]['audio_chunks'] = []
        active_streams[sid]['is_streaming'] = True
        emit('voice_started', {'message': 'Ready to receive audio'}, room=sid)
    else:
        print(f"Error: Client state not found for SID {sid}")
        emit('voice_error', {'error': 'Client session error. Please reconnect.'}, room=sid)

@socketio.on('audio_chunk')
@login_required
def handle_audio_chunk(chunk):
    sid = request.sid
    if sid in active_streams and active_streams[sid]['is_streaming']:
        active_streams[sid]['audio_chunks'].append(chunk)
    else:
        print(f'Warning: Received audio chunk from {sid} but not expected or streaming inactive.')

@socketio.on('stop_voice_interaction')
@login_required
def handle_stop_voice():
    sid = request.sid
    if sid not in active_streams or not active_streams[sid]['is_streaming']:
        print(f'Warning: Received stop signal from {sid} but not expected.')
        return
    print(f'Stopping voice interaction for {sid}')
    active_streams[sid]['is_streaming'] = False
    chat_id = active_streams[sid]['chat_id']
    user_id = active_streams[sid]['user_id']
    audio_chunks = active_streams[sid]['audio_chunks']
    if not chat_id or not audio_chunks:
        print(f'Error: Missing chat_id or audio data for {sid}')
        emit('voice_error', {'error': 'Missing chat or audio data.'}, room=sid)
        return
    full_audio_data = b''.join(audio_chunks)
    active_streams[sid]['audio_chunks'] = []
    print(f"Processing {len(full_audio_data)} bytes of audio for chat {chat_id} (SID: {sid})")
    emit('processing_voice', {'message': 'Transcribing and generating response...'}, room=sid)
    class BytesIOWrapper:
        def __init__(self, data, name="voice_input.webm", mimetype="audio/webm"):
            self.stream = io.BytesIO(data)
            self.filename = name
            self.mimetype = mimetype
        def read(self, size=-1):
            return self.stream.read(size)
        def seek(self, offset, whence=0):
            return self.stream.seek(offset, whence)
    audio_file_like = BytesIOWrapper(full_audio_data)
    try:
        user_text_message = process_audio(audio_file_like)
        print(f"STT Result for {sid}: {user_text_message}")
        emit('transcript_result', {'transcript': user_text_message}, room=sid)
        chat = Chat.query.filter_by(id=chat_id, user_id=user_id).first()
        if not chat:
             raise ValueError("Chat not found during processing")
        user_message_obj = Message(id=str(uuid.uuid4()), content=user_text_message, role='user', chat_id=chat.id)
        db.session.add(user_message_obj)
        db.session.commit()
        emit('new_message', {
            'id': user_message_obj.id,
            'content': user_message_obj.content,
            'role': user_message_obj.role,
            'timestamp': user_message_obj.timestamp.isoformat()
        }, room=sid)
        
        # Add language instructions to the conversation context
        # Default to the user's preferred language from their profile, or English
        language = current_user.preferred_language.lower() if current_user.preferred_language else 'en'
        conversation_context = get_language_prompt(language)
        conversation_context += "The following is a conversation...\n\n"
        for message in chat.messages:
            role_prefix = "Human: " if message.role == 'user' else "Gemma: "
            conversation_context += f"{role_prefix}{message.content}\n"
        conversation_context += "Gemma:"
        
        response = requests.post(
            OLLAMA_API_URL,
            json={"model": "gemma3:1b", "prompt": conversation_context, "stream": False}
        )
        response.raise_for_status()
        ai_text_response = response.json().get('response', '...')
        print(f"AI Response for {sid}: {ai_text_response[:50]}...")
        ai_message_obj = Message(id=str(uuid.uuid4()), content=ai_text_response, role='assistant', chat_id=chat.id)
        db.session.add(ai_message_obj)
        if len(chat.messages) == 1:
             title_words = user_text_message.split()[:3]
             chat.title = " ".join(title_words) + "..."
        db.session.commit()
        emit('new_message', {
            'id': ai_message_obj.id,
            'content': ai_message_obj.content,
            'role': ai_message_obj.role,
            'timestamp': ai_message_obj.timestamp.isoformat()
        }, room=sid)
        audio_data, mime_type = kokoro_tts(ai_text_response, language)
        print(f"TTS Result for {sid}: {len(audio_data)} bytes, type: {mime_type}")
        emit('audio_response', {
            'audio': audio_data,
            'mime_type': mime_type
        }, room=sid)
        emit('voice_interaction_complete', {'message': 'Interaction finished'}, room=sid)
    except Exception as e:
        app.logger.error(f'Error processing voice for SID {sid}: {str(e)}', exc_info=True)
        emit('voice_error', {'error': f'Processing error: {str(e)}'}, room=sid)
        if sid in active_streams:
             active_streams[sid]['is_streaming'] = False
             active_streams[sid]['audio_chunks'] = []

@socketio.on('voice_transcript')
@login_required
def handle_voice_transcript(data):
    """Riceve direttamente il testo trascritto dal browser via Web Speech API."""
    sid = request.sid
    if sid not in active_streams:
        print(f'Warning: Received transcript from {sid} but no active session found.')
        emit('voice_error', {'error': 'Session not found. Please refresh and try again.'}, room=sid)
        return
        
    chat_id = data.get('chat_id')
    transcript = data.get('transcript')
    language = data.get('language', 'en')  # Get language preference, default to English
    user_id = current_user.id
    
    if not chat_id or not transcript:
        print(f'Error: Missing chat_id or transcript for {sid}')
        emit('voice_error', {'error': 'Missing chat or transcript data.'}, room=sid)
        return
        
    print(f"Processing transcript for chat {chat_id} (SID: {sid}): '{transcript}'")
    emit('processing_voice', {'message': 'Generating response...'}, room=sid)
    
    # Verifica che la chat esista e appartenga all'utente
    chat = Chat.query.filter_by(id=chat_id, user_id=user_id).first()
    if not chat:
        print(f'Error: Chat {chat_id} not found or not owned by user {user_id}')
        emit('voice_error', {'error': 'Chat not found or access denied.'}, room=sid)
        return
        
    try:
        # 1. Salva messaggio utente
        user_message_obj = Message(id=str(uuid.uuid4()), content=transcript, role='user', chat_id=chat.id)
        db.session.add(user_message_obj)
        db.session.commit()
        
        # 2. Invia il messaggio utente al frontend per aggiornare la UI
        emit('new_message', {
            'id': user_message_obj.id,
            'content': user_message_obj.content,
            'role': user_message_obj.role,
            'timestamp': user_message_obj.timestamp.isoformat()
        }, room=sid)
        
        # 3. Prepara il contesto della conversazione per l'AI con le istruzioni sulla lingua
        conversation_context = get_language_prompt(language)
        conversation_context += "The following is a conversation with an AI assistant named Gemma. The assistant is helpful, friendly, and knowledgeable.\n\n"
        for message in chat.messages:
            role_prefix = "Human: " if message.role == 'user' else "Gemma: "
            conversation_context += f"{role_prefix}{message.content}\n"
        conversation_context += "Gemma:"
        
        # 4. Chiama Ollama API
        response = requests.post(
            OLLAMA_API_URL,
            json={"model": "gemma3:1b", "prompt": conversation_context, "stream": False}
        )
        response.raise_for_status()
        ai_text_response = response.json().get('response', 'Sorry, I could not generate a response.')
        print(f"AI Response for {sid}: {ai_text_response[:50]}...")
        
        # 5. Salva messaggio AI
        ai_message_obj = Message(id=str(uuid.uuid4()), content=ai_text_response, role='assistant', chat_id=chat.id)
        db.session.add(ai_message_obj)
        
        # 6. Aggiorna titolo della chat se necessario
        if len(chat.messages) == 1: # Se era il primo messaggio dell'utente
            title_words = transcript.split()[:3]
            chat.title = " ".join(title_words) + "..."
            
        db.session.commit()
        
        # 7. Invia il messaggio AI al frontend per aggiornare la UI
        emit('new_message', {
            'id': ai_message_obj.id,
            'content': ai_message_obj.content,
            'role': ai_message_obj.role,
            'timestamp': ai_message_obj.timestamp.isoformat()
        }, room=sid)
        
        # 8. Genera audio dalla risposta AI e invialo
        try:
            audio_data, mime_type = kokoro_tts(ai_text_response, language)
            print(f"TTS Result for {sid}: {len(audio_data)} bytes, type: {mime_type}")
            
            emit('audio_response', {
                'audio': audio_data,
                'mime_type': mime_type
            }, room=sid)
            
        except Exception as tts_error:
            print(f"Error during TTS for {sid}: {str(tts_error)}")
            emit('voice_error', {'error': f'TTS error: {str(tts_error)}'}, room=sid)
            # Anche se TTS fallisce, l'interazione ha comunque successo a livello testuale
        
        emit('voice_interaction_complete', {'message': 'Interaction finished'}, room=sid)
        
    except Exception as e:
        app.logger.error(f'Error processing transcript for SID {sid}: {str(e)}', exc_info=True)
        emit('voice_error', {'error': f'Processing error: {str(e)}'}, room=sid)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    print("Starting Flask-SocketIO server...")
    socketio.run(app, debug=app.config['DEBUG'], host='0.0.0.0', port=5000)