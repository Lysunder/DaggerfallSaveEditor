import {
  MAIN_QUEST_BRANCHES,
  ENDING_GLOBALS,
  TOTEM_GLOBALS,
  BACKBONE_QUEST,
  type MainQuestBranch,
  type MainQuestDef,
} from '../data/mainQuest';
import type { GlobalVar, NotebookData, QuestMachineData, QuestSaveData, QuestTaskSaveData } from '../store/useSaveStore';

export type QuestStatus = 'completed' | 'failed' | 'active' | 'started' | 'invited' | 'available' | 'locked';

export interface QuestProgress {
  def: MainQuestDef;
  status: QuestStatus;
  /** True when the status was deduced rather than read from the quest's own record. */
  inferred: boolean;
  evidence: string[];
}

export interface BranchProgress {
  branch: MainQuestBranch;
  quests: QuestProgress[];
  /** Why the next step can't start yet, or where to go when it can. */
  hint?: string;
}

export interface ActiveQuestInfo {
  def: MainQuestDef;
  journal: string[];
}

export interface MainQuestProgress {
  branches: BranchProgress[];
  active: ActiveQuestInfo[];
  requiredDone: number;
  requiredTotal: number;
  ending?: string;
  totemHolder?: string;
  curseLifted: boolean;
  /** QuestData.txt or the backbone quest is missing, so statuses rely on weaker evidence. */
  partial: boolean;
}

const START_QUEST_ACTION = 'DaggerfallWorkshop.Game.Questing.StartQuest';
const CLOCK_RESOURCE = 'DaggerfallWorkshop.Game.Questing.Clock';
const SECONDS_PER_DAY = 86400;

const MONTH_NAMES = [
  'Morning Star', "Sun's Dawn", 'First Seed', "Rain's Hand", 'Second Seed', 'Midyear',
  "Sun's Height", 'Last Seed', 'Hearthfire', 'Frostfall', "Sun's Dusk", 'Evening Star',
];

const ordinal = (n: number) => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
};

/** Quest IDs named by every completed StartQuest action in any tracked quest. */
export const collectStartedQuests = (quests: QuestSaveData[]): Set<string> => {
  const started = new Set<string>();
  for (const quest of quests) {
    for (const task of quest.tasks ?? []) {
      for (const action of task.actions ?? []) {
        const name = action.actionSpecific?.questName;
        if (action.type === START_QUEST_ACTION && action.isComplete && typeof name === 'string' && name) {
          started.add(name);
        }
      }
    }
  }
  return started;
};

/**
 * Finished-quest headers from the notebook, keyed by quest display name.
 * Headers look like "D:Mynisera's Letters completed at 01:50:54 03 Midyear 3E405:".
 * Continuation entries of long quests have no "D:" header and are skipped.
 */
export const parseFinishedQuestHeaders = (notebook: NotebookData | null): string[] =>
  (notebook?.finishedQuestEntries ?? [])
    .map((entry) => entry?.[0])
    .filter((first): first is string => typeof first === 'string' && first.startsWith('D:'))
    .map((first) => first.slice(2));

/** Journal text of a quest's active log entries, with the date and clock macros expanded. */
export const renderJournal = (quest: QuestSaveData): string[] => {
  const clocks = new Map<string, number>();
  for (const resource of quest.resources ?? []) {
    const spec = resource.resourceSpecific;
    if (resource.type === CLOCK_RESOURCE && spec?.clockEnabled && resource.symbol?.name) {
      clocks.set(resource.symbol.name, Math.floor(spec.remainingTimeInSeconds / SECONDS_PER_DAY));
    }
  }

  const lines: string[] = [];
  for (const log of quest.activeLogMessages ?? []) {
    const message = quest.messages?.find((m) => m.id === log.messageID);
    if (!message) continue;
    const date = log.dateTime
      ? `${ordinal(log.dateTime.Day + 1)} of ${MONTH_NAMES[log.dateTime.Month] ?? '?'}, 3E${log.dateTime.Year}`
      : '';
    // Lines are hard-wrapped for DFU's journal panel; join them into flowing text.
    const text = message.lines
      .map((line) => line.trim())
      .filter(Boolean)
      .join(' ')
      .replace(/%qdt/g, date)
      .replace(/=([A-Za-z0-9.]+)_/g, (match, name: string) => (clocks.has(name) ? String(clocks.get(name)) : match));
    lines.push(text.trim());
  }
  return lines;
};

