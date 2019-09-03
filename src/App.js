import React from "react";
import "./App.css";
import "./AudioRecorder";
import axios from "axios/index";

// const CLUSTER_COLORS = [];
const track0Default = [1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0];
const track1Default = [0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1];
const track2Default = [0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0, 1];
const track3Default = [0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0];
const TEMPO = [100, 150, 200, 250, 300, 400, 500, 600, 800, 1000];
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
            track0: track0Default,
            track1: track1Default,
            track2: track2Default,
            track3: track3Default,
            track0Audio: {
                // el,
                // color,
            },
            track1Audio: {},
            track2Audio: {},
            track3Audio: {},
            pos: 0, // 0-15,
            interval: "",
            playing: false
        };
        this.currTempo = 6; // %11
    }
    componentDidMount() {}
    playTracks() {
        let n = 0;
        const interval = setInterval(() => {
            const pos = n%16;
            this.loadAndPlay(0, this.state.track0[pos]);
            this.loadAndPlay(1, this.state.track1[pos]);
            this.loadAndPlay(2, this.state.track2[pos]);
            this.loadAndPlay(3, this.state.track3[pos]);
            n++;
        }, TEMPO[this.currTempo % TEMPO.length]);
        this.setState({
            interval,
            playing: true
        });
    }
    stopPlaying() {
        clearInterval(this.state.interval);
        this.setState({
            playing: false
        });
    }
    loadAndPlay(i, on) {
        const a = this.state[`track${i}Audio`];
        if (a.el) {
            a.el.load();
            if (on) {
                a.el.play();
            }
        }
    }
    startRecording() {
        window.HZRecorder.get(rec => {
            this.recorder = rec;
            this.recorder.start();
        });
        this.setState({
            recording: true
        });
    }
    stopRecording() {
        if (!this.recorder) return;
        const blob = this.recorder.getBlob();
        // console.log(blob);//todo
        this.setState({
            audio: [
                ...this.state.audio,
                {
                    src: window.URL.createObjectURL(this.recorder.getBlob()),
                    blob: blob,
                    coord: [Math.random(), Math.random()],
                    color: this.getRandomColor()
                }
            ],
            recording: false,
            editing: true
        });
    }
    tempoClick() {
        this.stopPlaying();
        this.currTempo++;
        console.log(this.currTempo);
        this.playTracks();
    }
    uploadAndPlayAll() {
        const { audio } = this.state;
        var fd = new FormData();
        const len = audio.length;
        for (let i = 0; i < len; i++) {
            fd.append(`${i}`, audio[i].blob);
        }
        const arr = JSON.parse(JSON.stringify(this.state.audio));
        const url = window.uploadAndPlayUrl || "localhost:4000/sort";
        axios.post(url, fd).then(res => {
            //todo robizlab.com
            // axios.post('http://47.99.141.253:4000/sort', fd).then((res) => { //todo robizlab.com
            // axios.post('https://robizlab.com/soundcloud/sort', fd).then((res) => { //todo robizlab.com
            if (res && res.data) {
                Object.keys(res.data).forEach(key => {
                    if (arr[key]) {
                        arr[key].cluster = res.data[key].cluster;
                        arr[key].coord = res.data[key].coord;
                    }
                });
                this.setState({
                    audio: arr,
                    editing: false
                });
            }
        });
    }
    getRandomColor() {
        var letters = "0123456789ABCDEF";
        var color = "#";
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
    render() {
        const { audio, editing, recording } = this.state;
        return (
            <div className="App">
                <div className="title">Sound Cloud</div>
                <header className="App-header">
                    {audio.map((item, index) => {
                        return (
                            <div
                                className={`dot${
                                    editing && index === audio.length - 1
                                        ? " dot-curr"
                                        : ""
                                }`}
                                style={{
                                    // if cluster exist, pick color[cluster]
                                    left: item.coord[0] * 100 + "%",
                                    top: item.coord[1] * 100 + "%"
                                }}
                            >
                                <audio src={item.src} id={"audio" + index} />
                                <div
                                    className="dot-inner"
                                    onMouseOver={() => {
                                        const el = document.getElementById(
                                            "audio" + index
                                        );
                                        el.load();
                                        el.play();
                                    }}
                                    style={{
                                        // if cluster exist, pick color[cluster]
                                        backgroundColor: `rgb(${item.coord[0] *
                                            255}, ${item.coord[1] * 255}, 125)`
                                    }}
                                />
                            </div>
                        );
                    })}
                </header>
                <div className="button-wrap">
                    <button
                        onClick={() => {
                            this.startRecording();
                        }}
                        type="success"
                        size="small"
                    >
                        <span
                            className={`recording-dot${
                                recording ? " blink" : ""
                            }`}
                        />
                        开始录音
                    </button>
                    <button
                        onClick={() => {
                            this.stopRecording();
                        }}
                        type="danger"
                        size="small"
                    >
                        结束录音
                    </button>
                    <button
                        className="submit"
                        onClick={() => {
                            this.uploadAndPlayAll();
                        }}
                    >
                        开始分类
                    </button>
                    <button
                        className="submit"
                        onClick={() => {
                            this.setState({
                                track0Audio: {
                                    el: document.getElementById('audio0'),
                                    color: this.state.audio[0].color,
                                },
                                track1Audio: {
                                    el: document.getElementById('audio1'),
                                    color: this.state.audio[1].color,
                                },
                                track2Audio: {
                                    el: document.getElementById('audio2'),
                                    color: this.state.audio[2].color,
                                },
                                track3Audio: {
                                    el: document.getElementById('audio3'),
                                    color: this.state.audio[3].color,
                                },
                            })
                        }}
                    >
                        LoadAudio
                    </button>
                </div>
                <div className="track-wrap">
                    <div className="play" onClick={() => {
                            if (this.state.playing) {
                                this.stopPlaying();
                            } else {
                                this.playTracks();
                            }
                        }}>
                        <button>{this.state.playing ? "Stop" : "Play"}</button>
                    </div>
                    <div className="track">
                        {[0, 1, 2, 3].map((item, rowi) => {
                            return (
                                <div className={`track${rowi} track-row`}>
                                    {this.state[`track${rowi}`].map(
                                        (colitem, coli) => {
                                            return (
                                                <div
                                                    className={`track-dot${
                                                        colitem ? " on" : ""
                                                    }`}
                                                    style={{
                                                        backgroundColor:
                                                            this.state[
                                                                `track${rowi}Audio`
                                                            ].color || "#fff"
                                                    }}
                                                />
                                            );
                                        }
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="random">
                        <button>Random</button>
                    </div>
                    <div className="pace">
                        <button onClick={()=>{this.tempoClick()}}>Tempo:{TEMPO[this.currTempo % TEMPO.length]}ms</button>
                    </div>
                </div>
            </div>
        );
    }
}
