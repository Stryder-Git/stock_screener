import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { PriceStream, Filter } from "./backend.js";

// CONFIGURATIONS SECTION

function MinMax(props) {
    return (
            <label>{props.field}:
            <input key="{props.field}_min" type="text" placeholder="min" />
                <input key="{props.field}_max" type="text" placeholder="max" />
            </label>
        )
}

function CurrentPrice(props) {
    return <div><MinMax field={props.field} /></div>;
}
function AddRemoveField(props) {
    return <button onClick={props.onclick}>{props.sign}</button>
}

function PercentChange(props) {
    let button;
    if (props.n > 0) {
        button = <AddRemoveField onclick={props.remove_field} sign="-"/>
    } else {
        button = <AddRemoveField onclick={props.add_field} sign="+"/>
    }

    return (
        <div>
            <MinMax field={props.field}/>
            <input key="{props.field}_ndays" type="text" placeholder="ndays" />
            {button}
        </div>
        );
}


class Configurations extends React.Component {
    constructor(props) {
        super(props);
        this.add = props.parent.add_field;
        this.remove = props.parent.remove_field
    }

    render() {

        let pct_changes = Array(this.props.parent.state["Percent Change"]).fill(undefined);
        for (let i in pct_changes) {
            pct_changes[i] = <PercentChange field="Percent Change" n={i}
                add_field={this.add("Percent Change")} remove_field={this.remove("Percent Change")}
            />
        }

        return (
            <form>
                <CurrentPrice field="Current Price"/>
                {pct_changes }    
            </form>
        );
    }


}

// RESULTS SECTION
function StockRow(props) {
    console.log("making row for ", props.symbol, props.close, props.volume);
    return (
        <tr key={props.symbol }>
            <td>{props.symbol}</td>
            <td>{props.close}</td>
            <td>{props.volume}</td>
        </tr>   
    )
}

const TableHeader = (
    <tr>
        <th>Symbol </th>
        <th>Price </th>
        <th>Volume </th>
    </tr>
);


function Results(props) {

    console.log(props);
    let results = props.results;
    let i = props.sort_index
    let symbols = Object.keys(results).sort(
        (a, b) => results[a][i] < results[b][i] ? -1 : (results[b][i] < results[a][i]) | 0);


    let n_rows = symbols.length
    n_rows = Math.min(n_rows, props.max_rows || 50)

    let rows = Array(n_rows);
    let ix = 0;
    for (let sym of symbols) {
        let data = results[sym];
        rows[ix++] = StockRow({ symbol: sym, close: data[0], volume: data[1] });
        if (ix === n_rows) { break; }
    }

    return (
        <div>
            <table className="stocklist">
                <thead>{TableHeader}</thead>
                <tbody>{rows}</tbody>
            </table>
        </div>
        )
}

let FIELDS = {
    "Percent Change": 1,
    "Moving Average": 1,
}

// ROOT
class StockScreener extends React.Component {
    constructor(props) {
        /* 
         Needs:
            * callback (for the button)
         */
        super(props)
        this.state = {
            results: {},
            fields: FIELDS
        };

        this.fields = ["min price", "max price", "min % change", "max % change", "above ma", "below ma"];
        this.configs = {};

        this.tracker = this.tracker.bind(this);
        this.calculate = this.calculate.bind(this);
        this.update_results = this.update_results.bind(this);
        //this.add_field = this.add_field.bind(this);
        //this.remove_field = this.remove_field.bind(this);

        this.filter = new Filter(this.update_results);
        this.sse = undefined;

    }

    add_field(field) {
        console.log("creating add_field: " + field);
        return () => {
            console.log("adding field: " + field);
            let state = { ... this.state };
            state.fields[field]++;
            this.setState(state);
        }
    }

    remove_field(field) {
        console.log("creating remove_field: " + field);
        return () => {
            console.log("removing field: " + field)
            let state = { ... this.state };
            state.fields[field]--;
            this.setState(state);
        }
    }


    tracker(field, value) {  // will track the values of each input field
        console.log("updating field ", field, " with ", value)
        this.configs[field] = value;
    }

    check_configs(confs) {
        for (let conf in this.configs) {
            if (this.configs[conf] !== "" && this.configs !== undefined) {
                return true;
            }
        }
        return false;
    }

    update_results(data) {
        console.log("updating stocklist: ", data)
        let state = {... this.state};

        //let results =
        // data[0] = symbol, data[1:] = close, volume
        state.results[data[0]] = data.slice(1);

        this.setState(state);    
    }

    close_sse() {
        console.log("closing last SSE", this.sse);
        this.sse.close();
        this.state.results = {};

        console.log("sending delete request.");
        let req = new XMLHttpRequest();
        req.addEventListener("loadend", (event) => { console.log("delete request completed."); });

        req.open("DELETE", "http://localhost:5045/Screener?i="+this.filter.sseid);
        req.send();
    }

    calculate() { // will be called when 'Calculate' is clicked
        console.log("setting Results state, configs: ", this.configs)
        if (this.sse !== undefined) { this.close_sse(); }

        if (this.check_configs(this.configs)) {
            this.sse = this.filter.filter(this.configs);
        }
    }

    render() {
        console.log("rendering Screener");
        console.log(this.state);
        return (
            <div>
                <Configurations parent={this}/>
                <button className="Calculate" onClick={this.calculate}>
                    Calculate
                </button>
                <hr/>
                <Results results={this.state.results} sort_index={0}/>
            </div>
        );    
    }

}

// ========================================================================

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<StockScreener />);