export const computeMainQuestProgress = ({
  questData,
  notebookData,
  globalVars,
  playerLevel,
}: {
  questData: QuestMachineData | null;
  notebookData: NotebookData | null;
  globalVars: GlobalVar[];
  playerLevel: number;
}): MainQuestProgress => {
  const quests = Array.isArray(questData?.quests) ? questData.quests : [];
  const questsByName = new Map(quests.map((q) => [q.questName, q]));
  const backbone = questsByName.get(BACKBONE_QUEST);
  const backboneTasks = new Map<string, QuestTaskSaveData>(
    (backbone?.tasks ?? []).filter((t) => t.symbol?.name).map((t) => [t.symbol.name, t]),
  );
  const started = collectStartedQuests(quests);
  const notebook = parseFinishedQuestHeaders(notebookData);
  const globals = new Map(globalVars.map((g) => [g.name, g.value]));
  const isSet = (name: string) => globals.get(name) === true;

  const taskTriggered = (name?: string) => !!name && backboneTasks.get(name)?.triggered === true;
  const taskDropped = (name?: string) => !!name && backboneTasks.get(name)?.dropped === true;
  const taskActionsDone = (name?: string) =>
    !!name && (backboneTasks.get(name)?.actions ?? []).some((a) => a.isComplete && !a.isTriggerCondition);

  // Pass 1: direct evidence for each quest, independent of its neighbours.
  const direct = new Map<string, Omit<QuestProgress, 'def'> | null>();
  for (const branch of MAIN_QUEST_BRANCHES) {
    for (const def of branch.quests) {
      const record = questsByName.get(def.id);
      if (record) {
        if (!record.questComplete) {
          direct.set(def.id, { status: 'active', inferred: false, evidence: ['Quest is in progress (QuestData.txt)'] });
        } else {
          const success = record.questSuccess || def.endsWithoutSuccess;
          direct.set(def.id, {
            status: success ? 'completed' : 'failed',
            inferred: false,
            evidence: [`Quest finished ${success ? 'successfully' : 'without success'} (QuestData.txt)`],
          });
        }
        continue;
      }

      // Most recent entry wins if a quest name appears more than once.
      const header = notebook.findLast((h) => h.startsWith(`${def.dfuName} `));
      if (header) {
        // "completed" is written for success and "ended" otherwise; other languages fall back to completed.
        const failed = !def.endsWithoutSuccess && / ended /.test(header) && !/ completed /.test(header);
        direct.set(def.id, { status: failed ? 'failed' : 'completed', inferred: true, evidence: [`Journal: "${header}"`] });
        continue;
      }

      const global = def.completionGlobals?.find(isSet);
      if (global) {
        direct.set(def.id, { status: 'completed', inferred: true, evidence: [`Global flag ${global} is set`] });
        continue;
      }

      if (started.has(def.id)) {
        direct.set(def.id, { status: 'started', inferred: true, evidence: ['A quest script started it, but no outcome was recorded'] });
        continue;
      }

      direct.set(def.id, null);
    }
  }

  // The backbone's branch-opener tasks are dropped once the branch starts.
  for (const branch of MAIN_QUEST_BRANCHES) {
    const opener = branch.quests[0];
    if (!direct.get(opener.id) && taskDropped(branch.questgiverTask)) {
      direct.set(opener.id, { status: 'started', inferred: true, evidence: [`Backbone task ${branch.questgiverTask} was dropped when the quest started`] });
    }
  }

  // The tutorial is long gone once the rest of the main quest exists.
  const tutorial = '_TUTOR__';
  if (!direct.get(tutorial) && (backbone || questsByName.has('S0000977') || isSet('MetLadyBrisienna'))) {
    direct.set(tutorial, { status: 'completed', inferred: true, evidence: ['Main quest has started, so the tutorial is finished'] });
  }
  const brisienna = '_BRISIEN';
  if (!direct.get(brisienna) && backbone) {
    direct.set(brisienna, { status: 'completed', inferred: true, evidence: ['Backbone quest S0000999 exists, which Lady Brisienna starts'] });
  }

  const isDone = (id: string) => direct.get(id)?.status === 'completed';

  // Pass 2: fill gaps from the chain and the backbone.
  const branches: BranchProgress[] = MAIN_QUEST_BRANCHES.map((branch) => {
    const results: QuestProgress[] = [];
    let hint: string | undefined;

    branch.quests.forEach((def, index) => {
      const own = direct.get(def.id);
      // Each script starts the next quest only on success, so any later evidence proves this one succeeded.
      const later = branch.quests.slice(index + 1).find((q) => direct.get(q.id));

      if (own && !(own.status === 'started' && later)) {
        results.push({ def, ...own });
        return;
      }
      if (later) {
        results.push({ def, status: 'completed', inferred: true, evidence: [`Later quest ${later.uespName} has started`] });
        return;
      }

      const previous = results[index - 1];
      if (index > 0) {
        const unlocked = previous?.status === 'completed';
        results.push({
          def,
          status: unlocked ? 'available' : 'locked',
          inferred: true,
          evidence: [unlocked ? `Follows ${previous.def.uespName}` : `Requires ${branch.quests[index - 1].uespName}`],
        });
        return;
      }

      // Branch opener that hasn't started: check the backbone's gates.
      if (branch.key === 'intro') {
        results.push({ def, status: 'locked', inferred: true, evidence: [] });
        return;
      }
      const reasons: string[] = [];
      if (!backbone) {
        reasons.push('Backbone quest S0000999 not found');
      } else {
        const levelMet = taskTriggered(branch.levelTask) || (!branch.levelTask && playerLevel >= (branch.minLevel ?? 0));
        if (!levelMet) reasons.push(`Reach level ${branch.minLevel}`);
        if (!taskTriggered(branch.reputationTask)) reasons.push(`Reputation with ${branch.questgiver} must be at least 0`);
        if (branch.prerequisiteQuest && !isDone(branch.prerequisiteQuest)) {
          const prereq = MAIN_QUEST_BRANCHES.flatMap((b) => b.quests).find((q) => q.id === branch.prerequisiteQuest);
          reasons.push(`Complete ${prereq?.uespName ?? branch.prerequisiteQuest}`);
        }
        if (branch.blockedByGlobal && isSet(branch.blockedByGlobal)) {
          reasons.push(`No longer offered once ${branch.blockedByGlobal} is set`);
        }
      }

      if (reasons.length) {
        results.push({ def, status: 'locked', inferred: true, evidence: reasons });
        hint = reasons.join('; ');
        return;
      }
      const invited = taskActionsDone(branch.letterTask);
      results.push({
        def,
        status: invited ? 'invited' : 'available',
        inferred: true,
        evidence: [invited ? 'An invitation letter was delivered' : 'Level and reputation requirements are met'],
      });
      hint = `Talk to ${branch.questgiver} in ${branch.location}`;
    });

    return { branch, quests: results, hint };
  });

  const all = branches.flatMap((b) => b.quests);
  const required = all.filter((q) => q.def.required);
  const active = all
    .filter((q) => q.status === 'active')
    .map((q) => ({ def: q.def, journal: renderJournal(questsByName.get(q.def.id)!) }));

  const endingKey = Object.keys(ENDING_GLOBALS).find(isSet);
  const totemKey = Object.keys(TOTEM_GLOBALS).find(isSet);

  return {
    branches,
    active,
    requiredDone: required.filter((q) => q.status === 'completed').length,
    requiredTotal: required.length,
    ending: endingKey ? ENDING_GLOBALS[endingKey] : undefined,
    totemHolder: totemKey ? TOTEM_GLOBALS[totemKey] : undefined,
    curseLifted: isSet('LiftedCurse'),
    partial: !questData || !backbone,
  };
};
