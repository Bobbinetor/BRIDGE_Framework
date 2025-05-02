# BRIDGE Project Web Application

## Overview

The BRIDGE Project is an interactive web application that facilitates communication with an AI assistant through a chat interface. This application utilizes a Flask backend, PostgreSQL database, and integrates with the Ollama API to generate AI-powered responses using the Gemma 3 language model.

## Features

- **User Authentication System**
  - Secure registration and login functionality
  - Password hashing for enhanced security
  - Session management with Flask-Login

- **Chat Management**
  - Creation of new chat sessions
  - Persistent storage of conversation history
  - Ability to rename and delete chat sessions

- **AI Integration**
  - Real-time communication with Gemma 3 (1B parameter) model
  - Context-aware conversations
  - Automatic chat title generation based on initial messages

- **Containerized Architecture**
  - PostgreSQL database in a Docker container
  - pgAdmin interface for database management
  - Environment variable configuration for flexible deployment

## Technical Architecture

The application follows a modern web application architecture:

- **Backend**: Flask framework with Python 3
- **Database**: PostgreSQL 14
- **ORM**: SQLAlchemy
- **Authentication**: Flask-Login
- **AI Integration**: Ollama API with Gemma 3:1B model
- **Containerization**: Docker and Docker Compose

### Database Schema

The application uses three primary models:
1. **User**: Stores user credentials and authentication information
2. **Chat**: Represents chat sessions belonging to users
3. **Message**: Contains individual messages within chats, identifying both user and AI responses

## Prerequisites

- Docker and Docker Compose
- Python 3.8 or higher
- Ollama running locally with the Gemma 3:1B model installed

## Installation and Setup

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd bridge-project
   ```

2. **Configure environment variables**
   - Copy the example .env file and modify as needed:
   ```bash
   cp .env.example .env
   ```

3. **Start the Docker containers**
   ```bash
   docker-compose up -d
   ```

4. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the Flask application**
   ```bash
   python app.py
   ```

6. **Access the application**
   - Web application: http://localhost:5000
   - pgAdmin: http://localhost:5050 (login with admin@example.com / pgadminpassword)

## Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| POSTGRES_USER | PostgreSQL username | seachatuser |
| POSTGRES_PASSWORD | PostgreSQL password | securepassword |
| POSTGRES_DB | PostgreSQL database name | seachat |
| POSTGRES_HOST | PostgreSQL host address | localhost |
| POSTGRES_PORT | PostgreSQL port | 5432 |
| FLASK_SECRET_KEY | Secret key for Flask sessions | your-secret-key-change-this-in-production |
| FLASK_DEBUG | Enable debug mode | True |
| OLLAMA_API_URL | URL for Ollama API | http://localhost:11434/api/generate |

## Usage

### User Registration and Login

1. Navigate to `/register` to create a new account
2. Use the `/login` endpoint with your credentials to access the application

### Creating and Managing Chats

1. From the main interface, create a new chat session
2. Enter messages to communicate with the AI assistant
3. View, rename, or delete chats from the chat management interface

## API Endpoints

### Authentication
- `GET/POST /login` - User login
- `GET/POST /register` - User registration
- `GET /logout` - User logout

### Chat Management
- `GET /api/chats` - Retrieve all user chats
- `POST /api/chats` - Create a new chat
- `GET /api/chats/<chat_id>` - Retrieve a specific chat with messages
- `DELETE /api/chats/<chat_id>` - Delete a specific chat
- `POST /api/chats/<chat_id>/rename` - Rename a specific chat

### Message Handling
- `POST /api/chats/<chat_id>/messages` - Send a message and get AI response
- `DELETE /api/chats/<chat_id>/messages/<message_id>` - Delete a specific message

## Docker Configuration

The application uses Docker Compose with the following services:

### PostgreSQL
- Image: postgres:14
- Exposed port: 5432
- Volume: postgres_data for persistent storage

### pgAdmin
- Image: dpage/pgadmin4
- Exposed port: 5050
- Default credentials: admin@example.com / pgadminpassword

## Dependencies

- Flask 2.3.3
- Flask-SQLAlchemy 3.1.1
- Flask-Login 0.6.3
- Requests 2.31.0
- Werkzeug 2.3.7
- psycopg2-binary 2.9.9
- python-dotenv 1.0.0

## Development

To run the application in development mode:

```bash
export FLASK_DEBUG=True
python app.py
```

## Ollama Setup

Ensure Ollama is installed and the Gemma 3:1B model is available:

```bash
ollama pull gemma3:1b
```

## Security Considerations

- Change the default credentials in production
- Update the Flask secret key with a strong, random value
- Consider implementing rate limiting for API endpoints
- Review PostgreSQL security settings before deployment

## License

[Specify your license information here]

## Contact

[Provide contact information for project maintainers]