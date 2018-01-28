// =============================================================================
// Straight forward variable to handle spectator (FPS) camera functionality.
// I always end up rewriting this stuff for every new project, so the following
// file constitutes an attempt to prevent that from happening.
// NOTE: required packages: TWGL
// =============================================================================
// author: Bartlomiej Dybisz
// -----------------------------------------------------------------------------

const SpectatorCamera = {

    // =========================================================================
    //  The Camera Definition.
    // =========================================================================
    __data: {
        m_pitch : 0,
        m_yaw : 0,
        m_angularSpeed : 0.5,
        m_position : [0, 25, 0],
        m_movementSpeed : 0.25
    },

    // =========================================================================
    //  Mathematical Operations on the Camera.
    // =========================================================================
    __degToRad: function(degrees) {
        return degrees * Math.PI / 180;
    },

    __getRightVector: function() {
        let radiansYaw = SpectatorCamera.__degToRad(SpectatorCamera.__data.m_yaw);
        let rightX = Math.sin(radiansYaw - Math.PI / 2.0);
        let rightZ = Math.cos(radiansYaw - Math.PI / 2.0);

        return [rightX, 0, rightZ];
    },

    __getDirectionVector: function() {
        const yaw        = SpectatorCamera.__data.m_yaw;
        const pitch      = SpectatorCamera.__data.m_pitch;
        let radiansYaw   = SpectatorCamera.__degToRad(yaw);
        let radiansPitch = SpectatorCamera.__degToRad(pitch);

        let dirX = Math.cos(radiansPitch) * Math.sin(radiansYaw);
        let dirY = Math.sin(radiansPitch);
        let dirZ = Math.cos(radiansPitch) * Math.cos(radiansYaw);

        return [dirX, dirY, dirZ];
    },

    __getUpVector: function() {
        return v3.cross(SpectatorCamera.__getRightVector(),
                        SpectatorCamera.__getDirectionVector());
    },

    invertPitch: function() {
        SpectatorCamera.__data.m_pitch = -SpectatorCamera.__data.m_pitch;
    },

    getViewMatrix: function(view, negate) {
        let eye = SpectatorCamera.__data.m_position;
        let target = v3.add(eye, SpectatorCamera.__getDirectionVector());
        // Update matrix
        if(negate) {
          var negatedUpVector = SpectatorCamera.__getUpVector();
          negatedUpVector[1] = -negatedUpVector[1];
            m4.lookAt(eye, target, negatedUpVector, view);
        } else {
            m4.lookAt(eye, target, SpectatorCamera.__getUpVector(), view);
        }
    },

    // =========================================================================
    //  Calculate movement vectors.
    // =========================================================================
    __getLeftRightMovementVector: function() {
      return v3.mulScalar(SpectatorCamera.__getRightVector(),
                          SpectatorCamera.__data.m_movementSpeed)
    },

    __getForwardBackwardMovementVector: function() {
      return v3.mulScalar(SpectatorCamera.__getDirectionVector(),
                          SpectatorCamera.__data.m_movementSpeed)
    },

    __getUpDownMovementVector: function() {
      return v3.mulScalar(SpectatorCamera.__getUpVector(),
                          SpectatorCamera.__data.m_movementSpeed)
    },

    // =========================================================================
    //  The Camera Steering.
    // =========================================================================
    moveLeft: function() {
        v3.subtract(SpectatorCamera.__data.m_position,
                    SpectatorCamera.__getLeftRightMovementVector(),
                    SpectatorCamera.__data.m_position);
    },

    moveRight: function() {
        v3.add(SpectatorCamera.__data.m_position,
               SpectatorCamera.__getLeftRightMovementVector(),
               SpectatorCamera.__data.m_position);
    },

    moveForward: function() {
        v3.add(SpectatorCamera.__data.m_position,
               SpectatorCamera.__getForwardBackwardMovementVector(),
               SpectatorCamera.__data.m_position);
    },

    moveBackward: function() {
        v3.subtract(SpectatorCamera.__data.m_position,
                    SpectatorCamera.__getForwardBackwardMovementVector(),
                    SpectatorCamera.__data.m_position);
    },

    moveUp: function() {
        v3.add(SpectatorCamera.__data.m_position,
               SpectatorCamera.__getUpDownMovementVector(),
               SpectatorCamera.__data.m_position);
    },

    moveDown: function() {
        v3.subtract(SpectatorCamera.__data.m_position,
                    SpectatorCamera.__getUpDownMovementVector(),
                    SpectatorCamera.__data.m_position);
    },

    lookAround: function(deltaX, deltaY) {
        const angularSpeed = SpectatorCamera.__data.m_angularSpeed;
        SpectatorCamera.__data.m_yaw += angularSpeed * deltaX;
        SpectatorCamera.__data.m_pitch += angularSpeed * deltaY;
    }
};

