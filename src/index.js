/* eslint-disable no-useless-constructor */

// import React from 'react';
// import ReactDOM from 'react-dom';
import React from './client/react';
import ReactDOM, {useState} from './client/react-dom';
import * as serviceWorker from './serviceWorker';

class App extends React.Component{
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="jsx">
        <p></p>
        <p><span>123</span></p>
        <p>456</p>
        <div>
          <p>a</p>
          <p>b</p>
          <p>c</p>
        </div>
        text
      </div>
    )
  }
}

App.defaultProps = {
  color: 'blue'
}

function FunctionComponent({val}) {
  return (
    <h3>FunctionComponent {val}</h3>
  )
}

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(10)}>设置成10</button>
      <br />
      <button onClick={() => setCount(count => count + 1)}>+1</button>
      <h4>{count}</h4>
    </div>
  )
}

const jsx = (
  <div className="jsx">
    <h1>bar</h1>
    <h2>lab</h2>
    <ul>
      <li>1</li>
      <li>2</li>
      <li>3</li>
    </ul>
    <FunctionComponent val="1" />
    <Counter />
  </div>
)

console.log(jsx);

ReactDOM.render(
  // <App />,
  jsx,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
