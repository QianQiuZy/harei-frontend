'use client';

type Cleanup = () => void;
type Color = readonly [number, number, number];

type Rocket = {
  originX: number;
  originY: number;
  velocityX: number;
  velocityY: number;
  launchTime: number;
  explodeAt: number;
  explodeX: number;
  explodeY: number;
  size: number;
  color: Color;
};

type Particle = {
  originX: number;
  originY: number;
  velocityX: number;
  velocityY: number;
  startTime: number;
  life: number;
  size: number;
  color: Color;
};

type RocketProgram = {
  program: WebGLProgram;
  attributes: {
    origin: number;
    velocity: number;
    startTime: number;
    size: number;
    color: number;
  };
  uniforms: {
    resolution: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
    gravity: WebGLUniformLocation | null;
  };
};

type ParticleProgram = {
  program: WebGLProgram;
  attributes: {
    origin: number;
    velocity: number;
    startTime: number;
    life: number;
    size: number;
    color: number;
  };
  uniforms: {
    resolution: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
    gravity: WebGLUniformLocation | null;
  };
};

const COLORS: readonly Color[] = [
  [1, 0.843, 0],
  [1, 0.302, 0.31],
  [1, 0.478, 0.271],
  [1, 0.663, 0.271],
  [0.729, 0.902, 0.216],
  [0.184, 0.329, 0.922],
  [0.075, 0.761, 0.761],
  [0.322, 0.769, 0.102],
  [0.969, 0.349, 0.671],
  [0.573, 0.329, 0.871],
  [0.212, 0.812, 0.788],
  [0.251, 0.663, 1],
] as const;

const MAX_DEVICE_PIXEL_RATIO = 2;
const LAUNCH_INTERVAL_SECONDS = 0.28;
const MAX_ROCKETS = 8;
const MAX_PARTICLES = 1800;
const ROCKET_GRAVITY = 820;
const PARTICLE_GRAVITY = 170;
const PARTICLE_COUNT_MIN = 80;
const PARTICLE_COUNT_MAX = 120;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomInteger(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1));
}

function pickColor(): Color {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function resizeCanvas(canvas: HTMLCanvasElement, onResize?: (width: number, height: number) => void) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
  const scaledWidth = Math.max(1, Math.round(width * pixelRatio));
  const scaledHeight = Math.max(1, Math.round(height * pixelRatio));

  canvas.width = scaledWidth;
  canvas.height = scaledHeight;

  onResize?.(scaledWidth, scaledHeight);
  return pixelRatio;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: GLenum,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Failed to create WebGL shader.');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? 'Unknown shader compile error.';
    gl.deleteShader(shader);
    throw new Error(info);
  }

  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error('Failed to create WebGL program.');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) ?? 'Unknown program link error.';
    gl.deleteProgram(program);
    throw new Error(info);
  }

  return program;
}

function createRocketProgram(gl: WebGLRenderingContext): RocketProgram {
  const program = createProgram(
    gl,
    `
      attribute vec2 a_origin;
      attribute vec2 a_velocity;
      attribute float a_start_time;
      attribute float a_size;
      attribute vec3 a_color;

      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_gravity;

      varying vec3 v_color;
      varying float v_alpha;

      void main() {
        float age = max(0.0, u_time - a_start_time);
        vec2 position = a_origin + vec2(
          a_velocity.x * age,
          a_velocity.y * age + 0.5 * u_gravity * age * age
        );

        vec2 clip = vec2(
          position.x / u_resolution.x * 2.0 - 1.0,
          1.0 - position.y / u_resolution.y * 2.0
        );

        gl_Position = vec4(clip, 0.0, 1.0);
        gl_PointSize = a_size;
        v_color = a_color;
        v_alpha = clamp(1.0 - age * 0.45, 0.4, 1.0);
      }
    `,
    `
      precision mediump float;

      varying vec3 v_color;
      varying float v_alpha;

      void main() {
        vec2 centered = gl_PointCoord * 2.0 - 1.0;
        float distance_to_center = dot(centered, centered);

        if (distance_to_center > 1.0) {
          discard;
        }

        float glow = smoothstep(1.0, 0.0, distance_to_center);
        gl_FragColor = vec4(v_color * 1.15, glow * v_alpha);
      }
    `,
  );

  return {
    program,
    attributes: {
      origin: gl.getAttribLocation(program, 'a_origin'),
      velocity: gl.getAttribLocation(program, 'a_velocity'),
      startTime: gl.getAttribLocation(program, 'a_start_time'),
      size: gl.getAttribLocation(program, 'a_size'),
      color: gl.getAttribLocation(program, 'a_color'),
    },
    uniforms: {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      gravity: gl.getUniformLocation(program, 'u_gravity'),
    },
  };
}