// =============================================================================
// The variable encapsulates all keyboard and mouse related procedures.
//
// Example of usage:
// Place this on top of the script:
// const m4 = twgl.m4;
// let view = m4.identity();
// document.onkeydown   = IO.handleKeyDown;
// document.onkeyup     = IO.handleKeyUp;
// document.onmouseup   = IO.handleMouseUp;
// document.onmousemove = IO.handleMouseMove;
// canvas.onmousedown   = IO.handleMouseDown;
//
// And this in the beginning of main render loop:
// IO.handleKeyboard();
// SpectatorCamera.getViewMatrix(view);
// m4.inverse(view, view);
//
// NOTE: TWGL library is assumed to be included in project in order for the
//       above example to work.
// =============================================================================
// author: Bartlomiej Dybisz
// -----------------------------------------------------------------------------

const IO = {

    // =========================================================================
    //  IO State.
    // =========================================================================
    __pressedKeys: {},
    __mouseDown: false,
    __lastMouseX: null,
    __lastMouseY: null,

    // =========================================================================
    //  Event Handles.
    // =========================================================================
    handleKeyDown: function(event) {
        IO.__pressedKeys[event.keyCode] = true;
    },

    handleKeyUp: function(event) {
        IO.__pressedKeys[event.keyCode] = false;
    },

    handleMouseDown: function(event) {
        IO.__mouseDown = true;
        IO.__lastMouseX = event.clientX;
        IO.__lastMouseY = event.clientY;
    },

    handleMouseUp: function(event) {
        IO.__mouseDown = false;
    },

    handleMouseMove: function(event) {
        if(!IO.__mouseDown) return;

        var newX = event.clientX;
        var newY = event.clientY;

        var deltaX = newX - IO.__lastMouseX;
        var deltaY = newY - IO.__lastMouseY;
        SpectatorCamera.lookAround(-deltaX, -deltaY);

        IO.__lastMouseX = newX
        IO.__lastMouseY = newY;
    },

    // =========================================================================
    //  Keyboard and Mouse functionalities.
    // =========================================================================
    handleKeyboard: function() {
        // =====================================================================
        // Left key or A pressed.
        // =====================================================================
        if (IO.__pressedKeys[37] || IO.__pressedKeys[65]) {
            SpectatorCamera.moveLeft();

        // =====================================================================
        // Right cursor key or D pressed.
        // =====================================================================
        } else if (IO.__pressedKeys[39] || IO.__pressedKeys[68]) {
            SpectatorCamera.moveRight();
        }

        // =====================================================================
        // Up cursor key or W pressed.
        // =====================================================================
        if (IO.__pressedKeys[38] || IO.__pressedKeys[87]) {
            SpectatorCamera.moveForward();

        // =====================================================================
        // Down cursor key pressed.
        // =====================================================================
        } else if (IO.__pressedKeys[40] || IO.__pressedKeys[83]) {
            SpectatorCamera.moveBackward();
        }

        // =====================================================================
        // Z key pressed.
        // =====================================================================
        if (IO.__pressedKeys[88]) {
        SpectatorCamera.moveDown();

        // =====================================================================
        // X key pressed.
        // =====================================================================
        } else if (IO.__pressedKeys[90]) {
            SpectatorCamera.moveUp();
        }
    }
};
