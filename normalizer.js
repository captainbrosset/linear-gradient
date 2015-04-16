function fetchNextIndex(list, startIndex) {
  for (let i = startIndex; i < list.length; i ++) {
    if (typeof list[i] !== "undefined") {
      return i;
    }
  }
  return -1;
}

function normalizeRange(list, start, end) {
  // list[start] and list[end] are defined, for sure, everything in between is
  // not.

  // First, make sure list[end] > list[start]
  if (list[start] > list[end]) {
    list[end] = list[start];
  }

  // Next distribute all values in between.
  for (let i = start + 1; i < end; i ++) {
    list[i] = list[start] + (i - start) * (list[end] - list[start]) / (end - start);
  }
}

function normalizeStops(stops) {
  // Make sure the first position is defined.
  if (typeof stops[0] === "undefined") {
    let nextIndex = fetchNextIndex(stops, 1);
    if (nextIndex === -1) {
      stops[0] = 0;
    } else if (stops[nextIndex] <= 0) {
      stops[0] = stops[nextIndex];
    } else {
      stops[0] = 0;
    }
  }

  // Then go range by range, a range being a slice of the array, from a defined
  // start position to a defined end position.
  let rangeStart = 0;
  while (true) {
    // If there is no next defined position, we at least need to set the last
    // stop.
    let rangeEnd = fetchNextIndex(stops, rangeStart + 1);
    if (rangeEnd === -1) {
      stops[stops.length - 1] = stops[0] > 100 ? stops[0] : 100;
      rangeEnd = stops.length - 1;
    }

    // Now that we're sure to have bounds, we can normalize the range.
    normalizeRange(stops, rangeStart, rangeEnd);

    rangeStart = rangeEnd;
    if (rangeStart === stops.length - 1) {
      break;
    }
  }
}
