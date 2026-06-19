function setup() {
  createCanvas(400, 400);

  background(255);
}

function draw() {
  translate(0, height);
  scale(1, -1);
  plot(50, 50);
  noLoop();
}
/*
1 - e^(-x/pi).

asymptotic exponential function.

https://math.stackexchange.com/questions/2821035/exponential-something-what-is-the-name-of-that-asymptotic-exponential-functi

*/

function plot(x, y) {
  strokeWeight(10);
  stroke(0);

  if (x < width - 50 && y < height - 50) {
    x+=1;

    const a = 100; //max. 
    const b = 50; //how quickly max is achieved.
    const base = 50; //to ensure base of graph doesn't shift.

    y = base + a * (1 - Math.exp(-(x - base) / b));

    point(x, y);
    plot(x, y);
  } else {
    return;
  }
}
