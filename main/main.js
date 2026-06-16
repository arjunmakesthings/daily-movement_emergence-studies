/*
world; container; places; beings; time; movement; schedule; software-interpretation.
*/

let world;

function setup() {
	// createCanvas(1000, 562); //in 16:9 aspect ratio.
	createCanvas(800, 800); //square.

	//p5 stuff; globally; once:
	noStroke(); 

	world = new World(); 
}

function draw() {
	world.exist(); 
}
