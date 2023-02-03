var c;
var ctx;

var startPoint;
var endPoint;
var paths;
var explored;
var openset;
var finalPath;

var intervalId;
var instant = false;

function getNeighbours (point) {
	var neighbours = [];
	
	var top = new Point(point.X, point.Y - 1);
	var bottom = new Point(point.X, point.Y + 1);
	var left = new Point(point.X - 1,  point.Y);
	var right = new Point(point.X + 1, point.Y);
	
	if (top.Y >= 0) neighbours.push(top);
	if (bottom.Y < mapHeight) neighbours.push(bottom);
	if (left.X >= 0) neighbours.push(left);
	if (right.X < mapWidth) neighbours.push(right);
	
	return neighbours;
}

function isExplored (point) {
	var found = false;
	for (var i = 0; i < explored.length; i++) {
		if (point.X == explored[i].X && point.Y == explored[i].Y) found = true;
	}
	return found; 
}

function inOpenset (point) {
	var found = false;
	for (var i = 0; i < openset.length; i++) {
		if (point.X == openset[i].X && point.Y == openset[i].Y) found = true;
	}
	return found; 
}

function removeFromOpenset (point) {
	var newopenset = [];
	for (var i = 0; i < openset.length; i++) {
		if (!(point.X == openset[i].X && point.Y == openset[i].Y)) newopenset.push(openset[i]);
	}
	openset = newopenset;
}

function clonePath (path) {
	var points = [];
	for (var i = 0; i < path.Points.length; i++) {
		var x = path.Points[i].X;
		var y = path.Points[i].Y;
		points.push(new Point(x, y));
	}
	return new Path(points);
}

function removePath (index) {
	var newpaths = [];
	for (var i = 0; i < paths.length; i++) {
		if (i != index) newpaths.push(paths[i]);
	}
	paths = newpaths;
}

function getDistance (start, end) {
	var distanceX = end.X - start.X;
	var distanceY = end.Y - start.Y;
	return Math.sqrt((distanceX * distanceX)) + Math.sqrt((distanceY * distanceY));
}

function expand () {
	// Choose a path and openset with lowest cost to expand
	var lowestCost = 90001;
	var chosenOpenset = null;
	var chosenPathIndex = null;
	for (var i = 0; i < paths.length; i++) {
		var tailNeighbours = getNeighbours(paths[i].Tail());
		
		// Get openset neighbour with lowest total cost to end point
		var cost = paths[i].Cost();
		for (var j = 0; j < tailNeighbours.length; j++) {
			var distance = getDistance(tailNeighbours[j], endPoint);
			var totalCost = cost + distance;
			if (inOpenset(tailNeighbours[j]) && totalCost <= lowestCost) {
				// With <= instead of < meaning the program will favor the most recent added path 
				lowestCost = totalCost;
				chosenPathIndex = i;
				chosenOpenset = tailNeighbours[j];
			}
		}
	}
	
	// Explore the openset
	if (chosenPathIndex != null) {
		var newPath = clonePath(paths[chosenPathIndex]);
		newPath.Points.push(chosenOpenset);
		paths.push(newPath);
		explored.push(chosenOpenset);
		removeFromOpenset(chosenOpenset);
		if (chosenOpenset.X == endPoint.X && chosenOpenset.Y == endPoint.Y) {
			finalPath = newPath;
			if (intervalId != null) {
				clearInterval(intervalId);
				intervalId = null;
			}
		}
		else {
			var neighbours = getNeighbours(chosenOpenset);
			for (var i = 0; i < neighbours.length; i++) {
				if (!isExplored(neighbours[i]) && !inOpenset(neighbours[i]) && map[neighbours[i].X][neighbours[i].Y] != 1) {
					openset.push(neighbours[i]);
				}
			}
		}
	}
	
	// Remove path no openset neighbour
	var i = 0;
	while (i < paths.length) {
		var tailNeighbours = getNeighbours(paths[i].Tail());
		
		var foundOpensetNeighbour = false;
		for (var j = 0; j < tailNeighbours.length; j++) {
			if (inOpenset(tailNeighbours[j])) {
				foundOpensetNeighbour = true;
			}
		}
		
		if (foundOpensetNeighbour) i++;
		else removePath(i);
	}
}

