// ── I18N — English + Québec French translations ──────────────────────────────

export type Lang = 'en' | 'qc'

export interface I18nStrings {
  title: string
  subtitle: string
  generated: string
  range: string
  langLabel: string
  intro: string

  metricEvents: string
  metricDays: string
  metricProjects: string
  metricStreak: string
  metricLongestStreak: string
  metricBusiestDay: string
  metricBusiestWeek: string
  metricCommits: string

  calendarTitle: string
  calendarHint: string
  less: string
  more: string

  monthlyTitle: string
  kindsTitle: string
  projectsTitle: string
  projectsNote: string

  commitSizeTitle: string
  commitSizeHint: string
  commitStatMean: string
  commitStatMedian: string
  commitStatMode: string
  commitStatSamples: string
  commitHistTitle: string
  commitBoxTitle: string
  commitOutliersTitle: string

  techTitle: string
  techHint: string
  statType: string
  statAdds: string
  statDels: string
  statFiles: string
  statChurn: string
  statNet: string
  statExcluded: string

  filesTouchedTitle: string
  concentrationTitle: string
  concentrationHint: string

  highlightsTitle: string
  highlightsHint: string
  hlMostConsistentMonth: string
  hlWidestProjectDay: string
  hlStrongestWeek: string
  hlMilestones: string

  labelProjects: string
  labelKinds: string
  labelClean: string
  labelRaw: string
  labelExcluded: string

  evidenceTitle: string
  evidenceHint: string
  colProject: string
  colEntries: string
  colFirst: string
  colLast: string
  colExamples: string

  agentTitle: string
  agentHint: string
  activityTitle: string
  activityHint: string

  noCommitData: string
  commitLineDataUnavailable: string
  lineStatsUnavailable: string
  fileDataUnavailable: string
  noMcpData: string
  noAgentDays: string
  noSummaries: string

  agentEventsLabel: string
  distinctActors: string
  modelsUsed: string
  toolsUsed: string

  streakMax: (n: number) => string

  kindLabels: Record<string, string>
  units: Record<string, string>
}

const en: I18nStrings = {
  title:                 'Work Impact',
  subtitle:              'Agent Ledger Statistics',
  generated:             'Generated',
  range:                 'Range',
  langLabel:             'FR',
  intro:                 'All activity recorded in the VaultWares agent ledger.',

  metricEvents:          'Total Events',
  metricDays:            'Active Days',
  metricProjects:        'Projects',
  metricStreak:          'Current Streak',
  metricLongestStreak:   'Longest Streak',
  metricBusiestDay:      'Busiest Day',
  metricBusiestWeek:     'Busiest Week',
  metricCommits:         'Commits',

  calendarTitle:         'Activity Calendar',
  calendarHint:          'Each cell = one day. Color intensity = event count.',
  less:                  'Less',
  more:                  'More',

  monthlyTitle:          'Monthly Activity',
  kindsTitle:            'Activity by Kind',
  projectsTitle:         'Projects by Volume',
  projectsNote:          'Top 20 shown.',

  commitSizeTitle:       'Commit Size Distribution',
  commitSizeHint:        'Lines changed per commit. Only evaluates commits associated with VaultWares ledger events, not the full GitHub history.',
  commitStatMean:        'Mean',
  commitStatMedian:      'Median',
  commitStatMode:        'Mode',
  commitStatSamples:     'Samples',
  commitHistTitle:       'Histogram',
  commitBoxTitle:        'Box Plot by Month',
  commitOutliersTitle:   'Outliers (>3200 lines)',

  techTitle:             'Line Changes by Scope',
  techHint:              'Raw = all commits; Clean = excluding generated/minified; Excluded = filtered-out files.',
  statType:              'Scope',
  statAdds:              'Insertions',
  statDels:              'Deletions',
  statFiles:             'Files',
  statChurn:             'Churn',
  statNet:               'Net',
  statExcluded:          'Excluded',

  filesTouchedTitle:     'Files Touched per Commit',
  concentrationTitle:    'Work Concentration',
  concentrationHint:     'Share of total events per top project.',

  highlightsTitle:       'Highlights',
  highlightsHint:        'Notable patterns from the period.',
  hlMostConsistentMonth: 'Most Consistent Month',
  hlWidestProjectDay:    'Widest Project Spread (day)',
  hlStrongestWeek:       'Strongest Week',
  hlMilestones:          'Milestones',

  labelProjects:         'Projects',
  labelKinds:            'Kinds',
  labelClean:            'Clean',
  labelRaw:              'Raw',
  labelExcluded:         'Excluded',

  evidenceTitle:         'Evidence Table',
  evidenceHint:          'All projects with entry counts, date ranges, and recent examples.',
  colProject:            'Project',
  colEntries:            'Entries',
  colFirst:              'First',
  colLast:               'Last',
  colExamples:           'Recent Examples',

  agentTitle:            'AI Agent Activity',
  agentHint:             'Extracted from ledger events with MCP/tool metadata.',
  activityTitle:         'Activity Pulse',
  activityHint:          'When work happens - hourly and daily patterns.',

  noCommitData:              'No commit size data available.',
  commitLineDataUnavailable: 'Commit line data unavailable.',
  lineStatsUnavailable:      'Line stats unavailable.',
  fileDataUnavailable:       'File touch data unavailable.',
  noMcpData:                 'No MCP/tool data recorded.',
  noAgentDays:               'No agent activity day data.',
  noSummaries:               'No recent summaries.',

  agentEventsLabel: 'Events',
  distinctActors:   'Actors',
  modelsUsed:       'MCP tools',
  toolsUsed:        'Tools used',

  streakMax: (n: number) => `Max: ${n} days`,

  kindLabels: {
    'code-change':  'Code Change',
    'plan':         'Plan',
    'verification': 'Verification',
    'commands':     'Commands',
    'handoff':      'Handoff',
    'general':      'General',
  },

  units: {
    days:    'days',
    entries: 'entries',
    commits: 'commits',
    lines:   'lines',
    files:   'files',
  },
}