function createParticleProgram(gl: WebGLRenderingContext): ParticleProgram {
  const program = createProgram(
    gl,
    `
      attribute vec2 a_origin;
      attribute vec2 a_velocity;
      attribute float a_start_time;
      attribute float a_life;
      attribute float a_size;
      attribute vec3 a_color;

      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_gravity;

      varying vec3 v_color;
      varying float v_alpha;

      void main() {
        float age = u_time - a_start_time;

        if (age < 0.0 || age > a_life) {
          gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
          gl_PointSize = 0.0;
          v_alpha = 0.0;
          v_color = a_color;
          return;
        }

        vec2 position = a_origin + vec2(
          a_velocity.x * age,
          a_velocity.y * age + 0.5 * u_gravity * age * age
        );

        vec2 clip = vec2(
          position.x / u_resolution.x * 2.0 - 1.0,
          1.0 - position.y / u_resolution.y * 2.0
        );

        float life_progress = age / a_life;
        gl_Position = vec4(clip, 0.0, 1.0);
        gl_PointSize = a_size * (0.75 + (1.0 - life_progress) * 0.55);
        v_color = a_color;
        v_alpha = pow(1.0 - life_progress, 1.6);
      }
    `,
    `
      precision mediump float;

      varying vec3 v_color;
      varying float v_alpha;

      void main() {
        vec2 centered = gl_PointCoord * 2.0 - 1.0;
        float distance_to_center = dot(centered, centered);

        if (distance_to_center > 1.0) {
          discard;
        }

        float glow = smoothstep(1.0, 0.0, distance_to_center);
        gl_FragColor = vec4(v_color * 1.2, glow * v_alpha);
      }
    `,
  );

  return {
    program,
    attributes: {
      origin: gl.getAttribLocation(program, 'a_origin'),
      velocity: gl.getAttribLocation(program, 'a_velocity'),
      startTime: gl.getAttribLocation(program, 'a_start_time'),
      life: gl.getAttribLocation(program, 'a_life'),
      size: gl.getAttribLocation(program, 'a_size'),
      color: gl.getAttribLocation(program, 'a_color'),
    },
    uniforms: {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      gravity: gl.getUniformLocation(program, 'u_gravity'),
    },
  };
}

function createRocket(
  width: number,
  height: number,
  now: number,
  pixelRatio: number,
): Rocket {
  const originX = randomBetween(width * 0.08, width * 0.92);
  const originY = height + 32 * pixelRatio;
  const explodeX = originX + randomBetween(-width * 0.08, width * 0.08);
  const explodeY = randomBetween(height * 0.16, height * 0.55);
  const flightDuration = randomBetween(0.9, 1.3);
  const velocityX = (explodeX - originX) / flightDuration;
  const velocityY = (
    explodeY - originY - 0.5 * ROCKET_GRAVITY * flightDuration * flightDuration
  ) / flightDuration;

  return {
    originX,
    originY,
    velocityX,
    velocityY,
    launchTime: now,
    explodeAt: now + flightDuration,
    explodeX,
    explodeY,
    size: randomBetween(5.5, 7.5) * pixelRatio,
    color: pickColor(),
  };
}

