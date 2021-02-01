import React, { FunctionComponent, useState } from 'react';
import ProgressBar from './progressBar'

export interface JsonTypes {
    done: string;
    progress: string;
    data: Array<string>[];
}

let ips: String = "";
let done: String = "0";
let first_send: Boolean = true;
var data: Array<string>[] = [];
var onlineDataCount = 0

const Counter: FunctionComponent = ({ }) => {

    const [dataToTable, setDataToTable] = useState([]);
    const [buttonCheckDisable, setButtonCheckDisable] = useState(true);
    const [buttonDownloadDisable, setButtonDownloadDisable] = useState(true);
    const [rateInputDisable, setRateInputDisable] = useState(false);
    const [rate, setRate] = useState("100");
    const [buttonPlusDisable, setButtonPlusDisable] = useState(false);
    const [buttonMinusDisable, setButtonMinusDisable] = useState(false);
    const [scanProgress, setScanProgress] = useState(String("Paste IP List and start check"));
    const [progress, setProgress] = useState(String(""));


    function sendToBackend() {
        if (ips.length > 0 && !buttonCheckDisable) {
            setButtonCheckDisable(true)
            setButtonDownloadDisable(true)
            setRateInputDisable(true)
            const intervalId = setInterval(() => {
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

    function updateData(res: JsonTypes) {
        done = res.done
        setProgress(res.progress)
        data = res.data
        var datatot: Array<string>[] = [];
        var _i = 1
        while (data.length > 0) {
            if (data.length > _i) {
                if (data[data.length - _i][0] == "Online") {
                    onlineDataCount++
                    var strArr: Array<string>;
                    strArr = [onlineDataCount.toString(), data[data.length - _i][1], data[data.length - _i][2], stringLength(data[data.length - _i][3], 10,true),
                    stringLength(data[data.length - _i][4], 4,true), stringLength(data[data.length - _i][5], 4,true), stringLength(data[data.length - _i][6], 20,true), stringLength(data[data.length - _i][7], 4,true)];
                    datatot.push(strArr)
                }
                _i++
            } else break;
            if (datatot.length >= 10) break

        }

        if (datatot.length != 0) setDataToTable(datatot)
        if (res.progress == "100.0")
            setScanProgress("Scaning is completed! " + String(data.length) + " results.")
        else setScanProgress("Scan progress: " + res.progress + "% Servers count: " + String(data.length))
    }

    function stringLength(str: string, length: number, bool: boolean): string {
        var str2: string = ""
        if (bool) {
            if (str.length < (length + 2)) {
                while (str2.length < (length - str.length + 2)) str2 += " "
                str2 = str + str2
            } else {
                str2 += str.slice(0, length) + ".."
            }
        }
        else {
            if (str.length < (length)) {
                while (str2.length < (length - str.length)) str2 += " "
                str2 = str + str2
            } else {
                str2 += str.slice(0, length)
            }
        }
        return str2
    }

    function dataToFile() {
        var currentdate = new Date();
        var datetime = currentdate.getDate() + "/"
            + (currentdate.getMonth() + 1) + "/"
            + currentdate.getFullYear() + "  "
            + currentdate.getHours() + ":"
            + currentdate.getMinutes() + ":"
            + currentdate.getSeconds();

        var csvFile = "Status;IP;Port;Version;Players now;Players max;Ping;Description\n"
        data.forEach(e => {
            if(e[0]=="Offline")
            csvFile += e[0] + ";" + e[1] + ";" + e[2] + ";" + "" + ";" + "" + ";" + "" + ";" + "" + ";" + "" + "\n"
            else
            csvFile += e[0] + ";" + e[1] + ";" + e[2] + ";" + e[3].replace(/;|\n/g, '') + ";" + e[4] + ";" + e[5] + ";" + e[7] + ";" + e[6].replace(/;|\n/g, '') + "\n"
        });
        csvFile += datetime + ";Count: " + data.length + ";;;;;"
        return csvFile
    }

    function download() {
        if (!buttonDownloadDisable) {
            var url = window.URL.createObjectURL(new Blob([dataToFile()], { type: 'text/plain' }));
            var anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = "Minecraft Servers List.csv";
            anchor.click();
            window.URL.revokeObjectURL(url);
        }
    }

    function setRateValue(newRate: string) {
        const re = /^[0-9\b]+$/
        if (newRate === '' || re.test(newRate) && newRate.length < 5) {
            setRate(newRate)
            if ((parseInt(newRate) + 100) < 10000 || newRate === '') setButtonPlusDisable(false)
            else setButtonPlusDisable(true)
            if ((parseInt(newRate) - 100) > 1) setButtonMinusDisable(false)
            else setButtonMinusDisable(true)
        }
    }

    function setRateValueFromPlusButton() {
        if (rate === '') setRate("100")
        else
            if ((parseInt(rate) + 100) < 10000) {
                setRate(String(parseInt(rate) + 100))
                setButtonMinusDisable(false)
            } else {
                setButtonPlusDisable(true)
                setRate("10000")
            }

    }

    function setRateValueFromMinusButton() {
        if ((parseInt(rate) - 100) > 1) {
            setRate(String(parseInt(rate) - 100))
            setButtonPlusDisable(false)
        } else {
            setButtonMinusDisable(true)
            setRate("1")
        }
    }

    return <div>
        <p className="header"> Check Minecraft Servers Crystal version</p>
        <div className="styled-input">
            <textarea required onChange={(event) => {
                ips = event.target.value
                if (ips.length > 0) {
                    setButtonCheckDisable(false)
                }
                else {
                    setButtonCheckDisable(true)
                }
            }} />
            <label>Paste IP List</label>
        </div>
        <p className="rateText">Rate</p>
        <div className="rate-block">
            <a className={buttonMinusDisable ? "animated-button disabled minus rate" : "animated-button enabled minus rate"} onClick={setRateValueFromMinusButton}>-</a>
            <div className="styled-input rate-input">
                <input type="text" required disabled={rateInputDisable} value={rate} onChange={(event) => {
                    setRateValue(event.target.value)
                }}></input>
            </div>
            <a className={buttonPlusDisable ? "animated-button disabled plus rate" : "animated-button enabled plus rate"} onClick={setRateValueFromPlusButton}>+</a>
        </div>
        <div>
            <a className={buttonCheckDisable ? "animated-button disabled" : "animated-button enabled check"} onClick={sendToBackend}>Check</a>
        </div>
        <div>
            <a className={buttonDownloadDisable ? "animated-button disabled" : "animated-button enabled"} onClick={download}>Download results</a>
        </div>
        <div>
            <p>{scanProgress}</p>
            <ProgressBar progress={progress}></ProgressBar>
            <table >
                <thead>
                    <tr>
                        <th>№</th>
                        <th>IP</th>
                        <th>Port</th>
                        <th>Version</th>
                        <th>Now</th>
                        <th>Max</th>
                        <th>Ping</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {dataToTable.map((server) => (
                        <tr>
                            <td>{server[0]}</td>
                            <td>{server[1]}</td>
                            <td>{server[2]}</td>
                            <td>{server[3]}</td>
                            <td>{server[4]}</td>
                            <td>{server[5]}</td>
                            <td>{server[7]}</td>
                            <td>{server[6]}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
}

export default Counter;

