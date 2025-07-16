const canvas = document.getElementById("canvas-frame");
const ctx = canvas.getContext("2d");

const sizeInput = document.getElementById("size");
const difficultyInput = document.getElementById("difficult");
const maxScoreElem = document.getElementById("maxScore");
const gameMenu = document.getElementById("game-menu");
const restartButton = document.getElementById("start");

const allowedSizes = [5, 10, 20, 25, 40, 50];
const baseSpeed = 120;
const minSpeed = 30;
let gridSize = 5;
let speedFactor = 5;

// Game state
let snake = [];
let food = {};
let bombs = [];
let dx = 1, dy = 0;
let oldDx = 0, oldDy = 0;
let score = 0;
let gameOver = false;
let paused = false;

// Utility
function updateTextInput(input) {
    const output = document.getElementById(`${input.name}Output`);

    let value = parseInt(input.value);

    if (input.name === "size") {
        const closest = allowedSizes.reduce((prev, curr) =>
            Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        );

        if (value !== closest) {
            input.value = closest;
            value = closest;
        }
    }

    if (output) output.value = value;
}

function spawnFood() {
    return {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize))
    };
}

function spawnBombs(count = 1) {
    const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
    occupied.add(`${food.x},${food.y}`);

    const newBombs = [];

    while (newBombs.length < count) {
        const x = Math.floor(Math.random() * (canvas.width / gridSize));
        const y = Math.floor(Math.random() * (canvas.height / gridSize));
        const key = `${x},${y}`;

        if (!occupied.has(key)) {
            newBombs.push({ x, y });
            occupied.add(key);
        }
    }

    bombs = bombs.concat(newBombs);
}

// Drawing
function drawRect(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
}

function drawSnake() {
    snake.forEach(segment => drawRect(segment.x, segment.y, "#27ae60"));
}

function drawFood() {
    drawRect(food.x, food.y, "#e67e22");
}

function drawBombs() {
    for (let bomb of bombs) {
        drawRect(bomb.x, bomb.y, "#e74c3c")
    }
}

function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = "20px Roboto";
    ctx.fillText(`Score: ${score}`, 10, 30);
}

// Movement & Game Logic
function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        food = spawnFood();
    } else {
        snake.pop();
    }

    const collisionType = isCollision(head);
    if (collisionType) {
        if (score > parseInt(maxScoreElem.innerText)) {
            maxScoreElem.innerText = score;
        }

        // TODO
        // const headColor = {
        //     wall: "#95a5a6",
        //     self: "#c0392b",
        //     bomb: "#f1c40f",
        // }

        // drawRect(snake[0].x + dx, snake[0].y + dy, headColor[collisionType])
        // console.log(snake[0].x + dx, snake[0].y + dy)

        gameOver = true;

        const message = {
            wall: "You hit the wall!",
            self: "You ran into yourself!",
            bomb: "BOOM! You hit a bomb!"
        };

        alert("Game Over: " + (message[collisionType] || "Unknown Reason"));
        gameMenu.style.display = "block";
    }
}

function isCollision(head) {
    if (
        head.x < 0 ||
        head.x >= canvas.width / gridSize ||
        head.y < 0 ||
        head.y >= canvas.height / gridSize
    ) return "wall";

    if (snake.slice(1).some(seg => seg.x === head.x && seg.y === head.y)) return "self";

    if (bombs.some(b => b.x === head.x && b.y === head.y)) return "bomb";

    return false;
}

// Controls
document.addEventListener("keydown", e => {
    if (paused && e.key !== "Escape") return;

    switch (e.key) {
        case "ArrowUp":
            if (dy === 0) [dx, dy] = [0, -1];
            break;
        case "ArrowDown":
            if (dy === 0) [dx, dy] = [0, 1];
            break;
        case "ArrowLeft":
            if (dx === 0) [dx, dy] = [-1, 0];
            break;
        case "ArrowRight":
            if (dx === 0) [dx, dy] = [1, 0];
            break;
        case "Escape":
            togglePause();
            break;
    }
});

function togglePause() {
    paused = !paused;
    if (paused) {
        oldDx = dx;
        oldDy = dy;
        dx = dy = 0;
        gameMenu.style.display = "block";
    } else {
        dx = oldDx;
        dy = oldDy;
        oldDx = oldDy = 0;
        gameMenu.style.display = "none";
        gameLoop(); // resume game loop immediately
    }
}

// Game Loop
function gameLoop() {
    if (gameOver || paused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    moveSnake();
    drawSnake();
    if (difficult.value > 10) {
        // Increase bomb spawn chance with difficulty
        const bombChance = Math.min(0.1, difficult.value / 5000);

        if (Math.random() < bombChance) {
            spawnBombs(1);
        }
        drawBombs();
    }
    drawFood();
    drawScore();

    const delay = Math.max(minSpeed, baseSpeed - score * speedFactor);
    setTimeout(gameLoop, delay);
}

// Restart Logic
restartButton.addEventListener("click", () => {
    gridSize = parseInt(sizeInput.value) || 5;
    speedFactor = 1 + (parseFloat(difficultyInput.value) / 10) || 1.5;

    snake = [{ x: 10, y: 10 }];
    food = spawnFood();
    bombs = []
    dx = 1;
    dy = 0;
    oldDx = oldDy = 0;
    score = 0;
    gameOver = false;
    paused = false;

    gameMenu.style.display = "none";
    gameLoop();
});
