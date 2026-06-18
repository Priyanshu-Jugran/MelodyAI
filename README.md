<div align="center">

# 🎵 MelodyAI

### AI-Powered Music Recommendation System

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-2.x-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.x-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![pandas](https://img.shields.io/badge/pandas-2.x-150458?style=for-the-badge&logo=pandas&logoColor=white)](https://pandas.pydata.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

*Discover music that truly matches your taste — powered by K-Means Clustering and Cosine Similarity across 51,000+ tracks.*

[Architecture](#-architecture) · [ML Workflow](#-machine-learning-workflow) · [Getting Started](#-installation-guide) · [API Docs](#-flask-backend)

</div>

---

## 📌 Project Overview

**MelodyAI** is a full-stack machine learning application that recommends songs similar to a user-selected track.
Built with a Flask backend and a Spotify-inspired dark UI, it processes a dataset of **~51,826 Hindi and English songs**
to deliver instant, intelligent recommendations.

The recommendation engine uses a **two-stage ML pipeline**:

1. **K-Means Clustering** (k=5, selected via the Elbow Method) to partition songs into musical clusters and dramatically reduce the search space.
2. **Cosine Similarity** on 11 normalized audio features within the matched cluster to rank and return the 5 most acoustically similar songs.

Users sign up, pick their top 5 favourite songs, and explore an **infinite recommendation chain** — clicking any
recommended song immediately generates new recommendations, creating a never-ending music discovery loop.

---

## ✨ Features

| Category | Feature |
|---|---|
| 🤖 **ML Engine** | K-Means + Cosine Similarity hybrid recommendation pipeline |
| 🎯 **Precision** | Cluster-scoped search — similarity computed only within the matched cluster |
| 🔍 **Search** | Debounced real-time autocomplete with prefix-first ranking across 51K+ tracks |
| 🔄 **Infinite Loop** | Click any recommended song → instantly get new recommendations |
| 🔗 **External Links** | One-click Spotify and YouTube search for every song card (no API keys needed) |
| 👤 **Auth** | Local signup/login with password hashing and session persistence via localStorage |
| 💾 **Persistence** | Favourite songs saved per-user and pre-filled when revisiting onboarding |
| 📊 **Chain History** | Visual breadcrumb tracking every hop in your recommendation journey |
| 💅 **UI** | Spotify-inspired dark glassmorphism design with skeleton loaders and micro-animations |
| 📱 **Responsive** | Fully mobile-friendly 5 → 3 → 2 → 1 column grid layout |
| ⚡ **Performance** | ML model and dataset loaded once at startup; sub-100 ms API responses |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                         │
│                                                                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌───────────┐  │
│   │index.html│  │auth.html │  │onboarding    │  │favorites  │  │
│   │(Landing) │  │(Auth)    │  │.html (Picker)│  │.html      │  │
│   └──────────┘  └──────────┘  └──────────────┘  └─────┬─────┘  │
│                                                        │         │
│   ┌────────┐  ┌─────────────┐  ┌──────────────┐ ┌────▼──────┐  │
│   │auth.js │  │onboarding.js│  │   app.js     │ │recs.html  │  │
│   └────────┘  └─────────────┘  └──────────────┘ └───────────┘  │
│         │               │             │                          │
│         └───────────────┴─────────────┘                         │
│                   localStorage / sessionStorage                  │
│         ┌────────────────────────────────────────┐              │
│         │  melody_users · melody_user · favorites │              │
│         └────────────────────────────────────────┘              │
└──────────────────────────┬───────────────────────────────────────┘
                           │  HTTP / JSON REST API
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                    Flask Backend  (app.py)                        │
│                                                                   │
│  Page Routes:                   API Endpoints:                    │
│  GET  /                         GET  /api/songs?q=&limit=         │
│  GET  /auth                     POST /api/recommend               │
│  GET  /onboarding               GET  /api/songs/validate          │
│  GET  /favorites                                                   │
│  GET  /recommendations                                            │
└──────────────────────────┬───────────────────────────────────────┘
                           │  pandas · sklearn · joblib
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                        ML Layer                                   │
│                                                                   │
│   song_dataset_clustered.csv  ←  51,826 songs + cluster label    │
│   optimised_model.joblib      ←  KMeans (k=5) trained model      │
│   scaler.joblib               ←  Fitted StandardScaler           │
│                                                                   │
│   All artifacts loaded ONCE at startup. Feature matrix held       │
│   in RAM for O(1) vector lookup during inference.                 │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Machine Learning Workflow

### Step 1 — Dataset Preparation

Raw data comes from two Spotify-sourced datasets merged by `Dataset Prep/dataset_prep.py`:

| Source File | Language | Approx. Tracks |
|---|---|---|
| `English_songs.csv` | English | ~51,600 |
| `Hindi_songs.csv` | Hindi / Bollywood | ~300 |

The script normalizes column names, drops null rows, removes duplicate `(name, artist)` pairs, and
concatenates both into the unified **`song_dataset.csv`** (~51,826 tracks).

**Audio features retained (11 total):**

| Feature | Type | Description |
|---|---|---|
| `danceability` | Float 0–1 | How suitable the track is for dancing |
| `energy` | Float 0–1 | Perceptual intensity and activity level |
| `loudness` | Float (dB) | Overall loudness of the track |
| `speechiness` | Float 0–1 | Proportion of spoken words detected |
| `acousticness` | Float 0–1 | Confidence that the track is acoustic |
| `liveness` | Float 0–1 | Likelihood of a live audience present |
| `valence` | Float 0–1 | Musical positiveness conveyed |
| `tempo` | Float (BPM) | Estimated beats per minute |
| `key` | Int 0–11 | Track key using Pitch Class notation |
| `mode` | Int 0 or 1 | Major (1) or minor (0) |
| `time_signature` | Int | Estimated beats per bar |

---

### Step 2 — Optimal K via the Elbow Method

`Model Training/elbow_method.py` samples **8,000 songs** for speed, fits KMeans for K = 1 through 11,
and plots the inertia curve to identify the natural elbow point:

```python
inertia = []
for k in range(1, 12):
    kmeans = KMeans(n_clusters=k, random_state=42)
    kmeans.fit(X_scaled)
    inertia.append(kmeans.inertia_)

plt.plot(range(1, 12), inertia, marker='o')
plt.title("Elbow Method — Optimal K for Song Clustering")
plt.show()
```

📉 **The elbow lands at K = 5** — selected as the production cluster count.

---

### Step 3 — K-Means Clustering (Production Model)

`Model Training/optimised_model_train.py` trains the final model on the **full 51K dataset**:

```python
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X[features])

kmeans = KMeans(n_clusters=5, random_state=42)
df["cluster"] = kmeans.fit_predict(X_scaled)

# Persist all production artifacts
joblib.dump(kmeans, "optimised_model.joblib")
joblib.dump(scaler,  "scaler.joblib")
df.to_csv("song_dataset_clustered.csv", index=False)
```

Each song is permanently assigned a cluster label (0–4). Songs in the same cluster share similar
audio profiles — similar tempo, energy, acousticness, etc.

> **Why pre-cluster?**
> Running cosine similarity against all 51,826 songs per query is wasteful.
> With k=5 clusters of ~10,000 songs each, every search scans only **~20% of the dataset** —
> a ~5× speedup at no quality cost.

---

### Step 4 — Cosine Similarity Inference

The `recommend()` function in `app.py` executes this pipeline on every API request:

```
Input: song name (string)
        │
        ▼  lowercase + strip whitespace
        │
        ▼  df["name_lower"] lookup  ──→  HTTP 404 if not found
        │
        ▼  Read cluster label from df["cluster"]
        │
        ▼  Filter dataset: only rows in that cluster
        │
        ▼  Slice pre-scaled vectors: X_scaled[cluster_indices]
        │
        ▼  cosine_similarity(song_vector, cluster_vectors)
        │
        ▼  Sort descending · skip index 0 (self) · take indices [1:6]
        │
        ▼  Return [ { name, artist } ] × 5
```

```python
scores = cosine_similarity(song_vector, cluster_vectors)[0]
scores = sorted(zip(cluster_indices, scores), key=lambda x: x[1], reverse=True)

recommendations = [
    {"name": df.iloc[i[0]]["name"], "artist": df.iloc[i[0]]["artist"]}
    for i in scores[1:6]
]
```

> **Why Cosine Similarity?**
> It measures the *angle* between feature vectors, not their magnitude — making it scale-invariant.
> A quiet acoustic ballad won't accidentally match a loud rock track just because they share a musical key.

---

## 🖥️ Flask Backend

`app.py` loads all ML artifacts **once at server startup** into memory and exposes both page routes and a JSON REST API.

### REST API Reference

#### `GET /api/songs?q=<query>&limit=<n>`

Real-time autocomplete. Returns prefix matches first, then substring matches. Results capped at 25.

```
GET /api/songs?q=beli&limit=5

Response 200:
[
  { "name": "Believer", "artist": "Imagine Dragons" },
  { "name": "Believer", "artist": "Old Dominion" },
  ...
]
```

#### `POST /api/recommend`

Core ML inference. Runs the cluster lookup and cosine similarity pipeline.

```
POST /api/recommend
Content-Type: application/json
{ "song": "Believer" }

Response 200:
{
  "input_song": "believer",
  "recommendations": [
    { "name": "Thunder",   "artist": "Imagine Dragons" },
    { "name": "Natural",   "artist": "Imagine Dragons" },
    { "name": "Enemy",     "artist": "Imagine Dragons" },
    { "name": "Warriors",  "artist": "Imagine Dragons" },
    { "name": "Bones",     "artist": "Imagine Dragons" }
  ]
}

Response 404: { "error": "Song \"xyz\" was not found in our dataset." }
Response 400: { "error": "No song name provided." }
```

#### `GET /api/songs/validate?name=<name>`

Checks whether a song exists in the dataset before it is saved to a user's favorites.

```
Response: { "exists": true,  "name": "Believer", "artist": "Imagine Dragons" }
      or: { "exists": false }
```

---

## 🎨 Frontend Features

Built entirely with **Vanilla HTML5 + CSS3 + JavaScript ES6+** — zero framework dependencies, zero build step.

### Pages

| Page | Route | Description |
|---|---|---|
| **Landing** | `/` | Dark hero with animated floating music notes and equalizer visualizer |
| **Auth** | `/auth` | Glassmorphism card with tabbed Login / Signup and inline field validation |
| **Onboarding** | `/onboarding` | Debounced autocomplete song picker, numbered pill list, 0/5 progress counter |
| **Favorites** | `/favorites` | 5 song cards, time-of-day greeting, Edit Favorites shortcut |
| **Recommendations** | `/recommendations` | Now-playing banner, 5 AI rec cards, chain breadcrumb, hop counter |

### Design System

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#0a0a0f` | Page background |
| `--accent` | `#1db954` | Buttons, active states, glow shadows |
| `--purple` | `#a855f7` | Decorative landing gradients |
| `--glass-border` | `rgba(255,255,255,0.10)` | Card and input borders |
| Font | Outfit (weights 300–900) | All text across all pages |

**Animations:** floating notes · equalizer bars · skeleton shimmer loaders ·
fade-up page entries · toast slide-in/out · pulse dot on now-playing label · card hover glow lift

---

## 🔗 Spotify and YouTube Search Integration

Every song card — on both the Favorites and Recommendations pages — includes two branded
search-URL buttons. **No API keys. No OAuth. No third-party credentials required.**

The URL is built entirely client-side:

```javascript
const searchQuery = encodeURIComponent(`${song.name} ${song.artist}`);

// Spotify native search
const spotifyUrl = `https://open.spotify.com/search/${searchQuery}`;

// YouTube native search
const youtubeUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
```

Both links open in a **new browser tab** (`target="_blank" rel="noopener noreferrer"`).
Click events use `e.stopPropagation()` to prevent them from accidentally triggering
the card's recommendation action.

| Button | Platform | URL Pattern |
|---|---|---|
| 🟢 **Spotify** | open.spotify.com | `/search/{encoded query}` |
| 🔴 **YouTube** | youtube.com | `/results?search_query={encoded query}` |

---

## 🚀 Installation Guide

### Prerequisites

- Python **3.9+**
- pip

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/MelodyAI.git
cd MelodyAI
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

**`requirements.txt`**
```
flask>=2.3
pandas>=2.0
scikit-learn>=1.3
joblib>=1.3
numpy>=1.24
matplotlib>=3.7
```

### 3. Verify ML artifacts are present

The following three files must exist in the project root:

```
song_dataset_clustered.csv   ← dataset with cluster labels
optimised_model.joblib       ← trained KMeans model (k=5)
scaler.joblib                ← fitted StandardScaler
```

> **If these files are missing**, regenerate them from the raw data:
>
> ```bash
> # Step 1 — Merge and clean both language datasets
> python "Dataset Prep/dataset_prep.py"
>
> # Step 2 — (Optional) Visualize the Elbow curve to confirm k=5
> python "Model Training/elbow_method.py"
>
> # Step 3 — Train the production model and export all artifacts
> python "Model Training/optimised_model_train.py"
> ```

### 4. Start the application

```bash
python app.py
```

Open your browser at **`http://127.0.0.1:5000`** and sign up to start discovering music.

### 5. Run the test suite (optional)

```bash
# Offline ML unit tests — no server required
python test_verify.py

# HTTP integration tests — requires the Flask server to be running
python test_api.py
```

Expected `test_api.py` output:

```
=== Autocomplete /api/songs?q=beli ===
  Believer — Imagine Dragons
  ...

=== Recommend: believer ===
  Thunder — Imagine Dragons
  Natural — Imagine Dragons
  ...

=== Not-found 404 — Song "fakesongxyz999" was not found (PASS) ===

=== Recommend: Babul Ka Ghar (Hindi) ===
  ...

✓ ALL API TESTS PASSED
```

---

## 📁 Project Structure

```
MelodyAI/
│
├── app.py                          ← Flask app — routes, REST API, ML inference  [MAIN]
├── recommender.py                  ← Standalone CLI recommender (dev/testing tool)
├── optimised_model.joblib          ← Trained KMeans model (k=5)                 [PRODUCTION]
├── scaler.joblib                   ← Fitted StandardScaler                       [PRODUCTION]
├── song_dataset.csv                ← Merged + cleaned dataset (no cluster labels)
├── song_dataset_clustered.csv      ← Dataset with cluster labels                 [PRODUCTION]
├── requirements.txt                ← Python dependencies
├── test_api.py                     ← HTTP integration tests
├── test_verify.py                  ← Offline ML unit tests
│
├── Dataset Prep/
│   ├── English_songs.csv           ← Raw English Spotify dataset
│   ├── Hindi_songs.csv             ← Raw Hindi / Bollywood Spotify dataset
│   ├── dataset_prep.py             ← Merge · normalize · deduplicate · export
│   └── source.txt                  ← Dataset provenance and attribution notes
│
├── Model Training/
│   ├── elbow_method.py             ← K selection via inertia plot (K = 1..11)
│   ├── model_train.py              ← V1 model (K=10, experimental — not used in app)
│   ├── optimised_model_train.py    ← V2 model (K=5, production — generates all artifacts)
│   ├── kmeans_model.joblib         ← V1 artifact (archived)
│   ├── optimised_model.joblib      ← V2 artifact (production copy)
│   └── scaler.joblib               ← Scaler artifact (production copy)
│
├── static/
│   ├── assets/
│   │   └── placeholder.png         ← Universal song artwork placeholder
│   ├── css/
│   │   └── style.css               ← Full design system (880+ lines, pure Vanilla CSS)
│   └── js/
│       ├── auth.js                 ← Signup / Login / session persistence
│       ├── onboarding.js           ← Autocomplete picker, favorites save, pre-fill
│       └── app.js                  ← Favorites dashboard + Recommendations + chain loop
│
└── templates/                      ← Jinja2 HTML templates served by Flask
    ├── index.html                  ← Landing page
    ├── auth.html                   ← Login / Signup
    ├── onboarding.html             ← Top 5 song picker
    ├── favorites.html              ← User dashboard
    └── recommendations.html        ← AI results + infinite recommendation chaining
```

---

## 📸 Screenshots

| Screen | Description |
|---|---|
| **Landing Page** | Full-screen dark hero, animated floating music notes, equalizer visualizer |
| **Auth** | Glassmorphism card, tabbed Login / Signup, inline field validation |
| **Onboarding** | Live autocomplete dropdown, numbered pill list, 0/5 progress counter |
| **Favorites Dashboard** | 5-card grid, Spotify + YouTube links, time-of-day greeting |
| **Recommendations** | Now-playing banner with pulse dot, 5 AI rec cards, chain breadcrumb, hop counter |

> *Screenshots will be added after the first public deployment.*

---

## 🛠️ Technologies Used

### Machine Learning

| Library | Version | Purpose |
|---|---|---|
| `scikit-learn` | >= 1.3 | KMeans clustering, StandardScaler, cosine_similarity |
| `pandas` | >= 2.0 | Dataset loading, preprocessing, deduplication, filtering |
| `numpy` | >= 1.24 | Array operations, feature matrix management |
| `joblib` | >= 1.3 | Model and scaler serialization / deserialization |
| `matplotlib` | >= 3.7 | Elbow Method inertia visualization (training phase only) |

### Backend

| Technology | Purpose |
|---|---|
| Python 3.9+ | Core language |
| Flask | Web framework, Jinja2 templating, REST API routing |

### Frontend

| Technology | Purpose |
|---|---|
| HTML5 | Semantic page structure |
| Vanilla CSS3 | Design system, glassmorphism, animations, responsive grid |
| Vanilla JavaScript ES6+ | Auth, autocomplete, API calls, infinite recommendation chain |
| Google Fonts — Outfit | Premium typography across all pages |

---

## 🔮 Future Improvements

| Priority | Improvement | Detail |
|---|---|---|
| 🔴 High | **Collaborative Filtering Hybrid** | Layer user-user similarity on top of audio-feature matching for true personalization |
| 🔴 High | **Server-side Authentication** | Replace localStorage auth with Flask-Session plus bcrypt password hashing |
| 🟡 Medium | **Recommendation Explanations** | Surface which features drove the match — "similar tempo, energy, and valence" |
| 🟡 Medium | **Mood-based Filtering** | Let users filter results by mood: Energetic, Calm, Happy, Melancholic |
| 🟡 Medium | **30-second Song Previews** | Embed Spotify preview clip URLs (available without OAuth for many tracks) |
| 🟢 Low | **Docker + Gunicorn** | Containerize with a production WSGI server for cloud deployment |
| 🟢 Low | **Redis Caching** | Cache frequent recommendation queries to reduce repeated ML inference |
| 🟢 Low | **Expanded Dataset** | Add Tamil, Telugu, K-Pop, and other regional language tracks |
| 🟢 Low | **Live A/B Testing** | Compare different K values or feature subsets in production |

---

## 👤 Author

<div align="center">

**Priyanshu Jugran**
*Aspiring ML Engineer · Full-Stack Developer*

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Priyanshu-Jugran)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/priyanshu-jugran-ld24/)

*Open to ML internship opportunities, collaborations, and conversations about music and AI.*

</div>


---

<div align="center">

*Built with passion for music and machine learning.*

⭐ **Star this repository** if you found it useful!

</div>
