class Bullet {
    constructor(startPos, direction, speed = 7, color = '#FFE100') {
        this.position = [...startPos];
        this.direction = direction;
        this.speed = speed;
        this.width = 8;
        this.height = 14;
        this.hitRadius = 4; // For collision detection
        this.active = true;
        this.rotation = Math.atan2(direction[1], direction[0]) * 180 / Math.PI + 90; // Calculate angle in degrees
        this.color = color; // Can be different for player vs enemy
        this.trail = []; // For bullet trail effect
        this.maxTrailLength = 5;
        
        // Load bullet image
        this.image = new Image();
        this.image.src = 'static/images/bullet.svg';
    }

    update() {
        if (!this.active) {
            return;
        }
        
        // Add current position to trail
        this.trail.push([...this.position]);
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift(); // Remove oldest position
        }
        
        // Move bullet
        this.position[0] += this.direction[0] * this.speed;
        this.position[1] += this.direction[1] * this.speed;
        
        // Deactivate if out of screen
        if (this.position[0] < 0 || this.position[0] > window.innerWidth ||
            this.position[1] < 0 || this.position[1] > window.innerHeight) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (this.active) {
            // Draw shell casing trail
            for (let i = 0; i < this.trail.length; i++) {
                const alpha = i / this.trail.length; // Fade out older positions
                ctx.save();
                ctx.globalAlpha = alpha * 0.6;
                ctx.translate(this.trail[i][0], this.trail[i][1]);
                ctx.rotate(this.rotation * Math.PI / 180);
                
                // Draw a simple trail
                ctx.fillStyle = this.color === 'red' ? '#FF6600' : '#FFCC00';
                ctx.beginPath();
                ctx.arc(0, 0, 2 + (i/this.trail.length) * 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            
            // Draw shell with rotation
            ctx.save();
            ctx.translate(this.position[0], this.position[1]);
            ctx.rotate(this.rotation * Math.PI / 180);
            
            // Draw either image or a custom tank shell
            ctx.drawImage(this.image, -this.width/2, -this.height/2, this.width, this.height);
            
            ctx.restore();
        }
    }
}

// Add explosion effect class
class Explosion {
    constructor(position, size = 30) {
        this.position = [...position];
        this.size = size;
        this.maxSize = size;
        this.active = true;
        this.frame = 0;
        this.maxFrames = 20; // How long explosion lasts
        this.particles = [];
        
        // Create explosion particles
        const particleCount = 10 + Math.floor(Math.random() * 10);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x: 0,
                y: 0,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color: Math.random() > 0.6 ? '#FF3300' : '#FFCC00'
            });
        }
    }
    
    update() {
        if (!this.active) return;
        
        this.frame++;
        if (this.frame >= this.maxFrames) {
            this.active = false;
            return;
        }
        
        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.size *= 0.95; // Shrink particles over time
        });
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        const progress = this.frame / this.maxFrames;
        const alpha = 1 - progress;
        
        ctx.save();
        ctx.translate(this.position[0], this.position[1]);
        
        // Draw outer explosion circle
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * (0.5 + progress * 0.5), 0, Math.PI * 2);
        ctx.fill();
        
        // Draw inner explosion circle
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFCC00';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.7 * (0.2 + progress * 0.3), 0, Math.PI * 2);
        ctx.fill();
        
        // Draw particles
        this.particles.forEach(p => {
            ctx.globalAlpha = alpha * 0.9;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
}
