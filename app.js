// setting tile width and height
tileW = 20;
tileH = 20;

// setting number of tiles in rows and columns
tileRowCount = 25;
tileColumnCount = 25;

// tiles is a matrix of key value pair
var tiles = [];
for (c = 0; c < tileColumnCount; c++) {
    tiles[c] = [];
    for (r = 0; r < tileRowCount; r++) {
        tiles[c][r] = { x: c * (tileW + 3), y: r * (tileH + 3), state: 'e' }; //state is e for empty
    }
}

// setting start tile and end tile
tiles[0][0].state = 's';
tiles[tileColumnCount - 1][tileRowCount - 1].state = 'f';

boundX = 0;
boundY = 0;

var canvas;
var ctx;
var output;

window.onload = function () {
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext("2d");
    output = document.getElementById("outcome");

    // call myDown function when mouse button is down
    canvas.onmousedown = myDown;
    // call myDown function when mouse button is down
    canvas.onmouseup = myUp;

    output.innerHTML = 'Green is start. Red is finish. You can draw your own blocks by clicking on the cells!';

    return setInterval(draw, 10);

};

// fill the tile color according to its state
function rect(x, y, w, h, state) {
    //red red green green blue blue
    if (state == 's') {
        ctx.fillStyle = '#00FF00';
    }
    else if (state == 'f') {
        ctx.fillStyle = '#FF0000';
    }
    else if (state == 'e') {
        ctx.fillStyle = '#CCCCCC';
    }
    else if (state == 'w') {
        ctx.fillStyle = '#003366';
    }
    else if (state == 'x') {
        ctx.fillStyle = '#FF9F19';
    }
    else if (state == 'v') {
        ctx.fillStyle = '#89CFF0';
    }
    else {
        ctx.fillStyle = '#CCCCCC';
    }

    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.closePath();
    ctx.fill();
}

// draw tiles according to their states
function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (c = 0; c < tileColumnCount; c++) {
        for (r = 0; r < tileRowCount; r++) {
            rect(tiles[c][r].x, tiles[c][r].y, tileW, tileH, tiles[c][r].state);
        }
    }

}

// returns heuristic value for a point
function heuristic(x, y) {
    // Chebyshev/Octile distance - best suited for 8-way movement, also consistent
    // return Math.max(Math.abs(x - tileColumnCount - 1), Math.abs(y - tileRowCount - 1));
    // Euclidean distance - not monotone or consistent (h(x) <= d(x,y) + h(y))
    // return Math.sqrt((x - tileColumnCount - 1)**2 + (y - tileRowCount - 1)**2);
    // Manhattan distance - not consistent
    return (Math.abs(x - tileColumnCount - 1) + Math.abs(y - tileRowCount - 1));
}

// this function fetches best node according to f param in O(n) time
function getNode(openlist) {
    if (openlist.length == 0)   {
        console.log('Could not fetch min node from openlist!');
        return;
    }

    var min = 0;
        
    for (var i = 1; i < openlist.length; i++) {
        if (openlist[i][6] < openlist[min][6]) {
            min = i;
        }
        // if there is a tie in f val, compare for h val
        else if (openlist[i][6] == openlist[min][6]) {
            console.log('tie');
            if (openlist[i][5] < openlist[min][5])  {
                min = i;
            }
        }
    }
    
    var node = JSON.parse(JSON.stringify(openlist[min]));
    openlist.splice(min, 1);

    return node;
}

// function for searching a point (x, y) in the closed or open list [O(n)]
function search(x, y, list) {
    for (var i = 0; i < list.length; i++)   {
        if (list[i][0] == x && list[i][1] == y) {
            return i;
        }
    }
    return -1;
}

