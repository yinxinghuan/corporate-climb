// ============================================================================
//  cartridge/types.js — CartridgeSpec for the 3D climb engine.
//  Engine (game.js) owns gameplay: physics, timing, difficulty, camera rig,
//  state machine, combo/scoring. Cartridge owns theme: colours, copy, SFX,
//  world builder constants.
// ============================================================================

/**
 * @typedef {{
 *   id: string,
 *   copy: { en: CopyStrings, zh?: CopyStrings },
 *   sky: SkyColors,
 *   lights: LightColors,
 *   fog: FogColors,
 *   bloom: BloomOpts,
 *   world: WorldColors,
 *   motes: MotesColors,
 *   audio: AudioMood,
 * }} CartridgeSpec3D
 *
 * @typedef {{
 *   title: string, subtitle: string, instruction: string,
 *   scoreLabel: string, bestLabel: string, leaderboardTitle: string,
 *   leaderboardSub: string, againBtn: string, deadTitle: string,
 *   deadSub: string, deadBest: string,
 *   titles: [number, string][], quips: Record<string, string>,
 *   perfectWords: string[], goodWords: string[],
 *   tooEarly: string, tooLate: string, barely: string,
 * }} CopyStrings
 *
 * @typedef {{ top: string, mid: string, bot: string, glow: string, glowDir: number[] }} SkyColors
 * @typedef {{ hemiSky: string, hemiGround: string, hemiIntensity: number, key: string, keyIntensity: number, rim: string, rimIntensity: number }} LightColors
 * @typedef {{ color: string, near: number, far: number }} FogColors
 * @typedef {{ strength: number, radius: number, threshold: number }} BloomOpts
 * @typedef {{ deskTones: string[], arrowCol: string, tideColors: { base: string, peak: string, edge: string } }} WorldColors
 * @typedef {{ color: string, count: number, opacity: number, size: number }} MotesColors
 * @typedef {{ masterGain: number, ambientBase: number, ambientOctave: number, sfx: Record<string, any> }} AudioMood
 */
