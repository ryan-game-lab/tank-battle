/**
 * Tank Battle: Mobile Controls
 * Handles touch controls for mobile devices
 */

(function() {
    // DOM Elements
    let joystickArea = document.querySelector('.joystick-area');
    let joystick = document.getElementById('movement-joystick');
    let fireButton = document.getElementById('fire-button');
    let canvas = document.getElementById('gameCanvas');

    // Variables for tracking touch
    let isDragging = false;
    let startX, startY;
    let currentX, currentY;

    // Control state
    let moveDirection = { x: 0, y: 0 };
    let isFiring = false;

    // Check if the device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Only initialize mobile controls if on a mobile device
    if (isMobile) {
        initMobileControls();
    }

    // Function to initialize mobile controls
    function initMobileControls() {
        // Add event listeners for joystick
        joystickArea.addEventListener('touchstart', handleJoystickStart);
        joystickArea.addEventListener('touchmove', handleJoystickMove);
        joystickArea.addEventListener('touchend', handleJoystickEnd);

        // Add event listeners for fire button
        fireButton.addEventListener('touchstart', handleFireStart);
        fireButton.addEventListener('touchend', handleFireEnd);

        // Handle orientation changes
        window.addEventListener('orientationchange', checkOrientation);
        window.addEventListener('resize', checkOrientation);

        // Initial check
        checkOrientation();

        // Handle game resize for mobile
        window.addEventListener('resize', handleResize);
        handleResize();
    }

    // Handle joystick touch start
    function handleJoystickStart(e) {
        e.preventDefault();

        isDragging = true;

        const touch = e.touches[0];
        const rect = joystickArea.getBoundingClientRect();

        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;

        // Initial position
        currentX = touch.clientX;
        currentY = touch.clientY;

        updateJoystickPosition();
    }

    // Handle joystick movement
    function handleJoystickMove(e) {
        if (!isDragging) return;
        e.preventDefault();

        const touch = e.touches[0];
        currentX = touch.clientX;
        currentY = touch.clientY;

        updateJoystickPosition();
    }

    // Handle joystick release
    function handleJoystickEnd(e) {
        e.preventDefault();

        isDragging = false;

        // Reset joystick position
        joystick.style.transform = 'translate(-50%, -50%)';

        // Reset movement
        moveDirection = { x: 0, y: 0 };

        // Dispatch custom event
        dispatchMoveEvent();
    }

    // Update joystick position and calculate direction
    function updateJoystickPosition() {
        const areaRect = joystickArea.getBoundingClientRect();
        const centerX = areaRect.left + areaRect.width / 2;
        const centerY = areaRect.top + areaRect.height / 2;

        // Calculate distance from center
        let deltaX = currentX - centerX;
        let deltaY = currentY - centerY;

        // Limit movement to the joystick area radius
        const radius = areaRect.width / 2;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > radius) {
            const angle = Math.atan2(deltaY, deltaX);
            deltaX = Math.cos(angle) * radius;
            deltaY = Math.sin(angle) * radius;
        }

        // Update joystick position
        joystick.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

        // Calculate normalized direction (-1 to 1)
        moveDirection = {
            x: deltaX / radius,
            y: deltaY / radius
        };

        // Dispatch custom event
        dispatchMoveEvent();
    }

    // Handle fire button press
    function handleFireStart(e) {
        e.preventDefault();
        isFiring = true;
        fireButton.style.backgroundColor = 'rgba(200, 0, 0, 0.7)';
        dispatchFireEvent();
    }

    // Handle fire button release
    function handleFireEnd(e) {
        e.preventDefault();
        isFiring = false;
        fireButton.style.backgroundColor = 'rgba(139, 0, 0, 0.7)';
    }

    // Create and dispatch move event
    function dispatchMoveEvent() {
        const moveEvent = new CustomEvent('mobilemove', {
            detail: {
                x: moveDirection.x,
                y: moveDirection.y
            }
        });
        document.dispatchEvent(moveEvent);
    }

    // Create and dispatch fire event
    function dispatchFireEvent() {
        const fireEvent = new CustomEvent('mobilefire');
        document.dispatchEvent(fireEvent);
    }

    // Check device orientation
    function checkOrientation() {
        const warning = document.querySelector('.orientation-warning');
        const gameContainer = document.querySelector('.game-container');

        if (window.innerHeight < 450 && window.innerWidth > window.innerHeight) {
            // Landscape on a very small screen
            warning.style.display = 'flex';
            gameContainer.style.display = 'none';
        } else {
            warning.style.display = 'none';
            gameContainer.style.display = 'block';
        }
    }

    // Handle window resize for canvas
    function handleResize() {
        // Adjust canvas dimensions
        const devicePixelRatio = window.devicePixelRatio || 1;

        // Set canvas size to match container
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Update canvas dimensions
        canvas.width = width * devicePixelRatio;
        canvas.height = height * devicePixelRatio;

        // Scale the rendering context
        const ctx = canvas.getContext('2d');
        ctx.scale(devicePixelRatio, devicePixelRatio);

        // Make sure the CSS size matches the viewport
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
    }

})();
