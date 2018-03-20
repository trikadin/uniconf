/**
 * Parser for ECMAScript Date Time String Format
 *
 * http://www.ecma-international.org/ecma-262/5.1/#sec-15.9.1.15
 */

{

const
	DEFAULTS_DATE = {
		year: 0,
		month: 1,
		day: 1,
	},
	DEFAULTS_TIME = {
		hours: 0,
		minutes: 0,
		seconds: 0,
		milliseconds: 0,
		timezone: 'Z'
	},
	DEFAULTS = Object.assign({}, DEFAULTS_DATE, DEFAULTS_TIME);

function inRange(value, max, min = 0) {
	return value >= min && value <= max;
}

function expectedInRange(name, max, min = 0, pad = 2) {
	return `${name} to be an integer from ${String(min).padStart(pad, '0')} to ${String(max).padStart(pad, '0')}`
}

function isLeapYear(year) {
	return Boolean(!(year % 4) && (year % 100 || !(year % 400)));
}

function checkDay(day, month, year) {
	let max = 31;

	if (typeof month === 'number') {
		if (month === 2) {
			max = (typeof year === 'number') && isLeapYear(year) ? 29 : 28;

		} else {
			max = 31 - (month - 1) % 7 % 2;
		}
	}

	if (!inRange(day, max, 1)) {
		return expectedInRange('day', max, 1);
	}

	return true;
}

function toValueObject(name, value) {
	return {[name]: value};
}

}

DIGIT 'digit'
	= [0-9]

SIGN
	= [+-]

year_normal
	= $(DIGIT DIGIT DIGIT DIGIT)

year_extended
	= $(SIGN DIGIT DIGIT DIGIT DIGIT DIGIT DIGIT)

year 'year ([[+-]YY]?YYYY)'
	= (year_normal / year_extended) {return Number(text())}

month 'month (MM)'
	= $(DIGIT DIGIT) {
		const month = Number(text());

		if (!inRange(month, 12, 1)) {
			expected(expectedInRange('month', 12, 1));
		}

		return month;
	}

day 'day (DD)'
	= $(DIGIT DIGIT) {
		const
			day = Number(text()),
			valid = checkDay(day);

		if (valid !== true) {
			expected(valid);
		}

		return day;
	}

dateRaw
	= year:year (
		'-' month:month (
			'-' (day {
				const
					day = Number(text()),
					valid = checkDay(day, month, year);

				if (valid !== true) {
					expected(valid);
				}

				return day;
			})
		)?
	)?

date
	= date:dateRaw {
		const [year] = date;

		let {month, day} = DEFAULTS_DATE;

		if (date[1]) {
			month = date[1][1];

			if (date[1][2]) {
				day = date[1][2][1];
			}
		}

		return {year, month, day};
	}

hours 'hours (HH)'
	= $(DIGIT DIGIT) {
		const hours = Number(text());

		if (!inRange(hours, 23)) {
			expected(expectedInRange('hours', 23));
		}

		return hours;
	}

minutes 'minutes (mm)'
	= $(DIGIT DIGIT) {
		const minutes = Number(text());

		if (!inRange(minutes, 59)) {
			expected(expectedInRange('minutes', 59));
		}

		return minutes;
	}

seconds 'seconds (ss)'
	= $(DIGIT DIGIT) {
		const seconds = Number(text());

		if (!inRange(seconds, 59)) {
			expected(expectedInRange('seconds', 59));
		}

		return seconds;
	}

milliseconds 'milliseconds (sss)'
	= $(DIGIT DIGIT DIGIT) {return Number(text())}

timezone 'timezone (Z or [+-]HH:mm)'
	= 'Z' / (sign:SIGN hoursRaw:hours ':' minutesRaw:minutes {
		const
			hours = Number(hoursRaw),
			minutes = Number(minutesRaw);

		return (hours + minutes / 60) * (sign === '-' ? -1 : 1);
	})

timeRaw
	= (hours:hours {return toValueObject('hours', hours)})
		(':' minutes:minutes {return toValueObject('minutes', minutes)})
		(
			secondsObj:(':' seconds:seconds {return toValueObject('seconds', seconds)})
			millisecondsObj:('.' milliseconds:milliseconds {return toValueObject('milliseconds', milliseconds)})?
			{return Object.assign({}, secondsObj, millisecondsObj)}
		)?
		(timezone:timezone {return toValueObject('timezone', timezone)})?

time
	= time:timeRaw {return Object.assign({}, DEFAULTS_TIME, ...time)}

datetime
	= date:date timeObj:('T' time:time {return time})? {return Object.assign({}, DEFAULTS, date, timeObj)}
