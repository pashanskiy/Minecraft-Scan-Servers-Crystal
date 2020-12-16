// import useState next to FunctionComponent
import React, { FunctionComponent, useState } from 'react';

let ips: String = "";
let done = "0";
let first_send: Boolean = true;

// our components props accept a number for the initial value
const Counter: FunctionComponent<{ initial?: number }> = ({ }) => {
    // since we pass a number here, clicks is going to be a number.
    // setClicks is a function that accepts either a number or a function returning
    // a number
    //const [ips, setIps] = useState(String);
    //const [done, setDone] = useState("0");

    const [progress, setProgress] = useState(String);
    const [data, setData] = useState([]);
    const [buttonCheckDisable, setButtonCheckDisable] = useState(true);
    const [buttonDownloadDisable, setButtonDownloadDisable] = useState(true);
    const [rateInputDisable, setRateInputDisable] = useState(false);
    const [rate, setRate] = useState("100");

    function sendToBackend() {
        if (ips.length > 0) {
            setButtonCheckDisable(true)
            setButtonDownloadDisable(true)
            setRateInputDisable(true)
            const intervalId = setInterval(() => {
                console.log("interval " + done)
                if (done == "0") {
                    var data = JSON.stringify({ "mode": "get_data" })
                    if (first_send) {
                        data = JSON.stringify({ "mode": "set_data", "rate": rate, "ips": ips.split("\n") })
                        first_send = false
                    }
                    fetch("http://127.0.0.1:8080/api", {
                        method: "POST", // *GET, POST, PUT, DELETE, etc.
                        headers: { "Content-Type": "application/json" },
                        body: data // body data type must match "Content-Type" header
                    })
                        .then(res => res.json())
                        .then(res => updateData(res))
                }
                else {
                    console.log("clearInterval")
                    setButtonCheckDisable(false)
                    setButtonDownloadDisable(false)
                    setRateInputDisable(false)
                    done = "0"
                    first_send = true
                    clearInterval(intervalId)
                }
            }, 1000);
        }
    }

    function supdateData(res) {
        //console.log(res)
        //console.log(res["done"])
        done = res["done"]
        console.log(done)
        if (done == "0") {
            setProgress(res["progress"])
            setData(res["data"])
        }
    }

    function updateData(res) {
        //console.log(res)
        //console.log(res["done"])
        done = res["done"]
        console.log(done)
            setProgress(res["progress"])
            setData(res["data"])
    }

    function ssendToBackend() {
        let kek = JSON.parse('{"done":"1"}')
        //console.log(kek)
        // console.log(kek["done"])
        console.log("edit " + done)
        done = "1"
        console.log("edit " + done)
    }
    function debug() {
        console.log(data.toString())
    }

    function dataToFile() {
        var currentdate = new Date();
        var datetime = currentdate.getDate() + "/"
            + (currentdate.getMonth() + 1) + "/"
            + currentdate.getFullYear() + "  "
            + currentdate.getHours() + ":"
            + currentdate.getMinutes() + ":"
            + currentdate.getSeconds();

        var csvFile = "Status;IP;Port;Version;Players now;Players max;Description\n"
        data.forEach(e => {
            csvFile += e[0] + ";" + e[1] + ";" + e[2] + ";" + e[3].replace(';', '') + ";" + e[4] + ";" + e[5] + ";" + e[6].replace(';', '') + "\n"
        });
        csvFile += datetime + ";Count: " + data.length + ";;;;;"
        return csvFile
    }

    function download() {
        var url = window.URL.createObjectURL(new Blob([dataToFile()], { type: 'text/plain' }));
        var anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "Minecraft Servers List.csv";
        anchor.click();
        window.URL.revokeObjectURL(url);
        //document.removeChild(anchor);
    }

    return <div>
        <h1>Check Minecraft Servers v3</h1>
        <form>
            <textarea placeholder="Paste IP List" onChange={(event) => {
                ips = event.target.value
                if (ips.length > 0) {
                    setButtonCheckDisable(false)
                }
                else {
                    setButtonCheckDisable(true)
                }
            }} />
        </form>
        <form>
            <input placeholder="Rate number" disabled={rateInputDisable} value={rate} onChange={(event) => {
                const re = /^[0-9\b]+$/
                if (event.target.value === '' || re.test(event.target.value) && event.target.value.length < 5) {
                    setRate(event.target.value)
                }
                if (event.target.value.length > 0)
                    setButtonCheckDisable(false)
                else setButtonCheckDisable(true)
            }}></input>
        </form>
        <div>
            <button disabled={buttonCheckDisable} onClick={sendToBackend}>Check</button>
        </div>

        <div>
            <button disabled={buttonDownloadDisable} onClick={download}>Download Results</button>
        </div>
        <h1>Progress {progress}%</h1>
        <table>
            <tr>
                <th>Status</th>
                <th>IP</th>
                <th>Port</th>
                <th>Version</th>
                <th>Now</th>
                <th>Max</th>
                <th>Description</th>
            </tr>
            {data.map((server) => (
                <tr>
                    <td>{server[0]}</td>
                    <td>{server[1]}</td>
                    <td>{server[2]}</td>
                    <td>{server[3]}</td>
                    <td>{server[4]}</td>
                    <td>{server[5]}</td>
                    <td>{server[6]}</td>
                </tr>
            ))}
        </table>
    </div>
}
export default Counter;