// 
// TODO
// mutation and genetic drift
// how to maintain amoeba form - NEXT
// title: primordial??? soup??
// 


/*
opening structure - ooze object contains an array of amoebas, each amoeba is an object. Each amoeba is ooze.addAmoeba()'d to the array.
new amoebas are born through createAmeoba() calling getOffspring() to get genotype.
new amoebas are created through 'n' or mouseClick() using createAmoeba() w/out getOffspring. 
*/


/*
testing -
line 149
change this.lifespan shorter: 
defaults: 
this.lifespan = 2600 + random(1000, 2000);
*/

var longestLength = 0.0;
var amoebaLocations = {};
var displayText = true;
var amoebaText = false;
var fullScr = false;
var timeline = 0;
var toBeKilled = [];
var highlightedAmoeba = "";
var birthTimer = 0;
/** @type {Number} master variable for line height and font size for displaying text information */
var emSize = 12;
var mouse;
var font;

function textSelect(font) {
    textFont(font);
}

function setup() {

    loadFont('Roboto/Roboto-Light.ttf', textSelect);

    angleMode(DEGREES);
    createCanvas(windowWidth, windowHeight);

    // creates the object holding arrays.
    ooze = new Ooze();
    ghostOoze = new GhostOoze();
    jellyMass = new JellyMass();
    dust = new Dust();
    rightTextBox = new TextComposer(windowWidth - 10, 20);

    // creates the initial batch of amoebas - 1/4 of a random
    amountLeftToCreate = parseInt(random(20, 40));
    var amountCreatedThisFrame = parseInt(random(0, amountLeftToCreate / 8));
    for (var i = 0; i < amountCreatedThisFrame; i++) {
        var a = new Amoeba();
        ooze.addAmoeba(a);
    }
    amountLeftToCreate -= amountCreatedThisFrame;
    for (var i = 0; i < Math.random() * 6; i++) {
        var j = new Jelly();
        jellyMass.addJelly(j);
    }
    for (var i = 0; i < (Math.random() * 100) + 500; i++) {
        var m = new Mote();
        dust.addMote(m);
    }
}



function draw() {

    // generic mouse vector update
    mouse = createVector(mouseX, mouseY);

    //creates the time for the sin wave background
    var bgTimeSin = sin(timeline) / 10;
    background(0, 20 + (bgTimeSin * 20), 30 + (bgTimeSin * 30));

    // creates remaining amoebas left over from setup()
    if (amountLeftToCreate > 0 && random(0, 1) > 0.01) {
        var a = new Amoeba();
        ooze.addAmoeba(a);
        amountLeftToCreate--;
    }

    // basic variable increment for time
    timeline += 1;
    birthTimer += 1;

    // run the various objects
    ghostOoze.run();
    ooze.run();
    jellyMass.run();
    dust.run();
    if (displayText == true) {
        informationDisplay();
        rightTextBox.run();
    }
    if (toBeKilled != []) {
        ghostOoze.amoebaDeath();
    }
}

// keeps objects and canvas in place when resized
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    rightTextBox.xBox = windowWidth - 10;
    for (item in rightTextBox.textLines) {
        rightTextBox.textLines[item].x = windowWidth - 10;
    }
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ooze object begin - ooze= collective noun of amoeba - also an array for collecting lots of Amoeba in an array called Amoebas //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Ooze() {
    // for creating ooze objects;
    this.amoebas = [];
}

Ooze.prototype.addAmoeba = function(amoeba) {
    //use to push amoebas on to the array
    this.amoebas.push(amoeba);
}

Ooze.prototype.run = function() {
    if (this.amoebas.length > 1) {
        for (var i = 0; i < this.amoebas.length; i++) {
            this.amoebas[i].update();
            this.amoebas[i].display();
        }
    } else { // if we're running low on amoebas add more. 
        for (i = 0; i < 15; i++) { // adds 15 amoebas into the group immediately - need to stagger them in. 
            var a = new Amoeba();
            ooze.addAmoeba(a);
        }
    }
};

/*add an amoeba to the ooze.
three parameters, name  - or - randomAmoebaName() 
locationVector - optional - 
genotype - optional - string - A2A1 or something*/
function createAmoeba(name, locationVector, genotype) {
    ooze.addAmoeba(new Amoeba(name, locationVector, genotype));
}





////////////////////////////////////
// amoeba prototype objects begin //
////////////////////////////////////


