with (p5) {
    let DEBUG = false;

    let SIZE = 900;
    let HEX_RADIUS = 4;
    let HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
    let HEX_HEIGHT = 2 * HEX_RADIUS;

    let HEX_ROW_HEIGHT = 3 * HEX_HEIGHT / 4;
    let HEX_NUM_X;
    let HEX_NUM_Y;

    let MAX_DEPTH = 60;

    let POINTS = new Set();

    let currentSeed;

    let seedTextField = "";

    function setup() {
        createCanvas(SIZE - SIZE % HEX_WIDTH, SIZE - SIZE % HEX_ROW_HEIGHT);

        HEX_NUM_X = width / HEX_WIDTH + 1;
        HEX_NUM_Y = height / HEX_ROW_HEIGHT + 1;

        let seed = parseInt(getURLParameter("seed"));

        console.log(seed);
        if (!isNaN(seed)) {
            currentSeed = seed;
        } else {
            currentSeed = Math.floor(random(0, 99999999));
        }



        frameRate(0);
        draw();
    }

    function keyPressed() {
        if (key === 'a' || keyCode === LEFT_ARROW || keyCode === DOWN_ARROW) {
            currentSeed -= 1;
            draw();
        } else if (key === 'd' || keyCode === RIGHT_ARROW || keyCode === UP_ARROW) {
            currentSeed += 1;
            draw();
        } else if (key >= '0' && key <= '9') {
            seedTextField = seedTextField + str(key);
            drawText();
        } else if (keyCode === ENTER) {
            if (seedTextField.length === 0) {
                return;
            }

            currentSeed = parseInt(seedTextField);
            console.log("push");
            seedTextField = "";
            draw();
        } else if (keyCode === BACKSPACE) {
            seedTextField = seedTextField.slice(0, -1);
            drawText();
        }
    }

    function getURLParameter(name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
    }

    function generate() {
        POINTS = generatePattern(new Point3D(0, 0, 0), MAX_DEPTH, currentSeed);
    }

    function draw() {
        history.pushState(null, "", "index.html?seed=" + currentSeed);
        generate();

        background(50);
        fill(10);
        noStroke();

        for (let y = 0; y < HEX_NUM_Y; y++) {
            let yPrime = (3 * HEX_HEIGHT / 4) * y;

            for (let x = 0; x < HEX_NUM_X; x++) {
                let xOffset = y % 2 === 0 ? HEX_WIDTH / 2 : 0;
                let xPrime = HEX_WIDTH * x + xOffset;

                let c = color(255);

                let point2D = new Point2D(x, y);
                point2D.translate(Math.round(-HEX_NUM_X / 2), Math.round(-HEX_NUM_Y / 2));

                let point3D = point2D.oddrToCube();

                let drawHex = POINTS.has(point3D.toString());

                //let doColor = point3D.x === 0 || point3D.z === 0 || point3D.y === 0;

                if (drawHex) {
                    //c = color(random(0, 255), random(0, 255), random(0, 255));
                    fill(c);
                    stroke(c);
                    //noStroke();

                    drawHexagon(xPrime, yPrime, HEX_RADIUS);
                }

                if (DEBUG) {
                    fill(255);
                    stroke(0);
                    text(str(point2D.x) + "     " + str(point2D.y), xPrime - 10, yPrime);
                }
            }
        }

        drawText();
    }

    function drawText() {
        noStroke();
        fill(50);
        rect(0, 0, width, 40);

        fill(255, 255, 255, 50);
        text(currentSeed, 10, 10);
        text(seedTextField, 10, 30);
    }

    function generatePattern(start, maxDepth, seed) {
        let result = new Set();

        _generatePattern(start, maxDepth, 0, result, seed, new Point3D(-1, 1, 0));
        result.add(new Point3D(0, 0, 0).toString());

        return result;
    }

    function _generatePattern(previous, i, branchDepth, result, seed, direction) {
        if (i === 0) {
            return;
        }

        let current = previous.clone();
        current.translatePoint(direction);

        //result.push(current);

        let c = current;

        result.add(new Point3D(c.x, c.y, c.z).toString());
        result.add(new Point3D(c.y, c.x, c.z).toString());
        result.add(new Point3D(c.z, c.y, c.x).toString());
        result.add(new Point3D(c.x, c.z, c.y).toString());
        result.add(new Point3D(c.z, c.x, c.y).toString());
        result.add(new Point3D(c.y, c.z, c.x).toString());

        if (current.x === 0 || current.y === 0) {
            return;
        }

        randomSeed(seed);
        let nextSeed = random(0, 1000000);
        let pBranch = Math.floor(random(0, 100));
        let pStraight = Math.floor(random(0, 100));

        let branch = pBranch < (1 / ((branchDepth + 1) / 10));
        let branchAll = pBranch < (1 / ((branchDepth + 1) / 5));
        let straight = pStraight < 95 + i / 2;

        if (branch) {
            _generatePattern(current, i - 1, branchDepth + 1, result, nextSeed, direction.left());
            _generatePattern(current, i - 1, branchDepth + 1, result, nextSeed, direction.right());
        }

        if (branchAll) {
            _generatePattern(current, i - 1, branchDepth + 1, result, nextSeed, direction.left().left());
            _generatePattern(current, i - 1, branchDepth + 1, result, nextSeed, direction.right().right());
        }

        if (straight) {
            _generatePattern(current, i - 1, branchDepth, result, nextSeed, direction);
        }
    }


    function drawHexagon(x, y, radius) {
        let center = new Point2D(x, y);

        beginShape();
        for (let i = 0; i < 6; i++) {
            let point = hexagonCorner(center, radius, i);
            vertex(point.x, point.y);
        }
        endShape(CLOSE);
    }

    function hexagonCorner(center, radius, i) {
        let angleDeg = 60 * i - 30;
        let angleRad = PI / 180 * angleDeg;

        return new Point2D(center.x + radius * cos(angleRad), center.y + radius * sin(angleRad));
    }

    class Point2D {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }

        axialToCube() {
            return new Point3D(this.x, -this.x - this.y, this.y);
        }

        translatePoint(other) {
            this.translate(other.x, other.y);
        }

        translate(x, y) {
            this.x += x;
            this.y += y;
        }

        oddrToCube() {
            let x = this.x - (this.y - (this.y & 1)) / 2;
            let z = this.y;
            let y = -x - z;

            return new Point3D(x, y, z);
        }
    }

    class Point3D {
        constructor(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        cubeToAxial() {
            return new Point2D(this.x, this.z);
        }

        cubeToOddr() {
            let col = this.x + (this.z - (this.z & 1)) / 2;
            let row = this.z;

            return new Point2D(col, row);
        }

        equals(other) {
            return this.constructor === other.constructor && this.x === other.x && this.y === other.y && this.z === other.z;
        }

        translatePoint(other) {
            this.translate(other.x, other.y, other.z);
        }

        translate(x, y, z) {
            this.x += x;
            this.y += y;
            this.z += z;
        }

        left() {
            let result = this.clone();
            result._left();
            return result;
        }

        right() {
            let result = this.clone();
            result._right();
            return result;
        }

        _left() {
            if (this.x === 0) {
                let temp = this.x;
                this.x = this.y;
                this.y = temp;
            } else if (this.y === 0) {
                let temp = this.y;
                this.y = this.z;
                this.z = temp;
            } else if (this.z === 0) {
                let temp = this.z;
                this.z = this.x;
                this.x = temp;
            }
        }

        _right() {
            if (this.x === 0) {
                let temp = this.z;
                this.z = this.x;
                this.x = temp;
            } else if (this.y === 0) {
                let temp = this.x;
                this.x = this.y;
                this.y = temp;
            } else if (this.z === 0) {
                let temp = this.y;
                this.y = this.z;
                this.z = temp;
            }
        }

        clone() {
            return new Point3D(this.x, this.y, this.z);
        }

        toString() {
            return str(this.x) + ", " + str(this.y) + ", " + str(this.z);
        }
    }
}