// Static description of Daggerfall's main quest, derived from the Daggerfall Unity quest scripts
// (Assets/StreamingAssets/Quests) and https://en.uesp.net/wiki/Daggerfall:Main_Quest.
// Task names refer to tasks in the backbone quest S0000999, serialized without underscores ("S.36").

export interface MainQuestDef {
  /** DFU quest file name, e.g. "S0000001". */
  id: string;
  /** Name used by UESP. */
  uespName: string;
  /** DFU displayName; also the key used in the notebook's finished-quest headers. */
  dfuName: string;
  /** Required to finish the game (per UESP). */
  required: boolean;
  /** Globals that only this quest sets; any being true proves it was completed. */
  completionGlobals?: string[];
  /** Quest can finish without questSuccess and still count as done (e.g. _BRISIEN just ends). */
  endsWithoutSuccess?: boolean;
  uespUrl: string;
}

export interface MainQuestBranch {
  key: string;
  title: string;
  /** Where the branch starts, shown for invited/available branches. */
  questgiver?: string;
  location?: string;
  minLevel?: number;
  /** Backbone tasks gating the branch opener. */
  levelTask?: string;
  reputationTask?: string;
  questgiverTask?: string;
  letterTask?: string;
  /** A quest that must be completed before the opener can be offered (Medora needs Missing Prince). */
  prerequisiteQuest?: string;
  /** Backbone refuses to start the branch once this global is set. */
  blockedByGlobal?: string;
  quests: MainQuestDef[];
}

const uesp = (page: string) => `https://en.uesp.net/wiki/Daggerfall:${page}`;

