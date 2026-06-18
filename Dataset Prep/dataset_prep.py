import pandas as pd

#load both datasets
eng = pd.read_csv("English_songs.csv");
hin = pd.read_csv("Hindi_songs.csv");


#rename columns
eng = eng.rename(
    columns={
        "name": "name",
        "artist":"artist",
        "valence": "valence"
    }
)
hin = hin.rename(
    columns={
        "song_name": "name",
        "singer":"artist",
        "Valence": "valence"
    }
)

#finalize columns to keep
columns=[
    "name",
    "artist",
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

#reduce both dataframes
eng = eng[columns]
hin = hin[columns]

#drop null value cols
eng = eng.dropna()
hin = hin.dropna()

#merge both to a single file
merged = pd.concat([eng,hin],ignore_index=True)
merged = merged.drop_duplicates(subset=["name","artist"])

#save new custom dataset
merged.to_csv("song_dataset.csv",index=False);
print("Custom dataset created : song_dataset.csv")
