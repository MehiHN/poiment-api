var Moment = require("moment");

var moment = require("moment-range").extendMoment(Moment);
var _ = require("underscore");

var originalVisits = [
  {
    student: "jan",
    range: [[10, 11], [13, 15]]
  },
  {
    student: "lea",
    range: [[9, 10], [13, 15]]
  },
  {
    student: "kim",
    range: [[9, 12], [14, 15]]
  },
  {
    student: "mohsen",
    range: [[12, 14]]
  },
  {
    student: "katy",
    range: [[16, 17]]
  },
  {
    student: "lina",
    range: [[15, 17], [10, 11]]
  },
  {
    student: "lara",
    range: [[10, 17]]
  },
  {
    student: "josh",
    range: [[13, 14], [09, 11], [15, 16]]
  },
  {
    student: "john",
    range: [[15, 17]]
  },
  {
    student: "mady",
    range: [[15, 16], [13, 14], [09, 11]]
  },
  {
    student: "arthur",
    range: [[13, 14], [15, 16], [09, 11]]
  }
];
var visits = JSON.parse(JSON.stringify(originalVisits)).map(v => {
  v.range = v.range.map(r => {
    r[0] = moment()
      .set("hour", r[0])
      .set("minute", 0);
    r[1] = moment()
      .set("hour", r[1])
      .set("minute", 0);

    return r;
  });

  return v;
});

var availableRangesInDay = [[09, 12], [15, 16]];

var totalVisitMinutes = availableRangesInDay.reduce((prev, current) => {
  if (!prev) prev = 0;

  return prev + Math.abs(current[0] - current[1]) * 60;
}, 0);
var totalVisits = visits.length;

console.log("\n\n\n");

console.log(
  `\t Total available minutes: ${totalVisitMinutes} ( ${totalVisitMinutes /
    60} hours) `
);
console.log(`\t Total students: ${totalVisits}  `);
console.log(
  `\t Available minutes for each student: ${Math.ceil(
    totalVisitMinutes / totalVisits
  )}  `
);

console.log(`\t Available time ranges`, availableRangesInDay);

var schedules = [];

for (var dayRange of availableRangesInDay) {
  //   console.log("day range", dayRange);

  var day = moment()
    .set("hour", dayRange[0])
    .set("minute", 0);

  var visitCountInDayRange = Math.ceil(
    ((dayRange[1] - dayRange[0]) * 60) / (totalVisitMinutes / totalVisits)
  );
  //   console.log("visitCountInDayRange", visitCountInDayRange);

  //   console.log("range start ", moment(day).format("HH:mm"));

  for (var i = 0; i < visitCountInDayRange; i++) {
    var schedule = {
      start: new Date(),
      end: new Date(),
      student: null
    };

    if (i == 0) {
      schedule.start = day.toDate();
    } else {
      //if(schedules[i - 1].end.getHours() < dayRange[dayRangeIndex])

      schedule.start = schedules[schedules.length - 1].end;

      //   if (
      //     moment(schedule.start).diff(
      //       moment()
      //         .set("hour", dayRange[1])
      //         .set("minute", 0)
      //     ) > 0
      //   )
      //     break;
    }

    schedule.end = moment(schedule.start)
      .add(totalVisitMinutes / totalVisits, "minute")
      .toDate();

    // console.log(
    //   "start : " + moment(schedule.start).format("HH:mm"),
    //   "end : " + moment(schedule.end).format("HH:mm")
    // );

    var scheduleRange = moment.range(schedule.start, schedule.end);

    schedule.candidates = visits.filter(visit => {
      return (
        visit.range.filter(range => {
          var mRange = moment.range(range[0], range[1]);
          return scheduleRange.overlaps(mRange);

          //  && schedule.end.getTime() <= moment(day.toDate()).set('hour', range[1]).set('minute', 0).toDate().getTime()
        }).length > 0
      );
    });

    schedule.candidates = _.sortBy(schedule.candidates, visit => {
      var rangeIndex = visit.range.indexOf(
        visit.range.filter(range => {
          var mRange = moment.range(range[0], range[1]);
          return scheduleRange.overlaps(mRange);

          //  && schedule.end.getTime() <= moment(day.toDate()).set('hour', range[1]).set('minute', 0).toDate().getTime()
        })[0]
      );

      return (
        (scheduleRange.center().diff(visit.range[rangeIndex][0]) +
          scheduleRange.center().diff(visit.range[rangeIndex][1])) *
          -1 +
        rangeIndex +
        1
      );
    });

    if (schedule.candidates[0]) {
      schedule.student = schedule.candidates[0].student;
      visits = visits.filter(p => {
        return p.student != schedule.student;
      });
    }
    // Decide who goes in this schedule
    schedules.push(schedule);
  }
}

console.log(
  "\n\tResults: ",
  "\n\n",
  schedules.map(s => {
    s.start = moment(s.start).format("HH:mm");
    s.end = moment(s.end).format("HH:mm");
    s.candidates = s.candidates.map(p => p.student);
    delete s.candidates;
    return s;
  })
);

var notIncluded = originalVisits.filter(
  v => schedules.filter(s => s.student == v.student).length == 0
);
console.log("\n\t Visits not included: " + notIncluded.length);

notIncluded.forEach(p => {
  console.log(p);
});

console.log("\n\n\n");