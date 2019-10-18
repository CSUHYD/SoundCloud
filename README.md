# SoundCloud
### 1. Requirements
See the *requirements.txt* file or simply run:
>  pip install -r requirements.txt

Or install umap, sklearn, flask, flask_cors by your own.

## 1. Running SoundCloud Web Application.
### 1.1 Running the SoundCloud Server
To run the SoundCloud Server, simply run:
>  python soundcloud-socket-server.py

### 1.2 Running the React Web App

To run the React Web App:
> cd ./src 

> npm i

> npm run start

## 2. Running SoundCloud Python Script (Optional)
If you want to check the clustering result on your own dataset, please 
- Feed your data into `./dataset`. Supported audio format is `.wav`.
- Run `python soundcloud.py`
- check the clustering result in ''result.json'' and matplotlib figure.