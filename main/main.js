/*
world; container; places; beings; time; movement; schedule; software-interpretation.
*/

let world;

function setup() {
	// createCanvas(1000, 562); //in 16:9 aspect ratio.
	createCanvas(800, 800); //square.

	world = new World(); 
}

function draw() {
	world.exist(); 
}

class World {
	constructor(){
		this.time;
		this.beings = []; 
	}
	exist(){
		background(255, 0, 0);
		this.keep_time(); 

		console.log(this.time);
	}
	keep_time(){
		this.time = Math.floor(frameCount/60 % 24); 
	}
}

class Being {
	constructor(){
		this.pos; 
	}
}
