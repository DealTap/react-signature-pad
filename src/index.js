// @flow
import React from 'react';

import Bezier from './bezier';
import DefinePoint from './point';

function calculateCurveControlPoints(s1, s2, s3) {
  const dx1 = s1.x - s2.x;
  const dy1 = s1.y - s2.y;
  const dx2 = s2.x - s3.x;
  const dy2 = s2.y - s3.y;

  const m1 = { x: (s1.x + s2.x) / 2.0, y: (s1.y + s2.y) / 2.0 };
  const m2 = { x: (s2.x + s3.x) / 2.0, y: (s2.y + s3.y) / 2.0 };

  const l1 = Math.sqrt((dx1 * dx1) + (dy1 * dy1));
  const l2 = Math.sqrt((dx2 * dx2) + (dy2 * dy2));

  const dxm = (m1.x - m2.x);
  const dym = (m1.y - m2.y);

  const k = l2 / (l1 + l2);
  const cm = { x: m2.x + (dxm * k), y: m2.y + (dym * k) };

  const tx = s2.x - cm.x;
  const ty = s2.y - cm.y;

  return {
    c1: new DefinePoint(m1.x + tx, m1.y + ty),
    c2: new DefinePoint(m2.x + tx, m2.y + ty),
  };
}

type SignatureProps = {
  minWidth: number,
  maxWidth: number,
  velocityFilterWeight: number,
  backgroundColor: string,
  penColor: string,
  dotSize: Number,
  onBegin: ?Function,
  onEnd: ?Function,
  classes: Object,
  width: number,
  height: number,
};

type SignatureState = {
  mouseButtonDown: boolean,
};

export default class SignaturePadC extends React.Component<SignatureProps, SignatureState> {

  static defaultProps = {
    width: 400,
    height: 250,
    penColor: '#555555',
    clearFunction: () => {},
    downloadFunction: () => {},
  }

  state = {
    mouseButtonDown: false,
  }

  componentDidMount() {
    this.ctx = this.canvas.getContext('2d');
    this.props.clearFunction(this.clear)
    this.props.downloadFunction(this.download)
    this.clear();

    this.handleMouseEvents();
    this.handleTouchEvents();
    this.resizeCanvas();
  }

  componentWillUnmount() {
    this.off();
  }

  ctx: HTMLCanvasElement.getContext;
  canvas: HTMLCanvasElement;
  clear: Function;
  lastWidth: number;
  lastVelocity: number;
  points: Array<any>;

  minWidth = this.props.minWidth || 0.5;
  maxWidth = this.props.maxWidth || 2;
  dotSize = this.props.dotSize || function dotSizeDefault() {
    return (this.minWidth + this.maxWidth) / 2;
  }
  backgroundColor = this.props.backgroundColor || 'rgba(0,0,0,0)';
  velocityFilterWeight = this.props.velocityFilterWeight || 0.7;

  clear = (e: ?Object) => {
    if (e) {
      e.preventDefault();
    }
    const { canvas, ctx } = this;

    ctx.fillStyle = this.backgroundColor;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.reset();
  }

  toDataURL = (...rest: any) => {
    const { canvas } = this;
    return canvas.toDataURL(...rest);
  }

  fromDataURL = (dataUrl: string) => {
    const self = this;
    const image = new Image();
    const ratio = window.devicePixelRatio || 1;
    const width = this.canvas.width / ratio;
    const height = this.canvas.height / ratio;

    this.reset();
    image.src = dataUrl;
    image.onload = function onLoadImage() {
      self.ctx.drawImage(image, 0, 0, width, height);
    };
    this.isEmpty = false;
  }

  isEmpty = () => this.isEmpty

  resizeCanvas = () => {
    const { ctx, canvas } = this;
    // When zoomed out to less than 100%, for some very strange reason,
    // some browsers report devicePixelRatio as less than 1
    // and only part of the canvas is cleared then.
    // const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const ratio = 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;

    ctx.scale(1, 1);
    this.isEmpty = true;
  }

  reset = () => {
    this.points = [];
    this.lastVelocity = 0;
    this.lastWidth = (this.minWidth + this.maxWidth) / 2;
    this.isEmpty = true;
    this.ctx.fillStyle = this.props.penColor;
  }

