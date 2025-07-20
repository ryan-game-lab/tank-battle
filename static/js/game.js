// Game state
let canvas;
let ctx;
let player;
let enemies = [];
let enemySpawnTimer = 0;
let score = 0;
let gameOver = false;
let keysPressed = {};
let isRunning = false;
let difficulty = 'medium'; // Default difficulty
let gameStarted = false;
let terrain = []; // Array of terrain objects (obstacles)
let explosions = []; // Array to hold explosion effects
let mousePos = [0, 0]; // Current mouse position for turret aiming
let isMobile = false; // Flag for mobile device
let mobileControls = { x: 0, y: 0 }; // Mobile joystick state

// Difficulty settings
const difficultySettings = {
    easy: {
        enemySpawnRate: 180,  // 3 seconds
        maxEnemies: 3,
        playerHealth: 150,
        playerSpeed: 3,
        obstacles: 5
    },
    medium: {
        enemySpawnRate: 120,  // 2 seconds
        maxEnemies: 5,
        playerHealth: 100,
        playerSpeed: 2.5,
        obstacles: 10
    },
    hard: {
        enemySpawnRate: 60,   // 1 second
        maxEnemies: 8,
        playerHealth: 80,
        playerSpeed: 2,
        obstacles: 15
    }
};

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Set canvas to full window size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Setup event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    document.getElementById('try-again').addEventListener('click', resetGame);
    document.getElementById('change-level').addEventListener('click', showLevelSelection);

    // Mobile controls event listeners
    document.addEventListener('mobilemove', handleMobileMove);
    document.addEventListener('mobilefire', handleMobileFire);

    // Check if device is mobile
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Level selection buttons
    document.getElementById('easy-btn').addEventListener('click', () => startGame('easy'));
    document.getElementById('medium-btn').addEventListener('click', () => startGame('medium'));
    document.getElementById('hard-btn').addEventListener('click', () => startGame('hard'));

    // Show level selection screen initially
    showLevelSelection();

    // Start game loop
    isRunning = true;
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function showLevelSelection() {
    gameStarted = false;
    gameOver = false;
    document.getElementById('level-selection').classList.remove('hidden');
    document.getElementById('game-over').classList.add('hidden');
}

function startGame(selectedDifficulty) {
    difficulty = selectedDifficulty;
    document.getElementById('level-selection').classList.add('hidden');
    resetGame();
    gameStarted = true;
}

function createTerrain() {
    const settings = difficultySettings[difficulty];
    terrain = [];

    // Create border perimeter (stone walls)
    const borderWidth = 40;
    const wallSegments = [
        // Top wall
        { x: 0, y: 0, width: canvas.width, height: borderWidth, color: '#555555', type: 'wall' },
        // Bottom wall
        { x: 0, y: canvas.height - borderWidth, width: canvas.width, height: borderWidth, color: '#555555', type: 'wall' },
        // Left wall
        { x: 0, y: borderWidth, width: borderWidth, height: canvas.height - borderWidth*2, color: '#555555', type: 'wall' },
        // Right wall
        { x: canvas.width - borderWidth, y: borderWidth, width: borderWidth, height: canvas.height - borderWidth*2, color: '#555555', type: 'wall' }
    ];
    terrain.push(...wallSegments);

    // Create obstacles
    for (let i = 0; i < settings.obstacles; i++) {
        // Random position (keep away from center and edges)
        const padding = 100;
        const centerAvoidance = 150;
        let x, y;

        // Avoid spawning obstacles in the center area where player starts
        do {
            x = Math.random() * (canvas.width - padding*2) + padding;
            y = Math.random() * (canvas.height - padding*2) + padding;
        } while (
            Math.abs(x - canvas.width/2) < centerAvoidance &&
            Math.abs(y - canvas.height/2) < centerAvoidance
        );

        // Random size
        const width = Math.random() * 60 + 40;
        const height = Math.random() * 60 + 40;

        // Random type and color
        const type = Math.random() > 0.6 ? 'rock' : 'bush';
        let color;

        if (type === 'rock') {
            // Shades of gray for rocks
            const colorVal = Math.floor(Math.random() * 30) + 50;
            color = `rgb(${colorVal}, ${colorVal}, ${colorVal})`;
        } else {
            // Green for bushes
            const greenVal = Math.floor(Math.random() * 50) + 50;
            color = `rgb(30, ${greenVal}, 30)`;
        }

        terrain.push({
            x, y, width, height, color, type
        });
    }
}

