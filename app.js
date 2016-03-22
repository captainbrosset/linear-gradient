
const ANGLE_KEYWORDS = {
  "to top": () => 0,
  "to top right": ({width, height}) => {
    return Math.acos((width/2) / (Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)) / 2));
  },
  "to right": () => Math.PI/2,
  "to bottom right": bounds => Math.PI - ANGLE_KEYWORDS["to top right"](bounds),
  "to bottom": () => Math.PI,
  "to bottom left": bounds => Math.PI + ANGLE_KEYWORDS["to top right"](bounds),
  "to left": () => 3*Math.PI/2,
  "to top left": bounds => (2*Math.PI) - ANGLE_KEYWORDS["to top right"](bounds)
};
const ANGLE_REGEX = /^-?[0-9.]+(deg|rad|grad|turn)$/;
const COLOR_REGEX = /^\([0-9., ]+\)/;
const ARC_RADIUS = 50;

let testElement = document.querySelector(".test-element");
let canvas = document.querySelector(".gradient-overlay");
let ctx = canvas.getContext("2d");

let input = document.querySelector(".gradient-input");
input.value = document.styleSheets[0].cssRules[4]
              .style.getPropertyValue("background-image");

function drawColorStop(color, position, angle, index) {
  // Drawing the stop cirlce.
  ctx.save();
  ctx.fillStyle = "#555";

  ctx.beginPath();
  ctx.arc(position.x, position.y, 4, 0, 2 * Math.PI, false);
  ctx.fill();

  ctx.restore();

  // Draw the color label.
  let cornerRadius = 4;
  let size = 20;
  let padding = 15;

  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "white";
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(0, 0, 0, .3)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;
  ctx.translate(position.x, position.y);
  ctx.rotate(index % 2 ? angle + Math.PI/2 : angle - Math.PI/2);
  ctx.translate(-size/2, - size - padding);

  ctx.beginPath();
  ctx.moveTo(cornerRadius, 0);
  ctx.lineTo(size - cornerRadius, 0);
  ctx.arcTo(size, 0, size, cornerRadius, cornerRadius);
  ctx.lineTo(size, size - cornerRadius);
  ctx.arcTo(size, size, size - cornerRadius, size, cornerRadius);
  
  ctx.lineTo((size / 2) + cornerRadius, size);
  ctx.lineTo((size / 2), size + 5);
  ctx.lineTo((size / 2) - cornerRadius, size);

  ctx.lineTo(cornerRadius, size);
  ctx.arcTo(0, size, 0, size - cornerRadius, cornerRadius);
  ctx.lineTo(0, cornerRadius);
  ctx.arcTo(0, 0, cornerRadius, 0, cornerRadius);
  ctx.stroke();
  ctx.fill();

  ctx.restore();
}

function getColorStopPosition(angle, gradientLine, percentagePosition) {
  let yDiff = Math.sin(angle-Math.PI/2) *
              (gradientLine.length * percentagePosition/100);
  let xDiff = Math.cos(angle-Math.PI/2) *
              (gradientLine.length * percentagePosition/100);
  return {
    x: gradientLine.start.x + xDiff,
    y: gradientLine.start.y + yDiff
  };
}

function drawGradientBox(quad) {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#555";

  ctx.beginPath();
  ctx.rect(quad.p1.x, quad.p1.y, quad.bounds.width, quad.bounds.height);
  ctx.stroke();

  ctx.restore();
}

function drawGradientLine(gradientLine) {
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#555";
  
  ctx.beginPath();
  ctx.moveTo(gradientLine.start.x, gradientLine.start.y);
  ctx.lineTo(gradientLine.end.x, gradientLine.end.y);
  ctx.stroke();
  
  ctx.restore();
}

function drawLinePoint(center) {
  ctx.save();
  ctx.fillStyle = "#555";

  ctx.beginPath();
  ctx.arc(center.x, center.y, 2, 0, 2 * Math.PI, false);
  ctx.fill();

  ctx.restore();
}

function drawCenterLine(gradientLine) {
  ctx.save();
  ctx.strokeStyle = "#555";
  ctx.setLineDash([3, 2]);

  ctx.beginPath();
  ctx.moveTo(gradientLine.center.x, gradientLine.center.y);
  ctx.lineTo(gradientLine.center.x, gradientLine.center.y - ARC_RADIUS - 10);
  ctx.stroke();
  
  ctx.restore();
}

function drawAngleArc(angle, gradientLine) {
  let startAngle = 3 * Math.PI / 2;
  let endAngle = angle - Math.PI / 2;

  ctx.save();
  ctx.strokeStyle = "#555";

  ctx.beginPath();
  ctx.arc(gradientLine.center.x, gradientLine.center.y, ARC_RADIUS, startAngle, endAngle);
  ctx.stroke();

  ctx.restore();
}

