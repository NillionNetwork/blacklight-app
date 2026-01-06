import { gsap } from 'gsap';
import * as THREE from 'three';

export class NetworkGlobe {
  static Geometry = class {
    static lon2xyz (R, longitude, latitude) {
      let lon = longitude * Math.PI / 180;
      const lat = latitude * Math.PI / 180;
      lon = -lon;

      const x = R * Math.cos(lat) * Math.cos(lon);
      const y = R * Math.sin(lat);
      const z = R * Math.cos(lat) * Math.sin(lon);
      return new THREE.Vector3(x, y, z);
    }

    static arcXOY(radius, startPoint, endPoint, options) {
      const threePointCenter = function (p1, p2, p3) {
        const L1 = p1.lengthSq();
        const L2 = p2.lengthSq();
        const L3 = p3.lengthSq();
        const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y, x3 = p3.x, y3 = p3.y;
        const S = x1 * y2 + x2 * y3 + x3 * y1 - x1 * y3 - x2 * y1 - x3 * y2;
        const x = (L2 * y3 + L1 * y2 + L3 * y1 - L2 * y1 - L3 * y2 - L1 * y3) / S / 2;
        const y = (L3 * x2 + L2 * x1 + L1 * x3 - L1 * x2 - L2 * x3 - L3 * x1) / S / 2;
        const center = new THREE.Vector3(x, y, 0);
        return center;
      };

      const radianAOB = function (A, B, O) {
        const dir1 = A.clone().sub(O).normalize();
        const dir2 = B.clone().sub(O).normalize();
        const cosAngle = dir1.clone().dot(dir2);
        const radianAngle = Math.acos(cosAngle);
        return radianAngle;
      };

      const circleLine = function (x, y, r, startAngle, endAngle, color) {
        const geometry = new THREE.BufferGeometry();
        const arc = new THREE.ArcCurve(x, y, r, startAngle, endAngle, false);
        const points = arc.getSpacedPoints(80);
        geometry.setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: color || 0x0000FF });
        const line = new THREE.Line(geometry, material);
        return line;
      };

