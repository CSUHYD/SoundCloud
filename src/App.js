import React from "react";
import "./App.css";
import "./AudioRecorder";
import axios from "axios/index";

// const CLUSTER_COLORS = [];
const track0Default = [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1];
const track1Default = [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0];
const track2Default = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
const track3Default = [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
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
                //     color: '', // initial random color. 刚加入是颜色随机 跟位置无关。分类后 跟位置有关
                //     cluster: 1,
                // },
            ], //
            recording: false,
            editing: true,
            track0: track0Default,
            track1: track1Default,
            track2: track2Default,
            track3: track3Default,
            track0Audio: {},
            track1Audio: {},
            track2Audio: {},
            track3Audio: {},
            interval: "",
            playing: false,
            pos: 0, // 0-15,
            selectors: [0,0,2,3],
        };
        this.pos = 0;
        this.currTempo = 4; // %11
    }
    componentDidMount() {}
    playTracks() {
        this.pos = 0;
        const interval = setInterval(() => {
            this.loadAndPlay(0, this.state.track0[this.pos]);
            this.loadAndPlay(1, this.state.track1[this.pos]);
            this.loadAndPlay(2, this.state.track2[this.pos]);
            this.loadAndPlay(3, this.state.track3[this.pos]);
            this.pos++;
            if (this.pos > 15) {
                this.pos = 0;
            }
            this.setState({
                pos: this.pos,
            })
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
        this.loadAndPlay(0, false);
        this.loadAndPlay(1, false);
        this.loadAndPlay(2, false);
        this.loadAndPlay(3, false);
    }
    loadAndPlay(i, on) {
        const a = this.state[`track${i}Audio`];
        if (a && a.el) {
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
                        const color = `rgb(${res.data[key].coord[0] * 255}, ${res.data[key].coord[1] * 255}, 125)`;
                        arr[key].cluster = res.data[key].cluster;
                        arr[key].coord = res.data[key].coord;
                        arr[key].color = color;
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
    loadTrack() {
        for(let i =0; i <4;i++){
            if (this.state.audio[i]) {
                this.setState({
                    [`track${i}Audio`]: {
                        el: document.getElementById(`audio${i}`),
                        color: this.state.audio[i].color,
                        coord: this.state.audio[i].coord,
                        audioIndex: i,
                    },
                })
            }
        }    
    }
    render() {
        const { audio, editing, recording } = this.state;
        return (
            <div className="App">
                <div className="title">Sound Cloud</div>
                <header className="App-header">
                    {audio.map((item, index) => {
                        // const color = `rgb(${item.coord[0] * 255}, ${item.coord[1] * 255}, 125)`;
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
                                    top: item.coord[1] * 100 + "%",
                                }}
                            >
                                <audio src={item.src} id={"audio" + index} />
                                <div
                                    className="dot-inner"
                                    onMouseOver={() => {
                                        const el = document.getElementById(
                                            "audio" + index,
                                        );
                                        el.load();
                                        el.play();
                                    }}
                                    style={{
                                        // if cluster exist, pick color[cluster]
                                        backgroundColor: item.color,
                                    }}
                                />
                            </div>
                        );
                    })}
                    {/* {this.state.selectors.map((wchaud, wchsel) => {
                        if (wchaud === index) {
                            return <div className='selector' style={{borderColor: color}} onClick={()=>{
                                console.log('select');
                                
                            }}/>
                        }
                    },)} */}
                    {[0, 1, 2, 3].map((item, rowi) => {
                        const rowAudio = this.state[`track${rowi}Audio`];
                        if (rowAudio.audioIndex > -1) {
                            // const color = `rgb(${rowAudio.coord[0] * 255}, ${rowAudio.coord[1] * 255}, 125)`;
                            return (
                                <div
                                    className="selector"
                                    style={{
                                        borderColor: rowAudio.color,
                                        left: rowAudio.coord[0] * 100 + "%",
                                        top: rowAudio.coord[1] * 100 + "%",
                                    }}
                                    onClick={() => {
                                        console.log("select");
                                    }}
                                />
                            );
                        }
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
                        分类
                    </button>
                    <button
                        className="submit"
                        onClick={() => {
                            this.loadTrack();
                        }}
                    >
                        载入音轨
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
                        <button>{this.state.playing ? "停止" : "播放"}</button>
                    </div>
                    <div className="track">
                        {[0, 1, 2, 3].map((item, rowi) => {
                            const row = this.state[`track${rowi}`];
                            const rowAudio = this.state[`track${rowi}Audio`];
                            return (
                                <div className={`track${rowi} track-row`}>
                                    {row.map(
                                        (colitem, coli) => {
                                            return (
                                                <div
                                                    className="track-dot-box"
                                                    onClick={() => {
                                                        const newrow = [...row];
                                                        newrow[coli] =
                                                            colitem === 0
                                                                ? 1
                                                                : 0; //toggle
                                                        this.setState({
                                                            [`track${rowi}`]: newrow,
                                                        });
                                                    }}
                                                >
                                                    <div
                                                        className={`track-dot${
                                                            colitem ? " on" : ""
                                                        }${
                                                            rowAudio.el &&
                                                            this.state.pos ===
                                                                coli &&
                                                            colitem === 1 &&
                                                            this.state.playing
                                                                ? " playing"
                                                                : ""
                                                        }`}
                                                        style={{
                                                            backgroundColor:
                                                                this.state[
                                                                    `track${rowi}Audio`
                                                                ].color ||
                                                                "#fff",
                                                        }}
                                                    />
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="random">
                        <button>随机</button>
                    </div>
                    <div className="pace">
                        <button onClick={()=>{this.tempoClick()}}>间隔:{TEMPO[this.currTempo % TEMPO.length]}ms</button>
                    </div>
                </div>
            </div>
        );
    }
}
