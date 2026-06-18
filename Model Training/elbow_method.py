import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt

#load dataset
df = pd.read_csv("song_dataset.csv")

#preprocessing data
df = df.drop_duplicates(subset=["name", "artist"])
df = df.dropna()

df = df.sample(n=8000, random_state=42)

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

#scaling same as original
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

#elbow method
inertia = []
K_range = range(1, 12)

print("Calculating inertia...")

for k in K_range:
    print(f"Testing K = {k}")
    kmeans = KMeans(n_clusters=k, random_state=42)
    kmeans.fit(X_scaled)
    inertia.append(kmeans.inertia_)

print("Done!")

#plot graph
plt.plot(K_range, inertia, marker='o')
plt.xlabel("Number of Clusters (K)")
plt.ylabel("Inertia")
plt.title("Elbow Method")
plt.show()


#best k acc to graph = 5