      const createFlyLine = function (radius, startAngle, endAngle, color) {
        const geometry = new THREE.BufferGeometry();
        const arc = new THREE.ArcCurve(0, 0, radius, startAngle, endAngle, false);
        const pointsArr = arc.getSpacedPoints(100);
        geometry.setFromPoints(pointsArr);
        
        const percentArr = [];
        for (let i = 0; i < pointsArr.length; i++) {
          percentArr.push(i / pointsArr.length);
        }
        const percentAttribute = new THREE.BufferAttribute(new Float32Array(percentArr), 1);
        geometry.setAttribute("percent", percentAttribute);
        
        const colorArr = [];
        for (let i = 0; i < pointsArr.length; i++) {
          const color1 = new THREE.Color(0xFFFFFF);
          const color2 = new THREE.Color(0xFFFFFF);
          const colorMixed = color1.lerp(color2, i / pointsArr.length);
          colorArr.push(colorMixed.r, colorMixed.g, colorMixed.b);
        }
        geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colorArr), 3));
        
        const size = 1.3;
        const material = new THREE.PointsMaterial({
          size,
          transparent: true,
          depthWrite: false,
          vertexColors: true
        });

        material.onBeforeCompile = function (shader) {
          shader.vertexShader = shader.vertexShader.replace(
            "void main() {",
            [
              "attribute float percent;",
              "void main() {",
            ].join("\n")
          );
          shader.vertexShader = shader.vertexShader.replace(
            "gl_PointSize = size;",
            ["gl_PointSize = percent * size;"].join("\n")
          );
        };

        const FlyLine = new THREE.Points(geometry, material);
        FlyLine.name = "name";
        return FlyLine;
      };

      const middleV3 = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
      const dir = middleV3.clone().normalize();
      const earthRadianAngle = radianAOB(startPoint, endPoint, new THREE.Vector3(0, 0, 0));
      const arcTopCoord = dir.multiplyScalar(radius + earthRadianAngle * radius * 0.2);
      const flyArcCenter = threePointCenter(startPoint, endPoint, arcTopCoord);
      const flyArcR = Math.abs(flyArcCenter.y - arcTopCoord.y);
      const flyRadianAngle = radianAOB(startPoint, new THREE.Vector3(0, -1, 0), flyArcCenter);
      const startAngle = -Math.PI / 2 + flyRadianAngle;
      const endAngle = Math.PI - startAngle;
      
      const arcline = circleLine(flyArcCenter.x, flyArcCenter.y, flyArcR, startAngle, endAngle, options.color);
      arcline.center = flyArcCenter;
      arcline.topCoord = arcTopCoord;

      const flyAngle = (endAngle - startAngle) / 7;
      const flyLine = createFlyLine(flyArcR, startAngle, startAngle + flyAngle, options.flyLineColor);
      flyLine.position.y = flyArcCenter.y;
      arcline.add(flyLine);
      flyLine.flyEndAngle = endAngle - startAngle - flyAngle;
      flyLine.startAngle = startAngle;
      flyLine.AngleZ = arcline.flyEndAngle * Math.random();
      arcline.userData["flyLine"] = flyLine;

      return arcline;
    }

    static flyArc(radius, lon1, lat1, lon2, lat2, options) {
      const _3Dto2D = function (startSphere, endSphere) {
        const origin = new THREE.Vector3(0, 0, 0);
        const startDir = startSphere.clone().sub(origin);
        const endDir = endSphere.clone().sub(origin);
        const normal = startDir.clone().cross(endDir).normalize();
        const xoyNormal = new THREE.Vector3(0, 0, 1);
        const quaternion3D_XOY = new THREE.Quaternion().setFromUnitVectors(normal, xoyNormal);

        const startSphereXOY = startSphere.clone().applyQuaternion(quaternion3D_XOY);
        const endSphereXOY = endSphere.clone().applyQuaternion(quaternion3D_XOY);

        const middleV3 = startSphereXOY.clone().add(endSphereXOY).multiplyScalar(0.5);
        const midDir = middleV3.clone().sub(origin).normalize();
        const yDir = new THREE.Vector3(0, 1, 0);
        const quaternionXOY_Y = new THREE.Quaternion().setFromUnitVectors(midDir, yDir);
        const startSpherXOY_Y = startSphereXOY.clone().applyQuaternion(quaternionXOY_Y);
        const endSphereXOY_Y = endSphereXOY.clone().applyQuaternion(quaternionXOY_Y);

        const quaternionInverse = quaternion3D_XOY.clone().invert().multiply(quaternionXOY_Y.clone().invert());
        return {
          quaternion: quaternionInverse,
          startPoint: startSpherXOY_Y,
          endPoint: endSphereXOY_Y,
        };
      }

      const sphereCoord1 = NetworkGlobe.Geometry.lon2xyz(radius, lon1, lat1);
      const startSphereCoord = new THREE.Vector3(sphereCoord1.x, sphereCoord1.y, sphereCoord1.z);
      const sphereCoord2 = NetworkGlobe.Geometry.lon2xyz(radius, lon2, lat2);
      const endSphereCoord = new THREE.Vector3(sphereCoord2.x, sphereCoord2.y, sphereCoord2.z);
      
      const startEndQua = _3Dto2D(startSphereCoord, endSphereCoord);
      const arcline = NetworkGlobe.Geometry.arcXOY(radius, startEndQua.startPoint, startEndQua.endPoint, options);
      arcline.quaternion.multiply(startEndQua.quaternion);
      return arcline;
    }
  }

  static EventEmitter = class {
    constructor() { this.events = {}; }
    on(event, listener) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(listener);
    }

    emit(event, ...args) {
      if (this.events[event]) {
        this.events[event].forEach(listener => listener(...args));
      }
    }
  }

  static Resources = class {
    constructor(config, callback) {
      this.config = config;
      this.callback = callback;
      this.textures = {};
      this.setLoadingManager();
      this.loadResources();
    }

    setLoadingManager() {
      this.manager = new THREE.LoadingManager();
      //this.manager.onStart = () => console.log("Starting.");
      this.manager.onLoad = () => this.callback();
      //this.manager.onProgress = (url) => console.log(`Loading： ${url}`);
      this.manager.onError = url => console.log("Error loading：" + url);
    }

    loadResources() {
      this.textureLoader = new THREE.TextureLoader(this.manager);
      this.config.forEach((item) => {
        this.textureLoader.load(item.url, (t) => {
          this.textures[item.name] = t;
        });
      });
    }
  }

  static Earth = class {
    constructor(options) {
      this.options = options;
      this.group = new THREE.Group();
      this.group.name = "group";
      this.group.scale.set(0, 0, 0);
      this.earthGroup = new THREE.Group();
      this.group.add(this.earthGroup);
      this.earthGroup.name = "EarthGroup";
      this.markupPoint = new THREE.Group();
      this.markupPoint.name = "markupPoint";
      this.waveMeshArr = [];
      this.circleLineList = [];
      this.circleList = [];
      this.isRotation = this.options.earth.isRotation;
      
      this.timeValue = 100;
      this.uniforms = {
        glowColor: { value: new THREE.Color(0xAAAAFF) },
        scale: { type: "f", value: -1.0 },
        bias: { type: "f", value: 1.0 },
        power: { type: "f", value: 3.3 },
        time: { type: "f", value: this.timeValue },
        isHover: { value: false },
        map: { value: null },
      };

      this.networkGlobe = options.networkGlobe;
    }

    async init() {
      const self = this;
    
      return new Promise(async (resolve) => {
        this.createEarth(self.options.geography);
        this.createEarthGlow();
        this.createEarthAperture();
        this.createBackGlow();
        this.createRotatingBeams();
        await this.createMarkupPoint();
        await this.createSpriteLabel();
        //this.createOrbits();
        this.createFlyLine();
        this.show();
        resolve();
      });
    }

    createEarth(geography) {
      const earth_geometry = new THREE.SphereGeometry(this.options.earth.radius, 50, 50);
      const earth_border = new THREE.SphereGeometry(this.options.earth.radius + 10, 60, 60);
      
      const pointMaterial = new THREE.PointsMaterial({
        color: 0x81FFFF,
        transparent: true,
        sizeAttenuation: true,
        opacity: 0.1,
        vertexColors: false,
        size: 0.01,
      });
      //const points = new THREE.Points(earth_border, pointMaterial);
      //this.earthGroup.add(points);

      if (geography === true) {
        this.uniforms.map.value = this.options.textures.earth;
      }

      const earth_material = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: this.networkGlobe.earthVertexShader,
        fragmentShader: this.networkGlobe.earthFragmentShader,
      });

      earth_material.needsUpdate = true;
      this.earth = new THREE.Mesh(earth_geometry, earth_material);
      this.earth.name = "earth";
      this.earthGroup.add(this.earth);
    }

    createBackGlow() {
      const R = this.options.earth.radius;

      const centered = false;
      let vertexShader;
      let fragmentShader;
      
      if (centered) {
        vertexShader = `
          varying vec3 vNormal;
          varying vec3 vPositionNormal;
          void main() {
            vNormal = normalize( normalMatrix * normal ); // Normal in view space
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          }
        `;

        fragmentShader = `
          varying vec3 vNormal;
          void main() {
            // Fresnel effect: dot product between normal and view direction (0,0,1)
            // We use the back of the sphere, so we invert the dot logic slightly
            float intensity = pow( 0.65 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) ), 4.0 ); 
            
            vec3 glowColor = vec3( 0.0, 0.2, 1.0 );
            
            // Crucial: Multiply alpha by intensity so the edges are 100% transparent
            gl_FragColor = vec4( glowColor, intensity );
          }
        `;
      } else {
        vertexShader = `
          varying vec3 vNormal;
          void main() {
            // Normal in view space: x+ is right, y+ is up
            vNormal = normalize( normalMatrix * normal ); 
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          }
        `;

        fragmentShader = `
          varying vec3 vNormal;
          void main() {
            // 1. Original Fresnel effect (the "halo" shape)
            float intensity = pow( 0.65 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) ), 4.0 ); 
            
            // 2. Create a mask for the straight left side.
            // vNormal.x is -1.0 on the far left. 
            // smoothstep(-1.0, 0.2, vNormal.x) means:
            // Everything at -1.0 (far left) is 0.0 (transparent)
            // It smoothly ramps up to 1.0 (full brightness) by the time it reaches 0.2 (just past center)
            float sideMask = smoothstep(-1.4, 0.1, vNormal.x);
            
            // 3. Apply the mask to the intensity
            intensity *= sideMask;

            vec3 glowColor = vec3( 0.0, 0.2, 1.0 );
            gl_FragColor = vec4( glowColor, intensity );
          }
        `;
      }

      const material = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.BackSide, 
        blending: THREE.AdditiveBlending, // Adds colors together without black borders
        transparent: true,
        depthWrite: false, // Prevents the "black box" clipping issue
        depthTest: true,
      });

      // Scale: 1.15 to 1.2 is usually the "sweet spot" for a tight halo
      const geometry = new THREE.SphereGeometry(R * 1.18, 64, 64);
      const glowMesh = new THREE.Mesh(geometry, material);
      if (!centered) {
        glowMesh.scale.y = 0.94;
        glowMesh.position.y += 0.8;
        glowMesh.position.x += 2.6;
      }
      const glowMeshGroup = new THREE.Group();
      glowMeshGroup.add(glowMesh);
      glowMeshGroup.scale.set(0.001, 0.001, 0.001);
      this.glowMesh = glowMeshGroup;
      this.networkGlobe.scene.add(glowMeshGroup);
    }

    createRotatingBeams() {
      this.beamGroup = new THREE.Group();
      this.beamGroup.name = "RotatingBeams";

      const beamMaterial = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: { color: { value: new THREE.Color(0x0033FF) } },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform vec3 color;
          void main() {
            // Fade out at the edges (u-axis) and fade out further from center (v-axis)
            float strength = (1.0 - abs(vUv.x - 0.5) * 2.0) * (1.0 - vUv.y);
            gl_FragColor = vec4(color, strength * 0.6);
          }
        `
      });

      const beamWidth = this.options.earth.radius * 2;
      const beamLength = this.options.earth.radius * 8;
      const beamGeo = new THREE.PlaneGeometry(beamWidth, beamLength);

      beamGeo.translate(0, beamLength / 2, 0);

      const beam1 = new THREE.Mesh(beamGeo, beamMaterial);
      beam1.rotation.z = 2 * Math.PI * (1 / 3);
      beam1.rotation.y = Math.PI / 4; // Angle it towards the viewer.
      
      const beam2 = new THREE.Mesh(beamGeo, beamMaterial);
      beam2.rotation.z = 2 * Math.PI * (2 / 3);
      beam2.rotation.x = Math.PI / 4; // Angle it towards the viewer.

      const beam3 = new THREE.Mesh(beamGeo, beamMaterial);
      beam3.rotation.z = 0;
      beam3.rotation.x = Math.PI / 4; // Angle it towards the viewer.

      this.beamGroup.add(beam1, beam2, beam3);
      this.beamGroup.position.z = -100;
      
      this.beamGroup.scale.set(0.001, 0.001, 0.001);
      
      return this.beamGroup;
    }

    createEarthGlow() {
      const R = this.options.earth.radius;
      const texture = this.options.textures.glow;
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        color: 0x2222FF,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(R * 3.0, R * 3.0, 1);
      this.earthGroup.add(sprite);
    }

    createEarthAperture() {
      const vertexShader = `
        varying vec3 vVertexWorldPosition;
        varying vec3 vVertexNormal;
        varying vec4 vFragColor;
        void main(){
          vVertexNormal = normalize(normalMatrix * normal);
          vVertexWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;
        
      const fragmentShader = `
        uniform vec3 glowColor;
        uniform float coeficient;
        uniform float power;
        varying vec3 vVertexNormal;
        varying vec3 vVertexWorldPosition;
        varying vec4 vFragColor;
        void main(){
          vec3 worldCameraToVertex = vVertexWorldPosition - cameraPosition;
          vec3 viewCameraToVertex = (viewMatrix * vec4(worldCameraToVertex, 0.0)).xyz;
          viewCameraToVertex = normalize(viewCameraToVertex);
          float intensity = pow(coeficient + dot(vVertexNormal, viewCameraToVertex), power);
          gl_FragColor = vec4(glowColor, intensity);
        }
      `;

      const uniforms = {
        coeficient: { type: "f", value: 1.0 },
        power: { type: "f", value: 3 },
        glowColor: { type: "c", value: new THREE.Color(0x4390d1) },
      };

      const material1 = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        blending: THREE.NormalBlending,
        transparent: true,
        depthWrite: false,
      });
        
      const sphere = new THREE.SphereGeometry(this.options.earth.radius + 0, 50, 50);
      const mesh = new THREE.Mesh(sphere, material1);
      this.earthGroup.add(mesh);
    }

    createWaveMesh(options) {
      const geometry = new THREE.PlaneGeometry(1, 1);
      const texture = options.textures.aperture;

      const material = new THREE.MeshBasicMaterial({
        color: 0xAAAAFF,
        map: texture,
        transparent: true,
        opacity: 1.0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const coord = NetworkGlobe.Geometry.lon2xyz(options.radius * 1.001, options.lon, options.lat);
      const size = options.radius * 0.12;
      mesh.scale.set(size, size, size);
      mesh.userData["size"] = size;
      mesh.userData["scale"] = Math.random() * 1.0;
      mesh.position.set(coord.x, coord.y, coord.z);
      const coordVec3 = new THREE.Vector3(coord.x, coord.y, coord.z).normalize();
      const meshNormal = new THREE.Vector3(0, 0, 1);
      mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3);
      return mesh;
    }

    createLightPillar(options) {
      const height = options.radius * 0.3;
      const geometry = new THREE.PlaneGeometry(options.radius * 0.05, height);
      geometry.rotateX(Math.PI / 2);
      geometry.translate(0, 0, height / 2);
      const material = new THREE.MeshBasicMaterial({
        map: options.textures.pillar,
        color: options.index == 0 ? options.punctuation.lightColumn.startColor : options.punctuation.lightColumn.endColor,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const group = new THREE.Group();
      group.add(mesh, mesh.clone().rotateZ(Math.PI / 2));
      const SphereCoord = NetworkGlobe.Geometry.lon2xyz(options.radius, options.lon, options.lat);
      group.position.set(SphereCoord.x, SphereCoord.y, SphereCoord.z);
      const coordVec3 = new THREE.Vector3(SphereCoord.x, SphereCoord.y, SphereCoord.z).normalize();
      const meshNormal = new THREE.Vector3(0, 0, 1);
      group.quaternion.setFromUnitVectors(meshNormal, coordVec3);
      return group;
    }

    createPointMesh(options) {
      const geometry = new THREE.PlaneGeometry(1, 1);
      const mesh = new THREE.Mesh(geometry, options.material);
      const coord = NetworkGlobe.Geometry.lon2xyz(options.radius * 1.001, options.lon, options.lat);
      const size = options.radius * 0.05;
      mesh.scale.set(size, size, size);
      mesh.position.set(coord.x, coord.y, coord.z);
      const coordVec3 = new THREE.Vector3(coord.x, coord.y, coord.z).normalize();
      const meshNormal = new THREE.Vector3(0, 0, 1);
      mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3);
      return mesh;
    }

    async createMarkupPoint() {
      const self = this;
    
      await Promise.all(this.options.data.map(async (item) => {
        const radius = this.options.earth.radius;
        const lon = item.startArray.E;
        const lat = item.startArray.N;
        
        this.punctuationMaterial = new THREE.MeshBasicMaterial({
          color: this.options.punctuation.circleColor,
          map: this.options.textures.label,
          transparent: true,
          depthWrite: false,
        });

        const mesh = self.createPointMesh({ radius, lon, lat, material: this.punctuationMaterial });
        this.markupPoint.add(mesh);
        
        const LightPillar = self.createLightPillar({
          radius: this.options.earth.radius,
          lon,
          lat,
          index: 0,
          textures: this.options.textures,
          punctuation: this.options.punctuation,
        });
        this.markupPoint.add(LightPillar);
        
        const WaveMesh = self.createWaveMesh({ radius, lon, lat, textures: this.options.textures });
        this.markupPoint.add(WaveMesh);
        this.waveMeshArr.push(WaveMesh);

        await Promise.all(item.endArray.map((obj) => {
          const lon = obj.E;
          const lat = obj.N;
          const mesh = self.createPointMesh({ radius, lon, lat, material: this.punctuationMaterial });
          this.markupPoint.add(mesh);
          
          const LightPillar = self.createLightPillar({
            radius: this.options.earth.radius,
            lon,
            lat,
            index: 1,
            textures: this.options.textures,
            punctuation: this.options.punctuation
          });
          this.markupPoint.add(LightPillar);
          
          const WaveMesh = self.createWaveMesh({ radius, lon, lat, textures: this.options.textures });
          this.markupPoint.add(WaveMesh);
          this.waveMeshArr.push(WaveMesh);
        }));
        this.earthGroup.add(this.markupPoint);
      }));
    }

    async createSpriteLabel() {
      const self = this;

      await Promise.all(this.options.data.map(async item => {
        let cityArry = [item.startArray, ...item.endArray];

        cityArry.forEach(e => {
          const p = NetworkGlobe.Geometry.lon2xyz(this.options.earth.radius * 1.001, e.E, e.N);
          const { texture, width, height } = self.networkGlobe.createTextTexture(e.name);

          const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: true,
            depthWrite: false
          });

          const sprite = new THREE.Sprite(material);
          
          // Adjust scale relative to globe radius
          // width/height ratio keeps the box from stretching
          const aspectRatio = width / height;
          const labelSize = 3; 
          sprite.scale.set(labelSize * aspectRatio, labelSize, 1);

          // Offset the sprite slightly further out so it doesn't clip the light pillars.
          const offset = 1.15;
          sprite.position.set(p.x * offset, p.y * offset, p.z * offset);

          this.earthGroup.add(sprite);
        });
      }));
    }

    getCirclePoints(option) {
      const list = [];
      for (let j = 0; j < 2 * Math.PI - 0.1; j += (2 * Math.PI) / (option.number || 100)) {
        list.push([
          parseFloat((Math.cos(j) * (option.radius || 10)).toFixed(2)),
          0,
          parseFloat((Math.sin(j) * (option.radius || 10)).toFixed(2)),
        ]);
      }
      if (option.closed) list.push(list[0]);
      return list;
    }

    createAnimateLine(option) {
      const l = [];
      option.pointList.forEach((e) => l.push(new THREE.Vector3(e[0], e[1], e[2])));
      const curve = new THREE.CatmullRomCurve3(l);
      const tubeGeometry = new THREE.TubeGeometry(
        curve,
        option.number || 50,
        option.radius || 1,
        option.radialSegments
      );
      return new THREE.Mesh(tubeGeometry, option.material);
    }

    createOrbits() {
      const self = this;
    
      const list = self.getCirclePoints({ radius: this.options.earth.radius + 15, number: 150, closed: true });
      const mat = new THREE.MeshBasicMaterial({
        color: "#FFFFFF",
        transparent: true,
        opacity: 0.02,
        side: THREE.DoubleSide,
      });
      const line = self.createAnimateLine({pointList: list, material: mat, number: 100, radius: 0.1 });
      this.earthGroup.add(line);

      const l2 = line.clone();
      l2.scale.set(1.2, 1.2, 1.2);
      l2.rotateZ(Math.PI / 6);
      this.earthGroup.add(l2);

      const l3 = line.clone();
      l3.scale.set(0.8, 0.8, 0.8);
      l3.rotateZ(-Math.PI / 6);
      this.earthGroup.add(l3);
      
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(this.options.satellite.size, 32, 32),
        new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.3 })
      );
      const ball2 = new THREE.Mesh(
        new THREE.SphereGeometry(this.options.satellite.size, 32, 32),
        new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.3 })
      );
      const ball3 = new THREE.Mesh(
        new THREE.SphereGeometry(this.options.satellite.size, 32, 32),
        new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.3 })
      );

      this.circleLineList.push(line, l2, l3);
      ball.name = ball2.name = ball3.name = "...";

      for (let i = 0; i < this.options.satellite.number; i++) {
        const ball01 = ball.clone();
        const num = Math.floor(list.length / this.options.satellite.number);
        ball01.position.set(list[num * (i + 1)][0], list[num * (i + 1)][1], list[num * (i + 1)][2]);
        line.add(ball01);

        const ball02 = ball2.clone();
        const num02 = Math.floor(list.length / this.options.satellite.number);
        ball02.position.set(list[num02 * (i + 1)][0], list[num02 * (i + 1)][1], list[num02 * (i + 1)][2]);
        l2.add(ball02);

        const ball03 = ball3.clone();
        const num03 = Math.floor(list.length / this.options.satellite.number);
        ball03.position.set(list[num03 * (i + 1)][0], list[num03 * (i + 1)][1], list[num03 * (i + 1)][2]);
        l3.add(ball03);
      }
    }

    createFlyLine() {
      this.flyLineArcGroup = new THREE.Group();
      this.flyLineArcGroup.userData["flyLineArray"] = [];
      this.earthGroup.add(this.flyLineArcGroup);

      this.options.data.forEach((cities) => {
        cities.endArray.forEach(item => {
          const arcline = NetworkGlobe.Geometry.flyArc(
            this.options.earth.radius, cities.startArray.E, cities.startArray.N, item.E, item.N, this.options.flyLine
          );
          this.flyLineArcGroup.add(arcline);
          this.flyLineArcGroup.userData["flyLineArray"].push(arcline.userData["flyLine"]);
        });
      });
    }

    show() {
      const self = this;

      gsap.to(self.group.scale, {
        x: 1, y: 1, z: 1,
        duration: 1.5,
        ease: "power2.inOut",
      });
      gsap.to(self.glowMesh.scale, {
        x: 1, y: 1, z: 1,
        duration: 1.5,
        ease: "power2.inOut",
      });
      setTimeout(function () {
        gsap.to(self.beamGroup.scale, {
          x: 1, y: 1, z: 1,
          duration: 1,
          ease: "power2.inOut",
        });
      }, 500);
    }

    render() {
      if(this.flyLineArcGroup && this.flyLineArcGroup.userData["flyLineArray"]) {
        this.flyLineArcGroup.userData["flyLineArray"].forEach(fly => {
          fly.rotation.z += this.options.flyLine.speed;
          if (fly.rotation.z >= fly.flyEndAngle) fly.rotation.z = 0;
        });
      }

      if (this.beamGroup) {
        this.beamGroup.rotation.z += 0.001;
      }

      if (this.isRotation) {
        this.earthGroup.rotation.y += this.options.earth.rotateSpeed;
      }

      this.circleLineList.forEach((e) => {
        e.rotateY(this.options.satellite.rotateSpeed);
      });

      this.uniforms.time.value = this.uniforms.time.value < -this.timeValue
        ? this.timeValue
        : this.uniforms.time.value - 1;

      if (this.waveMeshArr.length) {
        this.waveMeshArr.forEach((mesh) => {
          mesh.userData["scale"] += 0.007;
          mesh.scale.set(
            mesh.userData["size"] * mesh.userData["scale"],
            mesh.userData["size"] * mesh.userData["scale"],
            mesh.userData["size"] * mesh.userData["scale"]
          );
          if (mesh.userData["scale"] <= 1.5) {
            mesh.material.opacity = (mesh.userData["scale"] - 1) * 2;
          } else if (mesh.userData["scale"] > 1.5 && mesh.userData["scale"] <= 2) {
            mesh.material.opacity = 1 - (mesh.userData["scale"] - 1.5) * 2;
          } else {
            mesh.userData["scale"] = 1;
          }
        });
      }
    }
  }

  static Sizes = class {
    constructor(options) {
      this.emitter = new NetworkGlobe.EventEmitter();
      this.$sizeViewport = options.dom;
      this.viewport = { width: 0, height: 0 };
      this.resize = this.resize.bind(this);
      window.addEventListener("resize", this.resize);
      this.resize();
    }

    $on(event, fun) {
      this.emitter.on(event, fun);
    }

    resize() {
      this.viewport.width = this.$sizeViewport.offsetWidth;
      this.viewport.height = this.$sizeViewport.offsetHeight;
      this.emitter.emit("resize");
    }
  }

  createTextTexture(text) {
    const self = this;
  
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    const fontSize = 48; // High res for sharp text.
    const padding = 20;
    ctx.font = `Bold ${fontSize}px Arial`;
    
    // Measure text to size the box.
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const boxWidth = textWidth + (padding * 2);
    const boxHeight = fontSize + (padding * 1.5);

    // Set canvas size with slight padding for the border stroke.
    canvas.width = boxWidth + 10; 
    canvas.height = boxHeight + 10;

    // 2. Draw the box background.
    ctx.beginPath();
    ctx.rect(5, 5, boxWidth, boxHeight);
    ctx.fillStyle = "rgba(0, 0, 114, 0.7)"; 
    ctx.fill();

    // 3. Draw the border.
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();

    // 4. Draw the text.
    ctx.font = `Bold ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(text, (boxWidth / 2) + 5, (boxHeight / 2) + 5); // Center.

    // Use standard filtering to ensure the text looks sharp at distance.
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = self.renderer.capabilities.getMaxAnisotropy();

    return { texture, width: canvas.width, height: canvas.height };
  }

  async createEarth(data) {
    this.earth = new NetworkGlobe.Earth({
      data: data,
      dom: this.option.dom,
      textures: this.resources.textures,
      earth: { radius: 50, rotateSpeed: 0.002, isRotation: true },
      satellite: { show: true, rotateSpeed: -0.01, size: 1, number: 2 },
      punctuation: {
        circleColor: 0x0000FF,
        lightColumn: { startColor: 0xe4007f, endColor: 0xffffff },
      },
      flyLine: { color: 0x8888FF, flyLineColor: 0xFFFFFF, speed: 0.004 },
      geography: true,
      networkGlobe: this
    });

    this.scene.add(this.earth.group);
    await this.earth.init();

    if (this.earth.beamGroup) {
      this.scene.add(this.earth.beamGroup);
    }

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const canvas = this.renderer.domElement;

    canvas.addEventListener("mousedown", () => { isDragging = true; });
    canvas.addEventListener("mouseup", () => { isDragging = false; });
    canvas.addEventListener("mousemove", (e) => {
      if (isDragging) {
        const deltaMove = {
          x: e.offsetX - previousMousePosition.x,
          y: e.offsetY - previousMousePosition.y
        };

        const deltaRotationQuaternion =
          new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
              (deltaMove.y * Math.PI) / 180 * 0.3, 
              (deltaMove.x * Math.PI) / 180 * 0.3,
              0,
              "XYZ"
            ));

        //this.earth.earthGroup.quaternion.multiplyQuaternions(deltaRotationQuaternion, this.earth.earthGroup.quaternion);
        this.earth.earthGroup.rotation.y += deltaMove.x * 0.001;
        this.earth.earthGroup.rotation.x = Math.min(
          Math.max(
            this.earth.earthGroup.rotation.x + deltaMove.y * 0.001,
            -Math.PI / 8
          ),
          Math.PI / 6
        );
      }
      previousMousePosition = { x: e.offsetX, y: e.offsetY };
    });

    if (this.zoom) {
      canvas.addEventListener("wheel", (e) => {
        e.preventDefault(); // Prevent page scroll.
        const zoomSpeed = 0.02;
        const minZoom = 150;
        const maxZoom = 500;
        let newZ = this.camera.position.z + e.deltaY * zoomSpeed;
        let newY = this.camera.position.y + e.deltaY * zoomSpeed * 0.15;
        this.camera.position.z = Math.max(minZoom, Math.min(maxZoom, newZ));
        if (newZ >= minZoom && newZ <= maxZoom) {
          this.camera.position.y = newY;
        }
      }, { passive: false });
    }

    this.camera.position.z = 250;
  }

  constructor(dom, getCanvasRef, data, geography, zoom) {
    const self = this;
    
    this.earthVertexShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vp;
      varying vec3 vPositionNormal;
      void main(void){
        vUv = uv;
        vNormal = normalize( normalMatrix * normal );
        vp = position;
        vPositionNormal = normalize(( modelViewMatrix * vec4(position, 1.0) ).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `;

    this.earthFragmentShader = `
      uniform vec3 glowColor;
      uniform float bias;
      uniform float power;
      uniform float time;
      varying vec3 vp;
      varying vec3 vNormal;
      varying vec3 vPositionNormal;
      uniform float scale;
      uniform sampler2D map;
      varying vec2 vUv;

      void main(void){
        float a = pow( bias + scale * abs(dot(vNormal, vPositionNormal)), power );
        if(vp.y > time && vp.y < time + 20.0) {
            float t = smoothstep(0.0, 0.8, (1.0 - abs(0.5 - (vp.y - time) / 20.0)) / 3.0 );
            gl_FragColor = mix(gl_FragColor, vec4(glowColor, 1.0), t * t );
        }
        gl_FragColor = mix(gl_FragColor, vec4( glowColor, 1.0 ), a);
        // float b = 0.8; // Unused in original logic but preserved variable declaration
        gl_FragColor = gl_FragColor + texture2D( map, vUv );
      }
    `;

    this.option = {dom: dom};
    this.geography = geography === undefined ? true : geography;
    this.zoom = zoom === undefined ? false : zoom;

    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas: getCanvasRef() });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100000);
    this.camera.position.set(0, 30, -250);
    this.camera.rotation.x -= 0.15;
    this.camera.rotation.y += 0.3;

    this.sizes = new NetworkGlobe.Sizes({ dom: dom });

    this.sizes.$on("resize", () => {
      const newWidth = Number(this.sizes.viewport.width);
      const newHeight = window.innerHeight;
      if (newHeight >= 700) { // Respect CSS minimum.
        this.renderer.setSize(newWidth, window.innerHeight);
        this.camera.aspect = newWidth / newHeight;
        this.camera.updateProjectionMatrix();
      }
    });

    const assets = [
      "gradient", "label", "aperture", "glow", "pillar", "earth"
    ].map(item => { return { name: item, url: "./images/earth/" + item + ".png" }; });
    this.resources = new NetworkGlobe.Resources(assets, async () => {
      await this.createEarth(data);
      this.render();
    });
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    if (this.controls) this.controls.update();
    if (this.earth) this.earth.render();
  }

  unload(animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    this.renderer.dispose();
    this.scene.clear();
  }
}

export const networkExampleData = [
  {
    startArray: { name: "nilCC", N: 42.3555, E: -71.0565 },
    endArray: [
      { name: "nilUV", N: 53.3498, E: 6.2603 },
      { name: "nilUV", N: 50.1143, E: 8.6841 },
      { name: "nilUV", N: 50.1109, E: 8.6821 },
      { name: "nilUV", N: -34.6037, E: -58.3815 },
      { name: "nilUV", N: 43.8041, E: -120.5542, },
    ]
  },
  {
    startArray: { name: "nilCC", N: 42.3555, E: -71.0565, },
    endArray: [{ name: "nilUV", N: 53.3498, E: 6.2603 }]
  },
  {
    startArray: { name: "nilCC", N: 1.2902, E: 103.8519, },
    endArray: [{ name: "nilUV", N: -31.9535, E: 115.8570 }]
  }
];