// function that solves the maze. The maze will be solved by tracking a current location
// All the empty spaces around the location will be stored as places to check
// This function runs when Solve! button is clicked
async function solveMaze() {
    // add start point in the openlist
    // point object convention: [x, y, p_x, p_y, g, h, f]
    openlist = [[0, 0, -1, -1, 0, 0, 0]];
    // initialize closedlist
    closedlist = [];
    var tilesFreeze = JSON.parse(JSON.stringify(tiles));
    var pathFound = false;
    // current node
    var q = 0;  
    // Search the maze until a path from start to finish has been found or there is nowhere left to search. 
    while (openlist.length > 0) {
        // pop the element from the beginnnig of the list 
        // which also has the minimum f parameter in the open list
        q = getNode(openlist);
        
        // if the current node is our destination node, we are finished
        if ((q[0] == tileColumnCount - 1) && (q[1] == tileRowCount - 1)) {
            pathFound = true;
            break;
        }
        // put the current node in the closed list and look at all of its neighbors
        closedlist.push(q);

        // for each neighbour of the current node (9 iterations)
        for (var i = q[0] - 1; i <= q[0] + 1; i++) {
            for (var j = q[1] - 1; j <= q[1] + 1; j++) {
                // skip the current tile itself when scanning
                if (i == q[0] && j == q[1]) {
                    continue;
                }
                // check if the neighbour is valid (if the tile is empty or finish)
                if ((i >= 0 && i < tileColumnCount) && (j >= 0 && j < tileRowCount)) {
                    if (tilesFreeze[i][j].state === 'e' || tilesFreeze[i][j].state === 'f') {

                        // value of g() for current node will be 1 more than its parent 
                        var g = JSON.parse(JSON.stringify(q[4])) + 1;   
                        
                        var addNode = true;
                        // if neighbour is already in the CLOSED list and has a higher g()
                        // value than the new g, then replace its parent with current node
                        var idx = search(i, j, closedlist);
                        if (idx != -1)  {
                            if (g < closedlist[idx][4]) {
                                console.log('Updated in closed');
                                closedlist[k][2] = JSON.parse(JSON.stringify(q[0]));
                                closedlist[k][3] = JSON.parse(JSON.stringify(q[1]));
                                closedlist[k][4] = g;
                            }
                            continue;
                        }
    
                        // if neighbour is already in the OPEN list and has a higher g()
                        // value than the new g, then replace its parent with current node
                        // and recalculate and update its f() value
                        idx = search(i, j, openlist);
                        if (idx != -1) {
                            if (g < openlist[idx][4]) {
                                openlist[idx][2] = JSON.parse(JSON.stringify(q[0]));
                                openlist[idx][3] = JSON.parse(JSON.stringify(q[1]));
                                openlist[idx][4] = g;
                                openlist[idx][6] = g + openlist[idx][5];
                            }
                            continue;
                        }
                        // if neighbour is not already present in open or closed list, 
                        // then add it to the openlist
                        if (idx == -1) {
                            var h = heuristic(i, j);
                            var f = g + h;
                            var successor = [i, j, JSON.parse(JSON.stringify(q[0])), JSON.parse(JSON.stringify(q[1])), g, h, f];
                            openlist.unshift(JSON.parse(JSON.stringify(successor)));
                        }
                    }
                }
            }
        }
    }

    // if path not found, output no solution
    if (!pathFound) {
        output.innerHTML = 'No Solution';
    }
    // else mark the solution path
    else {
        // removing the first point in closed list which is the start point
        closedlist.shift();
        // get the parent of last point into x and y
        var x = closedlist[closedlist.length - 1][0];
        var y = closedlist[closedlist.length - 1][1];
        for (var i = closedlist.length-1; i >= 0; i--)    {
            node = JSON.parse(JSON.stringify(closedlist[i]))
            if (closedlist[i][0] == x && closedlist[i][1] == y) {
                // 1 at last index means this the solution path
                closedlist[i].push(1);
                // fetch its parent
                x = closedlist[i][2];
                y = closedlist[i][3];
            }
            else    {
                // 0 means visited tile
                closedlist[i].push(0);
            }
        }
        
        // set states to tiles for coloring them
        for (var x = 0; x < closedlist.length; x++) {
            if (closedlist[x][7] == 1)  {
                tiles[closedlist[x][0]][closedlist[x][1]].state = 'x';
            }
            else if (closedlist[x][7] == 0)  {
                tiles[closedlist[x][0]][closedlist[x][1]].state = 'v';
            }
            // sleep for 100ms
            await new Promise(r => setTimeout(r, 100));
        }
        // recolor the start and finish point just in case
        tiles[0][0].state = 's';
        tiles[tileColumnCount - 1][tileRowCount - 1].state = 'f';

        output.innerHTML = 'Solved!';
    }
}