function Amoeba(name, locationVector, genotype) {
    ///////////////////////
    // object parameters //
    ///////////////////////

    /*identifier*/
    this.name = name || randomAmoebaName();
    /*amoebaPosition used for centre position and nucleas position - if no location vector is provided, a random location is generated
     */
    this.aPos = locationVector || createVector(random(0, width), random(0, height));
    /*alleles variables and _original_ values*/
    this.genotype = genotype || (Math.random() > 0.5 ? "A1" : "A2") + (Math.random() > 0.5 ? "A1" : "A2");

    /////////////////////
    //other properties //
    /////////////////////

    // sliced genotype into two alleles
    this.gene1 = this.genotype.slice(0, 2);
    this.gene2 = this.genotype.slice(2);
    /*number of psuedopods, the numberOfPods/360 (an angle).*/
    this.legs = parseInt(random(4, 10));
    this.podAngleLimit = 360 / this.legs;
    /*velocity*/
    this.vel = createVector(0, 0);
    /*initial positions of each pod*/
    this.podPos = [];
    /*generates the first list of names and locations*/
    amoebaLocations[this.name] = this.aPos;
    /*amoeba distances - creates an object with all the amoebas and their distances from THIS amoeba*/
    this.amoebaDistances = {};
    /*nearest amoeba stores name, distance, vector. - used to build relative positions to other amoeba objects. */
    this.minKey = "";
    this.minValue = 0;
    this.nearestAmoebaVector;
    /*variables to hold lifespan of the amoeba, time born in*/
    this.timeBorn = timeline;
    this.lifespan = 100 + random(300, 1000);
    /*scaling factor for the dying amoebas*/
    this.scaleFactor = 1.1;
    /*creates various sized amoebas weighted towards smaller ones (gives the impression of space)*/
    this.amoebaSize = randomCase();

    /*color alpha is a function of size - i.e. atmos perspective*/
    this.amoebaAlphaColor = map(this.amoebaSize, 2, 7, 10, 80);
    this.nucleusAlphaColor = 5 * this.amoebaSize;
    this.amoebaColor = [random(110, 170), random(200, 240), random(210, 255), this.amoebaAlphaColor];
    this.nucleusAndAmoebaStroke = [random(40, 170), random(20, 255), random(30, 255), this.nucleusAlphaColor];




    //////////////////
    // object birth //
    //////////////////

    //amoeba creation- loop for creating the legs -i.e. double the points for legs
    for (var i = 0; i < 2 * (this.legs); i++) {
        //turn number of legs into the number of angles for points. creates an array of vectors fromAngles (e.g. 7 legs creates 14 nodes, so 360/14*legnumber), then pushes to array. 
        this.podPos.push(p5.Vector.fromAngle(radians((360 / (this.legs * 2)) * i)));

        // adds a slight randomness to try to hide the geometry somewhat
        this.podPos[i].add(random(-.1, .1), random(-.1, .1));

        // for the outer (mult 6 - 10) and inner pods(3 - 6). determines if the [i] is even and scales(Vector.mult) the pod an outer pod, else, inner
        // and use amoebaSize to scale at this point... 

        if (i % 2 == 0) {
            this.podPos[i].mult(random(7, 10) * this.amoebaSize);
        } else {
            this.podPos[i].mult(random(3, 6) * this.amoebaSize);
        };
    }


    // sets the base amoebaColor and adds the genotype tint
    var genoColor = [0, 0, 0, 0];
    if (this.genotype == "A2A2") {
        genoColor = [150, -25, -100, 30];
    } else if (this.genotype == "A1A1") {
        genoColor = [-125, -50, -150, 30];
    }
    this.amoebaColor = this.amoebaColor.map((a, i) => a + genoColor[i]);





    /////////////////////////
    // display and update  //
    /////////////////////////


    this.display = function() {

        var angleToMouse = degrees(p5.Vector.angleBetween(this.vel, mouse.sub(this.vel)));
        ///begin push()
        // pushes a new cartesian grid for each amoeba
        push();
        translate(this.aPos.x, this.aPos.y);

        push(); // push for rotation
        rotate(angleToMouse);

        // if recently born, grow to full size... 
        if (this.age / 60 <= this.amoebaSize) {
            scale(this.scaleFactor - 0.8);
            this.scaleFactor += random(0.001, 0.003);
        }


        // if dying soon shrink... 
        if (this.age >= this.lifespan - 50) {
            scale(this.scaleFactor);
            this.scaleFactor -= 0.02;
        }

        // draws the amoeba shape, nuclei. 
        strokeWeight(this.amoebaSize / 1.5);
        stroke(this.nucleusAndAmoebaStroke);
        beginShape();
        for (elements in this.podPos) {
            //curve for the amoeba
            fill(this.amoebaColor);
            curveVertex(this.podPos[elements].x, this.podPos[elements].y);
        }
        curveVertex(this.podPos[0].x, this.podPos[0].y);
        curveVertex(this.podPos[1].x, this.podPos[1].y);
        endShape(CLOSE);
        //weird little nucleus things. blobs. gene expressons. alleles.  
        stroke(this.nucleusAndAmoebaStroke);
        drawNucleus(this.gene1, this.amoebaSize, 1.5);
        drawNucleus(this.gene2, this.amoebaSize, -1.5);

        pop(); // pop() for rotation


        // nearest neighbour line
        fill(255, 255, 255);
        var lengthOfLine = Math.sqrt(Math.pow(Math.abs(this.vel.x), 2) + Math.pow(Math.abs(this.vel.y), 2)).toFixed(1);
        stroke(150 + (lengthOfLine * this.amoebaSize), 15 * this.amoebaSize);
        strokeWeight(this.amoebaSize / 5);
        line(0, 0, this.nearestAmoebaVector.x, this.nearestAmoebaVector.y);


        // displays amoeba text if toggled
        if (amoebaText == true) {
            this.amoebaDisplay();
        }

        // displays amoeba around mouse x,y - within 50 pixels
        if (this.aPos.dist(mouse) <= 50) {
            this.amoebaDisplay();
            highlightedAmoeba = this.name;
        }

        pop();
        /////////////end push() translation


        // updates longest line
        longestLineReporting(lengthOfLine);

    }

    this.update = function() {

        // age the amoeba
        this.age = (timeline - this.timeBorn);
        // check to see if the amoeba has expired i.e. this.age > this.lifespan
        if (this.age >= this.lifespan) {
            toBeKilled.push(this.name);
        }


        // creates the acceleration and velocity parts of the movement

        this.acc = p5.Vector.sub(mouse, this.aPos);
        this.acc.setMag(0.004 * this.amoebaSize);
        this.vel.add(this.acc);
        this.aPos.add(this.vel);



        // moves the pod...
        for (var i = 0; i < (this.podPos.length); i++) {
            var newVector = createVector(random(-0.1 * this.amoebaSize, 0.1 * this.amoebaSize), random(-0.1 * this.amoebaSize, 0.1 * this.amoebaSize));
            newVector = this.podPos[i].add(newVector);
            var vectorCheck = newVector.heading();
            if ((this.podAngleLimit * (i + 1)) < vectorCheck < (this.podAngleLimit * i) && i % 2 == 0 && (newVector > newVector.dist(this.aPos))) {
                this.podPos[i] = newVector;
            }
        };




        // updates the locations...
        amoebaLocations[this.name] = this.aPos;
        // assigns the distances of this amoeba from the others
        for (aLoc in amoebaLocations) {
            if (this.name != aLoc)
                this.amoebaDistances[aLoc] = this.aPos.dist(amoebaLocations[aLoc]);
        }
        // resets the variables that hold most-proximite (name and value)
        this.minKey = "";
        this.minValue = 0;
        // finds the nearest neighamoeba. neighmoeba. neighbormoeba.
        for (var x in this.amoebaDistances) {
            if (this.amoebaDistances.hasOwnProperty(x) && amoebaLocations.hasOwnProperty(x)) {
                if (!this.minKey || this.amoebaDistances[x] < this.minValue) {
                    this.minValue = this.amoebaDistances[x];
                    this.minKey = x;
                }
            }
        }
        // stores the vector of the nearest neighbour (minus the translate). 
        this.nearestAmoebaVector = createVector(amoebaLocations[this.minKey].x - this.aPos.x, amoebaLocations[this.minKey].y - this.aPos.y);




        //////////////////
        // reproduction //
        //////////////////


        //// put some test in to make sure that the amoebas don't reproduce in the same place - creates vicious circle. 
        if (this.aPos.dist(this.nearestAmoebaVector) <= 100 && birthTimer > 100) {
            birthTimer = 0; // resets birthTimer to delay crazy repeat reproduction;
            this.otherGenotype = findByAmoebaName(this.minKey)[0].genotype;
            this.newGenotype = get_offspring(this.genotype, this.otherGenotype); // generates a new genotype
            //this.name.split(" ")[1] takes the last name of the parent and passes it as a parameter to randomAmoebaName for creating a child that has the parent's last name
            createAmoeba(randomAmoebaName(this.name.split(" ")[1]), this.aPos.sub(this.nearestAmoebaVector).sub(random(20, 50), random(20, 50)), this.newGenotype);

            // creates the fading text box
            rightTextBox.addLine(new FadeText("In " + timeline + ", birth of " + ooze.amoebas[ooze.amoebas.length - 1].name + " (" + ooze.amoebas[ooze.amoebas.length - 1].genotype + ") at " + parseInt(this.aPos.x) + ", " + parseInt(this.aPos.y) + "! Parents are: " + this.name + " (" + this.genotype + ") and " + this.minKey + " (" + this.otherGenotype + ").", 130, [240, 230, 100]));
        }

        // alphaFader takes the amoebaAlphaColor and takes away the opacity by age - older more faded
        this.alphaFader = function(alphaValue, color) {
            color[3] = alphaValue - ((alphaValue / this.lifespan) * this.age);
        }
        this.alphaFader(this.nucleusAlphaColor, this.nucleusAndAmoebaStroke);
        this.alphaFader(this.amoebaAlphaColor, this.amoebaColor);

        // check if about to die soon and make white...
        if (this.age >= this.lifespan - 30) {
            this.amoebaColor = [215, 235, 255, 40];
        }
        // background flash - nasty. 
        // if (this.age >= this.lifespan - 2) {
        //     background(25, 45, 85);
        // }
    }

    /**
     * shows text that pertains to this.amoeba, directly below the amoeba.
     * @return {[type]} [description]
     */
    /*text name and genes, closest neighbour, genotype etc,*/
    this.amoebaDisplay = function() {
        noStroke();
        textAlign(RIGHT);
        textFont("Helvetica");
        fill(158, this.amoebaSize * 10 + 40);
        textSize(6 + (this.amoebaSize * 1.5));
        text("Name: " + this.name, -30, 30 + (this.amoebaSize * 2));
        fill(108, this.amoebaSize * 10 + 30);
        text("Genotype: " + this.genotype, -30, 40 + (this.amoebaSize * 2));
        text("Closest: " + this.minKey + " (" + this.minValue.toFixed(1) + ")", -30, 50 + (this.amoebaSize * 2));
        text("Age: " + this.age.toFixed(0), -30, 60 + (this.amoebaSize * 2));
    }
};