function resetGame() {
    // Get current difficulty settings
    const settings = difficultySettings[difficulty];

    // Create player with difficulty-specific settings
    player = new Player('Player1');
    player.health = settings.playerHealth;
    player.speed = settings.playerSpeed;

    // Reset game state
    enemies = [];
    explosions = [];
    enemySpawnTimer = 0;
    score = 0;
    gameOver = false;

    // Create terrain/obstacles
    createTerrain();

    // Reset UI
    document.getElementById('score').textContent = 'Score: 0';
    document.getElementById('game-over').classList.add('hidden');

    if (!isRunning) {
        isRunning = true;
        requestAnimationFrame(gameLoop);
    }
}

function handleKeyDown(e) {
    keysPressed[e.key] = true;
}

function handleKeyUp(e) {
    keysPressed[e.key] = false;
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mousePos = [
        e.clientX - rect.left,
        e.clientY - rect.top
    ];
}

function handleClick(e) {
    if (!gameOver && gameStarted) {
        const rect = canvas.getBoundingClientRect();
        const clickPos = [
            e.clientX - rect.left,
            e.clientY - rect.top
        ];
        player.shoot(clickPos);
    }
}

// Handle mobile joystick movement
function handleMobileMove(e) {
    mobileControls.x = e.detail.x;
    mobileControls.y = e.detail.y;

    // On mobile, update the mouse position to be in front of the player
    // This helps aim the turret in the direction of movement
    if (player && isMobile) {
        const distance = 100; // Distance in front of player
        mousePos = [
            player.position[0] + mobileControls.x * distance,
            player.position[1] + mobileControls.y * distance
        ];
    }
}

// Handle mobile fire button
function handleMobileFire() {
    if (!gameOver && gameStarted && player) {
        player.shoot(mousePos);
    }
}

function spawnEnemy() {
    const settings = difficultySettings[difficulty];
    if (enemies.length < settings.maxEnemies) {
        // Spawn at edges of the screen
        let x, y;
        const padding = 80; // Keep away from the very edge

        if (Math.random() > 0.5) {
            // Spawn at left or right edge
            x = Math.random() > 0.5 ? padding : canvas.width - padding;
            y = padding + Math.random() * (canvas.height - padding*2);
        } else {
            // Spawn at top or bottom edge
            x = padding + Math.random() * (canvas.width - padding*2);
            y = Math.random() > 0.5 ? padding : canvas.height - padding;
        }

        enemies.push(new Enemy(x, y, difficulty));
    }
}

