import pandas as pd
import joblib
from sklearn.metrics.pairwise import cosine_similarity

#load dataset
df = pd.read_csv("song_dataset.csv")

#load model and scaler
kmeans = joblib.load("optimised_model.joblib")
scaler = joblib.load("scaler.joblib")

#preprocessing same as training
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
        recommendations.append(f"{row['name']} - {row['artist']}")

    return recommendations


#main loop 
while True:
    print("\n_______MELODY AI (RAW)_______\n")
    print("1. Get Recommendations")
    print("2. Exit\n_____________________________")

    choice = input("Enter your choice: ")
    print()

    if choice == "1":

        song = input("Enter song name: ")

        recs = recommend(song)

        print("\nRecommended Songs:\n")

        for r in recs:
            print(r)
        print() 

    elif choice == "2":
        print("Exiting...")
        print("Thankyou!\n")
        break

    else:
        print("Invalid choice! Try again..")
        print()