import pandas as pd
import joblib
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from flask import Flask, request, jsonify, render_template, session
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)


#Load dataset, model, and scaler at startup

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

df = pd.read_csv(os.path.join(BASE_DIR, "song_dataset_clustered.csv"))
kmeans = joblib.load(os.path.join(BASE_DIR, "optimised_model.joblib"))
scaler = joblib.load(os.path.join(BASE_DIR, "scaler.joblib"))

#Preprocessing data
df = df.drop_duplicates(subset=["name", "artist"])
df = df.dropna()
df["name_lower"] = df["name"].str.lower()

features = [
    "danceability",
    "energy",
    "loudness",
    "speechiness",
    "acousticness",
    "liveness",
    "valence",
    "tempo",
    "key",
    "mode",
    "time_signature"
]

X = df[features]
X_scaled = scaler.transform(X)

#Reset index so that index lookups are consistent
df = df.reset_index(drop=True)

print(f"[MelodyAI] Dataset loaded: {len(df)} songs across {df['cluster'].nunique()} clusters.")



#Core recommendation function

def recommend(song_name, n=5):
    song_name = song_name.lower().strip()

    if song_name not in df["name_lower"].values:
        return None  # Caller handles "not found"

    idx = df[df["name_lower"] == song_name].index[0]

    cluster = df.iloc[idx]["cluster"]
    cluster_df = df[df["cluster"] == cluster]
    cluster_indices = cluster_df.index.tolist()

    cluster_vectors = X_scaled[cluster_indices]
    song_vector = X_scaled[idx].reshape(1, -1)

    scores = cosine_similarity(song_vector, cluster_vectors)[0]
    scores = list(zip(cluster_indices, scores))
    scores = sorted(scores, key=lambda x: x[1], reverse=True)

    recommendations = []
    for i in scores[1:n + 1]:
        row = df.iloc[i[0]]
        recommendations.append({
            "name": row["name"],
            "artist": row["artist"]
        })

    return recommendations



#Page routes

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/auth")
def auth():
    return render_template("auth.html")


@app.route("/onboarding")
def onboarding():
    return render_template("onboarding.html")


@app.route("/favorites")
def favorites():
    return render_template("favorites.html")


@app.route("/recommendations")
def recommendations():
    return render_template("recommendations.html")



#API - song autocomplete

@app.route("/api/songs")
def api_songs():
    query = request.args.get("q", "").strip().lower()
    limit = min(int(request.args.get("limit", 10)), 25)

    if len(query) < 1:
        return jsonify([])

    #Prefix match first, then substring match — combined and deduplicated
    prefix_mask = df["name_lower"].str.startswith(query)
    substr_mask = df["name_lower"].str.contains(query, na=False) & ~prefix_mask

    prefix_results = df[prefix_mask][["name", "artist"]].drop_duplicates(subset=["name"]).head(limit)
    substr_results = df[substr_mask][["name", "artist"]].drop_duplicates(subset=["name"]).head(limit)

    combined = pd.concat([prefix_results, substr_results]).head(limit)

    results = combined.apply(
        lambda row: {"name": row["name"], "artist": row["artist"]}, axis=1
    ).tolist()

    return jsonify(results)



#API - get recommendations

@app.route("/api/recommend", methods=["POST"])
def api_recommend():
    data = request.get_json(force=True)
    song_name = (data.get("song") or "").strip()

    if not song_name:
        return jsonify({"error": "No song name provided."}), 400

    recs = recommend(song_name)

    if recs is None:
        return jsonify({"error": f'Song "{song_name}" was not found in our dataset.'}), 404

    return jsonify({
        "input_song": song_name,
        "recommendations": recs
    })


#API - validate song exists

@app.route("/api/songs/validate")
def api_validate():
    name = request.args.get("name", "").strip().lower()
    exists = name in df["name_lower"].values
    if exists:
        row = df[df["name_lower"] == name].iloc[0]
        return jsonify({"exists": True, "name": row["name"], "artist": row["artist"]})
    return jsonify({"exists": False})



if __name__ == "__main__":
    app.run(debug=True, port=5000)
