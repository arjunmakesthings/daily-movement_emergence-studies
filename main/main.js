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

class World {
	constructor(){
		this.time = 0;
		this.beings = []; 
	}
	exist(){
		background(255);
		this.keep_time();

		
	}
	keep_time(){
		this.time = Math.floor(frameCount/60 % 24); 
	}
}

class Being {
	constructor(x,y){
		this.pos = createVector(this.x, this.y); 
		this.age = 0; 
	}
	exist(){
		this.body(); 
	}
	body(){
		fill (0); 
		circle (this.x, this.y, mass); 
	}
}
