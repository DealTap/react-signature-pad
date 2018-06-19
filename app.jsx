/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import ReactDOM from 'react-dom';
import SignaturePad from './src/index';

function SigPad() {
  let download = () => {};
  let clear = () => {};

  return (
    <div>
      <SignaturePad
        width={500}
        height={500}
        clearFunction={(c) => { clear = c; }}
        downloadFunction={(dl) => { download = dl; }}
      />
      <button onClick={() => { download(); }} >Download</button>
      <button onClick={() => { clear(); }} >Clear</button>
    </div>
  );
}

ReactDOM.render(
  <SigPad />,
  document.getElementById('container'),
);
