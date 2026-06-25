function setup() {
  createCanvas(400, 400);

  background(255);
}

function draw() {
  translate(0, height);
  scale(1, -1);
  plot2(50, 50);
  noLoop();
}
/*
1 - e^(-x/pi).

asymptotic exponential function.

https://math.stackexchange.com/questions/2821035/exponential-something-what-is-the-name-of-that-asymptotic-exponential-functi

*/

// function plot(x, y) {
//   strokeWeight(10);
//   stroke(0);

//   if (x < width - 50 && y < height - 50) {
//     x+=1;

//     const a = 100; //max.
//     const b = 50; //how quickly max is achieved.
//     const base = 50; //to ensure base of graph doesn't shift.

//     y = base + a * (1 - Math.exp(-(x - base) / b));

//     console.log(y);

//     point(x, y);
//     plot(x, y);
//   } else {
//     return;
//   }
// }

function plot2(x, y) {
  strokeWeight(10);
  stroke(0);

  if (x < width - 50 && y < height - 50) {
    /*
    y = (1/sd * sqrt(2*pi))^e
    https://www.thoughtco.com/normal-distribution-bell-curve-formula-3126278
    */

    const s = 2;
    const a = 7; 
    const b = 5000;

    let y = (Math.pow(s,
      (-(Math.pow(x-a, 2)) / b)
    ))*200

    console.log(x,y); 

    point(x, y);
    plot2(x + 1, y);
  } else {
    return;
  }
}
