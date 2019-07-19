from flask import Flask, request, Response, make_response
import json
from io import StringIO
from werkzeug.datastructures import ImmutableMultiDict

app = Flask(__name__)

@app.route('/')
def root():
    return 'Welcome Sound Cloud Server!'


@app.route('/api/speech',methods=['GET', 'POST'])
def projects():
    if request.method=='POST':
        print('POST')
        data = request.files['0']
        #data = dict(request.form)
        print(data)
        print(request.files.length)

        return 'ok'

    else:
        print('GET')
        return 'GET Method'


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=4000)
