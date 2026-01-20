
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  Trophy, Shield, Sword, Swords, Map as MapIcon, 
  Building2, FastForward, Users, 
  Bird, Globe, RotateCcw, SquareArrowUp, Star, Landmark, ChevronRight, Play, Sparkles,
  Link as LinkIcon, Copy, UserPlus, Zap, LayoutGrid, List, Github, Twitter, MessageSquare, ChevronDown, Monitor, Cpu
} from 'lucide-react';
import { Player, Cell, GamePhase, GameLogEntry, PlayerID, GameMode } from './types.ts';
// @ts-ignore
import { Peer } from 'https://esm.sh/peerjs@1.5.4';

const shadeColor = (col: string, amt: number) => {
  let num = parseInt(col.slice(1), 16);
  let r = Math.min(255, Math.max(0, (num >> 16) + amt));
  let g = Math.min(255, Math.max(0, ((num >> 8) & 255) + amt));
  let b = Math.min(255, Math.max(0, (num & 255) + amt));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

const GRID_SIZE_MAP: Record<number, number> = { 2: 15, 3: 18, 4: 20 };
const DEFAULT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const ALL_DIRECTIONS = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
];

type Lang = 'en' | 'ko';
type UIState = 'landing' | 'config' | 'game' | 'online_setup';
type MobileView = 'map' | 'status' | 'logs';

const TRANSLATIONS = {
  en: {
    title: "MIKROCIVITA",
    tagline: "The Zenith of Strategy",
    desc: "A Strategic Civilization Builder in your Browser.",
    heroTitle: "Build. Expand. Conquer.",
    heroDesc: "A polished turn-based strategy game where players build civilizations, expand territories, and engage in diplomacy or war to achieve global dominance.",
    playNow: "Start Conquest",
    playOnline: "Online Lobby",
    features: "Features",
    f1: "Deep Strategy",
    f1d: "Every tile matters. Manage your territory limits wisely and out-think your rivals.",
    f2: "Dynamic Warfare",
    f2d: "Victory isn't just luck. Your tech score determines your military prowess.",
    f3: "Grand Diplomacy",
    f3d: "Forge lasting truces or use peace as a weapon to consolidate power.",
    howToTitle: "How to Build an Empire",
    step1: "Found Your Capital",
    step1d: "Pick a strategic starting point. This is the heart of your nation.",
    step2: "Expand Borders",
    step2d: "Grow around your cities. Each building has a natural expansion limit.",
    step3: "Unite the Globe",
    step3d: "Through tech or force, bring every civilization under your banner.",
    start: "Forge Civilization",
    players: "Empire Count",
    turn: "Year",
    eliminated: "Eliminated",
    capLv: "Lv.{lv} Capital",
    citiesCount: "{count} Cities",
    territoryCount: "Territory: {current}/{max}",
    civStatus: "Empire Status",
    diploStatus: "Diplomacy",
    peace: "Pax Mundi: The world is at peace",
    vs: "vs",
    logs: "History",
    growCap: "Upgrade Capital",
    cityBuild: "New Colony",
    expand: "Expand",
    decWar: "Declare War",
    invade: "Invasion",
    truce: "Peace Treaty",
    endTurn: "Next Year",
    skipTurn: "Wait",
    initLog: "A new era begins. Establish your seat of power.",
    placeCap: "🏛️ Select your Capital's foundation tile.",
    warLog: "War declared on {name}!",
    growthLog: "The Capital has ascended to Level {lv}!",
    truceForcedLog: "FORCE TRUCE! A treaty with {name} is signed.",
    truceNormalLog: "Proposed a peace treaty to {name}.",
    truceAcceptLog: "Peace established between {p1} and {p2}.",
    truceDeclineLog: "{name} rejected the treaty.",
    truceEnded: "The peace treaty with {name} has expired.",
    noExpansion: "❌ No land left to claim!",
    limitReached: "❌ Sector reached capacity!",
    expandLog: "Claimed territory around {center} (+{n}).",
    warRestrict: "❌ Wartime blocks domestic growth!",
    cityLog: "A new colony has been founded.",
    cityUpLog: "Colony upgraded to Level {lv}",
    invadeSummary: "Assault result: {n} sectors captured!",
    invadeFailOnly: "Invasion repelled.",
    invadeCap: "Capital of {name} has fallen!",
    invadeCity: "Captured a colony from {name}!",
    capUpStart: "Capital expansion to Lv.{lv} in progress...",
    cityLvLimit: "❌ Colony level cannot exceed Capital ({lv})",
    struggleStart: "The era of struggle begins!",
    reset: "Back to Title",
    manualExpand: "Pick {n} expansion tiles.",
    pickEnemy: "⚔️ Select enemy territory to declare war!",
    pickCity: "🏙️ Select colony to upgrade or empty spot to build.",
    pickCenter: "📍 Select a hub to expand from.",
    trucePrompt: "{name} offers peace. Accept?",
    accept: "Accept",
    decline: "Decline",
    victory: "VICTORY!",
    winner: "has united the world!",
    techWinner: "achieves the technological pinnacle of civilization.",
    restart: "Restart Age",
    score: "Power Score",
    customize: "Customize Your Empire",
    namePlace: "Empire Name",
    capital: "Capital",
    city: "Colony",
    noEnemyInvade: "No enemy in range!",
    multiplayer: "Global Lobby",
    createRoom: "Create Room",
    joinRoom: "Join Room",
    roomID: "Room ID",
    connecting: "Connecting...",
    waitingPlayers: "Waiting for other empires...",
    imReady: "Ready for War",
    youAre: "Role:",
    host: "Host",
    client: "Challenger",
    notYourTurn: "Waiting for other turns...",
    activePlayer: "{name}'s Turn",
    map: "Strategic Map",
    status: "Intel"
  },
  ko: {
    title: "미크로시비타",
    tagline: "전략의 정점",
    desc: "브라우저에서 즐기는 고도의 전략 문명 시뮬레이션",
    heroTitle: "건설. 확장. 정복.",
    heroDesc: "정교한 턴제 전략을 통해 나만의 문명을 건설하고, 영토를 확장하며, 외교와 전쟁으로 세계의 정점에 올라서세요.",
    playNow: "정복 시작",
    playOnline: "온라인 로비",
    features: "특징",
    f1: "심도 있는 전략",
    f1d: "모든 타일이 전략의 핵심입니다. 영토 제한을 고려하여 효율적으로 확장하세요.",
    f2: "역동적인 전쟁",
    f2d: "문명의 종합 발전 수준이 곧 군사력입니다. 압도적인 국력으로 적을 굴복시키세요.",
    f3: "거대 외교",
    f3d: "때로는 칼보다 말이 강력합니다. 휴전을 통해 힘을 비축하거나 세력을 규합하세요.",
    howToTitle: "제국 건설 가이드",
    step1: "수도 정초",
    step1d: "전략적 요충지를 선택하세요. 국가의 심장이 될 곳입니다.",
    step2: "영토 확장",
    step2d: "도시 주변을 개척하세요. 각 거점은 고유의 확장 한계를 가집니다.",
    step3: "세계 통일",
    step3d: "기술력 혹은 무력을 통해 모든 문명을 당신의 깃발 아래 두십시오.",
    start: "문명 개척",
    players: "참여 문명 수",
    turn: "연도",
    eliminated: "멸망함",
    capLv: "수도 레벨 {lv}",
    citiesCount: "도시 {count}개",
    territoryCount: "영토: {current}/{max}",
    civStatus: "문명 현황",
    diploStatus: "외교 관계",
    peace: "세계에 평화의 시대가 지속되고 있습니다",
    vs: "대",
    logs: "문명 연대기",
    growCap: "수도 증축",
    cityBuild: "도시 건설",
    expand: "영토 확장",
    decWar: "전쟁 선포",
    invade: "군사 침공",
    truce: "휴전 제안",
    endTurn: "다음 연도",
    skipTurn: "대기",
    initLog: "새로운 시대의 서막이 올랐습니다. 수도를 건설하십시오.",
    placeCap: "🏛️ 수도를 건설할 타일을 선택하십시오.",
    warLog: "{name}에게 전쟁을 선포했습니다",
    growthLog: "수도가 {lv}레벨로 발전했습니다!",
    truceForcedLog: "강제 휴전! {name}와(과) 평화 협정을 맺었습니다.",
    truceNormalLog: "{name}에게 휴전을 제안했습니다.",
    truceAcceptLog: "{p1}와(과) {p2} 사이에 휴전이 성립되었습니다.",
    truceDeclineLog: "{name}이(가) 휴전을 거절했습니다.",
    truceEnded: "{name}와(과)의 휴전 기간이 끝났습니다.",
    noExpansion: "❌ 확장 가능한 인접지가 없습니다!",
    limitReached: "❌ 해당 거점의 영토 제한에 도달했습니다!",
    expandLog: "{center} 주변 영토를 확장했습니다 (+{n}).",
    warRestrict: "❌ 전시 상황에는 건설 및 증축이 불가능합니다!",
    cityLog: "새로운 도시를 개척했습니다",
    cityUpLog: "도시가 {lv}레벨로 업그레이드되었습니다",
    invadeSummary: "침공 결과: {n}개 타일을 점령했습니다.",
    invadeFailOnly: "침공이 격퇴되었습니다.",
    invadeCap: "{name}의 수도를 함락했습니다!",
    invadeCity: "{name}의 도시를 점령했습니다!",
    capUpStart: "{lv}레벨 수도로의 발전을 시작합니다...",
    cityLvLimit: "❌ 도시는 수도 레벨({lv})을 초과할 수 없습니다",
    struggleStart: "투쟁의 시대가 시작되었습니다!",
    reset: "타이틀로",
    manualExpand: "{n}개의 타일을 직접 선택하십시오.",
    pickEnemy: "⚔️ 전쟁을 선포할 적의 영토를 선택하십시오!",
    pickCity: "🏙️ 건설할 빈 터나 업그레이드할 도시를 선택하십시오.",
    pickCenter: "📍 확장의 기준이 될 거점을 선택하십시오.",
    trucePrompt: "{name}이(가) 휴전을 제안했습니다. 수락하시겠습니까?",
    accept: "수락",
    decline: "거절",
    victory: "승리!",
    winner: "이(가) 세계를 통일했습니다.",
    techWinner: "이(가) 문명의 기술적 정점에 도달했습니다.",
    restart: "시대 재시작",
    score: "발전도",
    customize: "국가 커스터마이징",
    namePlace: "문명 이름 입력",
    capital: "수도",
    city: "도시",
    noEnemyInvade: "사거리 내에 적대적인 영토가 없습니다!",
    multiplayer: "멀티플레이어 대기실",
    createRoom: "방 만들기",
    joinRoom: "참가하기",
    roomID: "방 코드",
    connecting: "연결 중...",
    waitingPlayers: "다른 문명을 기다리는 중...",
    imReady: "준비 완료",
    youAre: "현재 역할:",
    host: "방장",
    client: "참가자",
    notYourTurn: "다른 문명의 턴입니다",
    activePlayer: "{name}의 차례",
    map: "전략 지도",
    status: "문명 정보"
  }
};

