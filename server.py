from flask import Flask, request, Response, make_response
import json
from io import StringIO
from werkzeug.datastructures import ImmutableMultiDict
from flask_cors import CORS
from flask_socketio import SocketIO

# socket
flask_app = Flask(__name__)
flask_app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(flask_app)
CORS(flask_app)

@socketio.on('sort')
def sort(data):
    print(data)
    print(str(data))
    return 'sort result'

if __name__ == '__main__':
    # app.run(ssl_context=context, debug=True, host='127.0.0.1', port=4000)
    socketio.run(flask_app, debug=True, host='127.0.0.1', port=4000)
