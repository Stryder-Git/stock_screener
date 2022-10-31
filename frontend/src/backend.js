


export class Filter {
    constructor(callback) {
        this.confs = {};
        this.callback = callback;
        
    }

    _parse_data(data) {
        console.log("parsing data");
        data = data.split(":!:")
        let symbol = data[0];

        data = data[data.length - 1].slice(2, -2).split(",").slice(-2);
        return [symbol, data[0], data[1]];
    }

    _set_stream(configs) {
        let stream = new EventSource("http://localhost:5045/Screener/?"+configs);

        stream.onmessage = (e) => {
            console.log("the response is ", e.data);
            this.callback(this._parse_data(e.data));
        };
    }

    _get() {
        let xhr = new XMLHttpRequest();


        let error_func = (e) => {
            console.log("request failed " + e.responseText);
            console.log(Object.keys(e));
            console.log("status: ", xhr.status);
            console.log(e);

        }

        xhr.addEventListener("abort", error_func);
        xhr.addEventListener("error", error_func);
        xhr.addEventListener("load", (e) => {
            console.log("the repsponse is " + xhr.responseText);
            this.callback(xhr.responseText);
        })


        console.log("making request");
        xhr.open("GET", "http://localhost:5045/Screener");
        xhr.send();
    }

    filter(confs) {
        this.confs = confs;
        //this.stream.symbols = {
        //    AAPL: true, FB: true, NVDA: true
        //}

        let q = ""
        for (let field in confs) {
            q += field + "=" + confs[field] + "&"
        }




//        confs = JSON.stringify(confs);

        console.log("configs: ", q);

        this._set_stream(q.slice(0, -1));
        
    }

}




//export default function filter_screener(confs, callback) {



//    callback({ ...price_db });
//}
