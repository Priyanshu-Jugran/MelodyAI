import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans 
from sklearn.metrics.pairwise import cosine_similarity
import joblib

#load dataset
df = pd.read_csv("song_dataset.csv")
df["name_lower"] = df["name"].str.lower()

#data preprocessing
df = df.drop_duplicates(subset=["name","artist"])
df = df.dropna()

#required features selection
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

#feature scaling
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

#applying k-means clustering
kmeans = KMeans(n_clusters=10 , random_state=42)
df["cluster"] = kmeans.fit_predict(X_scaled)
print("Training done!\n")


#recommendation function
def recommend(song_name, n=5):

    song_name = song_name.lower().strip()
    if song_name not in df["name_lower"].values:
        return ["Song not found!"]
    
    idx = df[df["name_lower"] == song_name].index[0]
    song_vector = X_scaled[idx].reshape(1, -1)
    scores = cosine_similarity(song_vector, X_scaled)[0]
    scores = list(enumerate(scores))
    scores = sorted(scores, key=lambda x: x[1], reverse=True)
    recommendations = []

    for i in scores[1:n+1]:
        row = df.iloc[i[0]]
        recommendations.append(f"{row['name']} -{ row['artist']}")

    return recommendations


#model testing
song = input("Enter song name:")
recs = recommend(song)
print("\nRecommended Songs:\n")

for r in recs:
    print(r)

#saving model
joblib.dump(kmeans,"kmeans_model.joblib")
print("Model saved!\n")

