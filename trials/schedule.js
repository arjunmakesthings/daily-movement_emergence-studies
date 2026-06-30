// function set_schedule() {
//   let time = Array.from({ length: 24 }, (_, i) => i);
//   let schedule = [];

//   let i = 0;

//   while (i < time.length - 1) {
//     i = (i + Math.floor(Math.random() * 6)) % time.length;

//     schedule.push(
//       schedule.length === 0
//         ? [time.splice(i, 1)[0], time.splice(i, 1)[0]]
//         : [schedule[schedule.length - 1][1], time.splice(i, 1)[0]],
//     );
//   }

//   schedule.push([schedule[schedule.length - 1][1], schedule[0][0]]);

//   return schedule;
// }

function set_schedule() {
  let time = Array.from({ length: 24 }, (_, i) => i),
    schedule = [],
    i = 0;

  while (i < time.length - 1) {
    i = (i + Math.floor(Math.random() * 6)) % time.length;
    let a = time.splice(i, 1)[0],
      b = time.splice(i, 1)[0];
    schedule.push(
      schedule.length ? [schedule[schedule.length - 1][1], a] : [a, b],
    );
  }

  schedule.push([schedule[schedule.length - 1][1], schedule[0][0]]);
  return schedule;
}

let schedule = set_schedule();

console.log(schedule);
