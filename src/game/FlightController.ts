export class FlightController {
  public input: { x: number; y: number; z: number };
  private keys: Set<string>;
  private touchStart: { x: number; y: number } | null;
  private touchCurrent: { x: number; y: number } | null;
  private isDragging: boolean;

  constructor() {
    this.input = { x: 0, y: 0, z: 0 };
    this.keys = new Set();
    this.touchStart = null;
    this.touchCurrent = null;
    this.isDragging = false;

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
      const touch = e.touches[0];
      this.touchStart = { x: touch.clientX, y: touch.clientY };
      this.touchCurrent = { x: touch.clientX, y: touch.clientY };
      this.isDragging = true;
    });

    gameContainer.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.isDragging) return;
      const touch = e.touches[0];
      this.touchCurrent = { x: touch.clientX, y: touch.clientY };
    });

    gameContainer.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.isDragging = false;
      this.touchStart = null;
      this.touchCurrent = null;
    });
  }

  public update(): void {
    this.input.x = 0;
    this.input.y = 0;
    this.input.z = 0.15;

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
  }

  public dispose(): void {
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});
  }
}
