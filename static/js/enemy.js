class Enemy {
    constructor(x, y, difficulty = 'medium') {
        this.width = 35;
        this.height = 35;
        this.hitRadius = 17; // Slightly larger for tank
        
        // Set properties based on difficulty
        switch(difficulty) {
            case 'easy':
                this.speed = 1.2; // Tanks move slower than planes
                this.health = 2;  // Tanks have more health
                break;
            case 'medium':
                this.speed = 1.8;
                this.health = 3;
                break;
            case 'hard':
                this.speed = 2.5;
                this.health = 4;
                this.width = 40; // Larger tank for hard enemies
                this.height = 40;
                this.hitRadius = 20;
                break;
            default:
                this.speed = 1.5;
                this.health = 2;
        }
        
        // Random position if not specified
        this.position = [
            x !== undefined ? x : Math.random() * (window.innerWidth - this.width) + this.width/2,
            y !== undefined ? y : Math.random() * (window.innerHeight - this.height) + this.height/2
        ];
        
        this.active = true;
        this.rotation = 0;
        this.turretRotation = 0;
        this.lastMoveTime = Date.now();
        this.movePattern = Math.floor(Math.random() * 3); // 0: direct, 1: zigzag, 2: circular
        
        // Load appropriate image based on difficulty
        this.image = new Image();
        this.image.src = difficulty === 'hard' ? 
            'static/images/enemy_hard.svg' : 
            'static/images/enemy.svg';
    }

    moveTowardsPlayer(playerPos, terrain) {
        if (!this.active) {
            return;
        }
        
        const dx = playerPos[0] - this.position[0];
        const dy = playerPos[1] - this.position[1];
        
        // Turret always points at player
        this.turretRotation = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        
        // Normalize the direction
        const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        
        // Different movement patterns based on enemy type
        let moveX = dx / distance * this.speed;
        let moveY = dy / distance * this.speed;
        
        // Update tank body rotation more gradually than turret
        const targetRotation = Math.atan2(moveY, moveX) * 180 / Math.PI + 90;
        const rotDiff = targetRotation - this.rotation;
        
        // Normalize rotation difference to -180 to 180
        let normalizedDiff = rotDiff;
        while (normalizedDiff > 180) normalizedDiff -= 360;
        while (normalizedDiff < -180) normalizedDiff += 360;
        
        // Gradually rotate tank body (slower than turret)
        this.rotation += normalizedDiff * 0.1;
        
        // Apply movement patterns for variety
        const now = Date.now();
        const timeDiff = now - this.lastMoveTime;
        
        if (this.movePattern === 1) { // Zigzag
            const zigzagFactor = Math.sin(now / 500) * 0.7;
            const perpX = -moveY * zigzagFactor;
            const perpY = moveX * zigzagFactor;
            moveX += perpX;
            moveY += perpY;
        } else if (this.movePattern === 2) { // Circular/flanking
            if (distance < 200) { // Only circle when close
                const circleSpeed = 0.8;
                const perpX = -moveY * circleSpeed;
                const perpY = moveX * circleSpeed;
                moveX = perpX;
                moveY = perpY;
            }
        }
        
        // Check for terrain collision before moving
        let newX = this.position[0] + moveX;
        let newY = this.position[1] + moveY;
        
        // Check if new position would collide with terrain
        let terrainCollision = false;
        if (terrain) {
            for (const obstacle of terrain) {
                if (this.checkRectCollision(
                    [newX - this.width/2, newY - this.height/2, this.width, this.height],
                    [obstacle.x, obstacle.y, obstacle.width, obstacle.height]
                )) {
                    terrainCollision = true;
                    break;
                }
            }
        }
        
        // Only move if not colliding with terrain
        if (!terrainCollision) {
            this.position[0] = newX;
            this.position[1] = newY;
        } else {
            // Try to move around obstacle - change direction temporarily
            this.movePattern = (this.movePattern + 1) % 3; // Change pattern when hitting obstacle
            
            // Try moving in a different direction
            const angle = Math.random() * Math.PI * 2;
            this.position[0] += Math.cos(angle) * this.speed * 0.5;
            this.position[1] += Math.sin(angle) * this.speed * 0.5;
        }
        
        // Update time for movement patterns
        this.lastMoveTime = now;
    }
    
    checkRectCollision(rect1, rect2) {
        return (rect1[0] < rect2[0] + rect2[2] &&
                rect1[0] + rect1[2] > rect2[0] &&
                rect1[1] < rect2[1] + rect2[3] &&
                rect1[1] + rect1[3] > rect2[1]);
    }

    takeDamage() {
        this.health -= 1;
        if (this.health <= 0) {
            this.active = false;
        }
        return this.health <= 0; // Return true if enemy is destroyed
    }

    draw(ctx) {
        if (this.active) {
            // Draw enemy tank body with rotation
            ctx.save();
            ctx.translate(this.position[0], this.position[1]);
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.drawImage(this.image, -this.width/2, -this.height/2, this.width, this.height);
            
            // Draw enemy turret with independent rotation
            ctx.rotate((this.turretRotation - this.rotation) * Math.PI / 180);
            ctx.fillStyle = '#555555';
            ctx.fillRect(-2, -20, 4, 10); // Draw barrel
            
            ctx.restore();
            
            // Draw health indicator
            const healthWidth = 30;
            const healthHeight = 4;
            const healthPos = [this.position[0] - healthWidth/2, this.position[1] - this.height/2 - 8];
            
            // Background (red)
            ctx.fillStyle = "#FF0000";
            ctx.fillRect(healthPos[0], healthPos[1], healthWidth, healthHeight);
            
            // Health (green)
            ctx.fillStyle = "#00FF00";
            ctx.fillRect(healthPos[0], healthPos[1], healthWidth * (this.health/4), healthHeight);
        }
    }
}
