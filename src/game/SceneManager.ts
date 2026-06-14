import * as THREE from 'three';
import type { Building, GameConfig } from './types';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public ground!: THREE.Mesh;
  public buildings: { mesh: THREE.Mesh; data: Building }[] = [];
  public sunLight!: THREE.DirectionalLight;
  public ambientLight!: THREE.AmbientLight;
  public hemisphereLight!: THREE.HemisphereLight;
  private config: GameConfig;
  private buildingGroup: THREE.Group;

  constructor(container: HTMLElement, config: GameConfig) {
    this.config = config;
    this.buildingGroup = new THREE.Group();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 200, 600);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 50, 100);
    this.camera.lookAt(0, 30, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    this.initLights();
    this.initGround();
    this.initBuildings();
    this.scene.add(this.buildingGroup);

    window.addEventListener('resize', () => this.handleResize(container));
  }

  private initLights(): void {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    this.hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.5);
    this.scene.add(this.hemisphereLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.sunLight.position.set(100, 200, 100);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 4096;
    this.sunLight.shadow.mapSize.height = 4096;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 800;
    this.sunLight.shadow.camera.left = -300;
    this.sunLight.shadow.camera.right = 300;
    this.sunLight.shadow.camera.top = 300;
    this.sunLight.shadow.camera.bottom = -300;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
  }

  private initGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(
      this.config.worldSize * 3,
      this.config.worldSize * 3
    );
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a7c3e,
      roughness: 0.9,
      metalness: 0.0,
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = 0;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    const roadGeometry = new THREE.PlaneGeometry(
      this.config.worldSize * 3,
      8
    );
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
    });
    const road1 = new THREE.Mesh(roadGeometry, roadMaterial);
    road1.rotation.x = -Math.PI / 2;
    road1.position.y = 0.01;
    road1.receiveShadow = true;
    this.scene.add(road1);

    const road2 = new THREE.Mesh(roadGeometry, roadMaterial);
    road2.rotation.x = -Math.PI / 2;
    road2.rotation.z = Math.PI / 2;
    road2.position.y = 0.01;
    road2.receiveShadow = true;
    this.scene.add(road2);
  }

  private initBuildings(): void {
    const colors = [
      0x8b4513, 0xa0522d, 0x696969, 0x708090, 0x4682b4,
      0xd2b48c, 0xb8860b, 0xcd853f, 0x808080, 0x556b2f,
    ];

    const gridSize = 12;
    const spacing = this.config.worldSize / gridSize;

    for (let x = -gridSize / 2; x < gridSize / 2; x++) {
      for (let z = -gridSize / 2; z < gridSize / 2; z++) {
        if (Math.abs(x) < 1 && Math.abs(z) < 1) continue;
        if (Math.random() > this.config.buildingDensity) continue;

        const height =
          this.config.minBuildingHeight +
          Math.random() *
            (this.config.maxBuildingHeight - this.config.minBuildingHeight);
        const width = spacing * (0.5 + Math.random() * 0.4);
        const depth = spacing * (0.5 + Math.random() * 0.4);

        const posX = x * spacing + (Math.random() - 0.5) * spacing * 0.3;
        const posZ = z * spacing + (Math.random() - 0.5) * spacing * 0.3;

        const buildingData: Building = {
          id: `building-${x}-${z}`,
          position: { x: posX, y: height / 2, z: posZ },
          width,
          height,
          depth,
          color: colors[Math.floor(Math.random() * colors.length)],
        };

        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
          color: buildingData.color,
          roughness: 0.7,
          metalness: 0.2,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(posX, height / 2, posZ);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const roofHeight = 1 + Math.random() * 3;
        const roofGeometry = new THREE.BoxGeometry(
          width * 0.9,
          roofHeight,
          depth * 0.9
        );
        const roofMaterial = new THREE.MeshStandardMaterial({
          color: 0x3d3d3d,
          roughness: 0.8,
          metalness: 0.1,
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = height / 2 + roofHeight / 2;
        roof.castShadow = true;
        roof.receiveShadow = true;
        mesh.add(roof);

        this.addWindows(mesh, width, height, depth);

        this.buildings.push({ mesh, data: buildingData });
        this.buildingGroup.add(mesh);
      }
    }
  }

  private addWindows(
    building: THREE.Mesh,
    width: number,
    height: number,
    depth: number
  ): void {
    const windowRows = Math.floor(height / 6);
    const windowColsX = Math.floor(width / 5);
    const windowColsZ = Math.floor(depth / 5);

    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0xffe4b5,
      emissive: 0x8b7355,
      emissiveIntensity: 0.2,
      roughness: 0.3,
      metalness: 0.5,
    });

    const windowGeometry = new THREE.PlaneGeometry(1.5, 2);

    for (let row = 1; row < windowRows; row++) {
      for (let col = 0; col < windowColsX; col++) {
        const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
        window1.position.set(
          -width / 2 + ((col + 0.5) * width) / windowColsX,
          -height / 2 + row * 6,
          depth / 2 + 0.01
        );
        building.add(window1);

        const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
        window2.position.set(
          -width / 2 + ((col + 0.5) * width) / windowColsX,
          -height / 2 + row * 6,
          -depth / 2 - 0.01
        );
        window2.rotation.y = Math.PI;
        building.add(window2);
      }

      for (let col = 0; col < windowColsZ; col++) {
        const window3 = new THREE.Mesh(windowGeometry, windowMaterial);
        window3.position.set(
          width / 2 + 0.01,
          -height / 2 + row * 6,
          -depth / 2 + ((col + 0.5) * depth) / windowColsZ
        );
        window3.rotation.y = Math.PI / 2;
        building.add(window3);

        const window4 = new THREE.Mesh(windowGeometry, windowMaterial);
        window4.position.set(
          -width / 2 - 0.01,
          -height / 2 + row * 6,
          -depth / 2 + ((col + 0.5) * depth) / windowColsZ
        );
        window4.rotation.y = -Math.PI / 2;
        building.add(window4);
      }
    }
  }

  public updateCamera(kitePosition: THREE.Vector3): void {
    const targetX = kitePosition.x;
    const targetY = kitePosition.y + 20;
    const targetZ = kitePosition.z + 50;

    this.camera.position.x += (targetX - this.camera.position.x) * 0.05;
    this.camera.position.y += (targetY - this.camera.position.y) * 0.05;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.05;

    this.camera.lookAt(kitePosition.x, kitePosition.y, kitePosition.z - 20);
  }

  public setSkyColor(timeOfDay: number): void {
    const dayColor = new THREE.Color(0x87ceeb);
    const sunsetColor = new THREE.Color(0xff7f50);
    const nightColor = new THREE.Color(0x0a0a2a);

    let skyColor: THREE.Color;
    if (timeOfDay < 0.3) {
      skyColor = nightColor.clone().lerp(dayColor, timeOfDay / 0.3);
    } else if (timeOfDay < 0.7) {
      skyColor = dayColor;
    } else if (timeOfDay < 0.9) {
      skyColor = dayColor.clone().lerp(
        sunsetColor,
        (timeOfDay - 0.7) / 0.2
      );
    } else {
      skyColor = sunsetColor.clone().lerp(
        nightColor,
        (timeOfDay - 0.9) / 0.1
      );
    }

    this.scene.background = skyColor;
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color = skyColor;
    }
  }

  public setSunPosition(timeOfDay: number): void {
    const angle = timeOfDay * Math.PI * 2 - Math.PI / 2;
    const height = Math.sin(angle) * 200;
    const distance = Math.cos(angle) * 150;

    this.sunLight.position.set(distance, Math.max(height, 20), distance * 0.5);

    const intensity = Math.max(0.2, Math.sin(angle) * 1.5);
    this.sunLight.intensity = intensity;

    if (timeOfDay > 0.8 || timeOfDay < 0.2) {
      this.sunLight.color.setHex(0xffa07a);
    } else {
      this.sunLight.color.setHex(0xffffff);
    }
  }

  private handleResize(container: HTMLElement): void {
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.renderer.dispose();
    window.removeEventListener('resize', () => {});
  }

  public clearBuildings(): void {
    this.buildings.forEach(({ mesh }) => {
      this.buildingGroup.remove(mesh);
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.buildings = [];
  }

  public addBuilding(building: Building): void {
    const { position, width, height, depth, color } = building;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const roofHeight = Math.min(3, height * 0.1);
    const roofGeometry = new THREE.BoxGeometry(
      width * 0.9,
      roofHeight,
      depth * 0.9
    );
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d3d3d,
      roughness: 0.8,
      metalness: 0.1,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = height / 2 + roofHeight / 2;
    roof.castShadow = true;
    roof.receiveShadow = true;
    mesh.add(roof);

    if (height > 10) {
      this.addWindows(mesh, width, height, depth);
    }

    this.buildings.push({ mesh, data: building });
    this.buildingGroup.add(mesh);
  }

  public reconfigure(config: GameConfig): void {
    this.config = config;
    this.clearBuildings();
    this.initBuildings();

    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.near = config.worldSize * 0.4;
      this.scene.fog.far = config.worldSize * 1.2;
    }
  }
}