// funciton that resets the maze grid to unmarked tiles
function reset() {
    for (c = 0; c < tileColumnCount; c++) {
        tiles[c] = [];
        for (r = 0; r < tileRowCount; r++) {
            tiles[c][r] = { x: c * (tileW + 3), y: r * (tileH + 3), state: 'e' }; //state is e for empty
        }
    }
    tiles[0][0].state = 's';
    tiles[tileColumnCount - 1][tileRowCount - 1].state = 'f';

    output.innerHTML = 'Green is start. Red is finish.';
}

// mark/ unmark when mouse button is down on a tile
function myMove(e) {
    x = e.pageX - canvas.offsetLeft;
    y = e.pageY - canvas.offsetTop;

    for (c = 0; c < tileColumnCount; c++) {
        for (r = 0; r < tileRowCount; r++) {
            if (c * (tileW + 3) < x && x < c * (tileW + 3) + tileW && r * (tileH + 3) < y && y < r * (tileH + 3) + tileH) {
                if (tiles[c][r].state == "e" && (c != boundX || r != boundY)) {
                    tiles[c][r].state = "w";

                    boundX = c;
                    boundY = r;

                }
                else if (tiles[c][r].state == "w" && (c != boundX || r != boundY)) {
                    tiles[c][r].state = "e";

                    boundX = c;
                    boundY = r;

                }
            }
        }
    }
}

// do nothing on mouse button up
function myUp() {
    canvas.onmousemove = null;
}

// function to mark/unmark tiles when mouse button is down
function myDown(e) {

    // funciton to mark/unmark tiles while moving mouse
    canvas.onmousemove = myMove;

    x = e.pageX - canvas.offsetLeft;
    y = e.pageY - canvas.offsetTop;

    for (c = 0; c < tileColumnCount; c++) {
        for (r = 0; r < tileRowCount; r++) {
            if (c * (tileW + 3) < x && x < c * (tileW + 3) + tileW && r * (tileH + 3) < y && y < r * (tileH + 3) + tileH) {
                if (tiles[c][r].state == "e") {
                    tiles[c][r].state = "w";

                    boundX = c;
                    boundY = r;

                }
                else if (tiles[c][r].state == "w") {
                    tiles[c][r].state = "e";

                    boundX = c;
                    boundY = r;

                }
            }
        }
    }
}
// algorithm referred from brilliant.org

    // if (openlist.length == 0)   {
    //     openlist.push(node);
    //     return true;
    // }
    // // else binary search for appropriate position for successor
    // var lo = 0;
    // var hi = openlist.length - 1;

    // while (lo <= hi) {
    //     var mid = Math.floor((lo + hi) / 2);
    //     // if point with same f val found, then insert ahead of
    //     // that point
    //     if (openlist && openlist[mid][6] == node[6]) {
    //         openlist.splice(mid, 0, node);
    //         return true;
    //     }
    //     else if (openlist[mid][6] < node[6]) {
    //         lo = mid + 1;
    //     }
    //     else {
    //         hi = mid - 1;
    //     }
    // }
    // // if no point had equal f val, then insert it into the openlist
    // // at appropriate position 
    // openlist.splice(lo, 0, node);
    // return true;