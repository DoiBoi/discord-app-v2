// Given stopover time and total travel time, should you stopover or pay for both trips separately?
const TAX = 1.12;
const ACCESS_FEE = 1.85;

/**
 * Calculates the cost of one trip given the travel time.
 * @param {float} travel_time The total time to drive (this is from starting the car to ending the trip).
 * @returns {float} The total cost of the trip. This value is not rounded to 2 decimal places and does not include tax.
 */
function calculateTripCost(travel_time) {
    // Reset the variable for each recursive loop
    // (without this it seems to have some weird numbers)
    let total_cost = 0;

    if (travel_time >= 5943) {
        total_cost = 424.99;
        travel_time -= 7200;
    } else if (travel_time < 5943 && travel_time >= 3063) {
        total_cost = 264.99;
        travel_time -= 4320;
    } else if (travel_time < 3063 && travel_time >= 360) {
        total_cost = 104.99;
        travel_time -= 1440;
    } else if (travel_time < 360 && travel_time >= 37) {
        total_cost = 17.99;
        travel_time -= 60;
    } else if (travel_time > 0 && travel_time < 37) {
        total_cost = 0.49 * travel_time;
        travel_time = 0;
    }

    // Bound it to be more than 0 as the subtraction can make it negative
    // (but we assume it's zero)
    travel_time = Math.max(0, travel_time);

    if (travel_time != 0) {
        // Recursively go through and see how many discounts we can apply
        total_cost += calculateTripCost(travel_time);
    } else {
        // Adds the access fee once we've gone through all the discounts
        // (this will only add the access fee once)
        total_cost += ACCESS_FEE;
    }

    return total_cost;
}

function calcDiff(total_travel_time, stopover_time) {
    // These shouldn't be changed
    let two_trip_cost = Math.round(100 * (calculateTripCost(total_travel_time / 2) * 2 * TAX)) / 100;
    let stopover_trip_cost = Math.round(100 * (calculateTripCost(total_travel_time + stopover_time) * TAX)) / 100;
    let diff = two_trip_cost - stopover_trip_cost;

    return [two_trip_cost, stopover_trip_cost, diff]
}

module.exports = { 
    calcDiff
}


