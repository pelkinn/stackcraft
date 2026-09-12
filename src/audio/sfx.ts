let ctx: AudioContext | null = null
let muted = false

export function setMuted(m: boolean) {
  muted = m
}

function ac(): AudioContext | null {
  if (muted) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

interface ToneOpts {
  freq: number
  dur: number
  type?: OscillatorType
  gain?: number
  when?: number
  slideTo?: number
  filter?: number
}

function tone({ freq, dur, type = 'sine', gain = 0.06, when = 0, slideTo, filter }: ToneOpts) {
  const a = ac()
  if (!a) return
  const t0 = a.currentTime + when
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  let node: AudioNode = osc
  if (filter) {
    const f = a.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = filter
    osc.connect(f)
    node = f
  }
  node.connect(g).connect(a.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

export const sfx = {
  click: () => tone({ freq: 1200, dur: 0.04, type: 'square', gain: 0.02 }),
  place: () => {
    tone({ freq: 520, dur: 0.08, type: 'triangle' })
    tone({ freq: 780, dur: 0.1, type: 'triangle', when: 0.05 })
  },
  connect: () => tone({ freq: 400, dur: 0.18, type: 'sine', slideTo: 900, gain: 0.05 }),
  remove: () => tone({ freq: 500, dur: 0.15, type: 'triangle', slideTo: 180, gain: 0.05 }),
  error: () => {
    tone({ freq: 180, dur: 0.12, type: 'square', gain: 0.04, filter: 900 })
    tone({ freq: 140, dur: 0.18, type: 'square', gain: 0.04, when: 0.1, filter: 900 })
  },
  launch: () => {
    tone({ freq: 55, dur: 1.6, type: 'sawtooth', slideTo: 110, gain: 0.07, filter: 400 })
    tone({ freq: 220, dur: 1.2, type: 'sine', slideTo: 880, gain: 0.03, when: 0.2 })
  },
  alarm: () => {
    for (let i = 0; i < 3; i++) tone({ freq: 880, dur: 0.12, type: 'square', gain: 0.03, when: i * 0.22, filter: 2000 })
  },
  success: () => {
    ;[523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.25, type: 'triangle', when: i * 0.09, gain: 0.05 }))
  },
  fail: () => tone({ freq: 300, dur: 0.6, type: 'sawtooth', slideTo: 80, gain: 0.05, filter: 800 }),
  star: (i: number) => tone({ freq: 880 * Math.pow(1.26, i), dur: 0.3, type: 'sine', gain: 0.05 }),
}
