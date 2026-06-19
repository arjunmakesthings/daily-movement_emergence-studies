//test logarithmic growth of mass.

/*
log^2 of 10000 = ? 
is the same as asking 2^what = 10000.

log base growth rate max = time / iteration # / steps. 
*/

let age = 1;

function get_mass(age) {
  let a = 50;
  let b = 1;

  return a * Math.log(b * age + 1);
}

setInterval(spit, 250);

function spit() {
  age += 1;

  let mass = get_mass(age);

  console.log("mass = " + mass + ", age = " + age);
}
