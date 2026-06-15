export class FlightController {
  public input: { x: number; y: number; z: number };
  public reelInput: number;
  private keys: Set<string>;
  private touchStart: { x: number; y: number } | null;
  private touchCurrent: { x: number; y: number } | null;
  private isDragging: boolean;
  private touchPinchStart: number | null;
  private lastTouchDistance: number | null;

  constructor() {
    this.input = { x: 0, y: 0, z: 0 };
    this.reelInput = 0;
    this.keys = new Set();
    this.touchStart = null;
    this.touchCurrent = null;
    this.isDragging = false;
    this.touchPinchStart = null;
    this.lastTouchDistance = null;

    this.bindKeyboardEvents();
    this.bindTouchEvents();
  }

  private bindKeyboardEvents(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  private bindTouchEvents(): void {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;

    gameContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.touchPinchStart = Math.sqrt(dx * dx + dy * dy);
        this.lastTouchDistance = this.touchPinchStart;
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.touchStart = { x: touch.clientX, y: touch.clientY };
        this.touchCurrent = { x: touch.clientX, y: touch.clientY };
        this.isDragging = true;
      }
    });

    gameContainer.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        if (this.lastTouchDistance !== null) {
          const delta = currentDistance - this.lastTouchDistance;
          this.reelInput = Math.max(-1, Math.min(1, delta / 50));
        }
        this.lastTouchDistance = currentDistance;
      } else if (this.isDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        this.touchCurrent = { x: touch.clientX, y: touch.clientY };
      }
    });

    gameContainer.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (e.touches.length < 2) {
        this.touchPinchStart = null;
        this.lastTouchDistance = null;
        this.reelInput = 0;
      }
      if (e.touches.length === 0) {
        this.isDragging = false;
        this.touchStart = null;
        this.touchCurrent = null;
      }
    });
  }

  public update(): void {
    this.input.x = 0;
    this.input.y = 0;
    this.input.z = 0.15;
    this.reelInput = 0;

    if (this.keys.has('arrowleft') || this.keys.has('a')) {
      this.input.x -= 1;
    }
    if (this.keys.has('arrowright') || this.keys.has('d')) {
      this.input.x += 1;
    }
    if (this.keys.has('arrowup') || this.keys.has('w')) {
      this.input.y += 1;
    }
    if (this.keys.has('arrowdown') || this.keys.has('s')) {
      this.input.y -= 1;
    }
    if (this.keys.has('q')) {
      this.input.z -= 0.5;
    }
    if (this.keys.has('e')) {
      this.input.z += 0.5;
    }
    if (this.keys.has('r')) {
      this.reelInput += 1;
    }
    if (this.keys.has('f')) {
      this.reelInput -= 1;
    }

    if (this.isDragging && this.touchStart && this.touchCurrent) {
      const deltaX = this.touchCurrent.x - this.touchStart.x;
      const deltaY = this.touchCurrent.y - this.touchStart.y;

      this.input.x = Math.max(-1, Math.min(1, deltaX / 100));
      this.input.y = Math.max(-1, Math.min(1, -deltaY / 100));
    }

    const magnitude = Math.sqrt(
      this.input.x ** 2 + this.input.y ** 2 + this.input.z ** 2
    );
    if (magnitude > 0) {
      this.input.x /= magnitude;
      this.input.y /= magnitude;
      this.input.z /= magnitude;
    }

    this.reelInput = Math.max(-1, Math.min(1, this.reelInput));
  }

  public dispose(): void {
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});
  }
}