///////////////////////////
// information and input //
///////////////////////////

function longestLineReporting(lineLength) {
    /*passes lineLenngth to report on the longest line. */
    if (lineLength >= longestLength) {
        longestLength = lineLength;
    }
}

/**
 * displays information on the left side of the screen, that pertains to all of the amoebas, states of the program, etc
 * @return {[type]} [description]
 */
function informationDisplay() {
    textAlign(LEFT);
    fill(0, 250, 120);
    textSize(10);
    noStroke();
    text("Longest Length: " + longestLength, 20, 20);
    // number of amoebas
    fill(0, 233, 0);
    textSize(10);
    text("Number of amoebas: " + ooze.amoebas.length, 20, 40);
    text("Display Amoeba Info: " + amoebaText, 20, 60);
    text("Absolute Time: " + timeline.toFixed(0), 20, 80);
    text("Last Birth: " + "" + birthTimer, 20, 100);
    text("Number of Ghost Amoebas: " + ghostOoze.ghostAmoebas.length, 20, 120);
    for (amoeba in ooze.amoebas) {
        if (highlightedAmoeba == ooze.amoebas[amoeba].name) {
            fill(180, 150);
        } else {
            fill(128, 100);
        }
        text(ooze.amoebas[amoeba].name + " (" + ooze.amoebas[amoeba].genotype + ")" + " is at " + ooze.amoebas[amoeba].aPos.x.toFixed(0) + ", " + ooze.amoebas[amoeba].aPos.y.toFixed(0), 20, 140 + (amoeba * 20));
    }
    //resets highlight
    highlightedAmoeba = "";

    fill(225, 205);
    if (fullScr) {
        var bottomText = "Mouse click to create a new amoeba. Press 'T' to show/hide amoeba information, 't' to show general info. Amoebas also reproduce on contact, combining genes (shown in the nuclei), and die over time. press RETURN to leave fullscreen. ";
    } else {
        var bottomText = "Press 'n', or, mouse click to create a new amoeba. Press 'T' to show/hide amoeba information, 't' to show general info. Amoebas also reproduce on contact, combining genes (shown in the nuclei), and die over time. press RETURN to go fullscreen. ";
    }

    textAlign(CENTER);
    text(bottomText, windowWidth / 2, windowHeight - 10);
}



function keyTyped() {
    /*turn on/off info text*/
    if (key === "t") {
        displayText = !displayText;
    }
    if (key === "T") {
        amoebaText = !amoebaText;
    }
    if (key === "n") {
        createAmoeba(randomAmoebaName());
        rightTextBox.addLine(new FadeText("In " + timeline + ", " + ooze.amoebas[ooze.amoebas.length - 1].name + " was created at " + parseInt(ooze.amoebas[ooze.amoebas.length - 1].aPos.x) + ", " + parseInt(ooze.amoebas[ooze.amoebas.length - 1].aPos.y) + ".", 70, [158, 120, 90]));
    }
    if (key == '+' && emSize <= 20) {
        emSize++;
    }
    if (key == '_' && emSize >= 8) {
        emSize--;
    }
}


function keyPressed() {
    if (keyCode === RETURN) {
        fullScr = !fullScr;
        var fs = fullscreen();
        fullscreen(!fs);
    }
}

function mouseClicked() {
    createAmoeba(randomAmoebaName(), mouse);
    rightTextBox.addLine(new FadeText("In " + timeline + ", " + ooze.amoebas[ooze.amoebas.length - 1].name + " was created at " + parseInt(mouseX) + ", " + parseInt(mouseY) + ".", 70, [108, 130, 110]));
    return false;
}



//////////////
// genetics //
//////////////



// genetic drift and inheritance
var p = 0.5;
var max_mating_distance = 1;
var a1a1 = 0;
var a1a2 = 0;
var a2a2 = 0;

/**
 * creates the genotype of the offspring from two parent amoeabas
 * @param  {string} parent1 genotype string of parent
 * @param  {string} parent2 genotype string of other parent
 * @return {string}         child genotype
 */
function get_offspring(parent1, parent2) {
    var p1 = parent1;
    var p2 = parent2;
    if (p1 == "A1A1" && p2 == "A1A1") {
        return "A1A1";
    } else if ((p1 == "A1A1" && p2 == "A1A2") || (p1 == "A1A2" && p2 == "A1A1")) {
        if (Math.random() < 0.5) {
            return "A1A1";
        } else {
            return "A1A2";
        }
    } else if ((p1 == "A1A1" && p2 == "A2A2") || (p1 == "A2A2" && p2 == "A1A1")) {
        return "A1A2";
    } else if (p1 == "A1A2" && p2 == "A1A2") {
        var random_number = Math.random();
        if (random_number < 0.25) {
            return "A1A1";
        } else if (random_number > 0.75) {
            return "A2A2";
        } else {
            return "A1A2";
        }
    } else if ((p1 == "A2A2" && p2 == "A1A2") || (p1 == "A1A2" && p2 == "A2A2")) {
        if (Math.random() < 0.5) {
            return "A1A2";
        } else {
            return "A2A2";
        }
    } else if (p1 == "A2A2" && p2 == "A2A2") {
        return "A2A2";
    }
}



