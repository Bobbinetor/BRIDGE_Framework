# BRIDGE Framework

## Panoramica

BRIDGE è un'applicazione web interattiva che facilita la comunicazione con un assistente AI attraverso un'interfaccia di chat sia testuale che vocale. L'applicazione utilizza un backend Flask, un database PostgreSQL, integra Ollama API per generare risposte basate sul modello linguistico Gemma 3, e Kokoro-FastAPI per la sintesi vocale (TTS).

## Funzionalità

- **Sistema di Autenticazione**
  - Registrazione e login sicuri
  - Hashing delle password per maggiore sicurezza
  - Gestione delle sessioni con Flask-Login

- **Gestione delle Chat**
  - Creazione di nuove sessioni di chat
  - Archiviazione permanente della cronologia delle conversazioni
  - Possibilità di rinominare ed eliminare le sessioni di chat

- **Integrazione AI**
  - Comunicazione in tempo reale con il modello Gemma 3 (1B parametri)
  - Conversazioni contestuali
  - Generazione automatica del titolo della chat basata sui messaggi iniziali

- **Modalità Vocale**
  - Riconoscimento vocale tramite Web Speech API del browser
  - Sintesi vocale (TTS) tramite Kokoro-FastAPI
  - Comunicazione bidirezionale tramite WebSockets

- **Architettura Containerizzata**
  - Database PostgreSQL in un container Docker
  - Interfaccia pgAdmin per la gestione del database
  - Kokoro-FastAPI in container Docker per la sintesi vocale
  - Configurazione tramite variabili d'ambiente per deployment flessibile

## Architettura Tecnica

L'applicazione segue un'architettura moderna:

- **Backend**: Framework Flask con Python 3
- **Database**: PostgreSQL 14
- **ORM**: SQLAlchemy
- **Autenticazione**: Flask-Login
- **AI**: Ollama API con modello Gemma 3:1B
- **Comunicazione in tempo reale**: Flask-SocketIO e Socket.IO
- **Riconoscimento vocale**: Web Speech API (lato browser)
- **Sintesi vocale**: Kokoro-FastAPI (server TTS)
- **Containerizzazione**: Docker e Docker Compose

### Schema del Database

L'applicazione utilizza tre modelli principali:
1. **User**: Memorizza credenziali e informazioni di autenticazione
2. **Chat**: Rappresenta le sessioni di chat appartenenti agli utenti
3. **Message**: Contiene i singoli messaggi all'interno delle chat, identificando sia le risposte dell'utente che dell'AI

## Prerequisiti

- Docker e Docker Compose
- Python 3.8 o superiore
- Ollama in esecuzione localmente con il modello Gemma 3:1B installato
- Un browser moderno che supporti Web Speech API (Chrome o Edge consigliati)

## Installazione e Configurazione

1. **Clona il repository e il repository di Kokoro-FastAPI**
   ```bash
   git clone [repository-url] bridge-framework
   cd bridge-framework
   git clone https://github.com/remsky/Kokoro-FastAPI.git
   ```

2. **Avvia il container Docker di Kokoro-FastAPI**
   ```bash
   cd Kokoro-FastAPI/docker/cpu
   docker compose up -d
   cd ../../../
   ```

3. **Configura le variabili d'ambiente**
   - Copia il file .env di esempio e modificalo secondo le tue esigenze:
   ```bash
   cp .env.example .env
   ```

4. **Avvia i container Docker per PostgreSQL**
   ```bash
   docker-compose up -d
   ```

5. **Attiva l'ambiente virtuale e installa le dipendenze Python**
   ```bash
   python -m venv myenv
   source myenv/bin/activate  # su Windows: myenv\Scripts\activate
   pip install -r requirements.txt
   ```

6. **Avvia Ollama e carica il modello Gemma**
   ```bash
   ollama pull gemma3:1b
   ollama run gemma3:1b
   ```

7. **Avvia l'applicazione Flask**
   ```bash
   python app.py
   ```

8. **Accedi all'applicazione**
   - Applicazione web: http://localhost:5000
   - pgAdmin: http://localhost:5050 (login con admin@example.com / pgadminpassword)
   - API Kokoro: http://localhost:8880 (interfaccia Swagger per il test)

## Utilizzo della Modalità Vocale

La modalità vocale utilizza due componenti principali:
1. **Web Speech API** nel browser per il riconoscimento vocale (STT)
2. **Kokoro-FastAPI** sul server per la sintesi vocale (TTS)

Per utilizzare la modalità vocale:
1. Accedi all'applicazione e seleziona o crea una chat
2. Clicca sul pulsante del microfono nell'area di input
3. Parla chiaramente (preferibilmente in italiano)
4. Il testo riconosciuto verrà inviato automaticamente all'AI
5. La risposta dell'AI verrà visualizzata nella chat e riprodotta automaticamente come audio