function spawnParticles(
  rocket: Rocket,
  now: number,
  pixelRatio: number,
  particles: Particle[],
) {
  const count = randomInteger(PARTICLE_COUNT_MIN, PARTICLE_COUNT_MAX);

  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomBetween(70, 190) * pixelRatio;

    particles.push({
      originX: rocket.explodeX,
      originY: rocket.explodeY,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      startTime: now,
      life: randomBetween(0.9, 1.35),
      size: randomBetween(4.2, 7.2) * pixelRatio,
      color: rocket.color,
    });
  }

  if (particles.length > MAX_PARTICLES) {
    particles.splice(0, particles.length - MAX_PARTICLES);
  }
}

function createWebglBirthdayFireworks(canvas: HTMLCanvasElement): Cleanup | undefined {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
  });

  if (!gl) {
    return undefined;
  }

  let pixelRatio = 1;
  let animationFrameId = 0;
  const startedAt = performance.now();
  let lastLaunchTime = -LAUNCH_INTERVAL_SECONDS;
  const rockets: Rocket[] = [];
  const particles: Particle[] = [];

  const rocketProgram = createRocketProgram(gl);
  const particleProgram = createParticleProgram(gl);
  const rocketBuffer = gl.createBuffer();
  const particleBuffer = gl.createBuffer();

  if (!rocketBuffer || !particleBuffer) {
    if (rocketBuffer) {
      gl.deleteBuffer(rocketBuffer);
    }
    if (particleBuffer) {
      gl.deleteBuffer(particleBuffer);
    }
    gl.deleteProgram(rocketProgram.program);
    gl.deleteProgram(particleProgram.program);
    throw new Error('Failed to create WebGL buffers for fireworks.');
  }

  gl.clearColor(0, 0, 0, 0);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  const handleResize = () => {
    pixelRatio = resizeCanvas(canvas, (width, height) => {
      gl.viewport(0, 0, width, height);
    });
  };

  const drawRockets = (now: number) => {
    if (!rockets.length) {
      return;
    }

    const data = new Float32Array(rockets.length * 9);

    for (let index = 0; index < rockets.length; index += 1) {
      const rocket = rockets[index];
      const offset = index * 9;

      data[offset + 0] = rocket.originX;
      data[offset + 1] = rocket.originY;
      data[offset + 2] = rocket.velocityX;
      data[offset + 3] = rocket.velocityY;
      data[offset + 4] = rocket.launchTime;
      data[offset + 5] = rocket.size;
      data[offset + 6] = rocket.color[0];
      data[offset + 7] = rocket.color[1];
      data[offset + 8] = rocket.color[2];
    }

    gl.useProgram(rocketProgram.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, rocketBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);

    const stride = 9 * Float32Array.BYTES_PER_ELEMENT;
    gl.enableVertexAttribArray(rocketProgram.attributes.origin);
    gl.vertexAttribPointer(rocketProgram.attributes.origin, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(rocketProgram.attributes.velocity);
    gl.vertexAttribPointer(
      rocketProgram.attributes.velocity,
      2,
      gl.FLOAT,
      false,
      stride,
      2 * Float32Array.BYTES_PER_ELEMENT,
    );
    gl.enableVertexAttribArray(rocketProgram.attributes.startTime);
    gl.vertexAttribPointer(
      rocketProgram.attributes.startTime,
      1,
      gl.FLOAT,
      false,
      stride,
      4 * Float32Array.BYTES_PER_ELEMENT,
    );
    gl.enableVertexAttribArray(rocketProgram.attributes.size);
    gl.vertexAttribPointer(
      rocketProgram.attributes.size,
      1,
      gl.FLOAT,
      false,
      stride,
      5 * Float32Array.BYTES_PER_ELEMENT,
    );
    gl.enableVertexAttribArray(rocketProgram.attributes.color);
    gl.vertexAttribPointer(
      rocketProgram.attributes.color,
      3,
      gl.FLOAT,
      false,
      stride,
      6 * Float32Array.BYTES_PER_ELEMENT,
    );

    gl.uniform2f(rocketProgram.uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(rocketProgram.uniforms.time, now);
    gl.uniform1f(rocketProgram.uniforms.gravity, ROCKET_GRAVITY);
    gl.drawArrays(gl.POINTS, 0, rockets.length);
  };

  const drawParticles = (now: number) => {
    if (!particles.length) {
      return;
    }

    const data = new Float32Array(particles.length * 10);

    for (let index = 0; index < particles.length; index += 1) {
      const particle = particles[index];
      const offset = index * 10;

      data[offset + 0] = particle.originX;
      data[offset + 1] = particle.originY;
      data[offset + 2] = particle.velocityX;
      data[offset + 3] = particle.velocityY;
      data[offset + 4] = particle.startTime;
      data[offset + 5] = particle.life;
      data[offset + 6] = particle.size;
      data[offset + 7] = particle.color[0];
      data[offset + 8] = particle.color[1];
      data[offset + 9] = particle.color[2];
    }

    gl.useProgram(particleProgram.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);

    const stride = 10 * Float32Array.BYTES_PER_ELEMENT;
    gl.enableVertexAttribArray(particleProgram.attributes.origin);
    gl.vertexAttribPointer(particleProgram.attributes.origin, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(particleProgram.attributes.velocity);
    gl.vertexAttribPointer(
      particleProgram.attributes.velocity,
      2,
      gl.FLOAT,
      false,
      stride,
      2 * Float32Array.BYTES_PER_ELEMENT,
    );
    gl.enableVertexAttribArray(particleProgram.attributes.startTime);
    gl.vertexAttribPointer(
      particleProgram.attributes.startTime,
      1,
      gl.FLOAT,
      false,
      stride,
      4 * Float32Array.BYTES_PER_ELEMENT,
    );
    gl.enableVertexAttribArray(particleProgram.attributes.life);
    gl.vertexAttribPointer(
      particleProgram.attributes.life,
      1,
      gl.FLOAT,
      false,
      stride,
      5 * Float32Array.BYTES_PER_ELEMENT,
    );
    gl.enableVertexAttribArray(particleProgram.attributes.size);
    gl.vertexAttribPointer(
      particleProgram.attributes.size,
      1,
      gl.FLOAT,
      false,
      stride,
      6 * Float32Array.BYTES_PER_ELEMENT,
    );
    gl.enableVertexAttribArray(particleProgram.attributes.color);
    gl.vertexAttribPointer(
      particleProgram.attributes.color,
      3,
      gl.FLOAT,
      false,
      stride,
      7 * Float32Array.BYTES_PER_ELEMENT,
    );

    gl.uniform2f(particleProgram.uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(particleProgram.uniforms.time, now);
    gl.uniform1f(particleProgram.uniforms.gravity, PARTICLE_GRAVITY);
    gl.drawArrays(gl.POINTS, 0, particles.length);
  };

  const draw = (frameTime: number) => {
    const now = (frameTime - startedAt) / 1000;

    if (now - lastLaunchTime >= LAUNCH_INTERVAL_SECONDS && rockets.length < MAX_ROCKETS) {
      rockets.push(createRocket(canvas.width, canvas.height, now, pixelRatio));
      lastLaunchTime = now;
    }

    for (let index = rockets.length - 1; index >= 0; index -= 1) {
      const rocket = rockets[index];

      if (now >= rocket.explodeAt) {
        spawnParticles(rocket, now, pixelRatio, particles);
        rockets.splice(index, 1);
      }
    }

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];

      if (now - particle.startTime >= particle.life) {
        particles.splice(index, 1);
      }
    }

    gl.clear(gl.COLOR_BUFFER_BIT);
    drawRockets(now);
    drawParticles(now);
    animationFrameId = window.requestAnimationFrame(draw);
  };

  handleResize();
  window.addEventListener('resize', handleResize);
  animationFrameId = window.requestAnimationFrame(draw);

  return () => {
    window.removeEventListener('resize', handleResize);
    window.cancelAnimationFrame(animationFrameId);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.useProgram(null);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.deleteBuffer(rocketBuffer);
    gl.deleteBuffer(particleBuffer);
    gl.deleteProgram(rocketProgram.program);
    gl.deleteProgram(particleProgram.program);
  };
}

function createCanvasBirthdayFireworks(canvas: HTMLCanvasElement): Cleanup | undefined {
  const context = canvas.getContext('2d');

  if (!context) {
    return undefined;
  }

  let pixelRatio = 1;
  let animationFrameId = 0;
  const startedAt = performance.now();
  let lastLaunchTime = -LAUNCH_INTERVAL_SECONDS;
  const rockets: Rocket[] = [];
  const particles: Particle[] = [];

  const handleResize = () => {
    pixelRatio = resizeCanvas(canvas);
  };

  const draw = (frameTime: number) => {
    const now = (frameTime - startedAt) / 1000;

    if (now - lastLaunchTime >= LAUNCH_INTERVAL_SECONDS && rockets.length < 4) {
      rockets.push(createRocket(canvas.width, canvas.height, now, pixelRatio));
      lastLaunchTime = now;
    }

    for (let index = rockets.length - 1; index >= 0; index -= 1) {
      const rocket = rockets[index];

      if (now >= rocket.explodeAt) {
        spawnParticles(rocket, now, pixelRatio, particles);
        rockets.splice(index, 1);
      }
    }

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];

      if (now - particle.startTime >= particle.life) {
        particles.splice(index, 1);
      }
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.globalCompositeOperation = 'lighter';

    for (const rocket of rockets) {
      const age = now - rocket.launchTime;
      const x = rocket.originX + rocket.velocityX * age;
      const y = rocket.originY + rocket.velocityY * age + 0.5 * ROCKET_GRAVITY * age * age;
      const [red, green, blue] = rocket.color;
      const cssColor = `rgb(${Math.round(red * 255)} ${Math.round(green * 255)} ${Math.round(blue * 255)})`;

      context.beginPath();
      context.fillStyle = cssColor;
      context.shadowBlur = 14 * pixelRatio;
      context.shadowColor = cssColor;
      context.arc(x, y, rocket.size * 0.45, 0, Math.PI * 2);
      context.fill();
    }

    for (const particle of particles) {
      const age = now - particle.startTime;
      const x = particle.originX + particle.velocityX * age;
      const y = particle.originY + particle.velocityY * age + 0.5 * PARTICLE_GRAVITY * age * age;
      const lifeProgress = age / particle.life;
      const alpha = Math.max(0, 1 - lifeProgress * lifeProgress);
      const [red, green, blue] = particle.color;
      const cssColor = `rgba(${Math.round(red * 255)}, ${Math.round(green * 255)}, ${Math.round(blue * 255)}, ${alpha})`;

      context.beginPath();
      context.fillStyle = cssColor;
      context.shadowBlur = 10 * pixelRatio;
      context.shadowColor = cssColor;
      context.arc(
        x,
        y,
        particle.size * (0.35 + alpha * 0.3),
        0,
        Math.PI * 2,
      );
      context.fill();
    }

    context.restore();
    animationFrameId = window.requestAnimationFrame(draw);
  };

  handleResize();
  window.addEventListener('resize', handleResize);
  animationFrameId = window.requestAnimationFrame(draw);

  return () => {
    window.removeEventListener('resize', handleResize);
    window.cancelAnimationFrame(animationFrameId);
    context.clearRect(0, 0, canvas.width, canvas.height);
  };
}

export function createBirthdayFireworks(canvas: HTMLCanvasElement): Cleanup | undefined {
  try {
    const webglCleanup = createWebglBirthdayFireworks(canvas);
    if (webglCleanup) {
      return webglCleanup;
    }
  } catch (error) {
    console.error('Failed to initialize WebGL birthday fireworks.', error);
  }

  return createCanvasBirthdayFireworks(canvas);
}
