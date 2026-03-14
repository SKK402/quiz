// ============================================
// WebGL Shader Background — Animated Mesh
// ============================================

export function initWebGL(canvas) {
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: false })
    if (!gl) {
        console.warn('WebGL2 not supported, falling back to WebGL1')
        const gl1 = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false })
        if (!gl1) { console.error('WebGL not available'); return null }
        return initWithContext(gl1, canvas)
    }
    return initWithContext(gl, canvas)
}

function initWithContext(gl, canvas) {
    // --- Vertex Shader ---
    const vertSrc = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `

    // --- Fragment Shader: Animated nebula / plasma effect ---
    const fragSrc = `
    precision highp float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;

    // Simplex-like noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                       + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                               dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    float fbm(vec2 p) {
      float f = 0.0;
      float w = 0.5;
      for (int i = 0; i < 5; i++) {
        f += w * snoise(p);
        p *= 2.0;
        w *= 0.5;
      }
      return f;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      float aspect = u_resolution.x / u_resolution.y;
      vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

      float t = u_time * 0.08;

      // Mouse influence (subtle attraction)
      vec2 mouse = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);
      float mouseDist = length(p - mouse);
      float mouseInfluence = smoothstep(0.8, 0.0, mouseDist) * 0.15;

      // Layered noise
      float n1 = fbm(p * 1.5 + vec2(t, t * 0.7));
      float n2 = fbm(p * 2.5 - vec2(t * 0.5, t * 1.2) + mouseInfluence);
      float n3 = fbm(p * 0.8 + vec2(t * 0.3, -t * 0.4));

      // Color palette — deep space with category accent hints
      vec3 col1 = vec3(0.05, 0.02, 0.12);  // Deep purple-black
      vec3 col2 = vec3(0.08, 0.04, 0.18);  // Dark violet
      vec3 col3 = vec3(0.02, 0.08, 0.15);  // Dark teal
      vec3 col4 = vec3(0.12, 0.06, 0.02);  // Dark amber
      vec3 col5 = vec3(0.02, 0.10, 0.12);  // Dark cyan

      vec3 color = col1;
      color = mix(color, col2, smoothstep(-0.3, 0.5, n1));
      color = mix(color, col3, smoothstep(-0.2, 0.6, n2) * 0.6);
      color = mix(color, col4, smoothstep(0.1, 0.7, n3) * 0.3);
      color = mix(color, col5, smoothstep(-0.1, 0.5, n1 + n2) * 0.4);

      // Subtle glow spots
      float glow1 = exp(-4.0 * length(p - vec2(sin(t * 1.3) * 0.3, cos(t * 0.9) * 0.2)));
      float glow2 = exp(-5.0 * length(p - vec2(cos(t * 0.7) * 0.4, sin(t * 1.1) * 0.3)));
      float glow3 = exp(-3.5 * length(p - mouse * 0.5));

      color += vec3(0.35, 0.12, 0.55) * glow1 * 0.08;
      color += vec3(0.05, 0.45, 0.40) * glow2 * 0.06;
      color += vec3(0.30, 0.20, 0.50) * glow3 * mouseInfluence * 0.5;

      // Subtle vignette
      float vignette = 1.0 - smoothstep(0.3, 1.2, length(p));
      color *= 0.7 + vignette * 0.3;

      // Small floating particles via noise
      float sparkle = smoothstep(0.75, 0.78, snoise(p * 40.0 + t * 2.0)) * 0.15;
      color += sparkle;

      gl_FragColor = vec4(color, 1.0);
    }
  `

    // Compile shaders
    function compile(src, type) {
        const shader = gl.createShader(type)
        gl.shaderSource(shader, src)
        gl.compileShader(shader)
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader error:', gl.getShaderInfoLog(shader))
            gl.deleteShader(shader)
            return null
        }
        return shader
    }

    const vert = compile(vertSrc, gl.VERTEX_SHADER)
    const frag = compile(fragSrc, gl.FRAGMENT_SHADER)
    if (!vert || !frag) return null

    const program = gl.createProgram()
    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program))
        return null
    }

    gl.useProgram(program)

    // Fullscreen quad
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW)

    const posLoc = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    // Uniforms
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uResolution = gl.getUniformLocation(program, 'u_resolution')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')

    let mouseX = canvas.width * 0.5
    let mouseY = canvas.height * 0.5

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX
        mouseY = canvas.height - e.clientY
    })

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5) // Cap DPR for performance
        canvas.width = canvas.clientWidth * dpr
        canvas.height = canvas.clientHeight * dpr
        gl.viewport(0, 0, canvas.width, canvas.height)
    }

    resize()
    window.addEventListener('resize', resize)

    // Render loop
    const startTime = performance.now()
    let running = true

    function render() {
        if (!running) return
        const time = (performance.now() - startTime) / 1000.0
        gl.uniform1f(uTime, time)
        gl.uniform2f(uResolution, canvas.width, canvas.height)
        gl.uniform2f(uMouse, mouseX, mouseY)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
        requestAnimationFrame(render)
    }

    render()

    return {
        dispose() {
            running = false
            gl.deleteProgram(program)
            gl.deleteShader(vert)
            gl.deleteShader(frag)
            gl.deleteBuffer(buffer)
        },
    }
}
