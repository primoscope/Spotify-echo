
# 🎵 EchoTune AI - Spotify Music Recommendation System

## Project Vision
EchoTune AI is a next-generation music recommendation system designed to deliver a deeply personalized and interactive music discovery experience. By leveraging the Spotify API, advanced machine learning, and a conversational AI interface, EchoTune acts as a personal music sommelier, understanding nuanced user preferences to curate the perfect soundtrack for any moment. Our goal is to move beyond simple "you might also like" recommendations and create a dynamic, conversational partnership between the user and their music library.

## 🤖 For GitHub Coding Agents
This project is optimized for automated development workflows. See [CODING_AGENT_GUIDE.md](./CODING_AGENT_GUIDE.md) for detailed instructions on:
- Automated testing and CI/CD
- MCP server integration for browser automation
- Spotify API workflow automation
- Database optimization and CSV processing
- Code generation patterns and best practices

## ✨ Core Features
 * Deep History Analysis: Ingests and processes large CSV files containing a user's complete extended listening history (e.g., from a Spotify data privacy export). This file, with every song played, skipped, or added, serves as the foundational dataset for creating a highly accurate and personalized taste model.
 * Dynamic Preference Modeling: A self-improving machine learning model that analyzes a user's listening history, explicit feedback (likes/dislikes), and nuanced audio features (e.g., danceability, energy, valence) to build a sophisticated profile of their musical taste.
 * AI-Powered Conversational Interface: A chatbot, powered by a large language model (LLM), serves as the primary user interface. Users can make requests in natural language like, "Find me some upbeat indie folk for a rainy afternoon" or "Create a playlist that sounds like a mix between Tame Impala and Daft Punk."
 * Context-Aware Recommendations: The system generates suggestions not just on taste, but also on context. Users can request music for specific activities (workout, focus, relaxing), times of day, or moods.
 * Personalized Playlist Curation: Instantly generates and saves tailored playlists directly to the user's Spotify account based on their conversational prompts and underlying preference model.
 * Listening Habit Insights: Provides users with interactive visualizations and summaries of their listening habits, such as top genres by mood, most-listened-to artists during specific hours, and discovery trends.

## 🛠️ System Architecture
 * Data Ingestion & Processing
   * Bulk History Parser: The primary ingestion mechanism. Includes a robust, memory-efficient parser for large-scale CSV files (e.g., Spotify's extended streaming history) to process a user's entire historical data. This captures fine-grained interactions like tracks played, ms played, and skips, forming the backbone of the personalization engine.
   * Spotify API Sync: After the initial bulk import, it connects to the Spotify API to fetch ongoing user data, including new listening history, saved tracks, and playlists, keeping the model current.
   * Feature Enrichment: Extracts audio features for every unique track from the history file using Spotify's analysis endpoints.
   * All data is cleaned, normalized, and stored in a robust database.
 * Machine Learning Core
   * Preference Model: A model (e.g., collaborative filtering, content-based filtering, or a hybrid approach) trained on the comprehensive historical data and audio features. It generates a vector representation of a user's taste, giving strong weights to positive interactions (long plays, additions) and negative weights to skips.
   * Dynamic Updates: The model is periodically retrained to adapt to the user's evolving preferences based on new listening data from the API sync and direct feedback.
 * Recommendation Engine
   * Takes input from the user's preference model and any contextual prompts (mood, activity).
   * Queries the Spotify API for tracks that match the desired audio feature profile.
   * Ranks and filters results to ensure novelty and relevance, avoiding overly repetitive suggestions.
 * Conversational AI Layer (LLM Integration)
   * Processes natural language prompts from the user to extract key intents, entities (artists, genres), and context (mood, activity).
   * Translates user requests into structured queries for the Recommendation Engine.
   * Generates conversational, human-like responses and presents the music recommendations.
 * Scalable Database
   * A high-performance database (e.g., PostgreSQL with vector support or a dedicated NoSQL solution) designed to store user data, track features, and model outputs efficiently.
   * Ensures low latency and high availability as the user base and data volume grow.
## 🚀 Quick Start for Developers

### Prerequisites
- Python 3.8+
- Node.js 16+
- Spotify Developer Account
- MCP Server for browser automation

### Setup
```bash
# Clone repository
git clone https://github.com/dzp5103/Spotify-echo.git
cd Spotify-echo

# Install dependencies
pip install -r requirements.txt
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Spotify API credentials

# Initialize database
python scripts/merge_csv_data.py
python scripts/database_setup.py

# Start development server
npm run dev
```

### Environment Variables
```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
DATABASE_URL=sqlite:///echotune.db
MCP_SERVER_PORT=3001
```

## 🤖 Automated Development Workflow

This project includes:
- **GitHub Actions** for CI/CD automation
- **MCP Server** for browser and Spotify API automation  
- **Automated testing** with pytest and jest
- **Code quality** checks with eslint, black, and mypy
- **Database migrations** and CSV optimization scripts

### GitHub Actions Workflow
The project uses automated workflows for:
- Code quality checks and linting
- Automated testing on multiple Python/Node versions
- Database optimization and CSV processing
- MCP server deployment and testing
- Spotify API integration testing

### MCP Server Integration
- Browser automation for Spotify Web Player interaction
- Automated playlist creation and management
- Real-time listening data collection
- Cross-platform testing automation

## 🤖 Actionable Roadmap for Development Agent
This project will be built in phases. The following tasks are prioritized for initial development and are optimized for automated coding workflows.

### Phase 1: Core Backend & Data Foundation
 * [ ] Task 1: Bulk History Ingestion
   * [ ] Design a schema for the extended history CSV format (identifying key columns like ts, ms_played, master_metadata_track_name, reason_end, etc.).
   * [ ] Implement a high-performance parser to process the large CSV file and load the data into the database.
   * [ ] Develop a service to enrich the imported data by fetching audio features from Spotify for all unique tracks.
 * [ ] Task 2: Spotify API Sync & Authentication
   * [ ] Implement OAuth 2.0 for secure user authentication with Spotify.
   * [ ] Develop a service to fetch a user's recent listening history to supplement the bulk import.
 * [ ] Task 3: Initial Machine Learning Model
   * [ ] Develop a feature engineering pipeline based on the ingested historical data (e.g., creating labels based on ms_played and reason_end='fwdbtn').
   * [ ] Implement a baseline content-based filtering model that predicts user preference.
   * [ ] Create a script for training and evaluating the model on the historical dataset.

### Phase 2: Recommendation & API Endpoints
 * [ ] Task 4: Recommendation Engine
   * [ ] Build a core service that takes a user ID and generates a list of recommended track IDs based on the ML model.
   * [ ] Develop a REST API endpoint (e.g., GET /recommendations/{user_id}) to expose the recommendations.
 * [ ] Task 5: Playlist Curation
   * [ ] Create a service that uses the Spotify API to generate a new playlist and populate it with a list of track IDs.
   * [ ] Develop a REST API endpoint (e.g., POST /playlists) that accepts a user ID and track list.

### Phase 3: Conversational Interface & User Interaction
 * [ ] Task 6: LLM Integration
   * [ ] Set up an interface to an LLM provider (e.g., OpenAI API).
   * [ ] Develop a prompt engineering module that translates natural language into structured API calls for the recommendation and playlist services.
 * [ ] Task 7: Chatbot UI
   * [ ] Build a simple, user-friendly web-based chat interface.
   * [ ] Connect the chatbot front-end to the backend AI and recommendation services.
