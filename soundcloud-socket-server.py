from flask import Flask
import json
from flask_cors import CORS
from flask_socketio import SocketIO, send, emit
import eventlet
import os
import shutil
from soundcloud import soundcloud

# socket
flask_app = Flask(__name__)
flask_app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(flask_app)
CORS(flask_app)


@socketio.on('sort')
def sort(data):
    # print(data)
    # print(str(data))

    # delete all old wav files
    if os.path.exists('./client_data'):
        shutil.rmtree('./client_data')
    os.mkdir('./client_data')
    print('[info] New data folder has been created.')

    # # save new wav files from blob data
    print("[info] Record {} wav files.".format(len(data)))
    filename = 0
    for d in data:
        with open('./client_data/{}.wav'.format(filename), mode='bx') as f:
            f.write(d)
        filename += 1

    print('[info] The wav files saved successfully!')

    # return 'save files'

    soundcloud(directory='./client_data')
    with open("result.json", 'r') as f:
        json_result = json.load(f)
    print(json_result)
    emit('sortResult', json_result)

    return json_result


if __name__ == '__main__':
    # app.run(ssl_context=context, debug=True, host='127.0.0.1', port=4000)
    socketio.run(flask_app, debug=True, host='127.0.0.1', port=4000)
