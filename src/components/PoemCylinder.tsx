import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import useMediaQuery from '../hooks/useMediaQuery'

/** Geometry only — the exporter's baked text was stripped out, see scripts/strip-glb-texture.mjs. */
const MODEL_URL = '/models/text-cylinder.glb'

const TEXTURE_WIDTH = 2048
const INK = '#e7e5e4'
/** Marks the poem's line breaks, and the only place a row may end. */
const SEPARATOR = ' · '
/** Opacity of the far wall, matching the model's `text_ink_reverse` material. */
const REVERSE_OPACITY = 0.16
const SPIN_SPEED = 0.13 // radians/second

interface PoemCylinderProps {
  text: string
  className?: string
}

/**
 * Paints the poem into a texture sized to the cylinder's own proportions, so
 * the type isn't stretched when it wraps: the canvas is as many times wider
 * than tall as the drum's circumference is longer than its height.
 */
function usePoemTexture(text: string, circumference: number, height: number) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null)

  useEffect(() => {
    if (!circumference || !height) return
    let cancelled = false

    const paint = () => {
      if (cancelled) return
      const canvas = document.createElement('canvas')
      canvas.width = TEXTURE_WIDTH
      canvas.height = Math.round((TEXTURE_WIDTH * height) / circumference)
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Rows are filled right to the edge of the turn — a partly filled row
      // leaves a hole where the wrap closes on itself. Where a line break of the
      // poem falls near the end of a row anyway, the row is cut back to it, so
      // the break lands on a separator rather than mid-phrase. Backing up any
      // further than that would empty out the row it was meant to tidy.
      const PREFER_BREAK_FROM = 0.86
      const tokens = text.split(' ')

      const wrap = (size: number) => {
        ctx.font = `${size}px "Instrument Serif", serif`
        const rows: string[] = []
        let start = 0

        while (start < tokens.length) {
          let end = start
          while (end < tokens.length) {
            if (ctx.measureText(tokens.slice(start, end + 1).join(' ')).width > canvas.width) break
            end++
          }
          if (end === start) end = start + 1

          const full = ctx.measureText(tokens.slice(start, end).join(' ')).width
          let cut = end
          for (let k = end - 1; k > start; k--) {
            if (tokens[k - 1] !== SEPARATOR.trim()) continue
            const backed = ctx.measureText(tokens.slice(start, k).join(' ')).width
            if (backed >= full * PREFER_BREAK_FROM) cut = k
            break
          }

          rows.push(tokens.slice(start, cut).join(' '))
          start = cut
        }
        return rows
      }

      // Largest type whose rows still stack inside the drum's height. One row of
      // headroom is reserved for the descent described below.
      let fontSize = 96
      let lines = wrap(fontSize)
      while (fontSize > 12 && (lines.length + 1) * fontSize * 1.42 > canvas.height) {
        fontSize -= 2
        lines = wrap(fontSize)
      }

      const lineHeight = canvas.height / (lines.length + 1)
      ctx.font = `${fontSize}px "Instrument Serif", serif`
      ctx.fillStyle = INK
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'

      // The text is set as a helix, not as stacked rings. Each line descends by
      // exactly one line-height across the turn, so where it meets the wrap it
      // has arrived at the height the next line starts from, and the poem runs
      // on unbroken. Level lines would all break at the same angle instead,
      // putting the end of one line beside the start of another wherever that
      // angle faced the viewer — reading as two unrelated half-lines.
      const slope = lineHeight / canvas.width
      const tilt = Math.atan(slope)
      const spaceWidth = ctx.measureText(' ').width
      // Less one space, so the last word doesn't touch the first of the next.
      const target = canvas.width - spaceWidth

      const write = (word: string, x: number, baseY: number) => {
        ctx.save()
        ctx.translate(x, baseY + x * slope)
        ctx.rotate(tilt)
        ctx.fillText(word, 0, 0)
        ctx.restore()
      }

      lines.forEach((line, i) => {
        const baseY = lineHeight * (i + 0.5)
        const words = line.split(' ').filter(Boolean)

        if (words.length < 2) {
          write(line, 0, baseY)
          return
        }

        const ink = words.reduce((sum, w) => sum + ctx.measureText(w).width, 0)
        const gap = (target - ink) / (words.length - 1)
        let x = 0
        for (const word of words) {
          write(word, x, baseY)
          x += ctx.measureText(word).width + gap
        }
      })

      // Erase back into the top and bottom edges so the first and last lines
      // dissolve rather than stopping at a hard rim.
      const fade = ctx.createLinearGradient(0, 0, 0, canvas.height)
      fade.addColorStop(0, 'rgba(0,0,0,1)')
      fade.addColorStop(0.16, 'rgba(0,0,0,0)')
      fade.addColorStop(0.84, 'rgba(0,0,0,0)')
      fade.addColorStop(1, 'rgba(0,0,0,1)')
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = fade
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'source-over'

      const tex = new THREE.CanvasTexture(canvas)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 8
      // Clamped rather than repeating: the UVs already span 0–1, and this
      // canvas isn't a power of two in height, which repeat wrapping rejects
      // outright on a WebGL1 context.
      tex.wrapS = THREE.ClampToEdgeWrapping
      tex.wrapT = THREE.ClampToEdgeWrapping
      setTexture(tex)
    }

    // Painting before the webfont resolves would bake the fallback face in.
    if (document.fonts?.ready) document.fonts.ready.then(paint)
    else paint()

    return () => {
      cancelled = true
    }
  }, [text, circumference, height])

  useEffect(() => () => texture?.dispose(), [texture])

  return texture
}