function checkCollisions() {
    // Check bullet-enemy collisions
    for (const enemy of enemies) {
        if (!enemy.active) continue;

        // Check if any player bullet hits the enemy
        for (const bullet of player.bullets) {
            if (!bullet.active) continue;

            const distance = Math.sqrt(
                (bullet.position[0] - enemy.position[0]) ** 2 +
                (bullet.position[1] - enemy.position[1]) ** 2
            );

            if (distance < enemy.hitRadius + bullet.hitRadius) {
                bullet.active = false;

                // Create explosion effect
                explosions.push(new Explosion(bullet.position, 20));

                // Enemy takes damage and returns true if destroyed
                if (enemy.takeDamage()) {
                    // Create larger explosion for destroyed tank
                    explosions.push(new Explosion(enemy.position, 40));

                    score += difficulty === 'hard' ? 20 : 10; // More points for hard enemies
                    document.getElementById('score').textContent = `Score: ${score}`;
                }
                break;
            }
        }

        // Check if player is hit by enemy bullets
        for (const bullet of enemy.bullets || []) {
            if (!bullet.active) continue;

            const distance = Math.sqrt(
                (bullet.position[0] - player.position[0]) ** 2 +
                (bullet.position[1] - player.position[1]) ** 2
            );

            if (distance < player.width/2 + bullet.hitRadius) {
                bullet.active = false;
                player.health -= 5;

                // Create small explosion
                explosions.push(new Explosion(bullet.position, 15));

                if (player.health <= 0) {
                    // Create large explosion for player
                    explosions.push(new Explosion(player.position, 50));
                    endGame();
                }
            }
        }

        // Check if enemy hits player (tank collision)
        if (enemy.active) {
            const distance = Math.sqrt(
                (player.position[0] - enemy.position[0]) ** 2 +
                (player.position[1] - enemy.position[1]) ** 2
            );

            const collisionDistance = (player.width + enemy.width) / 2.5; // Adjust collision radius for tanks

            if (distance < collisionDistance) {
                player.health -= 0.5; // Continuous damage while in contact

                // Push player away from enemy
                const dx = player.position[0] - enemy.position[0];
                const dy = player.position[1] - enemy.position[1];
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 0) {
                    player.position[0] += dx/dist * 2;
                    player.position[1] += dy/dist * 2;
                }

                if (player.health <= 0) {
                    explosions.push(new Explosion(player.position, 50));
                    endGame();
                }
            }
        }
    }

    // Check for collisions with terrain
    for (const obstacle of terrain) {
        // Check if player collides with obstacle
        if (rectIntersect(
            player.position[0] - player.width/2,
            player.position[1] - player.height/2,
            player.width, player.height,
            obstacle.x, obstacle.y, obstacle.width, obstacle.height
        )) {
            // Only solid obstacles (rocks and walls) block movement
            if (obstacle.type === 'rock' || obstacle.type === 'wall') {
                // Push player away from obstacle with fixed distance
                const dx = player.position[0] - (obstacle.x + obstacle.width/2);
                const dy = player.position[1] - (obstacle.y + obstacle.height/2);
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist > 0) {
                    // Move more in the direction with greater distance
                    if (Math.abs(dx) > Math.abs(dy)) {
                        // Push horizontally (x-direction)
                        player.position[0] += (dx > 0) ? 5 : -5;
                    } else {
                        // Push vertically (y-direction)
                        player.position[1] += (dy > 0) ? 5 : -5;
                    }
                }
            }
        }

        // Check if bullets hit obstacles
        for (const bullet of player.bullets) {
            if (!bullet.active) continue;

            if (rectIntersect(
                bullet.position[0] - bullet.width/2,
                bullet.position[1] - bullet.height/2,
                bullet.width, bullet.height,
                obstacle.x, obstacle.y, obstacle.width, obstacle.height
            )) {
                // Only solid obstacles (rocks and walls) block bullets
                if (obstacle.type === 'rock' || obstacle.type === 'wall') {
                    bullet.active = false;
                    explosions.push(new Explosion(bullet.position, 10));
                }
            }
        }

        // Check enemy bullets collision with terrain
        for (const enemy of enemies) {
            if (!enemy.active || !enemy.bullets) continue;

            for (const bullet of enemy.bullets) {
                if (!bullet.active) continue;

                if (rectIntersect(
                    bullet.position[0] - bullet.width/2,
                    bullet.position[1] - bullet.height/2,
                    bullet.width, bullet.height,
                    obstacle.x, obstacle.y, obstacle.width, obstacle.height
                )) {
                    // Only solid obstacles (rocks and walls) block bullets
                    if (obstacle.type === 'rock' || obstacle.type === 'wall') {
                        bullet.active = false;
                        explosions.push(new Explosion(bullet.position, 10));
                    }
                }
            }
        }
    }
}

// Helper function to check if two rectangles intersect
function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

function endGame() {
    gameOver = true;
    document.getElementById('final-score').textContent = `Final Score: ${score}`;
    document.getElementById('game-over').classList.remove('hidden');
}

function update() {
    if (gameOver || !gameStarted) return;

    // Handle player movement
    let dx, dy;

    if (isMobile) {
        // Use mobile joystick controls
        dx = mobileControls.x;
        dy = mobileControls.y;
        
        // Apply a slightly higher speed for mobile to overcome any resistance
        if (dx !== 0 || dy !== 0) {
            player.speed = difficultySettings[difficulty].playerSpeed * 1.2;
        } else {
            player.speed = difficultySettings[difficulty].playerSpeed;
        }
    } else {
        // Use keyboard controls
        dx = (keysPressed['ArrowRight'] || keysPressed['d'] ? 1 : 0) -
             (keysPressed['ArrowLeft'] || keysPressed['a'] ? 1 : 0);
        dy = (keysPressed['ArrowDown'] || keysPressed['s'] ? 1 : 0) -
             (keysPressed['ArrowUp'] || keysPressed['w'] ? 1 : 0);
    }

    // Update player turret to face mouse even when not shooting
    if (player && mousePos) {
        const tdx = mousePos[0] - player.position[0];
        const tdy = mousePos[1] - player.position[1];
        player.turretRotation = Math.atan2(tdy, tdx) * 180 / Math.PI + 90;
    }

    player.move(dx, dy);
    player.update();

    // Spawn enemies based on difficulty
    const settings = difficultySettings[difficulty];
    enemySpawnTimer++;
    if (enemySpawnTimer >= settings.enemySpawnRate) {
        spawnEnemy();
        enemySpawnTimer = 0;
    }

    // Update enemies
    enemies.forEach(enemy => enemy.moveTowardsPlayer(player.position, terrain));

    // Update explosions
    explosions.forEach(explosion => explosion.update());
    explosions = explosions.filter(explosion => explosion.active);

    // Remove inactive enemies
    enemies = enemies.filter(enemy => enemy.active);

    // Check for collisions
    checkCollisions();
}

