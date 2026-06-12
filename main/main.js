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

		this.make_and_remove(); //or birth & death.

		for (let being of this.beings){
			being.exist(); 
		}
	}
	keep_time(){
		this.time = Math.floor(frameCount/60 % 24); 
	}
	make_and_remove(){
		/*
		death criteria: 
		-  
		*/
	}
}

class Being {
	constructor(x,y){
		this.pos = createVector(x, y); 
		this.curr_age = 0; 
		this.mass = 20; 
	}
	exist(){
		this.body();
		this.age(); 
	}
	body(){
		fill (0); 
		circle (this.pos.x, this.pos.y, this.mass); 
	}
	age(){
			
	}
	move(){
			
	}
}