**Nota**: Il riconoscimento vocale funziona meglio con browser come Chrome o Edge. Firefox ha un supporto limitato.

## Variabili d'Ambiente

| Variabile | Descrizione | Valore Predefinito |
|----------|-------------|---------------|
| POSTGRES_USER | Username PostgreSQL | seachatuser |
| POSTGRES_PASSWORD | Password PostgreSQL | securepassword |
| POSTGRES_DB | Nome database PostgreSQL | seachat |
| POSTGRES_HOST | Indirizzo host PostgreSQL | localhost |
| POSTGRES_PORT | Porta PostgreSQL | 5432 |
| FLASK_SECRET_KEY | Chiave segreta per le sessioni Flask | your-secret-key-change-this-in-production |
| FLASK_DEBUG | Abilita modalità debug | True |
| OLLAMA_API_URL | URL per l'API Ollama | http://localhost:11434/api/generate |
| KOKORO_API_URL | URL per l'API Kokoro | http://localhost:8880 |

## API Endpoint

### Autenticazione
- `GET/POST /login` - Login utente
- `GET/POST /register` - Registrazione utente
- `GET/POST /verify-otp` - Verifica OTP
- `GET/POST /complete-profile` - Completamento profilo
- `GET /logout` - Logout utente

### Gestione Chat
- `GET /api/chats` - Recupera tutte le chat utente
- `POST /api/chats` - Crea una nuova chat
- `GET /api/chats/<chat_id>` - Recupera una chat specifica con i messaggi
- `DELETE /api/chats/<chat_id>` - Elimina una chat specifica
- `POST /api/chats/<chat_id>/rename` - Rinomina una chat specifica

### Gestione Messaggi
- `POST /api/chats/<chat_id>/messages` - Invia un messaggio e ottieni la risposta AI
- `DELETE /api/chats/<chat_id>/messages/<message_id>` - Elimina un messaggio specifico

### Interazione Vocale
- WebSocket comunicazione bidirezionale tramite Socket.IO
- Eventi WebSocket per il controllo della modalità vocale
- Elaborazione dei messaggi trascritti e risposte vocali

## Configurazione Docker

L'applicazione utilizza Docker Compose con i seguenti servizi:

### PostgreSQL
- Immagine: postgres:14
- Porta esposta: 5432
- Volume: postgres_data per archiviazione persistente

### pgAdmin
- Immagine: dpage/pgadmin4
- Porta esposta: 5050
- Credenziali predefinite: admin@example.com / pgadminpassword

### Kokoro-FastAPI (Servizio TTS)
- Immagine: remsky/kokoro:latest-cpu
- Porta esposta: 8880
- Interfaccia API compatibile con OpenAI

## Dipendenze

- Flask 2.3.3
- Flask-SQLAlchemy 3.1.1
- Flask-Login 0.6.3
- Flask-SocketIO 5.3.6 (per comunicazione WebSocket)
- Requests 2.31.0
- Werkzeug 2.3.7
- psycopg2-binary 2.9.9
- python-dotenv 1.0.0
- python-socketio 5.11.2

## Risoluzione dei Problemi

### Kokoro-FastAPI
- Se riscontri errori con la sintesi vocale, verifica che il container Kokoro-FastAPI sia in esecuzione: `docker ps | grep kokoro`
- Controlla i log del container: `docker logs [container-id]`
- Verifica che l'API sia accessibile: http://localhost:8880/docs

### Ollama
- Assicurati che Ollama sia in esecuzione: `ps aux | grep ollama`
- Verifica che il modello Gemma 3:1B sia installato: `ollama list`
- Controlla la disponibilità dell'API: `curl http://localhost:11434/api/tags`

### Riconoscimento Vocale
- Se il riconoscimento vocale non funziona, assicurati di utilizzare un browser supportato (preferibilmente Chrome)
- Concedi i permessi per l'accesso al microfono quando richiesto
- Verifica che non ci siano problemi con il microfono nelle impostazioni del sistema

## Sviluppo

Per eseguire l'applicazione in modalità sviluppo:

```bash
export FLASK_DEBUG=True
python app.py
```

## Sicurezza e Considerazioni

- Modifica le credenziali predefinite in produzione
- Aggiorna la chiave segreta di Flask con un valore forte e casuale
- Considera l'implementazione di un limite di frequenza per gli endpoint API
- Rivedi le impostazioni di sicurezza di PostgreSQL prima del deployment

## Note sui Branch

Il progetto include diversi branch per funzionalità specifiche:
- `main`: Branch principale con la versione stabile dell'applicazione
- `alfredo`: Branch con l'implementazione della modalità vocale

## Licenza

[Specifica le informazioni sulla licenza qui]

## Contatti

[Fornisci informazioni di contatto per i responsabili del progetto]