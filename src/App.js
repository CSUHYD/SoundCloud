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
            recording: false,
            editing: true,
        }
    }
    componentDidMount() {
    }
    startRecording() {
        window.HZRecorder.get((rec) => {
            this.recorder = rec;
            this.recorder.start();
        });
        this.setState({
            recording: true,
        })
    }
    uploadAll() {
        const {audio} = this.state;
        var fd = new FormData();
        const len = audio.length;
        for (let i = 0; i < len; i++) {
            fd.append(`${i}`, audio[i].blob);
        }
        const arr = JSON.parse(JSON.stringify(this.state.audio));
        axios.post('http://localhost:4000/api/speech', fd).then((res) => { //todo robizlab.com
            if (res && res.data) {
                console.log(res.data);//todo
                Object.keys(res.data).forEach((key) => {
                    if (arr[key]) {
                        arr[key].cluster = res.data[key].cluster;
                        arr[key].coord = res.data[key].coord;
                    }
                });
                this.setState({
                    audio: arr,
                    editing: false,
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
        const {audio, editing, } = this.state;
        return (
            <div className="App">
                <div className="title">Sound Cloud</div>
                <header className="App-header">
                    {
                        audio.map((item, index) => {
                            return (
                                <div
                                    className={`dot${(editing && index == audio.length - 1) ? ' dot-curr' : ''}`}
                                    onMouseOver={()=>{
                                        const el = document.getElementById('audio'+index);
                                        el.load();
                                        el.play();
                                    }}
                                    style={{
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
                            ],
                            recording: false,
                            editing: true,
                        })
                    }} type="danger" size="small">结束录音并添加</button>
                    <button onClick={()=>{
                        this.uploadAll();
                    }}>开始分类</button>
                </div>
            </div>
        )
    }
}