function drawTerrain() {
    // Draw all terrain objects
    for (const obstacle of terrain) {
        ctx.fillStyle = obstacle.color;

        if (obstacle.type === 'rock') {
            // Draw rock (rectangle with some detail)
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

            // Add some detail
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

            // Add some cracks
            ctx.beginPath();
            ctx.moveTo(obstacle.x + obstacle.width * 0.2, obstacle.y + obstacle.height * 0.3);
            ctx.lineTo(obstacle.x + obstacle.width * 0.5, obstacle.y + obstacle.height * 0.7);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(obstacle.x + obstacle.width * 0.7, obstacle.y + obstacle.height * 0.2);
            ctx.lineTo(obstacle.x + obstacle.width * 0.3, obstacle.y + obstacle.height * 0.5);
            ctx.stroke();
        } else if (obstacle.type === 'wall') {
            // Draw wall with brick pattern
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

            // Draw brick pattern
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1;

            // Horizontal brick lines
            const brickHeight = 10;
            for (let y = obstacle.y; y < obstacle.y + obstacle.height; y += brickHeight) {
                ctx.beginPath();
                ctx.moveTo(obstacle.x, y);
                ctx.lineTo(obstacle.x + obstacle.width, y);
                ctx.stroke();
            }

            // Vertical brick lines (staggered)
            const brickWidth = 20;
            for (let row = 0; row < obstacle.height / brickHeight; row++) {
                const offset = row % 2 === 0 ? 0 : brickWidth / 2;
                for (let x = obstacle.x + offset; x < obstacle.x + obstacle.width; x += brickWidth) {
                    ctx.beginPath();
                    ctx.moveTo(x, obstacle.y + row * brickHeight);
                    ctx.lineTo(x, obstacle.y + (row + 1) * brickHeight);
                    ctx.stroke();
                }
            }
        } else {
            // Draw bush (circle)
            ctx.beginPath();
            ctx.arc(
                obstacle.x + obstacle.width/2,
                obstacle.y + obstacle.height/2,
                obstacle.width/2,
                0, Math.PI * 2
            );
            ctx.fill();

            // Add some detail to bush
            ctx.fillStyle = 'rgba(0,50,0,0.3)';

            // Add some darker spots
            for (let i = 0; i < 3; i++) {
                const spotX = obstacle.x + Math.random() * obstacle.width;
                const spotY = obstacle.y + Math.random() * obstacle.height;
                const spotSize = Math.random() * obstacle.width * 0.3 + obstacle.width * 0.1;

                ctx.beginPath();
                ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#8A9B56'; // Military green background for battlefield
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If game not started, don't render game objects
    if (!gameStarted && !gameOver) return;

    // Add grid pattern to the ground
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;

    // Draw grid pattern
    const gridSize = 50;
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Draw terrain first (so it appears behind tanks)
    drawTerrain();

    // Draw game objects
    player.draw(ctx);
    enemies.forEach(enemy => enemy.draw(ctx));

    // Draw explosions on top
    explosions.forEach(explosion => explosion.draw(ctx));

    // Draw player health bar at top of screen
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthBarX = 20;
    const healthBarY = 20;

    // Health bar background
    ctx.fillStyle = '#333333';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

    // Health bar fill
    const healthPercent = Math.max(0, player.health / difficultySettings[difficulty].playerHealth);
    const healthColor = healthPercent > 0.6 ? '#33CC33' : healthPercent > 0.3 ? '#FFCC00' : '#FF3333';
    ctx.fillStyle = healthColor;
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);

    // Health bar border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

    // Draw health text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillText(`HP: ${Math.floor(player.health)}`, healthBarX + 10, healthBarY + 15);

    // Draw score
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText(`SCORE: ${score}`, canvas.width - 150, 35);

    // Draw difficulty indicator
    ctx.fillStyle = difficulty === 'easy' ? '#4CAF50' :
                   difficulty === 'medium' ? '#FFA500' : '#F44336';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText(`LEVEL: ${difficulty.toUpperCase()}`, canvas.width / 2 - 60, 35);

    // Draw control hints
    if (gameStarted && !gameOver) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px "Courier New", monospace';
        ctx.fillText('WASD or Arrow Keys: Move Tank', 20, canvas.height - 60);
        ctx.fillText('Mouse Movement: Aim Turret', 20, canvas.height - 40);
        ctx.fillText('Mouse Click: Fire Cannon', 20, canvas.height - 20);
    }
}

function gameLoop() {
    update();
    render();

    if (isRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Start the game when the page loads
window.onload = init;
