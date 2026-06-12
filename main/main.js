/*
world; container; places; beings; time; movement; schedule; software-interpretation.
*/

let world;
let time = 0; 

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
		this.beings = [];
		
		this.beings.push(new Being(width/2, height/2)); //debug being.
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
		//on this world, time is a 24-second loop.
		time = Math.floor(frameCount/60 % 24); 
	}
	make_and_remove(){
		
		/*
		birth criteria: 
		at a certain rate, a new being is produced. 

		---

		death criteria:
		as beings age, their probability to die increases. therefore, it is almost imminent if they are 100.
		*/

		//death:
		//as beings age, their probability to die increases. therefore, it is almost imminent if they are 100.
		for (let i ){
			let p = being.age; 
			let chance = random(); 

			if (chance > p){
				//alive.
			}else{
				this.beings.splice
			}
		}
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
		if (time == 0 && frameCount%60==0){
			//on this planet, beings age by 1 unit per day.
			this.curr_age+=0.01;  
		}
	}
	move(){
			
	}
}
