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

function AddField(props) {
    return <button>+</button>;
}

function PercentChange(props) {
    return (
        <div>
            <MinMax field={props.field}/>
            <input key="{props.field}_ndays" type="text" placeholder="ndays" />
            <AddField/>
        </div>
        );
}




class ConfigField extends React.Component {
    constructor(props) {
        /*
         * Needs:
         *  * field (what is it getting)
         *  * tracker (to update FrontEnd)
         */
        super(props);
        this.state = { value: ""};
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) {
        this.setState({ value: event.target.value });
        this.props.tracker(this.props.field, event.target.value);
    }

    render() {
        let field = this.props.field;
        return (
                <label key={field}>
                    {field}:
                <input key={field + "inp"} type="text" onChange={this.handleChange} /><br />
                </label>
        )
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

// ROOT
class StockScreener extends React.Component {
    constructor(props) {
        /* 
         Needs:
            * callback (for the button)
         */
        super(props)
        this.state = {results: {}};

        this.fields = ["min price", "max price", "min % change", "max % change", "above ma", "below ma"];
        this.configs = {};

        this.tracker = this.tracker.bind(this);
        this.calculate = this.calculate.bind(this);
        this.update_results = this.update_results.bind(this);

        this.filter = new Filter(this.update_results);
        this.sse = undefined;

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
        let fields = Array(this.fields.length);
        
        for (let i = 0; i < this.fields.length; i++) {
            fields[i] = <ConfigField field={this.fields[i]} tracker={this.tracker} />;
        }

        return (
            <div>
                <form>
                    <CurrentPrice field= "Current Price"/>
                    <PercentChange field= "Percent Change"/>

                </form>
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