///////////////////////////
// general use functions //
///////////////////////////


/**
 * creates a random name for each amoeba and splices that name out of the pool of possible names in the array.
 * if no name is passed as a parameter, function will choose two random names (first + last), 
 * if there's a name in the parameter that is used for the last name i.e. first + parent last name
 * @return {string} composed of two names 
 */
function randomAmoebaName(parentLastName) {
    var amoebaLastName = ['Abbott', 'Acevedo', 'Acosta', 'Adams', 'Adkins', 'Aguilar', 'Aguirre', 'Albert', 'Alexander', 'Alford', 'Allen', 'Allison', 'Alston', 'Alvarado', 'Alvarez', 'Anderson', 'Andrews', 'Anthony', 'Armstrong', 'Arnold', 'Ashley', 'Atkins', 'Atkinson', 'Austin', 'Avery', 'Avila', 'Ayala', 'Ayers', 'Bailey', 'Baird', 'Baker', 'Baldwin', 'Ball', 'Ballard', 'Banks', 'Barber', 'Barker', 'Barlow', 'Barnes', 'Barnett', 'Barr', 'Barrera', 'Barrett', 'Barron', 'Barry', 'Bartlett', 'Barton', 'Bass', 'Bates', 'Battle', 'Bauer', 'Baxter', 'Beach', 'Bean', 'Beard', 'Beasley', 'Beck', 'Becker', 'Bell', 'Bender', 'Benjamin', 'Bennett', 'Benson', 'Bentley', 'Benton', 'Berg', 'Berger', 'Bernard', 'Berry', 'Best', 'Bird', 'Bishop', 'Black', 'Blackburn', 'Blackwell', 'Blair', 'Blake', 'Blanchard', 'Blankenship', 'Blevins', 'Bolton', 'Bond', 'Bonner', 'Booker', 'Boone', 'Booth', 'Bowen', 'Bowers', 'Bowman', 'Boyd', 'Boyer', 'Boyle', 'Bradford', 'Bradley', 'Bradshaw', 'Brady', 'Branch', 'Bray', 'Brennan', 'Brewer', 'Bridges', 'Briggs', 'Bright', 'Britt', 'Brock', 'Brooks', 'Brown', 'Browning', 'Bruce', 'Bryan', 'Bryant', 'Buchanan', 'Buck', 'Buckley', 'Buckner', 'Bullock', 'Burch', 'Burgess', 'Burke', 'Burks', 'Burnett', 'Burns', 'Burris', 'Burt', 'Burton', 'Bush', 'Butler', 'Byers', 'Byrd', 'Cabrera', 'Cain', 'Calderon', 'Caldwell', 'Calhoun', 'Callahan', 'Camacho', 'Cameron', 'Campbell', 'Campos', 'Cannon', 'Cantrell', 'Cantu', 'Cardenas', 'Carey', 'Carlson', 'Carney', 'Carpenter', 'Carr', 'Carrillo', 'Carroll', 'Carson', 'Carter', 'Carver', 'Case', 'Casey', 'Cash', 'Castaneda', 'Castillo', 'Castro', 'Cervantes', 'Chambers', 'Chan', 'Chandler', 'Chaney', 'Chang', 'Chapman', 'Charles', 'Chase', 'Chavez', 'Chen', 'Cherry', 'Christensen', 'Christian', 'Church', 'Clark', 'Clarke', 'Clay', 'Clayton', 'Clements', 'Clemons', 'Cleveland', 'Cline', 'Cobb', 'Cochran', 'Coffey', 'Cohen', 'Cole', 'Coleman', 'Collier', 'Collins', 'Colon', 'Combs', 'Compton', 'Conley', 'Conner', 'Conrad', 'Contreras', 'Conway', 'Cook', 'Cooke', 'Cooley', 'Cooper', 'Copeland', 'Cortez', 'Cote', 'Cotton', 'Cox', 'Craft', 'Craig', 'Crane', 'Crawford', 'Crosby', 'Cross', 'Cruz', 'Cummings', 'Cunningham', 'Curry', 'Curtis', 'Dale', 'Dalton', 'Daniel', 'Daniels', 'Daugherty', 'Davenport', 'David', 'Davidson', 'Davis', 'Dawson', 'Day', 'Dean', 'Decker', 'Dejesus', 'Delacruz', 'Delaney', 'Deleon', 'Delgado', 'Dennis', 'Diaz', 'Dickerson', 'Dickson', 'Dillard', 'Dillon', 'Dixon', 'Dodson', 'Dominguez', 'Donaldson', 'Donovan', 'Dorsey', 'Dotson', 'Douglas', 'Downs', 'Doyle', 'Drake', 'Dudley', 'Duffy', 'Duke', 'Duncan', 'Dunlap', 'Dunn', 'Duran', 'Durham', 'Dyer', 'Eaton', 'Edwards', 'Elliott', 'Ellis', 'Ellison', 'Emerson', 'England', 'English', 'Erickson', 'Espinoza', 'Estes', 'Estrada', 'Evans', 'Everett', 'Ewing', 'Farley', 'Farmer', 'Farrell', 'Faulkner', 'Ferguson', 'Fernandez', 'Ferrell', 'Fields', 'Figueroa', 'Finch', 'Finley', 'Fischer', 'Fisher', 'Fitzgerald', 'Fitzpatrick', 'Fleming', 'Fletcher', 'Flores', 'Flowers', 'Floyd', 'Flynn', 'Foley', 'Forbes', 'Ford', 'Foreman', 'Foster', 'Fowler', 'Fox', 'Francis', 'Franco', 'Frank', 'Franklin', 'Franks', 'Frazier', 'Frederick', 'Freeman', 'French', 'Frost', 'Fry', 'Frye', 'Fuentes', 'Fuller', 'Fulton', 'Gaines', 'Gallagher', 'Gallegos', 'Galloway', 'Gamble', 'Garcia', 'Gardner', 'Garner', 'Garrett', 'Garrison', 'Garza', 'Gates', 'Gay', 'Gentry', 'George', 'Gibbs', 'Gibson', 'Gilbert', 'Giles', 'Gill', 'Gillespie', 'Gilliam', 'Gilmore', 'Glass', 'Glenn', 'Glover', 'Goff', 'Golden', 'Gomez', 'Gonzales', 'Gonzalez', 'Good', 'Goodman', 'Goodwin', 'Gordon', 'Gould', 'Graham', 'Grant', 'Graves', 'Gray', 'Green', 'Greene', 'Greer', 'Gregory', 'Griffin', 'Griffith', 'Grimes', 'Gross', 'Guerra', 'Guerrero', 'Guthrie', 'Gutierrez', 'Guy', 'Guzman', 'Hahn', 'Hale', 'Haley', 'Hall', 'Hamilton', 'Hammond', 'Hampton', 'Hancock', 'Haney', 'Hansen', 'Hanson', 'Hardin', 'Harding', 'Hardy', 'Harmon', 'Harper', 'Harrell', 'Harrington', 'Harris', 'Harrison', 'Hart', 'Hartman', 'Harvey', 'Hatfield', 'Hawkins', 'Hayden', 'Hayes', 'Haynes', 'Hays', 'Head', 'Heath', 'Hebert', 'Henderson', 'Hendricks', 'Hendrix', 'Henry', 'Hensley', 'Henson', 'Herman', 'Hernandez', 'Herrera', 'Herring', 'Hess', 'Hester', 'Hewitt', 'Hickman', 'Hicks', 'Higgins', 'Hill', 'Hines', 'Hinton', 'Hobbs', 'Hodge', 'Hodges', 'Hoffman', 'Hogan', 'Holcomb', 'Holden', 'Holder', 'Holland', 'Holloway', 'Holman', 'Holmes', 'Holt', 'Hood', 'Hooper', 'Hoover', 'Hopkins', 'Hopper', 'Horn', 'Horne', 'Horton', 'House', 'Houston', 'Howard', 'Howe', 'Howell', 'Hubbard', 'Huber', 'Hudson', 'Huff', 'Huffman', 'Hughes', 'Hull', 'Humphrey', 'Hunt', 'Hunter', 'Hurley', 'Hurst', 'Hutchinson', 'Hyde', 'Ingram', 'Irwin', 'Jackson', 'Jacobs', 'Jacobson', 'James', 'Jarvis', 'Jefferson', 'Jenkins', 'Jennings', 'Jensen', 'Jimenez', 'Johns', 'Johnson', 'Johnston', 'Jones', 'Jordan', 'Joseph', 'Joyce', 'Joyner', 'Juarez', 'Justice', 'Kane', 'Kaufman', 'Keith', 'Keller', 'Kelley', 'Kelly', 'Kemp', 'Kennedy', 'Kent', 'Kerr', 'Key', 'Kidd', 'Kim', 'King', 'Kinney', 'Kirby', 'Kirk', 'Kirkland', 'Klein', 'Kline', 'Knapp', 'Knight', 'Knowles', 'Knox', 'Koch', 'Kramer', 'Lamb', 'Lambert', 'Lancaster', 'Landry', 'Lane', 'Lang', 'Langley', 'Lara', 'Larsen', 'Larson', 'Lawrence', 'Lawson', 'Le', 'Leach', 'Leblanc', 'Lee', 'Leon', 'Leonard', 'Lester', 'Levine', 'Levy', 'Lewis', 'Lindsay', 'Lindsey', 'Little', 'Livingston', 'Lloyd', 'Logan', 'Long', 'Lopez', 'Lott', 'Love', 'Lowe', 'Lowery', 'Lucas', 'Luna', 'Lynch', 'Lynn', 'Lyons', 'Macdonald', 'Macias', 'Mack', 'Madden', 'Maddox', 'Maldonado', 'Malone', 'Mann', 'Manning', 'Marks', 'Marquez', 'Marsh', 'Marshall', 'Martin', 'Martinez', 'Mason', 'Massey', 'Mathews', 'Mathis', 'Matthews', 'Maxwell', 'May', 'Mayer', 'Maynard', 'Mayo', 'Mays', 'Mcbride', 'Mccall', 'Mccarthy', 'Mccarty', 'Mcclain', 'Mcclure', 'Mcconnell', 'Mccormick', 'Mccoy', 'Mccray', 'Mccullough', 'Mcdaniel', 'Mcdonald', 'Mcdowell', 'Mcfadden', 'Mcfarland', 'Mcgee', 'Mcgowan', 'Mcguire', 'Mcintosh', 'Mcintyre', 'Mckay', 'Mckee', 'Mckenzie', 'Mckinney', 'Mcknight', 'Mclaughlin', 'Mclean', 'Mcleod', 'Mcmahon', 'Mcmillan', 'Mcneil', 'Mcpherson', 'Meadows', 'Medina', 'Mejia', 'Melendez', 'Melton', 'Mendez', 'Mendoza', 'Mercado', 'Mercer', 'Merrill', 'Merritt', 'Meyer', 'Meyers', 'Michael', 'Middleton', 'Miles', 'Miller', 'Mills', 'Miranda', 'Mitchell', 'Molina', 'Monroe', 'Montgomery', 'Montoya', 'Moody', 'Moon', 'Mooney', 'Moore', 'Morales', 'Moran', 'Moreno', 'Morgan', 'Morin', 'Morris', 'Morrison', 'Morrow', 'Morse', 'Morton', 'Moses', 'Mosley', 'Moss', 'Mueller', 'Mullen', 'Mullins', 'Munoz', 'Murphy', 'Murray', 'Myers', 'Nash', 'Navarro', 'Neal', 'Nelson', 'Newman', 'Newton', 'Nguyen', 'Nichols', 'Nicholson', 'Nielsen', 'Nieves', 'Nixon', 'Noble', 'Noel', 'Nolan', 'Norman', 'Norris', 'Norton', 'Nunez', 'Obrien', 'Ochoa', 'Oconnor', 'Odom', 'Odonnell', 'Oliver', 'Olsen', 'Olson', 'Oneal', 'Oneil', 'Oneill', 'Orr', 'Ortega', 'Ortiz', 'Osborn', 'Osborne', 'Owen', 'Owens', 'Pace', 'Pacheco', 'Padilla', 'Page', 'Palmer', 'Park', 'Parker', 'Parks', 'Parrish', 'Parsons', 'Pate', 'Patel', 'Patrick', 'Patterson', 'Patton', 'Paul', 'Payne', 'Pearson', 'Peck', 'Pena', 'Pennington', 'Perez', 'Perkins', 'Perry', 'Peters', 'Petersen', 'Peterson', 'Petty', 'Phelps', 'Phillips', 'Pickett', 'Pierce', 'Pittman', 'Pitts', 'Pollard', 'Poole', 'Pope', 'Porter', 'Potter', 'Potts', 'Powell', 'Powers', 'Pratt', 'Preston', 'Price', 'Prince', 'Pruitt', 'Puckett', 'Pugh', 'Quinn', 'Ramirez', 'Ramos', 'Ramsey', 'Randall', 'Randolph', 'Rasmussen', 'Ratliff', 'Ray', 'Raymond', 'Reed', 'Reese', 'Reeves', 'Reid', 'Reilly', 'Reyes', 'Reynolds', 'Rhodes', 'Rice', 'Rich', 'Richard', 'Richards', 'Richardson', 'Richmond', 'Riddle', 'Riggs', 'Riley', 'Rios', 'Rivas', 'Rivera', 'Rivers', 'Roach', 'Robbins', 'Roberson', 'Roberts', 'Robertson', 'Robinson', 'Robles', 'Rocha', 'Rodgers', 'Rodriguez', 'Rodriquez', 'Rogers', 'Rojas', 'Rollins', 'Roman', 'Romero', 'Rosa', 'Rosales', 'Rosario', 'Rose', 'Ross', 'Roth', 'Rowe', 'Rowland', 'Roy', 'Ruiz', 'Rush', 'Russell', 'Russo', 'Rutledge', 'Ryan', 'Salas', 'Salazar', 'Salinas', 'Sampson', 'Sanchez', 'Sanders', 'Sandoval', 'Sanford', 'Santana', 'Santiago', 'Santos', 'Sargent', 'Saunders', 'Savage', 'Sawyer', 'Schmidt', 'Schneider', 'Schroeder', 'Schultz', 'Schwartz', 'Scott', 'Sears', 'Sellers', 'Serrano', 'Sexton', 'Shaffer', 'Shannon', 'Sharp', 'Sharpe', 'Shaw', 'Shelton', 'Shepard', 'Shepherd', 'Sheppard', 'Sherman', 'Shields', 'Short', 'Silva', 'Simmons', 'Simon', 'Simpson', 'Sims', 'Singleton', 'Skinner', 'Slater', 'Sloan', 'Small', 'Smith', 'Snider', 'Snow', 'Snyder', 'Solis', 'Solomon', 'Sosa', 'Soto', 'Sparks', 'Spears', 'Spence', 'Spencer', 'Stafford', 'Stanley', 'Stanton', 'Stark', 'Steele', 'Stein', 'Stephens', 'Stephenson', 'Stevens', 'Stevenson', 'Stewart', 'Stokes', 'Stone', 'Stout', 'Strickland', 'Strong', 'Stuart', 'Suarez', 'Sullivan', 'Summers', 'Sutton', 'Swanson', 'Sweeney', 'Sweet', 'Sykes', 'Talley', 'Tanner', 'Tate', 'Taylor', 'Terrell', 'Terry', 'Thomas', 'Thompson', 'Thornton', 'Tillman', 'Todd', 'Torres', 'Townsend', 'Tran', 'Travis', 'Trevino', 'Trujillo', 'Tucker', 'Turner', 'Tyler', 'Tyson', 'Underwood', 'Valdez', 'Valencia', 'Valentine', 'Valenzuela', 'Vance', 'Vang', 'Vargas', 'Vasquez', 'Vaughan', 'Vaughn', 'Vazquez', 'Vega', 'Velasquez', 'Velazquez', 'Velez', 'Villarreal', 'Vincent', 'Vinson', 'Wade', 'Wagner', 'Walker', 'Wall', 'Wallace', 'Waller', 'Walls', 'Walsh', 'Walter', 'Walters', 'Walton', 'Ward', 'Ware', 'Warner', 'Warren', 'Washington', 'Waters', 'Watkins', 'Watson', 'Watts', 'Weaver', 'Webb', 'Weber', 'Webster', 'Weeks', 'Weiss', 'Welch', 'Wells', 'West', 'Wheeler', 'Whitaker', 'White', 'Whitehead', 'Whitfield', 'Whitley', 'Whitney', 'Wiggins', 'Wilcox', 'Wilder', 'Wiley', 'Wilkerson', 'Wilkins', 'Wilkinson', 'William', 'Williams', 'Williamson', 'Willis', 'Wilson', 'Winters', 'Wise', 'Witt', 'Wolf', 'Wolfe', 'Wong', 'Wood', 'Woodard', 'Woods', 'Woodward', 'Wooten', 'Workman', 'Wright', 'Wyatt', 'Wynn', 'Yang', 'Yates', 'York', 'Young', 'Zamora', 'Zimmerman'];
    var amoebaFirstName = ['Allison', 'Arthur', 'Ana', 'Alex', 'Arlene', 'Alberto', 'Barry', 'Bertha', 'Bill', 'Bonnie', 'Bret', 'Beryl', 'Chantal', 'Cristobal', 'Claudette', 'Charley', 'Cindy', 'Chris', 'Dean', 'Dolly', 'Danny', 'Danielle', 'Dennis', 'Debby', 'Erin', 'Edouard', 'Erika', 'Earl', 'Emily', 'Ernesto', 'Felix', 'Fay', 'Fabian', 'Frances', 'Franklin', 'Florence', 'Gabielle', 'Gustav', 'Grace', 'Gaston', 'Gert', 'Gordon', 'Humberto', 'Hanna', 'Henri', 'Hermine', 'Harvey', 'Helene', 'Iris', 'Isidore', 'Isabel', 'Ivan', 'Irene', 'Isaac', 'Jerry', 'Josephine', 'Juan', 'Jeanne', 'Jose', 'Joyce', 'Karen', 'Kyle', 'Kate', 'Karl', 'Katrina', 'Kirk', 'Lorenzo', 'Lili', 'Larry', 'Lisa', 'Lee', 'Leslie', 'Michelle', 'Marco', 'Mindy', 'Maria', 'Michael', 'Noel', 'Nana', 'Nicholas', 'Nicole', 'Nate', 'Nadine', 'Olga', 'Omar', 'Odette', 'Otto', 'Ophelia', 'Oscar', 'Pablo', 'Paloma', 'Peter', 'Paula', 'Philippe', 'Patty', 'Rebekah', 'Rene', 'Rose', 'Richard', 'Rita', 'Rafael', 'Sebastien', 'Sally', 'Sam', 'Shary', 'Stan', 'Sandy', 'Tanya', 'Teddy', 'Teresa', 'Tomas', 'Tammy', 'Tony', 'Van', 'Vicky', 'Victor', 'Virginie', 'Vince', 'Valerie', 'Wendy', 'Wilfred', 'Wanda', 'Walter', 'Wilma', 'William', 'Kumiko', 'Aki', 'Miharu', 'Chiaki', 'Michiyo', 'Itoe', 'Nanaho', 'Reina', 'Emi', 'Yumi', 'Ayumi', 'Kaori', 'Sayuri', 'Rie', 'Miyuki', 'Hitomi', 'Naoko', 'Miwa', 'Etsuko', 'Akane', 'Kazuko', 'Miyako', 'Youko', 'Sachiko', 'Mieko', 'Toshie', 'Junko'];
    return amoebaFirstName.splice(parseInt(Math.random() * amoebaFirstName.length - 1), 1) + " " + (parentLastName || amoebaLastName.splice(parseInt(Math.random() * amoebaLastName.length - 1), 1));
}

