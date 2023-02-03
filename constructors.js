function Point (x, y) {
	this.X = x;
	this.Y = y;
}

function Path (points) {
	this.Points = points;
	this.Cost = function () {
		return this.Points.length - 1;
	}
	this.Tail = function () {
		return this.Points[this.Points.length - 1];
	}
}