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
            track0Audio: {}, // el, audioIndex
            track1Audio: {},
            track2Audio: {},
            track3Audio: {},
            interval: "",
            playing: false,
            pos: 0, // 0-15,
            selectors: [0, 0, 2, 3],
        };
        this.pos = 0;
        this.currTempo = 4; // %11
        this.selectorMove = {
            0: false,
            1: false,
            2: false,
            3: false,
        };
        this.dotsContainer = React.createRef();
    }
    componentDidMount() {}
    startRecording() {
        window.HZRecorder.get(rec => {
            this.recorder = rec;
            this.recorder.start();
        });
        this.setState({
            recording: true,
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
                    color: this.getRandomColor(),
                },
            ],
            recording: false,
            editing: true,
        });
    }
    uploadAndSort() {
        const { audio } = this.state;
        var fd = new FormData();
        const len = audio.length;
        for (let i = 0; i < len; i++) {
            fd.append(`${i}`, audio[i].blob);
        }
        const arr = JSON.parse(JSON.stringify(this.state.audio));
        const url = window.uploadAndSortUrl || "localhost:4000/sort";
        axios.post(url, fd).then(res => {
            // axios.post('http://47.99.141.253:4000/sort', fd).then((res) => { //todo robizlab.com
            // axios.post('https://robizlab.com/soundcloud/sort', fd).then((res) => { //todo robizlab.com
            if (res && res.data) {
                Object.keys(res.data).forEach(key => {
                    if (arr[key]) {
                        const color = `rgb(${res.data[key].coord[0] *
                            255}, ${res.data[key].coord[1] * 255}, 125)`;
                        arr[key].cluster = res.data[key].cluster;
                        arr[key].coord = res.data[key].coord;
                        arr[key].color = color;
                    }
                });
                this.setState({
                    audio: arr,
                    editing: false,
                });
            }
        });
    }
    loadTrack() {
        for (let i = 0; i < 4; i++) {
            if (this.state.audio[i]) {
                this.setState({
                    [`track${i}Audio`]: {
                        el: document.getElementById(`audio${i}`),
                        audioIndex: i,
                    },
                });
            }
        }
    }
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
            });
        }, TEMPO[this.currTempo % TEMPO.length]);
        this.setState({
            interval,
            playing: true,
        });
    }
    stopPlaying() {
        clearInterval(this.state.interval);
        this.setState({
            playing: false,
        });
        this.loadAndPlay(0, false);
        this.loadAndPlay(1, false);
        this.loadAndPlay(2, false);
        this.loadAndPlay(3, false);
    }
    tempoClick() {
        this.stopPlaying();
        this.currTempo++;
        this.playTracks();
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
    selectorRelease(e, i) {
        console.log("select release");
        const rowAudio = this.state[`track${i}Audio`];
        const t = e.target;
        const pwidth = this.dotsContainer.current.offsetWidth;
        const pHeight = this.dotsContainer.current.offsetHeight;
        const cx = t.offsetLeft + parseFloat(t.getAttribute("data-x") || 0);
        const cy = t.offsetTop + parseFloat(t.getAttribute("data-y") || 0);
        let resIndex = -1;
        let minDis = window.innerWidth + window.innerHeight;
        this.state.audio.forEach((element, index) => {
            const x = element.coord[0] * pwidth;
            const y = element.coord[1] * pHeight;
            const d = this.distance(cx, cy, x, y);
            if (d < minDis) {
                minDis = d;
                resIndex = index;
            }
        });
        if (resIndex > -1) {
            // no selector overlapping
            let overlap = false;
            for (let i = 0; i < 4; i++) {
                if (this.state[`track${i}Audio`].audioIndex === resIndex) {
                    overlap = true;
                    break;
                }
            }
            if (!overlap) {
                this.setState({
                    [`track${i}Audio`]: Object.assign({}, rowAudio, {
                        audioIndex: resIndex,
                        el: document.getElementById(`audio${resIndex}`),
                    }),
                });
            }
        }
        t.style.zIndex = 0;
        t.style.transform = "translate(-50%, -50%)";
        t.setAttribute("data-x", 0);
        t.setAttribute("data-y", 0);
    }

    // helpers
    distance(x1, y1, x2, y2) {
        const dx = Math.round(x1) - Math.round(x2);
        const dy = Math.round(y1) - Math.round(y2);
        return Math.round(Math.sqrt(dx * dx + dy * dy));
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
                <header className="App-header" ref={this.dotsContainer}>
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
                    {[0, 1, 2, 3].map(item => {
                        const rowAudio = this.state[`track${item}Audio`];
                        if (rowAudio.audioIndex > -1) {
                            const aud = audio[rowAudio.audioIndex];
                            return (
                                <div
                                    className="selector"
                                    style={{
                                        borderColor: aud.color,
                                        left: aud.coord[0] * 100 + "%",
                                        top: aud.coord[1] * 100 + "%",
                                    }}
                                    onMouseDown={() => {
                                        this.selectorMove[item] = true;
                                        console.log("down");
                                    }}
                                    onMouseUp={e => {
                                        if (this.selectorMove[item]) {
                                            console.log("up");
                                            this.selectorMove[item] = false;
                                            this.selectorRelease(e, item);
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (this.selectorMove[item]) {
                                            console.log("leave");
                                            this.selectorMove[item] = false;
                                            this.selectorRelease(e, item);
                                        }
                                    }}
                                    onMouseMove={event => {
                                        if (this.selectorMove[item]) {
                                            let target = event.target;
                                            let x =
                                                (parseFloat(
                                                    target.getAttribute(
                                                        "data-x",
                                                    ),
                                                ) || 0) + event.movementX;
                                            let y =
                                                (parseFloat(
                                                    target.getAttribute(
                                                        "data-y",
                                                    ),
                                                ) || 0) + event.movementY;
                                            target.style.webkitTransform = target.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
                                            target.style.zIndex = 1;
                                            // update the position attributes
                                            target.setAttribute("data-x", x);
                                            target.setAttribute("data-y", y);
                                        }
                                    }}
                                    id={`selector${item}`}
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
                            this.uploadAndSort();
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
                    <div
                        className="play"
                        onClick={() => {
                            if (this.state.playing) {
                                this.stopPlaying();
                            } else {
                                this.playTracks();
                            }
                        }}
                    >
                        <button>{this.state.playing ? "停止" : "播放"}</button>
                    </div>
                    <div className="track">
                        {[0, 1, 2, 3].map((item, rowi) => {
                            const row = this.state[`track${rowi}`];
                            const rowAudio = this.state[`track${rowi}Audio`];
                            const color =
                                (rowAudio.audioIndex > -1 &&
                                    audio[rowAudio.audioIndex].color) ||
                                "#fff";
                            return (
                                <div className={`track${rowi} track-row`}>
                                    {row.map((colitem, coli) => {
                                        return (
                                            <div
                                                className="track-dot-box"
                                                onClick={() => {
                                                    const newrow = [...row];
                                                    newrow[coli] =
                                                        colitem === 0 ? 1 : 0; //toggle
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
                                                        backgroundColor: color,
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                    <div className="random">
                        <button>随机</button>
                    </div>
                    <div className="pace">
                        <button
                            onClick={() => {
                                this.tempoClick();
                            }}
                        >
                            间隔:{TEMPO[this.currTempo % TEMPO.length]}ms
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
