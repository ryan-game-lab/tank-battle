class Player {
    constructor(name) {
        this.name = name;
        this.score = 0;
        this.position = [400, 300];  // Start at center
        this.width = 40;
        this.height = 40;
        this.speed = 4;
        this.bullets = [];
        this.shootCooldown = 0;
        this.health = 100;
        this.rotation = 0; // Angle in degrees (0 = up, 90 = right, etc.)
        this.turretRotation = 0; // Separate rotation for the turret
        this.image = new Image();
        this.image.src = 'static/images/player.svg';
    }

    move(dx, dy) {
        // Only update tank body rotation if moving
        if (dx !== 0 || dy !== 0) {
            this.rotation = Math.atan2(dy, dx) * 180 / Math.PI + 90; // +90 to orient properly
        }

        this.position[0] += dx * this.speed;
        this.position[1] += dy * this.speed;
        
        // Keep player on screen
        this.position[0] = Math.max(this.width/2, Math.min(window.innerWidth - this.width/2, this.position[0]));
        this.position[1] = Math.max(this.height/2, Math.min(window.innerHeight - this.height/2, this.position[1]));
    }

    shoot(mousePos) {
        if (this.shootCooldown > 0) {
            return;
        }

        // Calculate direction vector
        const dx = mousePos[0] - this.position[0];
        const dy = mousePos[1] - this.position[1];
        
        // Update turret rotation to face target
        this.turretRotation = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        
        // Normalize the direction
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
            const normalizedDx = dx / length;
            const normalizedDy = dy / length;
            
            // Create new bullet at turret end position
            const bulletStartX = this.position[0] + normalizedDx * 25; // Offset from tank center
            const bulletStartY = this.position[1] + normalizedDy * 25;
            
            this.bullets.push(new Bullet([bulletStartX, bulletStartY], [normalizedDx, normalizedDy]));
            this.shootCooldown = 25;  // Wait 25 frames before next shot
            
            // Add a little recoil
            this.position[0] -= normalizedDx * 2;
            this.position[1] -= normalizedDy * 2;
        }
    }

    update() {
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
            
        // Update bullets
        this.bullets.forEach(bullet => bullet.update());
        
        // Remove inactive bullets
        this.bullets = this.bullets.filter(bullet => bullet.active);
    }

    draw(ctx) {
        // Save context
        ctx.save();
        
        // Draw tank body with rotation
        ctx.translate(this.position[0], this.position[1]);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.drawImage(this.image, -this.width/2, -this.height/2, this.width, this.height);
        
        // Draw additional turret rotation (customize as needed)
        ctx.rotate((this.turretRotation - this.rotation) * Math.PI / 180);
        ctx.fillStyle = '#880000';
        ctx.fillRect(-2, -25, 4, 15); // Draw barrel
        
        ctx.restore();
        
        // Draw bullets
        this.bullets.forEach(bullet => bullet.draw(ctx));
            
        // Draw health bar
        const healthWidth = 50;
        const healthHeight = 5;
        const healthPos = [this.position[0] - healthWidth/2, this.position[1] - this.height/2 - 15];
        
        // Background (red)
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(healthPos[0], healthPos[1], healthWidth, healthHeight);
        
        // Health (green)
        ctx.fillStyle = "#00FF00";
        ctx.fillRect(healthPos[0], healthPos[1], healthWidth * (this.health/100), healthHeight);
        
        // Draw tank treads motion effect (animated)
        if (this.treadsAnimation === undefined) {
            this.treadsAnimation = 0;
        }
        this.treadsAnimation = (this.treadsAnimation + 1) % 10;
    }
}