export const MAIN_QUEST_BRANCHES: MainQuestBranch[] = [
  {
    key: 'intro',
    title: 'Introduction',
    quests: [
      { id: '_TUTOR__', uespName: "Privateer's Hold", dfuName: 'Tutorial', required: true, uespUrl: uesp("Privateer's_Hold_(quest)") },
      {
        id: '_BRISIEN', uespName: 'Instructions from the Empire', dfuName: 'Lady Brisienna', required: false,
        completionGlobals: ['MetLadyBrisienna'], endsWithoutSuccess: true, uespUrl: uesp('Instructions_from_the_Empire'),
      },
    ],
  },
  {
    key: 'lhotun',
    title: 'Prince Lhotun',
    questgiver: 'Prince Lhotun',
    location: 'the main hall of Castle Sentinel',
    minLevel: 5,
    levelTask: 'S.15',
    reputationTask: 'S.14',
    questgiverTask: 'S.00',
    letterTask: 'S.45',
    quests: [
      { id: 'S0000001', uespName: 'The Missing Prince', dfuName: 'Missing Prince', required: true, uespUrl: uesp('The_Missing_Prince') },
      { id: 'S0000017', uespName: 'Painting the Truth', dfuName: 'Wayrest Painting', required: true, uespUrl: uesp('Painting_the_Truth') },
      { id: 'S0000010', uespName: 'The Ancient Watcher', dfuName: 'Stronghold of the Blades', required: true, uespUrl: uesp('The_Ancient_Watcher') },
    ],
  },
  {
    key: 'medora',
    title: 'Medora',
    questgiver: 'Medora',
    location: 'her tower (revealed during The Missing Prince)',
    minLevel: 8,
    levelTask: 'S.17',
    reputationTask: 'S.12',
    questgiverTask: 'S.02',
    prerequisiteQuest: 'S0000001',
    quests: [
      { id: 'S0000003', uespName: "Medora's Freedom", dfuName: 'Freeing Medora', required: true, uespUrl: uesp("Medora's_Freedom") },
      { id: 'S0000018', uespName: 'Dust of Restful Death', dfuName: 'Dust of Restful Death', required: true, uespUrl: uesp('Dust_of_Restful_Death') },
      { id: 'S0000022', uespName: "Lysandus' Revelation", dfuName: "Lysandus' Revelation", required: true, uespUrl: uesp("Lysandus'_Revelation") },
      { id: 'S0000015', uespName: "Lysandus' Revenge", dfuName: "Lysandus' Revenge", required: true, uespUrl: uesp("Lysandus'_Revenge") },
      {
        id: 'S0000008', uespName: 'Totem, Totem, Who Gets the Totem?', dfuName: 'Who Gets the Totem', required: true,
        uespUrl: uesp('Totem,_Totem,_Who_Gets_the_Totem%3F'),
      },
      {
        id: 'S0000016', uespName: 'Journey to Aetherius', dfuName: 'Journey to Aetherius', required: true,
        completionGlobals: ['GothrydEnding', 'KingOfWormsEnding', 'GortwogEnding', 'AkorithiEnding', 'UnderkingEnding', 'EadwyreEnding', 'BrisiennaEnding'],
        uespUrl: uesp('Journey_to_Aetherius'),
      },
    ],
  },
  {
    key: 'morgiah',
    title: 'Princess Morgiah',
    questgiver: 'Princess Morgiah',
    location: 'the throne room of Castle Wayrest',
    minLevel: 3,
    levelTask: 'S.18',
    reputationTask: 'S.11',
    questgiverTask: 'S.03',
    letterTask: 'S.46',
    quests: [
      { id: 'S0000004', uespName: "Morgiah's Wedding", dfuName: "Morgiah's Wedding", required: true, completionGlobals: ['MorgiahSatisfied'], uespUrl: uesp("Morgiah's_Wedding") },
      { id: 'S0000021', uespName: 'Soul of a Lich', dfuName: "Lich's Soul", required: true, completionGlobals: ['KingOfWormsSatisfied'], uespUrl: uesp('Soul_of_a_Lich') },
    ],
  },
  {
    key: 'cyndassa',
    title: 'Cyndassa',
    questgiver: 'Cyndassa',
    location: 'the back rooms of Castle Daggerfall',
    minLevel: 5,
    levelTask: 'S.21',
    reputationTask: 'S.08',
    questgiverTask: 'S.06',
    quests: [
      { id: 'S0000007', uespName: 'The Beast', dfuName: 'The Werebeast', required: true, uespUrl: uesp('The_Beast') },
      { id: 'S0000012', uespName: "The Emperor's Courier", dfuName: "The Emperor's Courier", required: true, uespUrl: uesp("The_Emperor's_Courier") },
      { id: 'S0000020', uespName: 'Orcish Emancipation', dfuName: 'Orcish Treaty', required: true, completionGlobals: ['MyniseraSatisfied'], uespUrl: uesp('Orcish_Emancipation') },
      { id: 'S0000988', uespName: 'The Mantella Revealed', dfuName: 'Mantella Revealed', required: false, uespUrl: uesp('The_Mantella_Revealed') },
      { id: 'S0000009', uespName: "Elysana's Betrayal", dfuName: "Elysana's Betrayal", required: false, uespUrl: uesp("Elysana's_Betrayal") },
    ],
  },
  {
    key: 'helseth',
    title: 'Prince Helseth',
    questgiver: 'Prince Helseth',
    location: 'the dining hall of Castle Wayrest',
    minLevel: 4,
    levelTask: 'S.16',
    reputationTask: 'S.13',
    questgiverTask: 'S.01',
    blockedByGlobal: 'ElysannaSatisfied',
    quests: [
      { id: 'S0000002', uespName: 'Blackmail', dfuName: "Prince Helseth's Blackmail", required: false, uespUrl: uesp('Blackmail') },
      { id: 'S0000011', uespName: "Barenziah's Book", dfuName: "Barenziah's Book", required: false, completionGlobals: ['BarenziahSatisfied'], uespUrl: uesp("Barenziah's_Book") },
    ],
  },
  {
    key: 'aubki',
    title: 'Queen Aubk-i',
    questgiver: 'Queen Aubk-i',
    location: 'the throne room of Castle Daggerfall',
    minLevel: 3,
    levelTask: 'S.19',
    reputationTask: 'S.10',
    questgiverTask: 'S.04',
    quests: [
      { id: 'S0000005', uespName: 'Concern for Nulfaga', dfuName: 'Concern for Nulfaga', required: false, uespUrl: uesp('Concern_for_Nulfaga') },
      { id: 'S0000013', uespName: "Mynisera's Letters", dfuName: "Mynisera's Letters", required: false, uespUrl: uesp("Mynisera's_Letters") },
    ],
  },
  {
    key: 'elysana',
    title: 'Princess Elysana',
    questgiver: 'Princess Elysana',
    location: 'the throne room of Castle Wayrest',
    minLevel: 6,
    levelTask: 'S.20',
    reputationTask: 'S.09',
    questgiverTask: 'S.05',
    blockedByGlobal: 'MyniseraSatisfied',
    quests: [
      { id: 'S0000006', uespName: "Elysana's Robe", dfuName: "Elysana's Robe", required: false, completionGlobals: ['ElysannaSatisfied'], uespUrl: uesp("Elysana's_Robe") },
    ],
  },
];

/** Ending flags set by Journey to Aetherius, keyed to who received the Mantella. */
export const ENDING_GLOBALS: Record<string, string> = {
  GothrydEnding: 'King Gothryd (Daggerfall)',
  EadwyreEnding: 'King Eadwyre (Wayrest)',
  AkorithiEnding: 'Queen Akorithi (Sentinel)',
  GortwogEnding: 'Gortwog (Orsinium)',
  KingOfWormsEnding: 'The King of Worms',
  UnderkingEnding: 'The Underking',
  BrisiennaEnding: 'Lady Brisienna (the Empire)',
};

/** Totem holder flags set during Who Gets the Totem. */
export const TOTEM_GLOBALS: Record<string, string> = {
  GothrydGotTotem: 'King Gothryd',
  EadwyreGotTotem: 'King Eadwyre',
  AkorithiGotTotem: 'Queen Akorithi',
  GortwogGotTotem: 'Gortwog',
  KingOfWormsGotTotem: 'The King of Worms',
  UnderkingGotTotem: 'The Underking',
  BrisiennaGotTotem: 'Lady Brisienna',
};

export const BACKBONE_QUEST = 'S0000999';
