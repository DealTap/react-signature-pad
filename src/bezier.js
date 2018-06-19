function point(t, start, c1, c2, end) {
  return (start * (1.0 - t) * (1.0 - t) * (1.0 - t))
    + (3.0 * c1 * (1.0 - t) * (1.0 - t) * t)
    + (3.0 * c2 * (1.0 - t) * t * t)
    + (end * t * t * t);
}

export default function Bezier({
  startPoint,
  control1,
  control2,
  endPoint,
}) {
  this.startPoint = startPoint;
  this.control1 = control1;
  this.control2 = control2;
  this.endPoint = endPoint;

  return {
    length: () => {
      const steps = 10;
      let length = 0;
      let i;
      let t;
      let cx;
      let cy;
      let px;
      let py;
      let xdiff;
      let ydiff;

      for (i = 0; i <= steps; i += 1) {
        t = i / steps;
        cx = point(t, this.startPoint.x, this.control1.x, this.control2.x, this.endPoint.x);
        cy = point(t, this.startPoint.y, this.control1.y, this.control2.y, this.endPoint.y);
        if (i > 0) {
          xdiff = cx - px;
          ydiff = cy - py;
          length += Math.sqrt((xdiff * xdiff) + (ydiff * ydiff));
        }
        px = cx;
        py = cy;
      }
      return length;
    },
    startPoint: this.startPoint,
    control1: this.control1,
    control2: this.control2,
    endPoint: this.endPoint,
  };

}