function Drum({ text, spin }: { text: string; spin: boolean }) {
  const gltf = useLoader(GLTFLoader, MODEL_URL)
  const group = useRef<THREE.Group>(null)

  // One geometry serves both walls; the model draws it twice (text_face_far and
  // text_face_near) with different materials. Centre it so orbiting stays put.
  const geometry = useMemo(() => {
    let found: THREE.BufferGeometry | null = null
    gltf.scene.traverse((obj) => {
      if (!found && (obj as THREE.Mesh).isMesh) found = (obj as THREE.Mesh).geometry as THREE.BufferGeometry
    })
    if (!found) return null
    const geo = (found as THREE.BufferGeometry).clone()
    geo.computeBoundingBox()
    const centre = new THREE.Vector3()
    geo.boundingBox?.getCenter(centre)
    geo.translate(-centre.x, -centre.y, -centre.z)
    return geo
  }, [gltf])


  const dims = useMemo(() => {
    if (!geometry) return { circumference: 0, height: 0 }
    geometry.computeBoundingBox()
    const size = new THREE.Vector3()
    geometry.boundingBox?.getSize(size)
    return { circumference: Math.PI * size.x, height: size.y }
  }, [geometry])

  const texture = usePoemTexture(text, dims.circumference, dims.height)

  useFrame((_, delta) => {
    if (spin && group.current) group.current.rotation.y += SPIN_SPEED * delta
  })

  if (!geometry || !texture) return null

  return (
    <group ref={group}>
      {/* Far wall first: seen through the near one, faint and reversed. */}
      <mesh geometry={geometry} renderOrder={0}>
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={REVERSE_OPACITY}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={geometry} renderOrder={1}>
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={1}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/** Built imperatively so the scene doesn't need JSX typings for the controls. */
function Orbit({ onGrab }: { onGrab: () => void }) {
  const camera = useThree((s) => s.camera)
  const domElement = useThree((s) => s.gl.domElement)
  const controls = useRef<OrbitControls | null>(null)

  useEffect(() => {
    const c = new OrbitControls(camera, domElement)
    c.enablePan = false
    // The drum is a fixed part of the page, so its size stays put: turning it is
    // the interaction, resizing it isn't. This also leaves the wheel to scroll
    // the page, which is what it should do over a panel this size.
    c.enableZoom = false
    c.enableDamping = true
    c.dampingFactor = 0.075
    c.rotateSpeed = 0.6
    // Keep the drum upright — a full flip reads as a mistake, not a feature.
    c.minPolarAngle = Math.PI * 0.22
    c.maxPolarAngle = Math.PI * 0.78
    c.addEventListener('start', onGrab)
    controls.current = c
    return () => {
      c.removeEventListener('start', onGrab)
      c.dispose()
    }
  }, [camera, domElement, onGrab])

  useFrame(() => controls.current?.update())
  return null
}

/** Shown where WebGL isn't available, so the verse still reads. */
function PoemFallback({ text }: { text: string }) {
  return (
    <p className="font-serif flex h-full items-center text-center text-lg leading-relaxed text-neutral-400">
      {text}
    </p>
  )
}

export default function PoemCylinder({ text, className = '' }: PoemCylinderProps) {
  const compact = useMediaQuery('(max-width: 767px)')
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [touched, setTouched] = useState(false)
  const [lost, setLost] = useState(false)
  // Bumped when a context comes back, to rebuild the texture that died with it.
  const [generation, setGeneration] = useState(0)
  const onGrab = useCallback(() => setTouched(true), [])

  const onCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    const canvas = gl.domElement
    canvas.addEventListener('webglcontextlost', (event) => {
      // A lost context is only ever restored if the default is prevented;
      // without this the drum simply goes blank and stays that way.
      event.preventDefault()
      setLost(true)
    })
    canvas.addEventListener('webglcontextrestored', () => {
      setLost(false)
      setGeneration((n) => n + 1)
    })
  }, [])

  const size = compact ? { width: 240, height: 320 } : { width: 400, height: 500 }

  return (
    <div className={className}>
      <div
        aria-hidden
        className="relative mx-auto cursor-grab active:cursor-grabbing"
        style={size}
      >
        <Canvas
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
          camera={{ position: [0, 0, 6.2], fov: 34 }}
          onCreated={onCreated}
          fallback={<PoemFallback text={text} />}
        >
          <Drum key={generation} text={text} spin={!touched && !reduceMotion} />
          <Orbit onGrab={onGrab} />
        </Canvas>
        {/* Rather than leave an empty frame while the GPU sorts itself out. */}
        {lost && (
          <div className="absolute inset-0 overflow-hidden">
            <PoemFallback text={text} />
          </div>
        )}
      </div>
      {/* The drum is decorative; the poem itself is read out as prose. */}
      <p className="sr-only">{text}</p>
    </div>
  )
}
