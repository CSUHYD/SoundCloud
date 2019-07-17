import React from 'react';
import './App.css';
import './AudioRecorder';
import axios from "axios/index";

const CLUSTER_COLORS = [];

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            audio: [
                // {
                //     src: '',
                //     blob: {},
                //     coord: [0.1, 0.2],
                //     color: '',
                //     cluster: 1,
                // },
            ], //
        }
    }
    componentDidMount() {
    }
    init() {

    }
    startRecording() {
        window.HZRecorder.get((rec) => {
            this.recorder = rec;
            this.recorder.start();
        });
    }
    stopRecording() {
        this.recorder.stopAndUpload();
    }
    uploadAll() {
        const {audio} = this.state;
        var fd = new FormData();
        const len = audio.length;
        for (let i = 0; i < len; i++) {
            fd.append(`${i}`, audio[i].blob);
        }
        const arr = JSON.parse(JSON.stringify(this.state.audio));
        axios.post('http://localhost:5000/projects', fd).then((res) => { //todo robizlab.com
            if (res && res.data) {
                console.log(res.data);//todo
                Object.keys(res.data).forEach((key) => {
                    arr[key].cluster = res.data[key].cluster;
                    arr[key].coord = res.data[key].coord;
                })
                this.setState({
                    audio: arr,
                })
            }
        });
    }
    getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
    render() {
        const {audio} = this.state;
        return (
            <div className="App">
                <div className="title">Sound Cloud</div>
                <header className="App-header">
                    {
                        audio.map((item, index) => {
                            return (
                                <div
                                    className="dot"
                                    onMouseOver={()=>{
                                        const el = document.getElementById('audio'+index);
                                        el.load();
                                        el.play();
                                    }}
                                    style={{
                                        marginTop:'5px',
                                        width: '20px',
                                        height:'20px',
                                        // if cluster exist, pick color[cluster]
                                        backgroundColor: `rgb(${item.coord[0]*255}, ${item.coord[1]*255}, 125)`,
                                        left: item.coord[0]*100+'%',
                                        top: item.coord[1]*100+'%',
                                    }}
                                >
                                    <audio
                                        src={item.src}
                                        id={'audio'+index}/>
                                </div>
                            )
                        })
                    }
                </header>
                <div className="button-wrap">
                    <button onClick={()=>{this.startRecording();}}
                            type="success" size="small"
                    >开始录音</button>
                    <button onClick={()=>{
                        const blob = this.recorder.getBlob();
                        // console.log(blob);//todo
                        this.setState({
                            audio: [...this.state.audio,
                                {
                                    src: window.URL.createObjectURL(this.recorder.getBlob()),
                                    blob: blob,
                                    coord: [Math.random(), Math.random()],
                                    color: this.getRandomColor(),
                                },
                            ]
                        })
                    }} type="danger" size="small">结束录音并添加</button>
                    <button onClick={()=>{
                        this.uploadAll();
                    }}>全部上传</button>
                </div>
            </div>
        )
    }
}
