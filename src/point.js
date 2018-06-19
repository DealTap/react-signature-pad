const distanceTo = (start, x, y) => Math.sqrt(((x - start.x) ** 2) + ((y - start.y) ** 2));

export default function Point(x, y, time) {
  this.x = x;
  this.y = y;
  this.time = time || new Date().getTime();

  return {
    velocityFrom: start => ((this.time !== start.time) ? distanceTo(start, this.x, this.y) / (this.time - start.time) : 1),
    x: this.x,
    y: this.y,
    time: this.time,
  };
}