function draw () {
	c.width = c.width;
	
	// Begin drawing
	ctx.beginPath();
	
	// Draw explored
	for (var i = 0; i < explored.length; i++) {
		var x = canvasPadding + explored[i].X * squareSize;
		var y = canvasPadding + explored[i].Y * squareSize;
		
		ctx.fillStyle = exploredColor;
		ctx.fillRect(x, y, squareSize, squareSize);
	}
	
	// Draw openset
	for (var i = 0; i < openset.length; i++) {
		var x = canvasPadding + openset[i].X * squareSize;
		var y = canvasPadding + openset[i].Y * squareSize;
		
		ctx.fillStyle = opensetColor;
		ctx.fillRect(x, y, squareSize, squareSize);
	}
	
	// Draw final path
	if (finalPath != null) {
		for (var i = 0; i < finalPath.Points.length; i++) {
			var x = canvasPadding + finalPath.Points[i].X * squareSize;
			var y = canvasPadding + finalPath.Points[i].Y * squareSize;
			
			ctx.fillStyle = finalPathColor;
			ctx.fillRect(x, y, squareSize, squareSize);
		}
	}
	
	// Draw map
	for (var i = 0; i < map.length; i++) {
		for (var j = 0; j < map[i].length; j++) {
			var x = canvasPadding + i * squareSize;
			var y = canvasPadding + j * squareSize;
			
			switch (map[i][j]) {
				case 1:
					ctx.fillStyle = wallColor; 
					ctx.fillRect(x, y, squareSize, squareSize);
					break;
				case 2:
					ctx.fillStyle = startColor; 
					ctx.fillRect(x, y, squareSize, squareSize);
					break;
				case 3:
					ctx.fillStyle = endColor; 
					ctx.fillRect(x, y, squareSize, squareSize);
					break;
				default:
					break;
			}
			
			if (drawGrid) ctx.rect(x, y, squareSize, squareSize);
		}
	}
	
	// Draw instant button
	var x = canvasPadding * 2 + mapWidth * squareSize;
	var y = canvasPadding;
	if (isPortrait) {
		var temp = x;
		x = y;
		y = temp;
	}
	
	ctx.font = canvasFont;
	if (instant) {
		ctx.fillStyle = buttonColor;
		ctx.fillRect(x, y, buttonWidth, buttonHeight);
	}
	ctx.rect(x, y, buttonWidth, buttonHeight);
	ctx.fillStyle = fontColor;
	ctx.fillText('Instant', x + buttonPadding, y + buttonPadding + lineHeight);
	
	y += buttonHeight + squareSize;
	ctx.fillStyle = startColor;
	ctx.fillRect(x, y, squareSize, squareSize);
	ctx.fillText('Start square', x + squareSize * 2, y + lineHeight);
	
	y += squareSize * 2;
	ctx.fillStyle = endColor;
	ctx.fillRect(x, y, squareSize, squareSize);
	ctx.fillText('End square (click a square to change)', x + squareSize * 2, y + lineHeight);
	
	y += squareSize * 2;
	ctx.fillStyle = wallColor;
	ctx.fillRect(x, y, squareSize, squareSize);
	ctx.fillText('Wall', x + squareSize * 2, y + lineHeight);
	
	y += squareSize * 2;
	ctx.fillStyle = exploredColor;
	ctx.fillRect(x, y, squareSize, squareSize);
	ctx.fillText('Explored squares', x + squareSize * 2, y + lineHeight);
	
	y += squareSize * 2;
	ctx.fillStyle = opensetColor;
	ctx.fillRect(x, y, squareSize, squareSize);
	ctx.fillText('Unexplored neighbours', x + squareSize * 2, y + lineHeight);
	
	y += squareSize * 2;
	ctx.fillStyle = finalPathColor;
	ctx.fillRect(x, y, squareSize, squareSize);
	ctx.fillText('Found shortest path', x + squareSize * 2, y + lineHeight);
	
	ctx.stroke();
}

function timerTick () {
	if (finalPath == null && paths.length > 0) expand();
	draw();
}

function reset () {
	startPoint = null;
	endPoint = null;
	paths = [];
	explored = [];
	openset = [];
	finalPath = null;
	
	for (var i = 0; i < map.length; i++) {
		for (var j = 0; j < map[i].length; j++) {
			if (map[i][j] == 2) startPoint = new Point(i, j);
			if (map[i][j] == 3) endPoint = new Point(i, j);
		}
	}
	
	// Initiate start point and openset
	paths.push(new Path([startPoint]));
	explored.push(startPoint);
	var neighbours = getNeighbours(startPoint);
	for (var i = 0; i < neighbours.length; i++) {
		if (!isExplored(neighbours[i]) && !inOpenset(neighbours[i]) && map[neighbours[i].X][neighbours[i].Y] != 1) {
			openset.push(neighbours[i]);
		}
	}
	
	if (instant) {
		while (finalPath == null && paths.length > 0) expand();
		draw();
	}
	else intervalId  = setInterval(timerTick, timerInterval);
}

function onMouseClick (e) {
	var eX = e.clientX;
	var eY = e.clientY;
	
	// Instant button
	var instantX = canvasPadding * 2 + mapWidth * squareSize;
	var instantY = canvasPadding;
	if (isPortrait) {
		var temp = instantX;
		instantX = instantY;
		instantY = temp;
	}
	if (eX >= instantX && eX < instantX + buttonWidth && eY >= instantY && eY < instantY + buttonHeight) {
		instant = !instant;
		reset();
	}
	
	// End point
	if (eX >= canvasPadding && eX < canvasPadding + mapWidth * squareSize && eY >= canvasPadding && eY < canvasPadding + mapHeight * squareSize) {
		var indexX = parseInt((eX - canvasPadding) / squareSize);
		var indexY = parseInt((eY - canvasPadding) / squareSize);
		
		if (map[indexX][indexY] == 0) {
			map[endPoint.X][endPoint.Y] = 0;
			map[indexX][indexY] = 3;
			reset();
		}
	}
}

window.onload = function () {
	c = document.getElementById("myCanvas");
	ctx = c.getContext("2d");
	
	c.width = window.innerWidth;
	c.height = window.innerHeight;
	
	document.onclick = onMouseClick;
	
	reset();
}