  handleMouseEvents = () => {
    this.setState({
      mouseButtonDown: false,
    });

    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  handleTouchEvents = () => {
    // Pass touch events to canvas element on mobile IE.
    this.canvas.style.msTouchAction = 'none';

    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  off = () => {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);

    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
  }

  handleMouseDown = (event: SyntheticMouseEvent<EventTarget>) => {
    if (event.button === 0) {
      this.setState({
        mouseButtonDown: true,
      });
      this.strokeBegin(event);
    }
  }

  handleMouseMove = (event: SyntheticMouseEvent<EventTarget>) => {
    if (this.state.mouseButtonDown) {
      this.strokeUpdate(event);
    }
  }

  handleMouseUp = (event: SyntheticMouseEvent<EventTarget>) => {
    if (event.button === 0 && this.state.mouseButtonDown) {
      this.setState({
        mouseButtonDown: false,
      });
      this.strokeEnd(event);
    }
  }

  handleTouchStart = (event: SyntheticTouchEvent<EventTarget>) => {
    const touch = event.changedTouches[0];
    this.strokeBegin(touch);
  }

  handleTouchMove(event: SyntheticTouchEvent<EventTarget>) {
    // Prevent scrolling.
    event.preventDefault();

    const touch = event.changedTouches[0];
    this.strokeUpdate(touch);
  }

  handleTouchEnd(event: SyntheticTouchEvent<EventTarget>) {
    const wasCanvasTouched = event.target === this.canvas;
    if (wasCanvasTouched) {
      this.strokeEnd(event);
    }
  }

  strokeUpdate(event: Object) {
    const point = this.createPoint(event);
    this.addPoint(point);
  }

  strokeBegin(event: Object) {
    this.reset();
    this.strokeUpdate(event);
    if (typeof this.props.onBegin === 'function') {
      this.props.onBegin(event);
    }
  }

  strokeDraw(point: Object) {
    const { ctx } = this;
    const dotSize = typeof (this.dotSize) === 'function' ? this.dotSize() : this.dotSize;

    ctx.beginPath();
    this.drawPoint(point.x, point.y, dotSize);
    ctx.closePath();
    ctx.fill();
  }

  strokeEnd = (event: Object) => {
    const canDrawCurve = this.points.length > 2;
    const point = this.points[0];

    if (!canDrawCurve && point) {
      this.strokeDraw(point);
    }
    if (typeof this.props.onEnd === 'function') {
      this.props.onEnd(event);
    }
  }

  createPoint = (event: Object) => {
    const rect = this.canvas.getBoundingClientRect();
    const definedPoint = new DefinePoint(
      event.clientX - rect.left,
      event.clientY - rect.top,
    );
    return definedPoint;
  }

  addPoint = (point: Object) => {
    const { points } = this;
    let curve;

    points.push(point);

    if (points.length > 2) {
      // To reduce the initial lag make it work with 3 points
      // by copying the first point to the beginning.
      if (points.length === 3) points.unshift(points[0]);

      const { c2 } = calculateCurveControlPoints(points[0], points[1], points[2]);
      const { c1 } = calculateCurveControlPoints(points[1], points[2], points[3]);
      curve = new Bezier({
        startPoint: points[1],
        control1: c2,
        control2: c1,
        endPoint: points[2],
      });
      this.addCurve(curve);

      // Remove the first element from the list,
      // so that we always have no more than 4 points in points array.
      points.shift();
    }
  }

  addCurve = (curve: Object) => {
    const { startPoint, endPoint } = curve;
    let velocity;

    velocity = endPoint.velocityFrom(startPoint);
    velocity = (this.velocityFilterWeight * velocity)
        + ((1 - this.velocityFilterWeight) * this.lastVelocity);

    const newWidth = this.strokeWidth(velocity);
    this.drawCurve(curve, this.lastWidth, newWidth);

    this.lastVelocity = velocity;
    this.lastWidth = newWidth;
  }

  drawPoint = (x: Number, y: Number, size: Number) => {
    const { ctx } = this;

    ctx.moveTo(x, y);
    ctx.arc(x, y, size, 0, 2 * Math.PI, false);
    this.isEmpty = false;
  }

  drawCurve = (curve: Object, startWidth: number, endWidth: number) => {
    const { ctx } = this;
    const widthDelta = endWidth - startWidth;
    let width;
    let i;
    let t;
    let tt;
    let ttt;
    let u;
    let uu;
    let uuu;
    let x;
    let y;

    const drawSteps = Math.floor(curve.length());
    ctx.beginPath();
    for (i = 0; i < drawSteps; i += 1) {
      // Calculate the Bezier (x, y) coordinate for this step.
      t = i / drawSteps;
      tt = t * t;
      ttt = tt * t;
      u = 1 - t;
      uu = u * u;
      uuu = uu * u;

      x = uuu * curve.startPoint.x;
      x += 3 * uu * t * curve.control1.x;
      x += 3 * u * tt * curve.control2.x;
      x += ttt * curve.endPoint.x;

      y = uuu * curve.startPoint.y;
      y += 3 * uu * t * curve.control1.y;
      y += 3 * u * tt * curve.control2.y;
      y += ttt * curve.endPoint.y;

      width = startWidth + (ttt * widthDelta);
      this.drawPoint(x, y, width);
    }
    ctx.closePath();
    ctx.fill();
  }

  strokeWidth(velocity: number) {
    return Math.max(this.maxWidth / (velocity + 1), this.minWidth);
  }

  download = () => {
    const el = document.createElement('a');
    el.style.display = 'none';
    el.setAttribute('href', this.toDataURL('image/png', 0.9));
    el.setAttribute('download', 'canvasDL');
    if (document.body != null) {
      document.body.appendChild(el);
      el.click();
    }
    if (document.body != null) {
      document.body.removeChild(el);
    }
  }

  render() {
    const { width, height } = this.props;
    return (
      <canvas
        width={width}
        height={height}
        ref={(c) => {
          if (c) {
            this.canvas = c;
          }
        }}
      />
    );
  }

}
