// ============================================================================
//  cartridge/office.js — canonical corporate office theme.
//  Original Corporate Climb values, extracted from game.js and index.html.
// ============================================================================

export const officeCartridge = {
  id: 'office',

  copy: {
    en: {
      title: 'CORPORATE CLIMB',
      subtitle: 'Climb the ladder. Step on colleagues. Don\'t get laid off.',
      instruction: 'Tap to climb',
      scoreLabel: 'Floor',
      bestLabel: 'Best',
      leaderboardTitle: 'The Corner Office',
      leaderboardSub: 'Highest climbers',
      againBtn: 'One More Grind',
      deadTitle: 'Pink slip delivered.',
      deadSub: 'You\'ve been laid off.',
      deadBest: 'Highest Floor',
      titles: [
        [0, 'INTERN'], [4, 'ASSOCIATE'], [9, 'ANALYST'], [15, 'MANAGER'],
        [23, 'SR. MANAGER'], [32, 'DIRECTOR'], [44, 'VP'], [58, 'SVP'],
        [74, 'C-SUITE'], [92, 'CEO'], [120, 'CHAIRMAN'], [150, 'OVERLORD'], [200, 'DEMIGOD'],
      ],
      quips: {
        ASSOCIATE: 'You have opinions now. Nobody asked.',
        ANALYST: 'You make slides about the slides.',
        MANAGER: 'You step on the people who got you here.',
        'SR. MANAGER': 'Now you delegate the stepping.',
        DIRECTOR: 'Your calendar has a calendar.',
        VP: 'You speak only in synergy.',
        SVP: 'You haven\'t done real work in years.',
        'C-SUITE': 'The air is thin. So is your soul.',
        CEO: 'You did it. Was it worth it?',
        CHAIRMAN: 'You own the ladder now. Still climbing.',
        OVERLORD: 'There is no top. Keep going.',
        DEMIGOD: 'Mortals fear your quarterly outlook.',
      },
      perfectWords: ['STOMPED!', 'CRUSHED!', 'FLATTENED!', 'BULLDOZED!', 'STEAMROLLED!'],
      goodWords: ['up!', 'climb!', 'next!', 'hustle!', 'move!'],
      tooEarly: 'TOO EARLY',
      tooLate: 'TOO LATE',
      barely: 'BARELY!',
    },
  },

  sky: {
    top: '#101830', mid: '#2a3358', bot: '#7a5a5e', glow: '#e8a25a',
    glowDir: [0.5, -0.18, 0.6],
  },

  lights: {
    hemiSky: '#bcd0ee', hemiGround: '#2a2230', hemiIntensity: 0.7,
    key: '#ffe6c4', keyIntensity: 0.85,
    rim: '#6fd0e0', rimIntensity: 0.32,
  },

  fog: { color: '#141d2b', near: 34, far: 58 },

  bloom: { strength: 0.4, radius: 0.6, threshold: 0.84 },

  world: {
    deskTones: ['#3c3e48', '#36384a', '#3a3a44', '#3e3c4a', '#38404a', '#3c3e46'],
    arrowCol: '#ff2e88',
    tideColors: { base: '#8c1020', peak: '#e23a4a', edge: '#c01f30' },
  },

  motes: { color: '#f3ead4', count: 90, opacity: 0.55, size: 0.12 },

  audio: {
    masterGain: 0.95,
    ambientBase: 64, ambientOctave: 96,
    sfx: {
      stomp: { freq: 240, dur: 0.15, gain: 0.22, slideTo: 70, type: 'sine' },
      perfect: { base: 540, step: 34, maxCombo: 10, gain: 0.17 },
      promote: { notes: [523, 659, 784], dur: [0.16, 0.16, 0.26], gain: [0.16, 0.15, 0.15], delay: [0, 0.08, 0.16] },
      stumble: { freq: 180, dur: 0.14, gain: 0.1, slideTo: 120, type: 'square' },
      hop: { freq: 430, dur: 0.11, gain: 0.10, slideTo: 720 },
      laidOff: { freq: 330, dur: 0.55, gain: 0.16, slideTo: 80, type: 'sawtooth' },
      uiClick: { freq: 880, dur: 0.07, gain: 0.08 },
    },
  },
};