const qc: I18nStrings = {
  ...en,
  title:                 'Impact de travail',
  subtitle:              'Statistiques du registre d\'agents',
  generated:             'Généré',
  range:                 'Période',
  langLabel:             'EN',
  intro:                 'Toute l\'activité enregistrée dans le registre d\'agents VaultWares.',

  metricEvents:          'Événements totaux',
  metricDays:            'Jours actifs',
  metricProjects:        'Projets',
  metricStreak:          'Séquence actuelle',
  metricLongestStreak:   'Plus longue séquence',
  metricBusiestDay:      'Jour le plus actif',
  metricBusiestWeek:     'Semaine la plus active',
  metricCommits:         'Commits',

  calendarTitle:         'Calendrier d\'activité',
  calendarHint:          'Chaque cellule = un jour. Intensité = nombre d\'événements.',
  less:                  'Moins',
  more:                  'Plus',

  monthlyTitle:          'Activité mensuelle',
  kindsTitle:            'Activité par type',
  projectsTitle:         'Projets par volume',
  projectsNote:          'Top 20 affiché.',

  commitSizeTitle:       'Distribution de la taille des commits',
  commitSizeHint:        'Lignes modifiées par commit (insertions + suppressions).',
  commitStatMean:        'Moyenne',
  commitStatMedian:      'Médiane',
  commitStatMode:        'Mode',
  commitStatSamples:     'Échantillons',
  commitHistTitle:       'Histogramme',
  commitBoxTitle:        'Boîte à moustaches par mois',
  commitOutliersTitle:   'Aberrants (>3200 lignes)',

  techTitle:             'Lignes modifiées par portée',
  techHint:              'Brut = tous les commits; Propre = hors généré/minifié; Exclus = fichiers filtrés.',
  statType:              'Portée',
  statAdds:              'Insertions',
  statDels:              'Suppressions',
  statFiles:             'Fichiers',
  statChurn:             'Rotation',
  statNet:               'Net',
  statExcluded:          'Exclus',

  filesTouchedTitle:     'Fichiers modifiés par commit',
  concentrationTitle:    'Concentration du travail',
  concentrationHint:     'Part des événements totaux par projet principal.',

  highlightsTitle:       'Points saillants',
  highlightsHint:        'Tendances notables de la période.',
  hlMostConsistentMonth: 'Mois le plus régulier',
  hlWidestProjectDay:    'Plus grand écart de projets (jour)',
  hlStrongestWeek:       'Semaine la plus forte',
  hlMilestones:          'Jalons',

  labelProjects:         'Projets',
  labelKinds:            'Types',
  labelClean:            'Propre',
  labelRaw:              'Brut',
  labelExcluded:         'Exclus',

  evidenceTitle:         'Tableau de preuves',
  evidenceHint:          'Tous les projets avec compteurs, plages de dates et exemples récents.',
  colProject:            'Projet',
  colEntries:            'Entrées',
  colFirst:              'Premier',
  colLast:               'Dernier',
  colExamples:           'Exemples récents',

  agentTitle:            'Activité des agents IA',
  agentHint:             'Extraite des événements du registre avec métadonnées MCP/outil.',
  activityTitle:         'Pouls d\'activité',
  activityHint:          'Quand le travail se produit - motifs horaires et quotidiens.',

  noCommitData:              'Aucune donnée de taille de commit disponible.',
  commitLineDataUnavailable: 'Données de lignes de commit indisponibles.',
  lineStatsUnavailable:      'Statistiques de lignes indisponibles.',
  fileDataUnavailable:       'Données de fichiers modifiés indisponibles.',
  noMcpData:                 'Aucune donnée MCP/outil enregistrée.',
  noAgentDays:               'Aucune donnée d\'activité d\'agent par jour.',
  noSummaries:               'Aucun résumé récent.',

  agentEventsLabel: 'Événements',
  distinctActors:   'Acteurs',
  modelsUsed:       'Modèles',
  toolsUsed:        'Outils utilisés',

  streakMax: (n: number) => `Max : ${n} jours`,

  kindLabels: {
    'code-change':  'Changement de code',
    'plan':         'Plan',
    'verification': 'Vérification',
    'commands':     'Commandes',
    'handoff':      'Transfert',
    'general':      'Général',
  },

  units: {
    days:    'jours',
    entries: 'entrées',
    commits: 'commits',
    lines:   'lignes',
    files:   'fichiers',
  },
}

export const translations: Record<Lang, I18nStrings> = { en, qc }

export function getI18n(lang: Lang): I18nStrings {
  return translations[lang] ?? translations.en
}