/**
 * [takes a name as a string, finds the corresponding object, and passes it back, then returns it]
 * @param  {string} amoebaName takes a name as a string and uses .filter(callback) to find the corresponding full object
 * @return {object}            returns the amoeba object
 */
function findByAmoebaName(amoebaName) {
    return result = ooze.amoebas.filter(function(obj) {
        return obj.name == amoebaName;
    });
}

/*
function for handling nucleus color 
note this works only to ADD the NEW allele color, not remove the old allele color.
*/
function nucleusGeneTint(gene, amoebaSize) {
    if (gene == "A2") {
        return [200, 0, 0, 10 * amoebaSize + 50];
    } else {
        return [0, 200, 0, 10 * amoebaSize + 50]
    }
}


/**
 * draws the nucleus for the amoebas or dead amoebas
        needs a gene (A1A2, A1A1), etc
        needs amoeba size... - where does that come from with dead amoebas
        needs a relative location – relative to aPos, or dead amoeba position.
 * @param  {string} gene             A1 or A2, determines color of nucleus
 * @param  {number} amoebaSize       basic multiplier for a lot of amoeba elements, size, opacity, speed
 * @param  {number} relativeLocation distance from this.aPos
 */
function drawNucleus(gene, amoebaSize, relativeLocation) {
    fill(nucleusGeneTint(gene, amoebaSize));
    ellipse(relativeLocation * amoebaSize, random(.51) * amoebaSize, random(1, 1.5) * amoebaSize + 2, random(1, 1.5) * amoebaSize + 2);
}