function drawPerpendicularLines(angle, quad, gradientLine) {
  let point1, point2;
  if (angle <= Math.PI/2) {
    point1 = quad.p4;
    point2 = quad.p2;
  } else if (angle <= Math.PI) {
    point1 = quad.p1;
    point2 = quad.p3;
  } else if (angle <= 3*Math.PI/2) {
    point1 = quad.p2;
    point2 = quad.p4;
  } else {
    point1 = quad.p3;
    point2 = quad.p1;
  }

  ctx.save();
  ctx.strokeStyle = "#555";
  ctx.setLineDash([3, 2]);

  ctx.beginPath();
  ctx.moveTo(gradientLine.start.x, gradientLine.start.y);
  ctx.lineTo(point1.x, point1.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(gradientLine.end.x, gradientLine.end.y);
  ctx.lineTo(point2.x, point2.y);
  ctx.stroke();

  ctx.restore();
}

function renderGradientLine(quad, {angle, stops, gradientLine}) {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(0.5, 0.5);

  // TODO: THIS SHOULD ACTUALLY BE DRAWN AROUND THE AREA DESCRIBED BY
  // BACKGROUND-SIZE, NOT THE ENTIRE ELEMENT'S QUADS
  drawGradientBox(quad);
  
  drawGradientLine(gradientLine);

  drawLinePoint(gradientLine.start);
  drawLinePoint(gradientLine.center);
  drawLinePoint(gradientLine.end);

  drawCenterLine(gradientLine);

  drawAngleArc(angle, gradientLine);

  drawPerpendicularLines(angle, quad, gradientLine);

  for (let i = 0; i < stops.length; i ++) {
    let {color, position} = stops[i];
    drawColorStop(color, getColorStopPosition(angle, gradientLine, position), angle, i);
  }

  ctx.restore();
}

function parseGradientPart(part, gradientBoxBounds) {
  // All parts have a useless trailing character, either ) or ,
  part = part.trim();
  part = part.substring(0, part.length - 1);

  // Check if the part is an angle, a signed float with 'deg' suffix or any of
  // the accepted keywords.
  if (Object.keys(ANGLE_KEYWORDS).indexOf(part) !== -1){
    return {
      type: "angle",
      angle: ANGLE_KEYWORDS[part](gradientBoxBounds)
    };
  } else if (part.match(ANGLE_REGEX)) {
    let parts = part.match(ANGLE_REGEX);
    let value = parseFloat(parts[0]);
    let unit = parts[1];

    if (unit === "rad") {
      value *= 180 / Math.PI;
    } else if (unit === "grad") {
      value *= 360 / 400;
    } else if (unit === "turn") {
      value *= 360;
    }

    return {
      type: "angle",
      angle: value * Math.PI / 180
    };
  } else {
    // Otherwise, it's a color stop. Color stops may or may not have a position.
    // Positions may be in px or %. Colors are a list of 3 or 4 numbers between
    // parens, and are either rgb or rgba.
    let color = part.match(COLOR_REGEX)[0];
    let rgbPrefix = color.split(",").length === 3 ? "rgb" : "rgba";
    let position = part.substring(color.length).trim();

    return {
      type: "stop",
      position,
      color: rgbPrefix + color
    };
  }

  return part;
}

function getGradientLine(angle, gradientBoxBounds) {
  let gradientLineLength = Math.abs(gradientBoxBounds.width * Math.sin(angle)) +
                           Math.abs(gradientBoxBounds.height * Math.cos(angle));
  let center = {
    x: gradientBoxBounds.x + gradientBoxBounds.width/2,
    y: gradientBoxBounds.y + gradientBoxBounds.height/2
  };

  let yDiff = Math.sin(angle-Math.PI/2) * gradientLineLength/2;
  let xDiff = Math.cos(angle-Math.PI/2) * gradientLineLength/2;

  return {
    length: gradientLineLength,
    center: center,
    start: {
      x: center.x - xDiff,
      y: center.y - yDiff
    },
    end: {
      x: center.x + xDiff,
      y: center.y + yDiff
    }
  };
}

function resolvePosition(positionString, gradientLine) {
  positionString = positionString + "";
  let isPx = positionString.endsWith("px");
  let value = parseFloat(positionString);

  if (isNaN(value)) {
    return undefined;
  } else {
    return isPx ? value * 100 / gradientLine.length : value;
  }
}

function parseGradient(parsedBackgroundImage, gradientBoxBounds) {
  // The computed-style gives us some facility to parse the gradient, but not
  // much. Color stops that don't have a defined position still don't have a
  // position in the computed-style. Angle keywords aren't replaced with degrees.
  // Position units can be mixed (% and px). So we need to parse the angle and
  // stops ourselves.
  let gradient = parsedBackgroundImage.value;

  // TODO: use the tokens in parsedBackgroundImage to only care about the actual
  // value between ( and ), and then add a new tokenizer function that will
  // tokenize this value correctly (right now, it's failing with transparent)

  let index = gradient.indexOf("linear-gradient");
  if (index === -1) {
    return;
  }

  // Removing the linear-gradient( part. Remaining is the angle and color stops.
  gradient = gradient.substring(index + 16);

  // Computed colors are always rgb or rgba, and positions, if present, are
  // found after colors, so splitting by this will give us a nice array with
  // the angle first (if present) and stops.
  let parts = [];
  while (true) {
    let rgbIndex = gradient.indexOf("rgb(");
    let rgbaIndex = gradient.indexOf("rgba(");
    let transparentIndex = gradient.indexOf("transparent");
    if (rgbIndex === -1 && rgbaIndex === -1 && transparentIndex === -1) {
      parts.push(parseGradientPart(gradient, gradientBoxBounds));
      break;
    }

    let index = Math.min.apply(null,
      [rgbIndex, rgbaIndex, transparentIndex].filter(i => i >= 0));
    let colorLength = rgbIndex === index ? 3 : rgbaIndex === index ? 4 : 11;

    let part = gradient.substring(0, index);
    if (part.trim()) {
      parts.push(parseGradientPart(gradient.substring(0, index), gradientBoxBounds));
    }
    gradient = gradient.substring(index + (rgbIndex === index ? 3 : 4));
  }

  // An angle is not mandatory. If missing, defaults ot "to bottom".
  let angle = ANGLE_KEYWORDS["to bottom"]();
  if (parts[0].type === "angle") {
    angle = parts[0].angle;
    parts.splice(0, 1);
  }

  // Get the gradient line data.
  let gradientLine = getGradientLine(angle, gradientBoxBounds);

  // Post-process the color stops to calculate the missing positions.
  // When a position is missing, it's typically between the previous and next.
  // But there are edge cases.

  // Massage the color stop positions so they're all defined.
  let positions = parts.map(({position}) => resolvePosition(position, gradientLine));
  normalizeStops(positions);

  let stops = [];
  for (let i = 0; i < positions.length; i++) {
    stops.push({
      color: parts[i].color,
      position: positions[i]
    });
  }

  return {angle, stops, gradientLine};
}

/**
 * Parses the value of a background-image CSS property.
 * Note that this only works with computed properties! Do not attempt to use with
 * authored styles as it doesn't handle malformed syntax at all (may fail
 * unexpectedly or create an infinite loop).
 * @param {String} backgroundImage The computed background-image value.
 * @return {Array} An array of background image objects: {type, value, tokens}
 */
function parseBackgroundImage(backgroundImage) {
  let images = [];
  let tokens = tokenizeBackgroundImage(backgroundImage);
  for (let i = 0; i < tokens.length; i += 5) {
    images.push({
      type: tokens[i].value,
      value: tokens[i].value + tokens[i+1].value + tokens[i+2].value + tokens[i+3].value,
      tokens: tokens.slice(i, i+4)
    });
  }
  return images;
}

/**
 * Tokenizes the value of a background-image CSS property.
 * Note that this only works with computed properties! Do not attempt to use with
 * authored styles as it doesn't handle malformed syntax at all (may fail
 * unexpectedly or create an infinite loop).
 * @param {String} backgroundImage The computed background-image value.
 * @return {Array} An array of tokens: {type, value, startIndex, endIndex}
 */
function tokenizeBackgroundImage(backgroundImage) {
  // TODO: USE CSSLEXER INSTEAD
  // TODO: DEAL WITH MULTIPLE BACKGROUND IMAGES

  // A CSS <image> may be a <uri>, a <gradient>, or a part of the page, defined by
  // the element() function.
  // "linear-gradient(50deg, rgba(0, 0, 0, 0.6), transparent), repeating-linear-gradient(to right, transparent 0px, transparent 100px, rgb(0, 0, 0) 100px, rgb(0, 0, 0) 200px, transparent 200px), -moz-element(#angle-range), url("https://dl.dropboxusercontent.com/u/714210/grid.png")"

  let imageTypes = [
    "repeating-linear-gradient", "linear-gradient",
    "repeating-radial-gradient", "radial-gradient",
    "url", "-moz-element"
  ];

  // Expect one of the image types at startIndex, return the type and endIndex.
  let eatType = startIndex => {
    for (let type of imageTypes) {
      if (backgroundImage.substring(startIndex).startsWith(type)) {
        return {
          endIndex: startIndex + type.length,
          value: type
        };
      }
    }
  };

  // Expect an <image> value at startIndex, looks for the next ) character.
  let eatValue = startIndex => {
    let nbOpen = 0;
    let i = startIndex;
    while (true) {
      if (backgroundImage[i] === "(") {
        nbOpen ++;
      } else if (backgroundImage[i] === ")") {
        nbOpen --;
        if (nbOpen === -1) {
          return {
            endIndex: i,
            value: backgroundImage.substring(startIndex, i)
          }
        }
      }
      i ++;
    }
  };

  let tokens = [];
  let lastToken = null;
  let i = 0;

  while (i < backgroundImage.length) {
    let char = backgroundImage[i];

    if (!lastToken) {
      // Progress to end of function name.
      let {endIndex, value} = eatType(i);
      tokens.push({
        type: "function",
        value,
        startIndex: i,
        endIndex
      });
      i = endIndex;
      lastToken = "function";
    } else if (lastToken === "function" && char === "(") {
      // Just saw a function, eat the (.
      lastToken = "(";
      tokens.push({
        type: "(",
        value: "(",
        startIndex: i,
        endIndex: i+1
      });
      i ++;
    } else if (lastToken === "(") {
      // Just opened a ( after a function, progress to end of value.
      let {endIndex, value} = eatValue(i);
      tokens.push({
        type: "value",
        value,
        startIndex: i,
        endIndex
      });
      i = endIndex;
      lastToken = "value";
    } else if (lastToken === "value" && char === ")") {
      // Just saw a closing ). Eat it.
      lastToken = ")";
      tokens.push({
        type: ")",
        value: ")",
        startIndex: i,
        endIndex: i+1
      });
      i ++;
    } else if (lastToken === ")" && char === ",") {
      // Multiple background separator, go back to start.
      lastToken = null;
      tokens.push({
        type: ",",
        value: ",",
        startIndex: i,
        endIndex: i+1
      });
      i += 2;
    } else {
      i ++;
    }
  }

  return tokens;
}

function previewGradient(element, index) {
  let backgroundImages = getComputedStyle(element).backgroundImage;
  let parsedImages = parseBackgroundImage(backgroundImages);
  let gradient = parsedImages[index];

  let quad = element.getBoxQuads()[0];

  renderGradientLine(quad, parseGradient(gradient, quad.bounds));
}

function isNumber(string) {
  return parseInt(string) + "" === string || string === "-" || string === ".";
}

function isCloseToNumber(string, index) {
  return (string[index - 1] && isNumber(string[index - 1])) ||
    (string[index] && isNumber(string[index]));
}

function getNumberRange(string, index) {
  if (isCloseToNumber(string, index)) {
    let start, end;
    index --;
    while (string[index]) {
      if (isNumber(string[index])) {
        index --;
      } else {
        start = index + 1;
        break;
      }
    }
    index ++;
    while (string[index]) {
      if (isNumber(string[index])) {
        index ++;
      } else {
        end = index;
        break;
      }
    }
    return {start: start, end: end};
  } else {
    return false;
  }
}

function increaseValue(input, isUp, isShift, isCtrl) {
  let selectionStartBefore = input.selectionStart;
  let nbRange = getNumberRange(input.value, selectionStartBefore);
  if (nbRange) {
    let delta = isUp === false ? -1 : 1;
    if (isShift) {
      delta *= 10;
    } else if (isCtrl) {
      delta /= 10;
    }
    let value = parseFloat(input.value.substring(nbRange.start, nbRange.end));
    value += delta;
    value = Math.round(value * 10) / 10;
    input.value = input.value.slice(0, nbRange.start) + value + input.value.slice(nbRange.end);
    setTimeout(function () {
      input.setSelectionRange(nbRange.start, nbRange.start);
    }, 0);
  }
}

input.addEventListener("keydown", e => {
  if (e.keyCode !== 38 && e.keyCode !== 40) {
    return;
  }

  increaseValue(input, e.keyCode === 38, e.shiftKey, e.ctrlKey);
  e.preventDefault();

  testElement.style.backgroundImage = input.value;
  previewGradient(testElement, 0);
});

input.addEventListener("keyup", e => {
  let value = input.value;
  testElement.style.backgroundImage = value;
  previewGradient(testElement, 0);
});

addEventListener("resize", e => {
  previewGradient(testElement, 0);
});

previewGradient(testElement, 0);
