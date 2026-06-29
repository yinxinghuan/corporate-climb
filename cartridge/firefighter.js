// ============================================================================
//  cartridge/firefighter.js — "firefighter climbing a burning skyscraper"
//  Second cartridge for the 3D climb engine. Swaps the corporate office theme
//  for a fire-rescue emergency: orange flames, smoke, alarm-red palette,
//  firefighter jargon copy.
// ============================================================================

export const firefighterCartridge = {
  id: 'firefighter',

  copy: {
    en: {
      title: 'FIRE RESCUE',
      subtitle: 'Climb the burning tower. Rescue survivors. Don\'t get burned.',
      instruction: 'Tap to climb',
      scoreLabel: 'Floor',
      bestLabel: 'Best',
      leaderboardTitle: 'Bravest Firefighters',
      leaderboardSub: 'Highest climbers',
      againBtn: 'Answer The Call',
      deadTitle: 'Flashover.',
      deadSub: 'The fire caught you.',
      deadBest: 'Highest Floor Reached',
      titles: [
        [0, 'PROBIE'], [4, 'FIREFIGHTER'], [9, 'ENGINEER'], [15, 'LIEUTENANT'],
        [23, 'CAPTAIN'], [32, 'BATT. CHIEF'], [44, 'DIV. CHIEF'], [58, 'DEP. CHIEF'],
        [74, 'ASST. CHIEF'], [92, 'CHIEF'], [120, 'COMMISSIONER'], [150, 'LEGEND'], [200, 'INFERNO TAMER'],
      ],
      quips: {
        PROBIE: 'You make the coffee. And you run toward fire.',
        FIREFIGHTER: 'Your boots have seen things.',
        ENGINEER: 'You know what every valve does.',
        LIEUTENANT: 'Your crew trusts you with their lives.',
        CAPTAIN: 'You\'ve pulled people from the flames.',
        'BATT. CHIEF': 'You command from the smoke.',
        'DIV. CHIEF': 'The city knows your name.',
        'DEP. CHIEF': 'You set the standard.',
        'ASST. CHIEF': 'One more rank. Keep climbing.',
        CHIEF: 'You run the department. Don\'t stop now.',
        COMMISSIONER: 'The whole city is your firehouse.',
        LEGEND: 'They\'ll name a station after you.',
        'INFERNO TAMER': 'No fire burns hot enough.',
      },
      perfectWords: ['RESCUED!', 'SAVED!', 'EXTINGUISHED!', 'CONTAINED!', 'HERO!'],
      goodWords: ['up!', 'climb!', 'go!', 'push!', 'move!'],
      tooEarly: 'NOT YET',
      tooLate: 'MISSED IT',
      barely: 'CLOSE ONE!',
    },
  },

  sky: {
    top: '#1a0a00',    // smoke-black crown
    mid: '#3a1800',    // deep orange-brown
    bot: '#8a3020',    // fire-glow horizon
    glow: '#ff6020',   // bright orange flame glow
    glowDir: [0.5, 0.0, 0.6],
  },

  lights: {
    hemiSky: '#ffaa60', hemiGround: '#2a1008', hemiIntensity: 0.6,
    key: '#ffe0c0', keyIntensity: 0.9,
    rim: '#ff4420', rimIntensity: 0.28,
  },

  fog: { color: '#1a0c04', near: 28, far: 52 },

  bloom: { strength: 0.5, radius: 0.7, threshold: 0.78 },

  world: {
    deskTones: ['#4a3830', '#4a3c34', '#463832', '#4c3a30', '#483e38', '#4a3c36'],
    arrowCol: '#ff4420',    // fire-orange cue
    tideColors: { base: '#cc2200', peak: '#ff4420', edge: '#ff6610' },
  },

  motes: { color: '#ffaa60', count: 120, opacity: 0.45, size: 0.10 },

  audio: {
    masterGain: 0.92,
    ambientBase: 55, ambientOctave: 82,
    sfx: {
      stomp: { freq: 300, dur: 0.13, gain: 0.24, slideTo: 90, type: 'triangle' },
      perfect: { base: 660, step: 40, maxCombo: 10, gain: 0.18 },
      promote: { notes: [660, 880, 1100], dur: [0.14, 0.14, 0.22], gain: [0.16, 0.14, 0.13], delay: [0, 0.07, 0.14] },
      stumble: { freq: 220, dur: 0.12, gain: 0.11, slideTo: 140, type: 'square' },
      hop: { freq: 520, dur: 0.10, gain: 0.11, slideTo: 880 },
      laidOff: { freq: 400, dur: 0.5, gain: 0.17, slideTo: 90, type: 'sawtooth' },
      uiClick: { freq: 1100, dur: 0.06, gain: 0.09 },
    },
  },
};
