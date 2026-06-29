/*
world; container; places; beings; time; movement; schedule; software-interpretation.
*/

let world;

function setup() {
	createCanvas(800, 800); //square.

	//p5 stuff; globally; once:
	noStroke(); 

	world = new World(); 

	background(190);
}

function draw() {
	world.exist(); 

	// debug();
}

function debug(){
	console.log(
    "time: " + world.time,
    "age: " + world.beings[0].curr_age,
    "mass: " + world.beings[0].mass,
    "energy: " + world.beings[0].energy,
  ); 
}