const serializePlayer = (p: Player) => ({
  ...p,
  territory: Array.from(p.territory),
  originalTerritories: Array.from(p.originalTerritories),
  warWith: Array.from(p.warWith),
  truceWith: Array.from(p.truceWith),
  truceProposals: Array.from(p.truceProposals),
});

const deserializePlayer = (p: any): Player => ({
  ...p,
  territory: new Set(p.territory),
  originalTerritories: new Set(p.originalTerritories),
  warWith: new Set(p.warWith),
  truceWith: new Set(p.truceWith),
  truceProposals: new Set(p.truceProposals),
});

/**
 * Helper function to claim land around a specific coordinate for a player.
 * Used during initialization of the Capital to give players a starting territory.
 */
const claimAround = (pid: number, x: number, y: number, radius: number, playersArr: Player[], gridArr: Cell[][]) => {
  const size = gridArr.length;
  const p = playersArr[pid];
  const controlId = gridArr[y][x].control;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < size && ny < size) {
        if (gridArr[ny][nx].owner === null) {
          gridArr[ny][nx] = { owner: pid, type: 'land', control: controlId, level: 1 };
          p.territory.add(`${ny},${nx}`);
        }
      }
    }
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Lang>('en');
  const [uiState, setUiState] = useState<UIState>('landing');
  const [mode, setMode] = useState<GameMode>('local');
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [players, setPlayers] = useState<Player[]>([]);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [gameTurn, setGameTurn] = useState<number>(1);
  const [logs, setLogs] = useState<GameLogEntry[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<((x: number, y: number) => void) | null>(null);
  const [selectableCells, setSelectableCells] = useState<Set<string>>(new Set());
  const [gridSize, setGridSize] = useState<number>(15);
  const [expansionRemaining, setExpansionRemaining] = useState<number>(0);
  const [mobileView, setMobileView] = useState<MobileView>('map');

  const [peer, setPeer] = useState<any>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [connections, setConnections] = useState<any[]>([]);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [myPlayerId, setMyPlayerId] = useState<number | null>(null);
  const [joinId, setJoinId] = useState<string>('');
  const [onlineStatus, setOnlineStatus] = useState<'idle' | 'connecting' | 'lobby'>('idle');

  // Refs to avoid stale closures in PeerJS callbacks
  const connectionsRef = useRef<any[]>([]);
  const isHostRef = useRef<boolean>(false);
  const playersRef = useRef<Player[]>([]);
  const gridRef = useRef<Cell[][]>([]);
  const currentIdxRef = useRef<number>(0);
  const turnRef = useRef<number>(1);
  const phaseRef = useRef<GamePhase>('setup');
  const logsRef = useRef<GameLogEntry[]>([]);

  useEffect(() => { connectionsRef.current = connections; }, [connections]);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { turnRef.current = gameTurn; }, [gameTurn]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { logsRef.current = logs; }, [logs]);

  const currentPlayer = players[currentIdx];
  const isMyTurn = mode === 'local' || (myPlayerId !== null && currentIdx === myPlayerId);

  const t = (key: keyof typeof TRANSLATIONS['en'], params: Record<string, any> = {}) => {
    let str = TRANSLATIONS[lang][key] || key;
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, String(v));
    });
    return str;
  };

  const getUpgradeCooldown = (targetLevel: number) => {
    if (targetLevel >= 2 && targetLevel <= 4) return 2;
    if (targetLevel >= 5 && targetLevel <= 8) return 3;
    if (targetLevel === 9) return 4;
    if (targetLevel === 10) return 5;
    return 2;
  };

  const getPlayerScore = useCallback((pid: number, playersArr: Player[], gridArr: Cell[][]) => {
    const p = playersArr[pid];
    if (!p || p.eliminated) return 0;
    const buildingLevels: Record<string, number> = { 'capital': p.capitalLevel };
    let score = p.capitalLevel * 10;
    gridArr.forEach(row => row.forEach(cell => {
      if (cell.owner === pid && cell.type === 'city' && cell.control) {
        score += cell.level * 5;
        buildingLevels[cell.control] = cell.level;
      }
    }));
    gridArr.forEach(row => row.forEach(cell => {
      if (cell.owner === pid) {
        const parentLevel = (cell.control && buildingLevels[cell.control]) || 1;
        score += (2 * parentLevel);
      }
    }));
    return score;
  }, []);

  const addLog = (pid: number, text: string, type: GameLogEntry['type'] = 'info', currentLogs?: GameLogEntry[], currentTurn?: number) => {
    const entry = { turn: currentTurn || turnRef.current, playerId: pid, text, type };
    const newLogs = [entry, ...(currentLogs || logsRef.current)];
    setLogs(newLogs);
    return newLogs;
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3500);
  };

  const syncGameState = (updatedPlayers: Player[], updatedGrid: Cell[][], updatedCurrentIdx: number, updatedTurn: number, updatedPhase: GamePhase, updatedLogs: GameLogEntry[]) => {
    if (mode === 'online') {
      const payload = {
        players: updatedPlayers.map(serializePlayer),
        grid: updatedGrid,
        currentIdx: updatedCurrentIdx,
        turn: updatedTurn,
        phase: updatedPhase,
        logs: updatedLogs,
      };
      const msg = { type: 'SYNC_STATE', payload };
      if (isHostRef.current) {
        connectionsRef.current.forEach(conn => conn.send(msg));
      } else if (connectionsRef.current.length > 0) {
        connectionsRef.current[0].send(msg);
      }
    }
  };

  const checkWinCondition = (updatedPlayers: Player[], currentLogs: GameLogEntry[]) => {
    const techWinner = updatedPlayers.find(p => p.capitalLevel >= 10);
    if (techWinner) { 
      const finalLogs = addLog(techWinner.id, t('techWinner'), 'growth', currentLogs);
      setPhase('end'); 
      return { phase: 'end' as GamePhase, logs: finalLogs };
    }
    const survivors = updatedPlayers.filter(p => !p.eliminated);
    if (survivors.length === 1 && phaseRef.current !== 'setup') {
      const finalLogs = addLog(survivors[0].id, t('winner'), 'growth', currentLogs);
      setPhase('end');
      return { phase: 'end' as GamePhase, logs: finalLogs };
    }
    return { phase: phaseRef.current as GamePhase, logs: currentLogs };
  };

  const resetToLanding = () => {
    if (peer) peer.destroy();
    setUiState('landing');
    setPlayers([]);
    setGrid([]);
    setPhase('setup');
    setGameTurn(1);
    setLogs([]);
    setCurrentIdx(0);
    setConnections([]);
    setPeer(null);
    setOnlineStatus('idle');
    setMobileView('map');
  };

  const handleHost = () => {
    setOnlineStatus('connecting');
    const newPeer = new Peer();
    newPeer.on('open', (id: string) => {
      setRoomId(id);
      setIsHost(true);
      isHostRef.current = true;
      setMyPlayerId(0);
      setOnlineStatus('lobby');
      setPeer(newPeer);
    });
    newPeer.on('connection', (conn: any) => {
      setConnections(prev => {
        const next = [...prev, conn];
        connectionsRef.current = next;
        return next;
      });
      conn.on('data', (data: any) => handleIncomingData(data, conn));
    });
  };

  const handleJoin = () => {
    setOnlineStatus('connecting');
    const newPeer = new Peer();
    newPeer.on('open', () => {
      setPeer(newPeer);
      const conn = newPeer.connect(joinId);
      conn.on('open', () => {
        setConnections([conn]);
        connectionsRef.current = [conn];
        setIsHost(false);
        isHostRef.current = false;
        setOnlineStatus('lobby');
      });
      conn.on('data', (data: any) => handleIncomingData(data));
    });
  };

  const handleIncomingData = (data: any, conn?: any) => {
    if (data.type === 'SYNC_STATE') {
      const p = data.payload.players.map(deserializePlayer);
      const g = data.payload.grid;
      const ci = data.payload.currentIdx;
      const turn = data.payload.turn;
      const ph = data.payload.phase;
      const lg = data.payload.logs;

      setPlayers(p);
      setGrid(g);
      setCurrentIdx(ci);
      setGameTurn(turn);
      setPhase(ph);
      setLogs(lg);
      setUiState('game');

      if (isHostRef.current) {
        connectionsRef.current.forEach(c => { if (c !== conn) c.send(data); });
      }
    } else if (data.type === 'START_GAME') {
        setMyPlayerId(data.myId);
        setUiState('game');
    }
  };

  const initGameGrid = () => {
    const size = GRID_SIZE_MAP[playerCount];
    setGridSize(size);
    const initialGrid: Cell[][] = Array.from({ length: size }).map(() =>
      Array.from({ length: size }).map(() => ({ owner: null, type: null, control: null, level: 1 }))
    );
    const initialPlayers: Player[] = Array.from({ length: playerCount }).map((_, i) => ({
      id: i,
      name: players[i]?.name || (lang === 'ko' ? `문명 ${i + 1}` : `Civ ${i + 1}`),
      color: players[i]?.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      capital: null,
      capitalLevel: 1,
      capitalUpgrade: null,
      cities: [],
      territory: new Set<string>(),
      originalTerritories: new Set<string>(),
      warWith: new Set<PlayerID>(),
      truceWith: new Set<PlayerID>(),
      truceTurns: {} as Record<PlayerID, number>,
      truceProposals: new Set<PlayerID>(),
      eliminated: false,
    }));
    setGrid(initialGrid);
    setPlayers(initialPlayers);
    setUiState('game');
    setPhase('setup');
    const initLogs = addLog(-1, t('initLog'), 'info', []);
    showMessage(t('placeCap'));
    if (mode === 'online' && isHost) {
        connections.forEach((conn, i) => conn.send({ type: 'START_GAME', myId: i + 1 }));
        syncGameState(initialPlayers, initialGrid, 0, 1, 'setup', initLogs);
    }
  };

  const proceedToConfig = () => {
    const initialPlayers: Player[] = Array.from({ length: playerCount }).map((_, i) => ({
      id: i,
      name: lang === 'ko' ? `문명 ${i + 1}` : `Civ ${i + 1}`,
      color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      capital: null,
      capitalLevel: 1,
      capitalUpgrade: null,
      cities: [],
      territory: new Set<string>(),
      originalTerritories: new Set<string>(),
      warWith: new Set<PlayerID>(),
      truceWith: new Set<PlayerID>(),
      truceTurns: {} as Record<PlayerID, number>,
      truceProposals: new Set<PlayerID>(),
      eliminated: false,
    }));
    setPlayers(initialPlayers);
    setUiState('config');
  };

  const nextTurn = (updatedGrid?: Cell[][], updatedPlayers?: Player[], updatedLogs?: GameLogEntry[]) => {
    if (phaseRef.current === 'end') return;
    if (!isMyTurn && mode === 'online') return;
    
    const finalGrid = updatedGrid || gridRef.current;
    let finalLogs = updatedLogs || logsRef.current;
    const workingPlayers = [...(updatedPlayers || playersRef.current)];
    
    const p = { ...workingPlayers[currentIdxRef.current] };
    if (p.capitalUpgrade) {
      const up = { ...p.capitalUpgrade, remaining: p.capitalUpgrade.remaining - 1 };
      if (up.remaining <= 0) {
        p.capitalLevel = up.targetLevel;
        p.capitalUpgrade = null;
        finalLogs = addLog(p.id, t('growthLog', { lv: p.capitalLevel }), 'growth', finalLogs);
      } else { 
        p.capitalUpgrade = up; 
      }
    }
    
    const newTruceTurns = { ...p.truceTurns };
    const newTruceWith = new Set(p.truceWith);
    Object.entries(newTruceTurns).forEach(([enemyIdStr, turns]) => {
      const enemyId = parseInt(enemyIdStr);
      const remaining = (turns as number) - 1;
      if (remaining <= 0) {
        delete newTruceTurns[enemyId];
        newTruceWith.delete(enemyId);
        finalLogs = addLog(p.id, t('truceEnded', { name: workingPlayers[enemyId].name }), 'info', finalLogs);
        const enemy = { ...workingPlayers[enemyId], truceWith: new Set(workingPlayers[enemyId].truceWith) };
        enemy.truceWith.delete(p.id);
        const enemyTurns = { ...enemy.truceTurns }; delete enemyTurns[p.id];
        enemy.truceTurns = enemyTurns;
        workingPlayers[enemyId] = enemy;
      } else { newTruceTurns[enemyId] = remaining; }
    });
    p.truceTurns = newTruceTurns; p.truceWith = newTruceWith;
    workingPlayers[currentIdxRef.current] = p;

    const winResult = checkWinCondition(workingPlayers, finalLogs);
    const finalPhase = winResult.phase;
    finalLogs = winResult.logs;

    setPendingAction(null); setSelectableCells(new Set()); setExpansionRemaining(0);
    
    let nextIdx = (currentIdxRef.current + 1) % playerCount;
    const areThereSurvivors = workingPlayers.some((pl, idx) => !pl.eliminated && idx !== currentIdxRef.current);
    if (areThereSurvivors) {
        while (workingPlayers[nextIdx] && workingPlayers[nextIdx].eliminated) { 
            nextIdx = (nextIdx + 1) % playerCount; 
        }
    }
    
    let nextTurnNum = turnRef.current;
    if (nextIdx === 0) {
        nextTurnNum = turnRef.current + 1;
        setGameTurn(nextTurnNum);
    }

    setPlayers(workingPlayers);
    setGrid(finalGrid);
    setLogs(finalLogs);
    setCurrentIdx(nextIdx);
    setPhase(finalPhase);
    
    if (mode === 'online') {
        syncGameState(workingPlayers, finalGrid, nextIdx, nextTurnNum, finalPhase, finalLogs);
    }
  };

  const cellClick = (x: number, y: number) => {
    if (!isMyTurn) return;
    if (phaseRef.current === 'setup') {
      if (gridRef.current[y][x].owner !== null) return;
      const newGrid = [...gridRef.current.map(row => [...row])];
      const newPlayers = [...playersRef.current.map(p => ({ ...p, territory: new Set(p.territory) }))];
      const p = { ...newPlayers[currentIdxRef.current] };
      p.capital = { x, y };
      p.territory.add(`${y},${x}`);
      newGrid[y][x] = { owner: currentIdxRef.current, type: 'capital', control: 'capital', level: 1 };
      // Added missing claimAround function call to initialize player territory.
      claimAround(currentIdxRef.current, x, y, 1, newPlayers, newGrid);
      newPlayers[currentIdxRef.current] = p;
      
      const isLastPlayer = currentIdxRef.current === playerCount - 1;
      const nextPhase = isLastPlayer ? 'play' : 'setup';
      const nextIdx = isLastPlayer ? 0 : currentIdxRef.current + 1;

      let finalLogs = logsRef.current;
      if (isLastPlayer) {
          finalLogs = addLog(-1, t('struggleStart'), 'info');
          setPhase('play');
      }
      
      setGrid(newGrid);
      setPlayers(newPlayers);
      setCurrentIdx(nextIdx);
      syncGameState(newPlayers, newGrid, nextIdx, turnRef.current, nextPhase, finalLogs);
    } else if (phaseRef.current === 'play' && pendingAction) { pendingAction(x, y); }
  };

  const handleCityGrow = () => {
    if (!isMyTurn) return;
    if (currentPlayer.warWith.size > 0) { showMessage(t('warRestrict')); return; }
    const validSpots: Set<string> = new Set();
    gridRef.current.forEach((row, y) => row.forEach((cell, x) => {
      if (cell.owner === null) {
        let near = false;
        currentPlayer.territory.forEach(k => { const [ty, tx] = k.split(',').map(Number); if (Math.abs(tx - x) <= 1 && Math.abs(ty - y) <= 1) near = true; });
        let tooClose = false;
        if (currentPlayer.capital && Math.abs(currentPlayer.capital.x - x) <= 2 && Math.abs(currentPlayer.capital.y - y) <= 2) tooClose = true;
        currentPlayer.cities.forEach(c => { if (Math.abs(c.x - x) <= 2 && Math.abs(c.y - y) <= 2) tooClose = true; });
        if (near && !tooClose) validSpots.add(`${y},${x}`);
      } else if (cell.owner === currentIdxRef.current && cell.type === 'city') {
        validSpots.add(`${y},${x}`);
      }
    }));
    setSelectableCells(validSpots); showMessage(t('pickCity'));
    setPendingAction(() => (x: number, y: number) => {
      const key = `${y},${x}`; if (!validSpots.has(key)) return;
      const cell = gridRef.current[y][x];
      if (cell.owner === currentIdxRef.current && cell.type === 'city') {
        if (cell.level >= currentPlayer.capitalLevel) { showMessage(t('cityLvLimit', { lv: currentPlayer.capitalLevel })); return; }
        const newGrid = [...gridRef.current.map(r => [...r])];
        newGrid[y][x] = { ...newGrid[y][x], level: newGrid[y][x].level + 1 };
        const newLogs = addLog(currentIdxRef.current, t('cityUpLog', { lv: cell.level + 1 }));
        nextTurn(newGrid, playersRef.current, newLogs);
      } else if (cell.owner === null) {
        const cityId = `city_${currentPlayer.cities.length}`;
        const newGrid = [...gridRef.current.map(r => [...r])];
        newGrid[y][x] = { owner: currentIdxRef.current, type: 'city', control: cityId, level: 1 };
        const newPlayers = [...playersRef.current.map(pl => ({ ...pl, territory: new Set(pl.territory) }))];
        const p = { ...newPlayers[currentIdxRef.current] };
        p.cities = [...p.cities, { x, y, id: cityId }];
        p.territory.add(key);
        newPlayers[currentIdxRef.current] = p;
        const newLogs = addLog(currentIdxRef.current, t('cityLog'), 'growth');
        nextTurn(newGrid, newPlayers, newLogs);
      }
    });
  };

  const handleExpand = () => {
    if (!isMyTurn) return;
    if (currentPlayer.warWith.size > 0) { showMessage(t('warRestrict')); return; }
    showMessage(t('pickCenter'));
    const centers = [
      { id: 'capital', name: t('capital'), x: currentPlayer.capital!.x, y: currentPlayer.capital!.y, limit: 25 },
      ...currentPlayer.cities.map(c => ({ id: c.id, name: t('city'), x: c.x, y: c.y, limit: 10 }))
    ];
    setSelectableCells(new Set(centers.map(c => `${c.y},${c.x}`)));
    setPendingAction(() => (x: number, y: number) => {
      const center = centers.find(c => c.x === x && c.y === y);
      if (!center) return;
      const currentCenterTerritory: string[] = [];
      gridRef.current.forEach((row, gy) => row.forEach((cell, gx) => { if (cell.owner === currentIdxRef.current && cell.control === center.id) currentCenterTerritory.push(`${gy},${gx}`); }));
      const capacityLeft = center.limit - currentCenterTerritory.length;
      if (capacityLeft <= 0) { showMessage(t('limitReached')); return; }
      const frontierSet: Set<string> = new Set();
      currentCenterTerritory.forEach(k => {
        const [ty, tx] = k.split(',').map(Number);
        ALL_DIRECTIONS.forEach(([dy, dx]) => { const nx = tx + dx, ny = ty + dy; if (nx >= 0 && ny >= 0 && nx < gridSize && ny < gridSize && gridRef.current[ny][nx].owner === null) frontierSet.add(`${ny},${nx}`); });
      });
      const frontier = Array.from(frontierSet);
      if (frontier.length === 0) { showMessage(t('noExpansion')); return; }
      if (frontier.length <= capacityLeft) {
        const newGrid = [...gridRef.current.map(r => [...r])];
        const newPlayers = [...playersRef.current.map(pl => ({ ...pl, territory: new Set(pl.territory) }))];
        const p = { ...newPlayers[currentIdxRef.current] };
        frontier.forEach(key => {
          const [fy, fx] = key.split(',').map(Number);
          newGrid[fy][fx] = { owner: currentIdxRef.current, type: 'land', control: center.id, level: 1 };
          p.territory.add(key);
        });
        newPlayers[currentIdxRef.current] = p;
        const newLogs = addLog(currentIdxRef.current, t('expandLog', { center: center.name, n: frontier.length }));
        nextTurn(newGrid, newPlayers, newLogs);
      } else {
        setExpansionRemaining(capacityLeft); setSelectableCells(new Set(frontier)); showMessage(t('manualExpand', { n: capacityLeft }));
        setPendingAction(() => (mx: number, my: number) => {
          const mKey = `${my},${mx}`; if (!frontierSet.has(mKey)) return;
          const newGrid = [...gridRef.current.map(r => [...r])];
          newGrid[my][mx] = { owner: currentIdxRef.current, type: 'land', control: center.id, level: 1 };
          const newPlayers = [...playersRef.current.map(pl => ({ ...pl, territory: new Set(pl.territory) }))];
          const p = { ...newPlayers[currentIdxRef.current] };
          p.territory.add(mKey);
          newPlayers[currentIdxRef.current] = p;
          
          setGrid(newGrid);
          setPlayers(newPlayers);
          setExpansionRemaining(prev => { 
              if (prev - 1 <= 0) { 
                  const newLogs = addLog(currentIdxRef.current, t('expandLog', { center: center.name, n: capacityLeft })); 
                  setTimeout(() => nextTurn(newGrid, newPlayers, newLogs), 10); 
                  return 0; 
              } 
              return prev - 1; 
          });
          setSelectableCells(prev => { const ns = new Set(prev); ns.delete(mKey); return ns; });
        });
      }
    });
  };

  const handleInvasion = () => {
    if (!isMyTurn) return;
    const targets: Set<string> = new Set();
    currentPlayer.territory.forEach(k => {
      const [y, x] = k.split(',').map(Number);
      ALL_DIRECTIONS.forEach(([dy, dx]) => { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < gridSize && ny < gridSize) { const target = gridRef.current[ny][nx]; if (target.owner !== null && currentPlayer.warWith.has(target.owner)) targets.add(`${ny},${nx}`); } });
    });
    if (targets.size === 0) { showMessage(t('noEnemyInvade')); return; }
    const attackerScore = getPlayerScore(currentIdxRef.current, playersRef.current, gridRef.current);
    let totalCaptured = 0;
    
    const nextGrid = [...gridRef.current.map(r => [...r])];
    const nextPlayers = [...playersRef.current.map(p => ({ ...p, territory: new Set(p.territory) }))];
    const pAttacker = nextPlayers[currentIdxRef.current];
    let currentLogs = logsRef.current;
    
    targets.forEach(key => {
      const [ty, tx] = key.split(',').map(Number); const cell = nextGrid[ty][tx]; const oldOwnerId = cell.owner!;
      const defenderScore = getPlayerScore(oldOwnerId, nextPlayers, nextGrid);
      const successChance = Math.max(0.05, attackerScore / (attackerScore + defenderScore));
      if (Math.random() < successChance) {
        totalCaptured++;
        if (cell.type === 'capital') {
          currentLogs = addLog(currentIdxRef.current, t('invadeCap', { name: nextPlayers[oldOwnerId].name }), 'war', currentLogs);
          nextPlayers[oldOwnerId].eliminated = true;
          nextGrid.forEach((row, gy) => row.forEach((c, gx) => { if (c.owner === oldOwnerId) { nextGrid[gy][gx] = { ...c, owner: currentIdxRef.current, control: 'captured' }; pAttacker.territory.add(`${gy},${gx}`); } }));
        } else if (cell.type === 'city') {
          const cityId = cell.control; 
          currentLogs = addLog(currentIdxRef.current, t('invadeCity', { name: nextPlayers[oldOwnerId].name }), 'war', currentLogs);
          nextGrid.forEach((row, gy) => row.forEach((c, gx) => { if (c.owner === oldOwnerId && c.control === cityId) { nextGrid[gy][gx] = { ...c, owner: currentIdxRef.current, control: `captured:from:${oldOwnerId}` }; pAttacker.territory.add(`${gy},${gx}`); nextPlayers[oldOwnerId].territory.delete(`${gy},${gx}`); } }));
        } else { nextGrid[ty][tx] = { ...cell, owner: currentIdxRef.current, control: 'captured' }; pAttacker.territory.add(key); nextPlayers[oldOwnerId].territory.delete(key); }
      }
    });

    if (totalCaptured > 0) currentLogs = addLog(currentIdxRef.current, t('invadeSummary', { n: totalCaptured }), 'war', currentLogs); 
    else currentLogs = addLog(currentIdxRef.current, t('invadeFailOnly'), 'info', currentLogs);
    
    nextTurn(nextGrid, nextPlayers, currentLogs);
  };

  const handleWar = () => {
    if (!isMyTurn) return;
    const enemyTerritories: Set<string> = new Set();
    gridRef.current.forEach((row, y) => row.forEach((cell, x) => { if (cell.owner !== null && cell.owner !== currentIdxRef.current && !currentPlayer.warWith.has(cell.owner) && !currentPlayer.truceWith.has(cell.owner)) enemyTerritories.add(`${y},${x}`); }));
    if (enemyTerritories.size === 0) return;
    setSelectableCells(enemyTerritories); showMessage(t('pickEnemy'));
    setPendingAction(() => (x: number, y: number) => {
      const targetCell = gridRef.current[y][x]; if (!enemyTerritories.has(`${y},${x}`)) return;
      const targetId = targetCell.owner!;
      const nextP = [...playersRef.current.map(pl => ({ ...pl, warWith: new Set(pl.warWith) }))];
      nextP[currentIdxRef.current].warWith.add(targetId);
      nextP[targetId].warWith.add(currentIdxRef.current);
      const nextLogs = addLog(currentIdxRef.current, t('warLog', { name: playersRef.current[targetId].name }), 'war'); 
      nextTurn(gridRef.current, nextP, nextLogs);
    });
  };

  const renderGrid = useMemo(() => grid.map((row, y) => (
    <div key={y} className="flex">
      {row.map((cell, x) => {
        const isSelectable = selectableCells.has(`${y},${x}`);
        const ownerColor = cell.owner !== null && players[cell.owner] ? players[cell.owner].color : 'transparent';
        const borders = {
            top: y > 0 && grid[y-1][x].owner === cell.owner && grid[y-1][x].control !== cell.control,
            right: x < gridSize - 1 && grid[y][x+1].owner === cell.owner && grid[y][x+1].control !== cell.control,
            bottom: y < gridSize - 1 && grid[y+1][x].owner === cell.owner && grid[y+1][x].control !== cell.control,
            left: x > 0 && grid[y][x-1].owner === cell.owner && grid[y][x-1].control !== cell.control,
        };
        return (
          <div key={`${x}-${y}`} onClick={() => cellClick(x, y)}
            style={{ 
              backgroundColor: cell.owner !== null && players[cell.owner] ? (
                cell.type === 'capital' ? '#f59e0b' : 
                cell.type === 'city' ? shadeColor(ownerColor, -80) : 
                cell.control === 'capital' ? shadeColor(ownerColor, 40) : 
                cell.control?.startsWith('city') ? shadeColor(ownerColor, 75) : 
                shadeColor(ownerColor, 60)
              ) : undefined,
              borderTop: borders.top ? '2px solid rgba(0,0,0,0.5)' : undefined,
              borderRight: borders.right ? '2px solid rgba(0,0,0,0.5)' : undefined,
              borderBottom: borders.bottom ? '2px solid rgba(0,0,0,0.5)' : undefined,
              borderLeft: borders.left ? '2px solid rgba(0,0,0,0.5)' : undefined,
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 border border-slate-700/50 flex items-center justify-center text-[10px] sm:text-xs font-bold cursor-pointer rounded-sm
              ${isSelectable ? 'selectable-pulse border-white shadow-lg' : ''}
              ${cell.type === 'capital' ? 'ring-1 ring-yellow-400 shadow-lg shadow-yellow-500/20' : ''}
              ${cell.owner === null ? 'bg-slate-800' : ''}`}
          >
            {cell.type === 'capital' && cell.owner !== null && players[cell.owner] && <span className="text-yellow-950">{players[cell.owner].capitalLevel}</span>}
            {cell.type === 'city' && <span className="opacity-80 text-white">{cell.level}</span>}
          </div>
        );
      })}
    </div>
  )), [grid, selectableCells, players, gridSize]);

  // Premium Landing Sections
  const Hero = () => (
    <section className="relative min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent)]" />
      <div className="max-w-4xl text-center space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
        <h4 className="text-yellow-500 font-black tracking-[0.4em] uppercase text-sm mb-4">{t('tagline')}</h4>
        <h1 className="text-6xl md:text-9xl font-black leading-none tracking-tighter">{t('heroTitle')}</h1>
        <p className="text-slate-400 text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed">{t('heroDesc')}</p>
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
          <button onClick={() => { setMode('local'); proceedToConfig(); }} className="w-full sm:w-auto px-12 py-6 bg-white text-slate-950 rounded-full font-black text-xl hover:scale-105 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3">
            {t('playNow')} <Play className="w-6 h-6" fill="currentColor" />
          </button>
          <button onClick={() => { setMode('online'); setUiState('online_setup'); }} className="w-full sm:w-auto px-12 py-6 bg-slate-900 border border-slate-700 rounded-full font-bold text-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
            {t('playOnline')} <Globe className="w-6 h-6" />
          </button>
        </div>
      </div>
      <div className="absolute bottom-12 animate-bounce opacity-30"><ChevronDown className="w-8 h-8" /></div>
    </section>
  );

  const FeatureSection = () => (
    <section className="py-32 px-8 bg-slate-900/30">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
        <FeatureCard icon={<Sparkles className="text-yellow-400" />} title={t('f1')} desc={t('f1d')} />
        <FeatureCard icon={<Sword className="text-red-400" />} title={t('f2')} desc={t('f2d')} />
        <FeatureCard icon={<Bird className="text-cyan-400" />} title={t('f3')} desc={t('f3d')} />
      </div>
    </section>
  );

  const GuideSection = () => (
    <section className="py-32 px-8">
      <div className="max-w-5xl mx-auto space-y-24">
        <div className="text-center space-y-4"><h2 className="text-5xl font-black">{t('howToTitle')}</h2><p className="text-slate-500 font-bold">Master the art of rule.</p></div>
        <div className="grid gap-12">
          <GuideStep num="01" title={t('step1')} desc={t('step1d')} icon={<Landmark className="text-yellow-500" />} />
          <GuideStep num="02" title={t('step2')} desc={t('step2d')} icon={<MapIcon className="text-blue-500" />} />
          <GuideStep num="03" title={t('step3')} desc={t('step3d')} icon={<Trophy className="text-emerald-500" />} />
        </div>
      </div>
    </section>
  );

  if (uiState === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden scroll-smooth">
        <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-[100] backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3"><Landmark className="w-8 h-8 text-yellow-500" /><span className="text-2xl font-black tracking-tighter uppercase">{t('title')}</span></div>
          <div className="flex gap-4">
             <button onClick={() => setLang('en')} className={`text-sm font-black transition-all ${lang === 'en' ? 'text-yellow-500' : 'text-slate-500'}`}>EN</button>
             <button onClick={() => setLang('ko')} className={`text-sm font-black transition-all ${lang === 'ko' ? 'text-yellow-500' : 'text-slate-500'}`}>KO</button>
          </div>
        </nav>
        <Hero />
        <FeatureSection />
        <GuideSection />
        <footer className="py-24 border-t border-slate-900 text-center space-y-8">
          <div className="flex justify-center gap-8 opacity-40 hover:opacity-100 transition-all">
            <Github className="w-6 h-6" /> <Twitter className="w-6 h-6" /> <MessageSquare className="w-6 h-6" />
          </div>
          <p className="text-slate-600 font-bold text-sm">© 2024 MIKROCIVITA. ALL RIGHTS RESERVED.</p>
        </footer>
      </div>
    );
  }

  if (uiState === 'online_setup') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8 text-white">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-4">
            <Globe className="w-16 h-16 mx-auto text-cyan-400 animate-pulse" />
            <h2 className="text-5xl font-black uppercase tracking-tighter">{t('multiplayer')}</h2>
          </div>
          {onlineStatus === 'idle' ? (
            <div className="grid md:grid-cols-2 gap-6">
              <button onClick={handleHost} className="p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:bg-slate-800 transition-all text-left space-y-4 group">
                <UserPlus className="w-10 h-10 text-yellow-500 group-hover:scale-110 transition-transform" />
                <div><h3 className="text-2xl font-bold">{t('createRoom')}</h3><p className="text-slate-500 text-sm">Forge a new world arena.</p></div>
              </button>
              <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <LinkIcon className="w-10 h-10 text-cyan-500" />
                <input value={joinId} onChange={e => setJoinId(e.target.value)} placeholder={t('roomID')} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-bold outline-none focus:ring-2 ring-cyan-500/50" />
                <button onClick={handleJoin} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-black transition-all">{t('joinRoom')}</button>
              </div>
            </div>
          ) : onlineStatus === 'connecting' ? (
            <div className="text-center py-12 space-y-4"><div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" /><p className="font-bold text-slate-500">{t('connecting')}</p></div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] space-y-8">
              <div className="flex justify-between items-center">
                <div className="space-y-1"><span className="text-[10px] font-black uppercase text-slate-500">Room Code</span><div className="flex items-center gap-3"><span className="text-3xl font-mono font-black text-cyan-400">{roomId || joinId}</span><button onClick={() => { navigator.clipboard.writeText(roomId || joinId); showMessage('Copied!'); }}><Copy className="w-5 h-5 text-slate-500" /></button></div></div>
                <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800"><span className="text-[10px] block font-black text-slate-500">{t('youAre')}</span><span className="font-black text-sm">{isHost ? t('host') : t('client')}</span></div>
              </div>
              <div className="space-y-4 border-t border-slate-800 pt-8">
                <h4 className="text-xs font-black text-slate-500 flex items-center gap-2"><Users className="w-4 h-4" /> Players ({connections.length + 1})</h4>
                <div className="flex gap-2">
                  <div className="px-4 py-2 bg-slate-950 rounded-full border border-yellow-500/30 text-yellow-500 font-bold text-xs flex items-center gap-2"><Star className="w-3 h-3" fill="currentColor" /> {t('host')}</div>
                  {connections.map((_, i) => <div key={i} className="px-4 py-2 bg-slate-950 rounded-full border border-slate-800 text-slate-500 font-bold text-xs">Empire {i+2}</div>)}
                </div>
              </div>
              {isHost && (
                <div className="pt-8 space-y-6">
                  <div className="flex items-center justify-center gap-4">
                    <span className="font-bold text-slate-400">{t('players')}</span>
                    {[2,3,4].map(n => <button key={n} onClick={() => setPlayerCount(n)} className={`w-12 h-12 rounded-xl font-black ${playerCount === n ? 'bg-yellow-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>{n}</button>)}
                  </div>
                  <button onClick={initGameGrid} disabled={connections.length < playerCount-1} className="w-full py-6 bg-yellow-500 text-slate-950 font-black text-2xl rounded-3xl disabled:opacity-20">{t('start')}</button>
                </div>
              )}
            </div>
          )}
          <button onClick={resetToLanding} className="w-full text-slate-600 font-bold hover:text-white transition-all">{t('reset')}</button>
        </div>
      </div>
    );
  }

  if (uiState === 'config') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-white">
        <div className="max-w-4xl w-full space-y-12">
          <div className="text-center space-y-2"><h2 className="text-5xl font-black tracking-tight">{t('customize')}</h2><p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Configure your empire</p></div>
          <div className="grid md:grid-cols-2 gap-4">
            {players.map((p, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] space-y-4">
                <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500">Empire {idx+1}</span><div className="w-5 h-5 rounded-full" style={{ backgroundColor: p.color }} /></div>
                <input value={p.name} onChange={e => { const n = [...players]; n[idx].name = e.target.value; setPlayers(n); }} placeholder={t('namePlace')} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-bold outline-none ring-yellow-500/30 focus:ring-2" />
                <div className="flex gap-2 flex-wrap">{DEFAULT_COLORS.map(c => <button key={c} onClick={() => { const n = [...players]; n[idx].color = c; setPlayers(n); }} style={{ backgroundColor: c }} className={`w-8 h-8 rounded-lg border-2 transition-all ${p.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`} />)}</div>
              </div>
            ))}
          </div>
          <button onClick={initGameGrid} className="w-full py-6 bg-yellow-500 text-slate-950 font-black text-3xl rounded-3xl shadow-2xl hover:bg-yellow-400 active:scale-95 transition-all">{t('start')}</button>
        </div>
      </div>
    );
  }

  // GAME UI
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden relative text-white flex-col lg:flex-row">
      {/* HUD Message Overlay */}
      {message && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-yellow-500 text-slate-950 font-black text-lg rounded-full shadow-2xl animate-bounce flex items-center gap-4 border-4 border-white/20">
          <Landmark className="w-6 h-6" /> {message}
        </div>
      )}

      {/* Desktop Sidebar (Left) */}
      <aside className="hidden lg:flex w-72 bg-slate-900/40 backdrop-blur-3xl border-r border-white/5 flex-col z-20">
        <div className="p-8 border-b border-white/5 flex items-center gap-3"><Landmark className="w-6 h-6 text-yellow-500" /><h1 className="font-black tracking-tighter uppercase text-2xl">{t('title')}</h1></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
           <CivilizationIntel players={players} currentIdx={currentIdx} gameTurn={gameTurn} grid={grid} t={t} getPlayerScore={getPlayerScore} myPlayerId={myPlayerId} mode={mode} />
        </div>
        <div className="p-4 bg-slate-950/50 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest"><span>Year {gameTurn}</span><button onClick={resetToLanding} className="hover:text-white transition-all"><RotateCcw className="w-4 h-4"/></button></div>
      </aside>

      {/* Main Gameplay */}
      <section className="flex-1 flex flex-col relative overflow-hidden">
        {/* Mobile Nav */}
        <div className="lg:hidden flex bg-slate-900/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 justify-between items-center z-50">
           <div className="flex items-center gap-2 font-black tracking-tighter uppercase text-sm"><Landmark className="w-5 h-5 text-yellow-500" /> {t('title')}</div>
           <div className="flex gap-2">
              <NavBtn active={mobileView === 'map'} icon={<LayoutGrid />} onClick={() => setMobileView('map')} />
              <NavBtn active={mobileView === 'status'} icon={<Users />} onClick={() => setMobileView('status')} />
              <NavBtn active={mobileView === 'logs'} icon={<List />} onClick={() => setMobileView('logs')} />
           </div>
        </div>

        {/* View Content */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          <div className={`flex-1 items-center justify-center p-8 overflow-auto z-10 ${mobileView === 'map' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-md">
               {renderGrid}
            </div>
          </div>
          {mobileView === 'status' && <div className="lg:hidden flex-1 bg-slate-950 overflow-y-auto p-6"><CivilizationIntel players={players} currentIdx={currentIdx} gameTurn={gameTurn} grid={grid} t={t} getPlayerScore={getPlayerScore} myPlayerId={myPlayerId} mode={mode} /></div>}
          {mobileView === 'logs' && <div className="lg:hidden flex-1 bg-slate-950 overflow-y-auto p-6"><LogChronicle logs={logs} players={players} t={t} /></div>}
        </div>

        {/* Action HUD */}
        {phase === 'play' && mobileView === 'map' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-4 w-full max-w-4xl px-4 animate-in slide-in-from-bottom-12 duration-500">
             {currentPlayer && (
               <div className="flex items-center gap-3 px-6 py-2 bg-slate-950/80 border border-white/5 rounded-full shadow-2xl backdrop-blur-xl">
                 <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: currentPlayer.color }} />
                 <span className="text-xs font-black uppercase tracking-widest" style={{ color: currentPlayer.color }}>{t('activePlayer', { name: currentPlayer.name })}</span>
               </div>
             )}
             <div className="flex flex-col sm:flex-row gap-4 w-full items-center justify-center">
                <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/5 p-2 rounded-[2.5rem] flex flex-nowrap gap-2 shadow-2xl overflow-x-auto max-w-full scrollbar-hide snap-x touch-pan-x px-6 sm:px-2">
                  <HUDButton icon={<SquareArrowUp />} label={t('growCap')} color="yellow" onClick={() => { 
                     if (!currentPlayer.capitalUpgrade) { 
                       const next = currentPlayer.capitalLevel + 1; 
                       const nextPlayers = [...players]; const p = {...nextPlayers[currentIdx]}; 
                       p.capitalUpgrade = { targetLevel: next, remaining: getUpgradeCooldown(next) }; 
                       nextPlayers[currentIdx] = p; 
                       const newLogs = addLog(currentIdx, t('capUpStart', { lv: next }), 'growth'); 
                       nextTurn(grid, nextPlayers, newLogs); 
                     } 
                   }} active={!!currentPlayer.capitalUpgrade} disabled={!isMyTurn} badge={currentPlayer.capitalUpgrade ? `${currentPlayer.capitalUpgrade.remaining}T` : null}/>
                  <HUDButton icon={<Building2 />} label={t('cityBuild')} color="emerald" onClick={handleCityGrow} disabled={!isMyTurn}/>
                  <HUDButton icon={<MapIcon />} label={t('expand')} color="blue" onClick={handleExpand} disabled={!isMyTurn} badge={expansionRemaining > 0 ? `+${expansionRemaining}` : null}/>
                  <div className="w-px bg-white/5 my-4 mx-2 shrink-0 self-stretch" />
                  <HUDButton icon={<Sword />} label={t('decWar')} color="red" onClick={handleWar} disabled={!isMyTurn}/>
                  <HUDButton icon={<Swords />} label={t('invade')} color="orange" onClick={handleInvasion} disabled={!isMyTurn || currentPlayer.warWith.size === 0}/>
                  <HUDButton icon={<Bird className="w-5 h-5" />} label={t('truce')} color="cyan" onClick={() => {}} disabled={!isMyTurn || currentPlayer.warWith.size === 0}/>
                </div>
                <button onClick={() => nextTurn()} disabled={!isMyTurn} className="w-full sm:w-auto px-10 py-5 bg-white text-slate-950 rounded-[2rem] font-black text-lg hover:scale-105 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 shrink-0 whitespace-nowrap disabled:opacity-20">{t('endTurn')} <ChevronRight className="w-6 h-6"/></button>
             </div>
          </div>
        )}

        {/* End Game Overlay */}
        {phase === 'end' && (
          <div className="absolute inset-0 z-[200] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-8">
            <div className="max-w-xl w-full bg-slate-900 border border-white/5 rounded-[3rem] p-12 text-center space-y-8 animate-in zoom-in-95 duration-500 shadow-2xl">
               <Trophy className="w-24 h-24 mx-auto text-yellow-500 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]" />
               <div className="space-y-4">
                 <h2 className="text-6xl font-black">{t('victory')}</h2>
                 <p className="text-xl text-slate-400 font-bold uppercase tracking-widest">{players.find(p => !p.eliminated || p.capitalLevel >= 10)?.name} {t('winner')}</p>
               </div>
               <button onClick={resetToLanding} className="w-full py-6 bg-yellow-500 text-slate-950 font-black text-2xl rounded-3xl hover:bg-yellow-400 active:scale-95 transition-all">{t('restart')}</button>
            </div>
          </div>
        )}
      </section>

      {/* Desktop History Log */}
      <aside className="hidden lg:flex w-80 bg-slate-900/40 backdrop-blur-3xl border-l border-white/5 flex-col z-20">
        <div className="p-8 border-b border-white/5"><h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">{t('logs')}</h3></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin"><LogChronicle logs={logs} players={players} t={t} /></div>
      </aside>
    </div>
  );
};

// Components
const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="bg-slate-900/50 border border-white/5 p-12 rounded-[3rem] space-y-6 hover:bg-slate-800 transition-all group">
    <div className="w-20 h-20 bg-slate-950 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">{React.cloneElement(icon as React.ReactElement<any>, { className: "w-10 h-10" })}</div>
    <h3 className="text-3xl font-black">{title}</h3>
    <p className="text-slate-500 font-bold leading-relaxed">{desc}</p>
  </div>
);

const GuideStep = ({ num, title, desc, icon }: { num: string, title: string, desc: string, icon: React.ReactNode }) => (
  <div className="flex gap-8 items-start group">
    <span className="text-8xl font-black text-white/5 group-hover:text-white/10 transition-colors leading-none">{num}</span>
    <div className="space-y-4 pt-4">
      <div className="flex items-center gap-4">{React.cloneElement(icon as React.ReactElement<any>, { className: "w-8 h-8" })}<h3 className="text-4xl font-black">{title}</h3></div>
      <p className="text-slate-500 text-xl font-bold leading-relaxed max-w-lg">{desc}</p>
    </div>
  </div>
);

const HUDButton = ({ icon, label, onClick, color, disabled, active, badge }: { icon: React.ReactNode, label: string, onClick: () => void, color: string, disabled?: boolean, active?: boolean, badge?: string|null }) => {
  const colors: any = { yellow: 'text-yellow-400', emerald: 'text-emerald-400', blue: 'text-blue-400', red: 'text-red-400', orange: 'text-orange-400', cyan: 'text-cyan-400' };
  return (
    <button onClick={onClick} disabled={disabled} className={`w-24 h-24 rounded-3xl flex flex-col items-center justify-center transition-all relative shrink-0 snap-center ${disabled ? 'opacity-20 grayscale cursor-not-allowed' : 'hover:bg-white/5 active:scale-90'} ${active ? 'bg-yellow-500/20 ring-2 ring-yellow-500' : ''}`}>
      <div className={`mb-1 ${colors[color]}`}>{React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6" })}</div>
      <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter text-center px-1 leading-none">{label}</span>
      {badge && <span className="absolute top-2 right-2 bg-slate-950 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white/10">{badge}</span>}
    </button>
  );
};

const NavBtn = ({ active, icon, onClick }: { active: boolean, icon: React.ReactNode, onClick: () => void }) => (
  <button onClick={onClick} className={`p-3 rounded-2xl transition-all ${active ? 'bg-yellow-500 text-slate-950 shadow-xl' : 'text-slate-500 bg-slate-950 border border-white/5'}`}>{React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6" })}</button>
);

const CivilizationIntel = ({ players, currentIdx, grid, t, getPlayerScore, myPlayerId, mode }: any) => (
  <div className="space-y-4">
    {players.map((p: Player) => {
      const limit = 25 + p.cities.length * 10;
      return (
        <div key={p.id} className={`p-6 rounded-[2rem] border transition-all ${p.eliminated ? 'opacity-20 grayscale' : p.id === currentIdx ? 'bg-slate-800 border-yellow-500 shadow-2xl' : 'bg-slate-900 border-white/5'}`}>
          <div className="flex justify-between items-center mb-4">
            <span className="font-black text-sm flex items-center gap-2" style={{ color: p.color }}>{p.name} {mode === 'online' && myPlayerId === p.id && <Monitor className="w-3 h-3"/>}</span>
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black text-yellow-500 border border-white/5"><Star className="w-3 h-3"/> {getPlayerScore(p.id, players, grid)}</div>
          </div>
          <div className="space-y-3 opacity-80 text-[10px] font-bold">
            <div className="flex justify-between"><span>{t('capLv', { lv: p.capitalLevel })}</span><span>{p.cities.length} {t('city')}</span></div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${Math.min(100, (p.territory.size / limit) * 100)}%` }} /></div>
            <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase"><span>{t('status')}</span><span>{p.territory.size}/{limit}</span></div>
          </div>
        </div>
      );
    })}
  </div>
);

const LogChronicle = ({ logs, players, t }: any) => (
  <div className="space-y-3">
    {logs.map((log: GameLogEntry, i: number) => (
      <div key={i} className={`p-4 rounded-2xl border text-xs font-bold space-y-1 ${log.type === 'war' ? 'bg-red-950/20 border-red-900/40 text-red-300' : log.type === 'growth' ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-slate-900/50 border-white/5 text-slate-300'}`}>
        <div className="flex justify-between items-center opacity-40 text-[9px] uppercase tracking-tighter"><span>Year {log.turn}</span>{log.playerId >= 0 && <span style={{ color: players[log.playerId]?.color }}>{players[log.playerId]?.name}</span>}</div>
        <p className="leading-relaxed">{log.text}</p>
      </div>
    ))}
  </div>
);

export default App;