/**
 * creates a biased random number - used for create amoeba sizes and dust/bubbles
 * @return {[Number(value: any)]} [a number from the list below]
 */
randomCase = function() {
    var n = parseInt(random(0, 11));
    switch (n) {
        case 1:
            return 1.4;
            break;
        case 2:
            return 1.6;
            break;
        case 3:
            return 2;
            break;
        case 4:
        case 5:
            return 3;
            break;
        case 6:
            return 3.5;
            break;
        case 7:
            return 4;
            break;
        case 8:
            return 4.5;
            break;
        case 9:
            return 5;
            break;
        default:
            return 3.7;
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GHOST Ooze object begin - ooze= collective noun of amoeba - also an array for collecting lots of deadAmoeba in an array called deadAmoebas also general death functions //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * creates an object containing an array, the elements of the array of the ghostamoeba objects
 */
function GhostOoze() {
    this.ghostAmoebas = [];
}

/**
 * a method for adding amoebas to the right array
 * @param {object} ghostAmoeba adds a ghostamoeba to the ghostooze.ghostamoebas array
 */
GhostOoze.prototype.addGhostAmoeba = function(ghostAmoeba) {
    this.ghostAmoebas.push(ghostAmoeba);
}

/////////////////////////
// Creates GhostAmoeba //
/////////////////////////

function createGhostAmoeba(liveAmoebaObject) {
    /*
    duplicates the liveAmoebaObject in the ghostAmoebas array with filter() 
    - note callback passes a one object array [object], hence the [0] at the end of the callback to return just an object.
    updates the methods of the object.
    */

    var ghostAmoeba = ooze.amoebas.filter(function(obj) {
        return obj.name === liveAmoebaObject;
    })[0];

    ghostAmoeba.posthumousCounter = 0;


    // overwrite the amoeba.display() with ghostAmoeba.display functionality 

    ghostAmoeba.display = function() {
        var angleToMouse = degrees(p5.Vector.angleBetween(this.vel, mouse.sub(this.vel)));

        // begin push()
        // pushes a new cartesian grid for each amoeba
        push();
        translate(this.aPos.x, this.aPos.y);

        if (this.posthumousCounter < 1000) {
            fill(150 - this.posthumousCounter / 2, 255 - this.posthumousCounter * 2);
            if (displayText) {
                textAlign(CENTER);
                text(this.name + " R.I.P.", -10, 20);
            }
        }

        //weird little nucleus things. blobs. gene expressons. alleles.  
        stroke(this.nucleusAndAmoebaStroke);
        drawNucleus(this.gene1, this.amoebaSize, 0);

        // displays amoeba text if toggled
        if (amoebaText == true) {
            this.amoebaDisplay();
        }

        pop();
        //end push() translation

    }

    ghostAmoeba.amoebaDisplay = function() {
        /* 
        not a good solution - 
        just empties the amoebaDisplay function from displaying the information of the liveamoeba
        */
    }

    ghostAmoeba.update = function() {
        // creates the acceleration and velocity parts of the movement
        this.acc = p5.Vector.sub(mouse, this.aPos);
        this.acc.setMag(0.004 * this.amoebaSize);
        this.vel.add(this.acc);
        this.aPos.add(this.vel);

        // moves the pod...
        for (var i = 0; i < (this.podPos.length); i++) {
            var newVector = createVector(random(-0.1 * this.amoebaSize, 0.1 * this.amoebaSize), random(-0.1 * this.amoebaSize, 0.1 * this.amoebaSize));
            newVector = this.podPos[i].add(newVector);
            var vectorCheck = newVector.heading();
            if ((this.podAngleLimit * (i + 1)) < vectorCheck < (this.podAngleLimit * i) && i % 2 == 0 && (newVector > newVector.dist(this.aPos))) {
                this.podPos[i] = newVector;
            }
        };

        this.posthumousCounter++;
    }

    // returns the amoeba object amended methods with  as a ghostAmoeba
    return ghostAmoeba;
}

GhostOoze.prototype.run = function() {
    if (this.ghostAmoebas != []) {
        for (var i = 0; i < this.ghostAmoebas.length; i++) {
            this.ghostAmoebas[i].update(); // this?
            this.ghostAmoebas[i].display(); // this structure?
        }
    }
};

GhostOoze.prototype.amoebaDeath = function() {
    /*
    cycles through the toBeKilled array and finds and kills off amoebas in the ooze.amoebas array
    then creates them in the ghostAmoeba array. then deletes/splices the killed amoeba out of the toBeKilled array.
    */
    for (aName in toBeKilled) {
        for (var i = 0; i < ooze.amoebas.length; i++) {
            if (ooze.amoebas[i].name == toBeKilled[aName]) {

                // ---- create a ghostAmoeba object - and push it on the arrays... 

                this.ghostAmoebas.push(createGhostAmoeba(ooze.amoebas[i].name));
                // removes 'location' from nearest array - prevents other live amoebas from detecting for the nearest line or reproduction
                delete amoebaLocations[ooze.amoebas[i].name];
                // delete amoeba from array 'a'
                ooze.amoebas.splice(i, 1);
            }
        }
        rightTextBox.addLine(new FadeText("In " + timeline + ", " + toBeKilled[0] + " died.", 50, [200, 120, 50]));
        toBeKilled.splice(aName, 1);
    }
}



///////////////////
// Jelly Objects //
///////////////////


function JellyMass() {
    // for creating Jelly objects;
    this.jellies = [];
}

JellyMass.prototype.addJelly = function(jelly) {
    //use to push amoebas on to the array
    this.jellies.push(jelly);
}

JellyMass.prototype.run = function() {
    for (var i = 0; i < this.jellies.length; i++) {
        this.jellies[i].update();
        this.jellies[i].display();
    }
};

function createJelly(locationVector) {
    /*add a jelly to the Mass*/
    jellyMass.addJelly(new Jelly(locationVector));
}


function Jelly(locationVector, size) {
    this.size = size || Math.random();
    this.locationVector = locationVector || createVector(random(0, width), random(0, height));
    /*velocity*/
    this.vel = createVector(0, 0);
    this.size = randomCase() / 2;

    this.update = function() {
        // creates the acceleration and velocity parts of the movement
        this.acc = p5.Vector.sub(mouse, this.locationVector);
        this.acc.setMag(this.size / 100);
        this.vel.add(this.acc);
        this.locationVector.add(this.vel);
    }

    this.display = function() {
        for (var i = 0; i < 10; i++) {
            push();
            translate(this.locationVector.x, this.locationVector.y);
            rotate(spinner()); //endless rotation through closure function.  
            scale((this.size + this.sineWave()) / 30);
            rotate(180 * i / 5); //
            this.objectWithGlow(ellipse, 50 + mouseY / 12, 60 + mouseX / 10, 20, 10, [150, 50, 200 + i * 3, this.size * 150]);
            for (var j = 0; j < 6; j++) {
                push();
                rotate(180 / 3.3 * j);
                this.objectWithGlow(ellipse, 53 + (j * 18) + mouseY / 2, 201 + (j * 27.2) + mouseX / 20, 5 + j / 3, 5 + j / 3, [50, 150 / j, 230, this.size * 150]);
                pop();
            }
            pop();
        }
    }

    var spinner = (function() {
        var spinAngle = 0;
        var direction;
        var speed = Math.random() / 5;
        Math.random() < 0.5 ? direction = -1 : direction = 1;
        return function() {
            return spinAngle += (speed * direction);
        }
    })();

    this.sineWave = (function() {
        var sineVariable = (Math.random() * 2);
        return function() {
            sineVariable += 0.1;
            return sin(sineVariable);
        }
    })();

    this.objectWithGlow = function(shape, x, y, width, height, shapeColor) {
        var ellipseStroke = 200;
        for (var i = 0; i < 3; i++) {
            fill(shapeColor[0] + 10, shapeColor[1] - i * 5, shapeColor[2] + i * 5, i / (2 - this.size / 2));
            shape(x, y, width + i * 305, height + i * 302);
        }
        fill(shapeColor);
        shape(x, y, width, height);
    };

}








//////////
// dust //
//////////

function Dust() {
    // for creating dust objects;
    this.motes = [];
}

Dust.prototype.addMote = function(mote) {
    //use to push amoebas on to the array
    this.motes.push(mote);
}

Dust.prototype.run = function() {
    for (i = 0; i < dust.motes.length - 1; i++) {
        this.motes[i].display();
    }
};

function Mote() {
    this.pos = createVector(random(-1000, width + 1000), random(-1000, height + 1000));
    this.size = randomCase();
    this.vel = createVector(0, 0);
    this.dustAlpha = Math.random() * 255;

    this.display = function() {
        this.acc = p5.Vector.sub(mouse, this.pos);
        this.acc.setMag(0.0001 * (this.size * 3));
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        fill(240, 230, 220, this.dustAlpha);
        ellipse(this.pos.x, this.pos.y, 0.5 * this.size, 0.5 * this.size);
    };
}






/////////////////////////
///temp display update //
/////////////////////////


/** @type {Number} master variable for line height and font size for displaying text information */
var emSize = 10;

/**
 * object to hold an array of texts and the xy upper left coordinates
 * @param {number} xBox holds x coordinate
 * @param {number} yBox holds y coordinate
 */
function TextComposer(xBox, yBox) {
    this.textLines = [];
    this.xBox = 0 || xBox;
    this.yBox = 0 || yBox;
}
/**
 * takes a line of text (with other params as objects) and inserts into the array. 
 * assigns the x and y coordinates of the line based on the index position of the line in the array
 * @param {object} textObject takes a FadeText object
 */
TextComposer.prototype.addLine = function(textObject) {
    //use to push textobjects onto the array
    this.textLines.push(textObject);
    this.textLines[this.textLines.length - 1].x = this.xBox;
    this.textLines[this.textLines.length - 1].y = this.yBox + ((this.textLines.length - 1) * (emSize * 2));
}

/**
 * run() runs through the array updating info and positions
 * deletes objects from the array as they fade
 * @return {[type]} [description]
 */
TextComposer.prototype.run = function() {

    var newLines = [];
    var newLines = this.textLines.filter(line => {
        if (line.lifeSpan > -80) {
            return line;
        }
    })


    // for (var i = 0; i < newLines.length; i++) {
    //     if (newLines[i].y >= this.yBox + (i * (emSize * 2))) {
    //         newLines[i].y = newLines[i].y - 2;
    //     }
    //     newLines[i].display();
    // }

    // this, below, can replace the code above. Doesn't quite work yet. overlays text. 
    newLines.map(line => {
        if (line.y >= this.yBox + newLines.length * (emSize * 2)) {
            line.y = line.y - 2;
        }
        line.display();
    })

    this.textLines = newLines;
}


/**
 * FadeText is the class that makes fadeText objects. 
 * decides if to start fading the text objects or not 
 * @param {string} textString a string of text to be displayed
 * @param {number} lifeSpan   lifeSpan (in draw() cycles) of the object
 * @param {array} colorArray colorarray 
 */
function FadeText(textString, lifeSpan, colorArray) {
    this.textString = textString;
    this.x = 0;
    this.y = 0;
    this.lifeSpan = lifeSpan;
    this.colorArray = colorArray;

    fill(colorArray);
    /**
     * creates a decrementer that returns an integar to fade the fill value of text over time 
     * @param  {number} time) {               TimerLength [decrementer]
     * @return {Number(value: between 255 and 1)}       [description]
     */
    this.fadeTimer = (function(time) {
        var timerLength = 255;
        return function() {
            return [this.colorArray[0], this.colorArray[1], this.colorArray[2], timerLength -= 5];
        }
    })();

    this.display = function() {
        textSize(emSize);
        this.lifeSpan--;
        textAlign(RIGHT);
        if (this.lifeSpan <= 0) {
            this.fade();
        } else {
            fill(this.colorArray); // hmm... not great... renews the color so that the draw cycle doesn't conflate two objects. i.e. another fading object's fill can still be set when a non-fading object is drawn at this line. 
            text(this.textString, this.x, this.y);
        }
    }

    this.fade = function() {
        fill(this.fadeTimer());
        text(this.textString, this.x, this.y);
    }
}
