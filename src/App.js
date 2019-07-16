import React from 'react';
import './App.css';
import './AudioRecorder';

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            audio: [
                {
                    cluster: 1,
                    coord: [0.1, 0.2],
                    blob: {},
                    color: '',
                },
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

    }
    render() {
        const {audio} = this.state;
        return (
            <div className="App">
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
                                    style={{width: '20px', height:'20px', backgroundColor: 'yellow', marginTop:'5px',}}
                                >
                                    <audio
                                        src={item}
                                        id={'audio'+index}/>
                                </div>
                            )
                        })
                    }
                    <button onClick={()=>{this.startRecording();}}
                            type="success" size="small"
                    >开始录音</button>
                    <button onClick={()=>{
                        // const blob = this.recorder.getBlob();
                        // console.log(blob);//todo
                        this.setState({
                            audio: [...this.state.audio, window.URL.createObjectURL(this.recorder.getBlob())]
                        })
                    }} type="danger" size="small">结束录音并添加</button>
                    <button onClick={()=>{}}>全部上传</button>
                </header>
            </div>
        )
    }
}
