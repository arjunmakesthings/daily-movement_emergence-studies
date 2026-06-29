function set_schedule() {
  /*
    a schedule can be thought of as an array of time slots; such as: 
    [
    x,y => newpos
    y,z => newpos

    where x-y >= 1. 
    ]

	which can be represented as a 2-dimensional array. 

	[
	[],
	[],
	[]
	]

	where arr[i].length === 12;
	and arr[i]
    */

  let time = Array.from({ length: 24 }, (_, i) => i);
  let schedule = Array.from({ length: 12 }, () => [[], []]);

  //to divide into 12 sub-arrays, we need to go over the array 12 times. 

  for (let i = 0; i<time.length/2; i++){
	let n = Math.floor(Math.random()*time.length); 
	let ne = (n + Math.floor(Math.random()*4) + time.length) % time.length;

	schedule[i][0].push(time[n]);
	schedule[i][1].push(time[ne]); 
  }

  console.log(schedule); 
}

set_schedule(); 

