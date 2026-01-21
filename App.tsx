
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  Trophy, Shield, Sword, Swords, Map as MapIcon, 
  Building2, FastForward, Users, 
  Bird, Globe, RotateCcw, SquareArrowUp, Star, Landmark, ChevronRight, Play, Sparkles,
  Link as LinkIcon, Copy, UserPlus, Zap, LayoutGrid, List, Github, Twitter, MessageSquare, ChevronDown, Monitor, Cpu, Handshake, XCircle, Palette, User, Settings, BookOpen, Info, Lock, Unlock, Hash, Search
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
    [1, 1], [1, -1], [1, 1], [-1, -1]
];

type Lang = 'en' | 'ko';
type UIState = 'landing' | 'config' | 'game' | 'online_setup' | 'tutorial_config';
type MobileView = 'map' | 'status' | 'logs';

const TRANSLATIONS = {
  en: {
    title: "MIKROCIVITA",
    tagline: "The Zenith of Strategy",
    desc: "A Strategic Civilization Builder in your Browser.",
    heroTitle: "Build. Expand. Conquer.",
    heroDesc: "A polished turn-based strategy game where players build civilizations, expand territories, and engage in diplomacy or war to achieve global dominance.",
    playNow: "Tutorial / Trial",
    playOnline: "Online Lobby",
    start: "Start Tutorial",
    startOnlineGame: "Start the Civ", // New translation key for online host button
    players: "Max Civs",
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
    customize: "Identity Setup",
    namePlace: "Empire Name",
    capital: "Capital",
    city: "Colony",
    noEnemyInvade: "No enemy in range!",
    multiplayer: "Online Servers",
    createRoom: "Create Room",
    joinRoom: "Join Room",
    roomID: "Direct Room ID",
    connecting: "Connecting...",
    waitingPlayers: "Waiting for other empires...",
    imReady: "Ready for War",
    youAre: "Role:",
    host: "Host",
    client: "Challenger",
    notYourTurn: "Waiting for other turns...",
    activePlayer: "{name}'s Turn",
    map: "Strategic Map",
    status: "Intel",
    pickTruceEnemy: "🕊️ Select an enemy to propose peace treaty.",
    forceTruceTitle: "Consolidate Power",
    forceTruceDesc: "You captured a colony! Force {name} into a 4-year peace treaty?",
    forceTruceAction: "Force Treaty",
    continueWar: "Continue War",
    offerReceived: "Diplomatic Envoy",
    offerDesc: "{name} is pleading for a 4-year peace treaty.",
    tooCloseCap: "❌ Capitals must be at least 5 tiles apart!",
    tooCloseCity: "❌ Colonies must be at least 2 tiles apart from other hubs!",
    lobbyEdit: "Customize Identity",
    tutorialTitle: "Field Manual",
    tutorialNext: "Got it, Next",
    tutorialClose: "Dismiss Guide",
    tut1: "Foundation: Place your Capital. It must be at least 5 tiles away from rivals. This is the heart of your Score.",
    tut2: "Expansion: Use 'Expand' to claim land. Capitals have a 25-tile limit; Colonies have 10. Integrated land yields 3pts/tile.",
    tut3: "Invasion & Exclaves: Attacking takes land. But 'Captured' land (exclaves) is unstable: 50% less defense and only 1pt/tile.",
    tut4: "Consolidation: Use Peace Treaties to absorb captured land into stable territory. A Lv.10 Capital wins a Tech Victory!",
    publicLobby: "Public Lobby",
    privateRoom: "Private Session",
    roomName: "Room Name",
    privacy: "Visibility",
    public: "Public",
    private: "Private",
    noRooms: "No public warzones found.",
    refresh: "Refresh Intel",
    roomNamePrefix: "Global Conquest"
  },
  ko: {
    title: "미크로시비타",
    tagline: "전략의 정점",
    desc: "브라우저에서 즐기는 고도의 전략 문명 시뮬레이션",
    heroTitle: "건설. 확장. 정복.",
    heroDesc: "정교한 턴제 전략을 통해 나만의 문명을 건설하고, 영토를 확장하며, 외교와 전쟁으로 세계의 정점에 올라서세요.",
    playNow: "튜토리얼 / 연습",
    playOnline: "온라인 로비",
    start: "튜토리얼 시작",
    startOnlineGame: "문명 시작", // New translation key for online host button
    players: "최대 문명",
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
    customize: "국가 설정",
    namePlace: "문명 이름 입력",
    capital: "수도",
    city: "도시",
    noEnemyInvade: "사거리 내에 적대적인 영토가 없습니다!",
    multiplayer: "온라인 서버",
    createRoom: "방 만들기",
    joinRoom: "참가하기",
    roomID: "방 코드 입력",
    connecting: "연결 중...",
    waitingPlayers: "다른 문명을 기다리는 중...",
    imReady: "준비 완료",
    youAre: "현재 역할:",
    host: "방장",
    client: "참가자",
    notYourTurn: "다른 문명의 턴입니다",
    activePlayer: "{name}의 차례",
    map: "전략 지도",
    status: "문명 정보",
    pickTruceEnemy: "🕊️ 휴전을 제안할 적을 선택하십시오.",
    forceTruceTitle: "권력 공고화",
    forceTruceDesc: "도시를 점령했습니다! {name}와(과) 4년간의 강제 휴전 협정을 맺으시겠습니까?",
    forceTruceAction: "강제 휴전",
    continueWar: "전쟁 지속",
    offerReceived: "외교 사절단",
    offerDesc: "{name}이(가) 4년간의 평화 협정을 간곡히 요청합니다.",
    tooCloseCap: "❌ 수도 간의 거리는 최소 5타일 이상이어야 합니다!",
    tooCloseCity: "❌ 도시는 다른 거점과 최소 2타일 이상 떨어져야 합니다!",
    lobbyEdit: "국적 및 문양 변경",
    tutorialTitle: "제국 교본",
    tutorialNext: "확인, 다음",
    tutorialClose: "교본 닫기",
    tut1: "정초: 수도를 건설하세요. 적국과 최소 5타일 거리를 유지해야 합니다. 수도는 발전도(점수)의 핵심입니다.",
    tut2: "확장: '영토 확장'을 통해 땅을 개척하세요. 수도는 25타일, 도시는 10타일까지 가능하며 편입된 땅은 타일당 3점입니다.",
    tut3: "침공과 외지: 적을 공격해 땅을 뺏으세요. 하지만 '점령지(외지)'는 불안정합니다: 방어력이 50% 낮고 점수는 타일당 1점뿐입니다.",
    tut4: "공고화: 휴전 협정을 통해 점령지를 완전한 영토로 편입하세요. 수도 10레벨 달성 시 기술 승리를 거둡니다!",
    publicLobby: "공개 로비",
    privateRoom: "비공개 세션",
    roomName: "방 이름",
    privacy: "공개 여부",
    public: "전체 공개",
    private: "암호화(비공개)",
    noRooms: "참여 가능한 공개 작전이 없습니다.",
    refresh: "정보 갱신",
    roomNamePrefix: "작전 구역"
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
          const key = `${ny},${nx}`;
          p.territory.add(key);
          if (Math.abs(dx) <= radius && Math.abs(dy) <= radius && (gridArr[y][x].type === 'capital' || gridArr[y][x].type === 'city')) {
             p.originalTerritories.add(key);
          }
        }
      }
    }
  }
};

const HUDButton = ({ icon, label, onClick, color, disabled, active, badge }: { icon: React.ReactNode, label: string, onClick: () => void, color: string, disabled?: boolean, active?: boolean, badge?: string|null }) => {
  const colors: any = { 
    yellow: 'text-yellow-400 group-hover:bg-yellow-400/10', 
    emerald: 'text-emerald-400 group-hover:bg-emerald-400/10', 
    blue: 'text-blue-400 group-hover:bg-blue-400/10', 
    red: 'text-red-400 group-hover:bg-red-400/10', 
    orange: 'text-orange-400 group-hover:bg-orange-400/10', 
    cyan: 'text-cyan-400 group-hover:bg-cyan-400/10' 
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center transition-all relative shrink-0 snap-center group ${disabled ? 'opacity-20 grayscale cursor-not-allowed' : 'hover:scale-105 active:scale-95'} ${active ? 'bg-yellow-500/20 ring-1 ring-yellow-500/50' : 'bg-slate-900/50 border border-white/5'}`}
    >
      <div className={`mb-1 transition-colors ${colors[color].split(' ')[0]}`}>{React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5 sm:w-6 sm:h-6" })}</div>
      <span className="text-[7px] sm:text-[9px] font-black uppercase text-slate-400 tracking-tighter text-center px-1 leading-none group-hover:text-white transition-colors">{label}</span>
      {badge && <span className="absolute -top-1 -right-1 bg-yellow-500 text-slate-950 text-[7px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full border border-slate-950 shadow-lg">{badge}</span>}
    </button>
  );
};

const NavBtn = ({ active, icon, onClick }: { active: boolean, icon: React.ReactNode, onClick: () => void }) => (
  <button 
    onClick={onClick} 
    className={`p-3 rounded-xl transition-all flex items-center justify-center ${active ? 'bg-yellow-500 text-slate-950 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'text-slate-500 bg-slate-900/50 border border-white/5'}`}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5" })}
  </button>
);

const CivilizationIntel = ({ players, currentIdx, grid, t, getPlayerScore, myPlayerId, mode }: any) => (
  <div className="space-y-3 pb-24 lg:pb-0">
    {players.map((p: Player) => {
      if (!p.name) return null;
      const limit = 25 + (p.cities?.length || 0) * 10;
      const territoryCount = p.territory?.size || 0;
      const isCurrent = p.id === currentIdx;
      return (
        <div key={p.id} className={`p-4 rounded-3xl border transition-all ${p.eliminated ? 'opacity-20 grayscale' : isCurrent ? 'bg-slate-800 border-yellow-500/50 shadow-xl' : 'bg-slate-900/50 border-white/5'}`}>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="font-black text-xs truncate max-w-[120px]" style={{ color: p.name === `Civ ${p.id + 1}` || p.name === `문명 ${p.id + 1}` ? 'currentColor' : p.color }}>{p.name}</span>
              {mode === 'online' && myPlayerId === p.id && <Monitor className="w-3 h-3 text-cyan-500"/>}
            </div>
            <div className="flex items-center gap-1 bg-slate-950/50 px-2 py-0.5 rounded-full text-[9px] font-black text-yellow-500 border border-white/5"><Star className="w-3 h-3"/> {getPlayerScore(p.id, players, grid)}</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-bold text-slate-400">
              <span>{t('capLv', { lv: p.capitalLevel })}</span>
              <span>{(p.cities?.length || 0)} {t('city')}</span>
            </div>
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${Math.min(100, (territoryCount / limit) * 100)}%` }} />
            </div>
            <div className="flex justify-between text-[7px] font-black text-slate-500 uppercase tracking-widest">
              <span>{t('status')}</span>
              <span>{territoryCount}/{limit}</span>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

const LogChronicle = ({ logs, players, t }: any) => (
  <div className="space-y-2 pb-24 lg:pb-0">
    {logs.map((log: GameLogEntry, i: number) => (
      <div key={i} className={`p-3 rounded-2xl border text-[10px] sm:text-xs font-bold space-y-1 ${log.type === 'war' ? 'bg-red-950/10 border-red-900/30 text-red-300' : log.type === 'growth' ? 'bg-emerald-950/10 border-emerald-900/30 text-emerald-300' : 'bg-slate-900/30 border-white/5 text-slate-400'}`}>
        <div className="flex justify-between items-center opacity-40 text-[8px] uppercase tracking-tighter">
          <span>{log.turn}y</span>
          {log.playerId >= 0 && <span style={{ color: players[log.playerId]?.color }}>{players[log.playerId]?.name}</span>}
        </div>
        <p className="leading-tight">{log.text}</p>
      </div>
    ))}
  </div>
);

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
  // Fix: Correctly initialize selectableCells with useState to hold a Set<string>.
  // This addresses potential type inference issues that could lead to "Property 'has' does not exist on type 'string'"
  const [selectableCells, setSelectableCells] = useState<Set<string>>(new Set<string>()); 
  const [gridSize, setGridSize] = useState<number>(15);
  const [expansionRemaining, setExpansionRemaining] = useState<number>(0);
  const [mobileView, setMobileView] = useState<MobileView>('map');
  const [pendingTruceTarget, setPendingTruceTarget] = useState<number | null>(null);

  // Tutorial logic states
  const [isTutorial, setIsTutorial] = useState<boolean>(false);
  const [tutStep, setTutStep] = useState<number>(0);

  // Multiplayer Room States
  const [roomName, setRoomName] = useState<string>('New World Era');
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [peer, setPeer] = useState<any>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [connections, setConnections] = useState<any[]>([]);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [myPlayerId, setMyPlayerId] = useState<number | null>(null);
  const [joinId, setJoinId] = useState<string>('');
  const [onlineStatus, setOnlineStatus] = useState<'idle' | 'connecting' | 'lobby' | 'discovery'>('idle');
  const [publicRooms, setPublicRooms] = useState<Array<{ id: string, name: string, currentPlayers: number, maxPlayers: number, hostName: string }>>([]);

  const connectionsRef = useRef<any[]>([]);
  const isHostRef = useRef<boolean>(false);
  const playersRef = useRef<Player[]>([]); // Using ref to avoid stale closures in some callbacks
  const roomIdRef = useRef<string>(''); // Ref for roomId
  const isPublicRef = useRef<boolean>(true); // Ref for isPublic
  const playerCountRef = useRef<number>(2); // Ref for playerCount
  const myPlayerIdRef = useRef<number | null>(null); // Ref for myPlayerId
  const roomNameRef = useRef<string>('New World Era'); // Ref for roomName

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
  // Update refs for online multiplayer states
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { isPublicRef.current = isPublic; }, [isPublic]);
  useEffect(() => { playerCountRef.current = playerCount; }, [playerCount]);
  useEffect(() => { myPlayerIdRef.current = myPlayerId; }, [myPlayerId]);
  useEffect(() => { roomNameRef.current = roomName; }, [roomName]);


  const currentPlayer = players[currentIdx];
  const isMyTurn = mode === 'local' || (myPlayerId !== null && currentIdx === myPlayerId);

  const t = useCallback((key: keyof typeof TRANSLATIONS['en'], params: Record<string, any> = {}) => {
    let str = TRANSLATIONS[lang][key] || key;
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, String(v));
    });
    return str;
  }, [lang]);

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
    let score = 0;
    score += p.capitalLevel * 25; 
    gridArr.forEach(row => row.forEach(cell => {
      if (cell.owner === pid && cell.type === 'city') {
        score += cell.level * 12;
      }
    }));
    gridArr.forEach(row => row.forEach(cell => {
      if (cell.owner === pid) {
        if (cell.control?.includes('captured')) { score += 1; } else { score += 3; }
      }
    }));
    return Math.floor(score);
  }, []);

  const addLog = useCallback((pid: number, text: string, type: GameLogEntry['type'] = 'info', currentLogs?: GameLogEntry[], currentTurn?: number) => {
    const entry = { turn: currentTurn || turnRef.current, playerId: pid, text, type };
    const newLogs = [entry, ...(currentLogs || logsRef.current)];
    setLogs(newLogs);
    return newLogs;
  }, []);

  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }, []);

  /**
   * Synchronizes the game state across connected peers.
   * This function is called by the host to broadcast state to clients,
   * or by clients (e.g., for lobby updates or tool responses) to send state to the host.
   * A full state synchronization approach is used to ensure consistency.
   */
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
        // In client role, send to the host (first connection)
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
    const survivors = updatedPlayers.filter(p => !p.eliminated && p.name);
    if (survivors.length === 1 && phaseRef.current !== 'setup') {
      const finalLogs = addLog(survivors[0].id, t('winner'), 'growth', currentLogs);
      setPhase('end'); 
      return { phase: 'end' as GamePhase, logs: finalLogs };
    }
    return { phase: phaseRef.current as GamePhase, logs: currentLogs };
  };

  const proceedToConfig = useCallback((isTut: boolean = false) => {
    const initialPlayers: Player[] = Array.from({ length: isTut ? 2 : playerCount }).map((_, i) => ({
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
    setIsTutorial(isTut);
    if (isTut) setPlayerCount(2);
    setUiState(isTut ? 'tutorial_config' : 'config');
  }, [playerCount, lang]);

  const initGameGrid = () => {
    const size = GRID_SIZE_MAP[playerCount];
    setGridSize(size);
    const initialGrid: Cell[][] = Array.from({ length: size }).map(() =>
      Array.from({ length: size }).map(() => ({ owner: null, type: null, control: null, level: 1 }))
    );
    const finalPlayers: Player[] = Array.from({ length: playerCount }).map((_, i) => ({
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
    setPlayers(finalPlayers);
    setUiState('game');
    setPhase('setup');
    const initLogs = addLog(-1, t('initLog'), 'info', []);
    showMessage(t('placeCap'));
    if (isTutorial) setTutStep(1);
    if (mode === 'online' && isHost) {
        connections.forEach((conn, i) => conn.send({ type: 'START_GAME', myId: i + 1 }));
        syncGameState(finalPlayers, initialGrid, 0, 1, 'setup', initLogs);
    }
  };

  const establishTruce = (p1Id: number, p2Id: number, currentPlayers: Player[], currentGrid: Cell[][]) => {
    const nextP = [...currentPlayers.map(pl => ({ 
      ...pl, 
      warWith: new Set(pl.warWith), 
      truceWith: new Set(pl.truceWith), 
      truceTurns: { ...pl.truceTurns },
      truceProposals: new Set(pl.truceProposals)
    }))];
    [p1Id, p2Id].forEach(id => {
      const other = id === p1Id ? p2Id : p1Id;
      nextP[id].warWith.delete(other);
      nextP[id].truceWith.add(other);
      nextP[id].truceTurns[other] = 4;
      nextP[id].truceProposals.delete(other);
    });
    const nextGrid = [...currentGrid.map(row => [...row])];
    [p1Id, p2Id].forEach(pid => {
        const hubs = [{ id: 'capital', x: nextP[pid].capital!.x, y: nextP[pid].capital!.y }, ...nextP[pid].cities.map(c => ({ id: c.id, x: c.x, y: c.y }))];
        nextGrid.forEach((row, gy) => row.forEach((cell, gx) => {
            if (cell.owner === pid && cell.control?.includes('captured')) {
                let nearestHub = hubs[0];
                let minDist = Math.abs(gx - nearestHub.x) + Math.abs(gy - nearestHub.y);
                hubs.forEach(hub => {
                    const d = Math.abs(gx - hub.x) + Math.abs(gy - hub.y);
                    if (d < minDist) { minDist = d; nearestHub = hub; }
                });
                nextGrid[gy][gx] = { ...cell, control: nearestHub.id };
            }
        }));
    });
    return { players: nextP, grid: nextGrid };
  };

  const nextTurn = (updatedGrid?: Cell[][], updatedPlayers?: Player[], updatedLogs?: GameLogEntry[]) => {
    if (phaseRef.current === 'end') return;
    if (!isMyTurn) return; // Use isMyTurn for player actions
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
      } else { p.capitalUpgrade = up; }
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
    setPendingAction(null); setSelectableCells(new Set()); setExpansionRemaining(0); setPendingTruceTarget(null);
    let nextIdx = (currentIdxRef.current + 1) % playerCount;
    const areThereSurvivors = workingPlayers.some((pl, idx) => !pl.eliminated && pl.name && idx !== currentIdxRef.current);
    if (areThereSurvivors) { while (workingPlayers[nextIdx] && (workingPlayers[nextIdx].eliminated || !workingPlayers[nextIdx].name)) { nextIdx = (nextIdx + 1) % playerCount; } }
    let nextTurnNum = turnRef.current;
    if (nextIdx === 0) { nextTurnNum = turnRef.current + 1; setGameTurn(nextTurnNum); }
    setPlayers(workingPlayers); setGrid(finalGrid); setLogs(finalLogs); setCurrentIdx(nextIdx); setPhase(finalPhase);
    if (isTutorial && nextTurnNum === 2 && tutStep === 1) setTutStep(2);
    if (isTutorial && nextTurnNum === 4 && tutStep === 2) setTutStep(3);
    if (mode === 'online') { syncGameState(workingPlayers, finalGrid, nextIdx, nextTurnNum, finalPhase, finalLogs); }
  };

  const cellClick = (x: number, y: number) => {
    if (!isMyTurn) return;
    if (phaseRef.current === 'setup') {
      if (gridRef.current[y][x].owner !== null) return;
      let tooClose = false;
      playersRef.current.forEach(p => { if (p.capital) { const dist = Math.max(Math.abs(p.capital.x - x), Math.abs(p.capital.y - y)); if (dist < 5) tooClose = true; } });
      if (tooClose) { showMessage(t('tooCloseCap')); return; }
      const newGrid = [...gridRef.current.map(row => [...row])];
      const newPlayers = [...playersRef.current.map(p => ({ ...p, territory: new Set(p.territory), originalTerritories: new Set(p.originalTerritories) }))];
      const p = { ...newPlayers[currentIdxRef.current] };
      p.capital = { x, y }; p.territory.add(`${y},${x}`); p.originalTerritories.add(`${y},${x}`);
      newGrid[y][x] = { owner: currentIdxRef.current, type: 'capital', control: 'capital', level: 1 };
      claimAround(currentIdxRef.current, x, y, 1, newPlayers, newGrid);
      newPlayers[currentIdxRef.current] = p;
      const survivorsCount = newPlayers.filter(pl => pl.name).length;
      const isLastPlayer = currentIdxRef.current === survivorsCount - 1;
      const nextPhase = isLastPlayer ? 'play' : 'setup';
      const nextIdx = isLastPlayer ? 0 : currentIdxRef.current + 1;
      let finalLogs = logsRef.current;
      if (isLastPlayer) { finalLogs = addLog(-1, t('struggleStart'), 'info'); setPhase('play'); }
      setGrid(newGrid); setPlayers(newPlayers); setCurrentIdx(nextIdx);
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
        playersRef.current.forEach(p => {
          if (p.capital && Math.max(Math.abs(p.capital.x - x), Math.abs(p.capital.y - y)) < 2) tooClose = true;
          p.cities.forEach(c => { if (Math.max(Math.abs(c.x - x), Math.abs(c.y - y)) < 2) tooClose = true; });
        });
        if (near && !tooClose) validSpots.add(`${y},${x}`);
      } else if (cell.owner === currentIdxRef.current && cell.type === 'city') { validSpots.add(`${y},${x}`); }
    }));
    if (validSpots.size === 0) { showMessage(t('tooCloseCity')); return; }
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
        const newPlayers = [...playersRef.current.map(pl => ({ ...pl, territory: new Set(pl.territory), originalTerritories: new Set(pl.originalTerritories) }))];
        const p = { ...newPlayers[currentIdxRef.current] };
        p.cities = [...p.cities, { x, y, id: cityId }]; p.territory.add(key); p.originalTerritories.add(key);
        newPlayers[currentIdxRef.current] = p;
        const newLogs = addLog(currentIdxRef.current, t('cityLog'), 'growth'); nextTurn(newGrid, newPlayers, newLogs);
      }
    });
  };

  const handleExpand = () => {
    if (!isMyTurn) return;
    if (currentPlayer.warWith.size > 0) { showMessage(t('warRestrict')); return; }
    showMessage(t('pickCenter'));
    const centers = [{ id: 'capital', name: t('capital'), x: currentPlayer.capital!.x, y: currentPlayer.capital!.y, limit: 25 }, ...currentPlayer.cities.map(c => ({ id: c.id, name: t('city'), x: c.x, y: c.y, limit: 10 }))];
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
        frontier.forEach(key => { const [fy, fx] = key.split(',').map(Number); newGrid[fy][fx] = { owner: currentIdxRef.current, type: 'land', control: center.id, level: 1 }; p.territory.add(key); });
        newPlayers[currentIdxRef.current] = p;
        const newLogs = addLog(currentIdxRef.current, t('expandLog', { center: center.name, n: frontier.length })); nextTurn(newGrid, newPlayers, newLogs);
      } else {
        setExpansionRemaining(capacityLeft); setSelectableCells(new Set(frontier)); showMessage(t('manualExpand', { n: capacityLeft }));
        setPendingAction(() => (mx: number, my: number) => {
          const mKey = `${my},${mx}`; if (!frontierSet.has(mKey)) return;
          const newGrid = [...gridRef.current.map(r => [...r])];
          newGrid[my][mx] = { owner: currentIdxRef.current, type: 'land', control: center.id, level: 1 };
          const newPlayers = [...playersRef.current.map(pl => ({ ...pl, territory: new Set(pl.territory) }))];
          const p = { ...newPlayers[currentIdxRef.current] }; p.territory.add(mKey); newPlayers[currentIdxRef.current] = p;
          setGrid(newGrid); setPlayers(newPlayers);
          setExpansionRemaining(prev => { 
              if (prev - 1 <= 0) { const newLogs = addLog(currentIdxRef.current, t('expandLog', { center: center.name, n: capacityLeft })); setTimeout(() => nextTurn(newGrid, newPlayers, newLogs), 10); return 0; } 
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
    const nextPlayers = [...playersRef.current.map(p => ({ ...p, territory: new Set(p.territory), originalTerritories: new Set(p.originalTerritories) }))];
    const pAttacker = nextPlayers[currentIdxRef.current];
    let currentLogs = logsRef.current;
    let forcedTrucePotentialId: number | null = null;
    targets.forEach(key => {
      const [ty, tx] = key.split(',').map(Number); const cell = nextGrid[ty][tx]; const oldOwnerId = cell.owner!;
      let defenderScore = getPlayerScore(oldOwnerId, nextPlayers, nextGrid);
      if (cell.control?.includes('captured')) { defenderScore *= 0.5; }
      const successChance = Math.max(0.05, attackerScore / (attackerScore + defenderScore));
      if (Math.random() < successChance) {
        totalCaptured++;
        const isTargetNonOriginalCity = (cell.type === 'capital' || cell.type === 'city') && !pAttacker.originalTerritories.has(key);
        if (cell.type === 'capital') {
          currentLogs = addLog(currentIdxRef.current, t('invadeCap', { name: nextPlayers[oldOwnerId].name }), 'war', currentLogs);
          nextPlayers[oldOwnerId].eliminated = true;
          nextGrid.forEach((row, gy) => row.forEach((c, gx) => { if (c.owner === oldOwnerId) { nextGrid[gy][gx] = { ...c, owner: currentIdxRef.current, control: 'captured' }; pAttacker.territory.add(`${gy},${gx}`); } }));
          if (isTargetNonOriginalCity) forcedTrucePotentialId = oldOwnerId;
        } else if (cell.type === 'city') {
          const cityId = cell.control; 
          currentLogs = addLog(currentIdxRef.current, t('invadeCity', { name: nextPlayers[oldOwnerId].name }), 'war', currentLogs);
          nextGrid.forEach((row, gy) => row.forEach((c, gx) => { if (c.owner === oldOwnerId && c.control === cityId) { nextGrid[gy][gx] = { ...c, owner: currentIdxRef.current, control: `captured:from:${oldOwnerId}` }; pAttacker.territory.add(`${gy},${gx}`); nextPlayers[oldOwnerId].territory.delete(`${gy},${gx}`); } }));
          if (isTargetNonOriginalCity) forcedTrucePotentialId = oldOwnerId;
        } else { nextGrid[ty][tx] = { ...cell, owner: currentIdxRef.current, control: 'captured' }; pAttacker.territory.add(key); nextPlayers[oldOwnerId].territory.delete(key); }
      }
    });
    if (totalCaptured > 0) {
      currentLogs = addLog(currentIdxRef.current, t('invadeSummary', { n: totalCaptured }), 'war', currentLogs);
      setGrid(nextGrid); setPlayers(nextPlayers); setLogs(currentLogs);
      if (forcedTrucePotentialId !== null && !nextPlayers[forcedTrucePotentialId].eliminated) { setPendingTruceTarget(forcedTrucePotentialId); } else { nextTurn(nextGrid, nextPlayers, currentLogs); }
      if (isTutorial && tutStep === 3) setTutStep(4);
    } else {
      currentLogs = addLog(currentIdxRef.current, t('invadeFailOnly'), 'info', currentLogs);
      nextTurn(nextGrid, nextPlayers, currentLogs);
    }
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

  const handleTruce = () => {
    if (!isMyTurn) return;
    if (currentPlayer.warWith.size === 0) return;
    const enemyTerritories: Set<string> = new Set();
    gridRef.current.forEach((row, y) => row.forEach((cell, x) => { if (cell.owner !== null && cell.owner !== currentIdxRef.current && currentPlayer.warWith.has(cell.owner)) { enemyTerritories.add(`${y},${x}`); } }));
    setSelectableCells(enemyTerritories); showMessage(t('pickTruceEnemy'));
    setPendingAction(() => (x: number, y: number) => {
      const targetCell = gridRef.current[y][x]; if (!enemyTerritories.has(`${y},${x}`)) return;
      const targetId = targetCell.owner!;
      const nextP = [...playersRef.current.map(pl => ({ ...pl, truceProposals: new Set(pl.truceProposals) }))];
      nextP[targetId].truceProposals.add(currentIdxRef.current);
      const nextLogs = addLog(currentIdxRef.current, t('truceNormalLog', { name: playersRef.current[targetId].name }), 'info');
      nextTurn(gridRef.current, nextP, nextLogs);
    });
  };

  const respondToTruce = (proposingPlayerId: number, accept: boolean) => {
    if (!isMyTurn) return;
    let nextP = playersRef.current; let nextGrid = gridRef.current; let nextLogs = logsRef.current;
    if (accept) {
      const truceRes = establishTruce(currentIdx, proposingPlayerId, playersRef.current, gridRef.current);
      nextP = truceRes.players; nextGrid = truceRes.grid;
      nextLogs = addLog(currentIdx, t('truceAcceptLog', { p1: currentPlayer.name, p2: players[proposingPlayerId].name }), 'peace');
    } else {
      nextP = [...playersRef.current.map(pl => ({ ...pl, truceProposals: new Set(pl.truceProposals) }))];
      nextP[currentIdxRef.current].truceProposals.delete(proposingPlayerId);
      nextLogs = addLog(currentIdxRef.current, t('truceDeclineLog', { name: currentPlayer.name }), 'info');
    }
    setPlayers(nextP); setGrid(nextGrid); setLogs(nextLogs);
    syncGameState(nextP, nextGrid, currentIdxRef.current, turnRef.current, phaseRef.current, nextLogs);
  };

  const updateProfile = (name: string, color: string) => {
    if (myPlayerId === null) return;
    setPlayers(prev => {
      const next = [...prev];
      next[myPlayerId] = { ...next[myPlayerId], name, color };
      if (mode === 'online') {
        const msg = { type: 'LOBBY_UPDATE', payload: { players: next.map(serializePlayer) } };
        if (isHost) {
          connections.forEach(c => c.send(msg));
          // If the host changes their profile and their room is public, update the public room listing
          if (isPublic && roomId) {
            setPublicRooms(currentPublicRooms => currentPublicRooms.map(room =>
              room.id === roomId ? { ...room, hostName: name } : room
            ));
          }
        } else if (connections.length > 0) {
          connections[0].send(msg);
        }
      }
      return next;
    });
  };

  const resetToLanding = () => { if (peer) peer.destroy(); setUiState('landing'); setPlayers([]); setGrid([]); setPhase('setup'); setGameTurn(1); setLogs([]); setCurrentIdx(0); setConnections([]); setPeer(null); setOnlineStatus('idle'); setMobileView('map'); setIsTutorial(false); setTutStep(0); setRoomName('New World Era'); setIsPublic(true); setPublicRooms([]); };

  // This function is for clearing public rooms as per previous request.
  const clearPublicRooms = useCallback(() => {
    return []; 
  }, []);

  /**
   * Handles incoming peer data, parsing the message type and updating state accordingly.
   * This central handler is crucial for maintaining synchronization in online mode.
   */
  const handlePeerData = useCallback((data: any) => {
    switch (data.type) {
      case 'LOBBY_UPDATE':
        // Updates lobby specific information, like player list and their details.
        // If host, re-broadcasts the updated lobby state to all connected clients.
        if (data.payload.myId !== undefined) setMyPlayerId(data.payload.myId);
        if (data.payload.players) {
          setPlayers(data.payload.players.map(deserializePlayer));
          if (isHostRef.current) { connectionsRef.current.forEach(c => c.send({ type: 'LOBBY_UPDATE', payload: { players: data.payload.players } })); }
        }
        break;
      case 'START_GAME':
        // Signals clients that the game is starting and sets their player ID.
        if (data.myId !== undefined) setMyPlayerId(data.myId);
        setUiState('game'); setPhase('setup');
        break;
      case 'SYNC_STATE':
        // Receives a full snapshot of the game state and updates all relevant state variables.
        // This is a robust way to ensure clients are always in sync with the host's game state.
        const { players: p, grid: g, currentIdx: ci, turn: t, phase: ph, logs: l } = data.payload;
        setPlayers(p.map(deserializePlayer)); setGrid(g); setCurrentIdx(ci); setGameTurn(t); setPhase(ph); setLogs(l);
        break;
      // Add more cases here for other network messages (e.g., chat, specific actions if not using full state sync)
      default:
        console.warn('Received unknown peer data type:', data.type, data);
    }
  }, []);

  const handleRefreshPublicRooms = useCallback(() => {
    // Access state via refs to ensure the most current values are read,
    // especially after asynchronous operations or state updates.
    const currentIsHost = isHostRef.current;
    const currentRoomId = roomIdRef.current;
    const currentIsPublic = isPublicRef.current;
    const currentMyPlayerId = myPlayerIdRef.current;
    const currentPlayers = playersRef.current; // Get the latest players array from ref
    const currentConnections = connectionsRef.current; // Get the latest connections array from ref
    const currentRoomName = roomNameRef.current; // Get the latest roomName from ref
    const currentPlayerCount = playerCountRef.current; // Get the latest playerCount from ref

    const isCurrentUserHostAndHasRoom = currentIsHost && currentRoomId && currentIsPublic && currentMyPlayerId === 0;

    if (isCurrentUserHostAndHasRoom) {
        // Host player should always be at index 0 in the players array for the host.
        const hostPlayer = currentPlayers[0];
        const currentHostName = hostPlayer?.name || (lang === 'ko' ? '방장' : 'Host');

        setPublicRooms([{
            id: currentRoomId,
            name: currentRoomName,
            currentPlayers: currentConnections.length + 1, // Host + all connected clients
            maxPlayers: currentPlayerCount,
            hostName: currentHostName
        }]);
    } else {
        // For clients, or if no public room is actively hosted by this user (or it's private), clear the list.
        setPublicRooms([]);
    }
  }, [lang]); // Dependencies simplified as most values are read from refs


  useEffect(() => {
    // When entering discovery mode, trigger a refresh to show any relevant rooms (currently only self-hosted public ones).
    if (onlineStatus === 'discovery') {
        handleRefreshPublicRooms();
    }
  }, [onlineStatus, handleRefreshPublicRooms]); // Refresh public rooms when online status changes

  const handleHost = useCallback(() => {
    setOnlineStatus('connecting');
    const p = new Peer();
    p.on('open', (id: string) => {
      setRoomId(id);
      setIsHost(true);
      setMyPlayerId(0);
      setPeer(p);

      // Create a temporary host player object using the latest configured name/color
      const hostInitialPlayer: Player = {
        id: 0,
        name: playersRef.current[0]?.name || (lang === 'ko' ? '방장' : 'Host'), // Get initial configured name
        color: playersRef.current[0]?.color || DEFAULT_COLORS[0],
        capital: null, capitalLevel: 1, capitalUpgrade: null, cities: [], territory: new Set<string>(), originalTerritories: new Set<string>(), warWith: new Set<PlayerID>(), truceWith: new Set<PlayerID>(), truceTurns: {}, truceProposals: new Set<PlayerID>(), eliminated: false,
      };

      // IMMEDIATELY update the players state for the host
      setPlayers([hostInitialPlayer]);

      // Now, set onlineStatus to 'lobby' AFTER players is updated.
      setOnlineStatus('lobby'); 

      if (isPublic) { // Use isPublic from state, as this is the value chosen by the user
          setPublicRooms(prev => [...prev, {
              id: id,
              name: roomName, // Room name from input field
              currentPlayers: 1,
              maxPlayers: playerCount,
              hostName: hostInitialPlayer.name // Use the name derived for this specific player object
          }]);
      }
    });
    p.on('connection', (conn: any) => {
      conn.on('open', () => {
        setConnections(prev => [...prev, conn]);
        setPlayers(prev => {
          const newId = prev.length;
          const nextPlayers = [...prev, {
            id: newId, name: lang === 'ko' ? `참가자 ${newId}` : `Challenger ${newId}`, color: DEFAULT_COLORS[newId % DEFAULT_COLORS.length], capital: null, capitalLevel: 1, capitalUpgrade: null, cities: [], territory: new Set<string>(), originalTerritories: new Set<string>(), warWith: new Set<PlayerID>(), truceWith: new Set<PlayerID>(), truceTurns: {}, truceProposals: new Set<PlayerID>(), eliminated: false,
          }];
          conn.send({ type: 'LOBBY_UPDATE', payload: { players: nextPlayers.map(serializePlayer), myId: newId } });
          connectionsRef.current.forEach(c => c.send({ type: 'LOBBY_UPDATE', payload: { players: nextPlayers.map(serializePlayer) } }));

          // If the room is public and current user is host, update publicRooms to reflect new player count.
          if (isHostRef.current && isPublicRef.current) { // Use refs for `isPublic`
            const currentHostPlayer = nextPlayers[0]; // Host is always player 0
            const updatedHostName = currentHostPlayer?.name || (lang === 'ko' ? '방장' : 'Host');

            setPublicRooms(currentPublicRooms => currentPublicRooms.map(room =>
              room.id === roomIdRef.current ? { ...room, currentPlayers: nextPlayers.length, hostName: updatedHostName } : room
            ));
          }
          return nextPlayers;
        });
      });
      conn.on('data', handlePeerData);
    });
  }, [lang, roomName, playerCount, isPublic, playersRef]); // Added isPublic to deps, removed roomId as it's set in this callback

  const handleJoin = useCallback((targetId?: string) => {
    const id = targetId || joinId;
    if (!id) return;
    setOnlineStatus('connecting');
    const p = new Peer();
    p.on('open', () => {
      setPeer(p);
      const conn = p.connect(id);
      conn.on('open', () => { 
        setConnections([conn]); 
        setIsHost(false); 
        setOnlineStatus('lobby'); 
      });
      conn.on('data', handlePeerData);
    });
  }, [joinId, handlePeerData]);

  const Hero = () => (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent)]" />
      <div className="max-w-4xl space-y-6 sm:space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
        <h4 className="text-yellow-500 font-black tracking-[0.3em] uppercase text-[10px] sm:text-xs mb-2 sm:mb-4">{t('tagline')}</h4>
        <h1 className="text-5xl sm:text-8xl lg:text-9xl font-black leading-none tracking-tighter drop-shadow-2xl">{t('heroTitle')}</h1>
        <p className="text-slate-400 text-sm sm:text-lg lg:text-2xl max-w-2xl mx-auto leading-relaxed">{t('heroDesc')}</p>
        <div className="pt-6 sm:pt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <button onClick={() => { setMode('local'); proceedToConfig(true); }} className="w-full sm:w-auto px-10 py-5 bg-white text-slate-950 rounded-full font-black text-lg hover:scale-105 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
            {t('playNow')} <BookOpen className="w-5 h-5" />
          </button>
          <button onClick={() => { setMode('online'); setUiState('online_setup'); }} className="w-full sm:w-auto px-10 py-5 bg-slate-900/80 border border-slate-700/50 rounded-full font-bold text-lg hover:bg-slate-800 transition-all backdrop-blur-md flex items-center justify-center gap-2">
            {t('playOnline')} <Globe className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );

  const renderGrid = useMemo(() => grid.map((row, y) => (
    <div key={y} className="flex flex-nowrap shrink-0">
      {row.map((cell, x) => {
        const isSelectable = selectableCells.has(`${y},${x}`);
        const ownerColor = cell.owner !== null && players[cell.owner] ? players[cell.owner].color : 'transparent';
        const checkNeighbor = (ny: number, nx: number) => {
            if (ny < 0 || ny >= gridSize || nx < 0 || nx >= gridSize) return 'edge';
            const neighbor = grid[ny][nx];
            if (neighbor.owner !== cell.owner) return 'international';
            if (neighbor.control !== cell.control) return 'jurisdiction';
            return 'same';
        };
        const checkOwnerNeighbor = (ny: number, nx: number) => {
            if (ny < 0 || ny >= gridSize || nx < 0 || nx >= gridSize) return false;
            return grid[ny][nx].owner === cell.owner;
        };
        const borders = { top: checkNeighbor(y - 1, x), right: checkNeighbor(y, x + 1), bottom: checkNeighbor(y + 1, x), left: checkNeighbor(y, x - 1) };
        const ownerBorders = { top: !checkOwnerNeighbor(y - 1, x), right: !checkOwnerNeighbor(y, x + 1), bottom: !checkOwnerNeighbor(y + 1, x), left: !checkOwnerNeighbor(y, x - 1) };
        const getBorderStyle = (type: string) => {
            if (type === 'international') return '1.5px solid rgba(0,0,0,0.75)';
            if (type === 'jurisdiction') return '0.5px solid rgba(0,0,0,0.1)';
            return undefined;
        };
        const isEdge = ownerBorders.top || ownerBorders.right || ownerBorders.bottom || ownerBorders.left;
        const cornerRadius = 10;
        const borderRadiusStyle = cell.owner !== null ? {
            borderTopLeftRadius: (ownerBorders.top && ownerBorders.left) ? cornerRadius : 0,
            borderTopRightRadius: (ownerBorders.top && ownerBorders.right) ? cornerRadius : 0,
            borderBottomLeftRadius: (ownerBorders.bottom && ownerBorders.left) ? cornerRadius : 0,
            borderBottomRightRadius: (ownerBorders.bottom && ownerBorders.right) ? cornerRadius : 0,
        } : {};
        return (
          <div key={`${x}-${y}`} onClick={() => cellClick(x, y)}
            style={{ 
              backgroundColor: cell.owner !== null && players[cell.owner] ? (
                cell.type === 'capital' ? '#f59e0b' : 
                cell.type === 'city' ? shadeColor(ownerColor, -80) : 
                (cell.control?.includes('captured') ? shadeColor(ownerColor, 130) : 
                (cell.control === 'capital' ? shadeColor(ownerColor, 40) : shadeColor(ownerColor, 75)))
              ) : undefined,
              borderTop: getBorderStyle(borders.top), borderRight: getBorderStyle(borders.right), borderBottom: getBorderStyle(borders.bottom), borderLeft: getBorderStyle(borders.left),
              ...borderRadiusStyle,
              boxShadow: (isEdge && cell.owner !== null) ? `inset 0 0 5px rgba(255,255,255,0.05), 0 0 10px ${players[cell.owner]?.color}22` : undefined,
            }}
            className={`w-8 h-8 sm:w-11 sm:h-11 flex items-center justify-center text-[8px] sm:text-xs font-black cursor-pointer rounded-sm shrink-0 transition-all duration-300 border-[0.5px] border-white/5 relative
              ${isSelectable ? 'selectable-pulse border-white shadow-lg z-10 scale-105' : ''}
              ${cell.type === 'capital' ? 'ring-1 ring-yellow-400/40 shadow-lg z-10' : ''}
              ${cell.owner === null ? 'bg-slate-900/40 hover:bg-slate-800/40' : ''}`}
          >
            {cell.type === 'capital' && cell.owner !== null && players[cell.owner] && <span className="text-yellow-950 z-10">{players[cell.owner].capitalLevel}</span>}
            {cell.type === 'city' && <span className="opacity-80 text-white z-10">{cell.level}</span>}
            {isEdge && cell.owner !== null && <div className="absolute inset-0 border border-white/5 pointer-events-none" style={{...borderRadiusStyle}} />}
          </div>
        );
      })}
    </div>
  )), [grid, selectableCells, players, gridSize]);

  if (uiState === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden scroll-smooth selection:bg-yellow-500 selection:text-slate-950">
        <nav className="fixed top-0 w-full p-4 sm:p-6 flex justify-between items-center z-[100] backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-2"><Landmark className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" /><span className="text-lg sm:text-2xl font-black tracking-tighter uppercase">{t('title')}</span></div>
          <div className="flex gap-4">
             <button onClick={() => setLang('en')} className={`text-xs sm:text-sm font-black transition-all ${lang === 'en' ? 'text-yellow-500' : 'text-slate-500'}`}>EN</button>
             <button onClick={() => setLang('ko')} className={`text-xs sm:text-sm font-black transition-all ${lang === 'ko' ? 'text-yellow-500' : 'text-slate-500'}`}>KO</button>
          </div>
        </nav>
        <Hero />
      </div>
    );
  }

  if (uiState === 'online_setup') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8 text-white overflow-y-auto">
        <div className="max-w-5xl w-full space-y-6 sm:space-y-10">
          <div className="text-center space-y-2">
            <Globe className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-cyan-400 animate-pulse" />
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter">{t('multiplayer')}</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Connect to global warzones</p>
          </div>

          {onlineStatus === 'idle' || onlineStatus === 'discovery' ? (
            <div className="grid lg:grid-cols-2 gap-6 items-start">
              {/* Host Section */}
              <div className="bg-slate-900/80 border border-slate-800 p-6 sm:p-10 rounded-[2.5rem] space-y-8 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-4 text-yellow-500">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center"><UserPlus className="w-6 h-6"/></div>
                  <div><h3 className="text-xl sm:text-2xl font-black">{t('createRoom')}</h3><p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Establish a new command</p></div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">{t('roomName')}</label>
                    <input value={roomName} onChange={e => setRoomName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-bold outline-none ring-yellow-500/30 focus:ring-2 transition-all" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-500 ml-1">{t('players')}</label>
                      <div className="flex gap-2">
                        {[2,3,4].map(n => <button key={n} onClick={() => setPlayerCount(n)} className={`flex-1 py-3 rounded-xl font-black transition-all ${playerCount === n ? 'bg-yellow-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>{n}</button>)}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-500 ml-1">{t('privacy')}</label>
                      <div className="flex gap-2">
                        <button onClick={() => setIsPublic(true)} className={`flex-1 py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2 ${isPublic ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-500'}`}><Unlock className="w-3 h-3"/> {t('public')}</button>
                        <button onClick={() => setIsPublic(false)} className={`flex-1 py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2 ${!isPublic ? 'bg-slate-200 text-slate-950' : 'bg-slate-800 text-slate-500'}`}><Lock className="w-3 h-3"/> {t('private')}</button>
                      </div>
                    </div>
                  </div>

                  <button onClick={handleHost} className="w-full py-5 bg-yellow-500 text-slate-950 font-black text-xl rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">{t('startOnlineGame')}</button>
                </div>
              </div>

              {/* Join Section */}
              <div className="space-y-6">
                <div className="flex bg-slate-900/50 p-2 rounded-2xl border border-white/5">
                  <button onClick={() => setOnlineStatus('discovery')} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${onlineStatus === 'discovery' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><Search className="w-4 h-4"/> {t('publicLobby')}</button>
                  <button onClick={() => setOnlineStatus('idle')} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${onlineStatus === 'idle' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}><Hash className="w-4 h-4"/> {t('privateRoom')}</button>
                </div>

                {onlineStatus === 'idle' ? (
                  <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-[2.5rem] space-y-6 shadow-xl animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-4 text-cyan-400">
                      <Hash className="w-8 h-8"/>
                      <h3 className="text-xl font-black">{t('privateRoom')}</h3>
                    </div>
                    <div className="space-y-4">
                      <input value={joinId} onChange={e => setJoinId(e.target.value)} placeholder={t('roomID')} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-bold outline-none ring-cyan-500/30 focus:ring-2 transition-all uppercase tracking-widest text-center" />
                      <button onClick={() => handleJoin()} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl transition-all shadow-lg">{t('joinRoom')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-[2.5rem] space-y-4 shadow-xl animate-in zoom-in-95 duration-300 min-h-[300px]">
                    <div className="flex justify-between items-center mb-2">
                       <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.2em]">{t('publicLobby')}</h3>
                       <button onClick={handleRefreshPublicRooms} className="text-[10px] font-black text-cyan-500 hover:text-cyan-400 transition-colors uppercase flex items-center gap-2"><RotateCcw className="w-3 h-3"/> {t('refresh')}</button>
                    </div>
                    <div className="space-y-3">
                       {publicRooms.length > 0 ? (
                         publicRooms.map(room => (
                           <div key={room.id} className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-yellow-500/30 transition-all cursor-pointer" onClick={() => handleJoin(room.id)}>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500"><Swords className="w-5 h-5"/></div>
                                <div><div className="font-black text-sm">{room.name}</div><div className="text-[8px] text-slate-500 uppercase font-black">Host: {room.hostName}</div></div>
                              </div>
                              <div className="text-right">
                                 <div className="text-[10px] font-black text-cyan-400">{room.currentPlayers}/{room.maxPlayers} Players</div>
                                 <div className="text-[8px] text-slate-600 uppercase font-black">Status: Peacetime</div>
                              </div>
                           </div>
                         ))
                       ) : (
                          <div className="p-10 border-2 border-dashed border-slate-800 rounded-3xl text-center space-y-2 opacity-50">
                             <Globe className="w-8 h-8 mx-auto text-slate-700"/>
                             <p className="text-xs font-black text-slate-600 uppercase tracking-widest">{t('noRooms')}</p>
                          </div>
                       )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : onlineStatus === 'connecting' ? (
            <div className="text-center py-24 space-y-6">
              <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_20px_rgba(6,182,212,0.2)]" />
              <p className="font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">{t('connecting')}</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-6 sm:gap-8">
              <div className="lg:col-span-3 space-y-6 sm:space-y-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 sm:p-10 rounded-[3rem] shadow-2xl">
                <div className="flex flex-wrap gap-6 justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 ml-1">Secure Signal Link</span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-4xl font-mono font-black text-cyan-400 drop-shadow-glow">{roomId || joinId}</span>
                      <button onClick={() => { navigator.clipboard.writeText(roomId || joinId); showMessage('Frequency copied to clipboard'); }} className="p-2 hover:bg-slate-800 rounded-xl transition-all"><Copy className="w-5 h-5 text-slate-500" /></button>
                    </div>
                  </div>
                  <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 shadow-inner">
                    <span className="text-[8px] block font-black text-slate-500 uppercase tracking-widest mb-1">{t('youAre')}</span>
                    <span className="font-black text-xs sm:text-sm text-yellow-500 uppercase tracking-widest">{isHost ? t('host') : t('client')}</span>
                  </div>
                </div>

                <div className="space-y-6 pt-8 border-t border-slate-800/50">
                  <div className="flex items-center gap-2 text-yellow-500"><User className="w-5 h-5" /><h4 className="font-black uppercase tracking-widest text-[10px] sm:text-xs">{t('lobbyEdit')}</h4></div>
                  <div className="grid sm:grid-cols-2 gap-6 items-center">
                    <input value={players[myPlayerId!]?.name || ''} onChange={e => updateProfile(e.target.value, players[myPlayerId!]?.color)} placeholder={t('namePlace')} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-bold outline-none ring-yellow-500/30 focus:ring-2 transition-all" />
                    <div className="flex gap-2 flex-wrap">{DEFAULT_COLORS.map(c => <button key={c} onClick={() => updateProfile(players[myPlayerId!]?.name, c)} style={{ backgroundColor: c }} className={`w-10 h-10 rounded-xl border-2 transition-all ${players[myPlayerId!]?.color === c ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'border-transparent opacity-40 hover:opacity-100'}`} />)}</div>
                  </div>
                </div>

                {isHost && (
                  <div className="pt-8 space-y-6 border-t border-slate-800/50">
                    <button onClick={initGameGrid} disabled={players.filter(p => p.name).length < playerCount} className="w-full py-6 bg-yellow-500 text-slate-950 font-black text-2xl rounded-[2rem] disabled:opacity-20 shadow-2xl transition-all active:scale-[0.98] uppercase tracking-widest">{t('startOnlineGame')}</button>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-lg border border-slate-800 p-8 rounded-[3rem] space-y-6 shadow-xl">
                <h4 className="text-[10px] sm:text-xs font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest"><Users className="w-4 h-4" /> Enrolled Empires ({players.filter(p => p.name).length}/{playerCount})</h4>
                <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin">
                  {players.map((p, i) => p.name ? (
                    <div key={i} className={`flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border transition-all ${myPlayerId === i ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/5'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]" style={{ backgroundColor: p.color }} />
                        <span className="font-black text-sm sm:text-base truncate max-w-[120px]">{p.name} {i === 0 && <span className="text-[8px] text-yellow-500 opacity-50 ml-1 uppercase">(HOST)</span>}</span>
                      </div>
                      {myPlayerId === i && <div className="flex items-center gap-2 text-cyan-400 font-black text-[10px] uppercase"><Monitor className="w-4 h-4"/> You</div>}
                    </div>
                  ) : null)}
                  {Array.from({ length: Math.max(0, playerCount - players.filter(p => p.name).length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-4 border border-dashed border-slate-800 rounded-2xl flex items-center gap-3 opacity-30">
                       <div className="w-4 h-4 rounded-full bg-slate-800" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Waiting for Signal...</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <button onClick={resetToLanding} className="w-full text-slate-600 font-bold hover:text-white transition-all text-sm uppercase tracking-widest py-4">{t('reset')}</button>
        </div>
      </div>
    );
  }

  if (uiState === 'config' || uiState === 'tutorial_config') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8 text-white">
        <div className="max-w-4xl w-full space-y-8 sm:space-y-12">
          <div className="text-center space-y-2"><h2 className="text-3xl sm:text-5xl font-black tracking-tight">{uiState === 'config' ? t('customize') : t('playNow')}</h2><p className="text-slate-500 font-black uppercase tracking-widest text-[10px] sm:text-xs">{uiState === 'config' ? 'Configure local match' : 'Trial Identity Setup'}</p></div>
          <div className="grid sm:grid-cols-2 gap-6">
            {players.map((p, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2.5rem] space-y-5 backdrop-blur-xl">
                <div className="flex justify-between items-center"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Empire #{idx+1}</span><div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: p.color }} /></div>
                <input value={p.name} onChange={e => { const n = [...players]; n[idx].name = e.target.value; setPlayers(n); }} placeholder={t('namePlace')} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-bold outline-none ring-yellow-500/30 focus:ring-2 transition-all" />
                <div className="flex gap-2 flex-wrap">{DEFAULT_COLORS.map(c => <button key={c} onClick={() => { const n = [...players]; n[idx].color = c; setPlayers(n); }} style={{ backgroundColor: c }} className={`w-8 h-8 rounded-xl border-2 transition-all ${p.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`} />)}</div>
              </div>
            ))}
          </div>
          <button onClick={initGameGrid} className="w-full py-6 bg-yellow-500 text-slate-950 font-black text-2xl sm:text-3xl rounded-[2rem] shadow-2xl hover:scale-[1.01] active:scale-95 transition-all">{t('start')}</button>
          <button onClick={resetToLanding} className="w-full text-slate-600 font-bold hover:text-white transition-all text-sm uppercase tracking-widest">{t('reset')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden relative text-white flex-col lg:flex-row">
      {message && (
        <div className="fixed top-20 sm:top-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 bg-yellow-500 text-slate-950 font-black text-xs sm:text-sm rounded-full shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-3 border border-white/20 whitespace-nowrap">
          <Landmark className="w-4 h-4" /> {message}
        </div>
      )}

      {/* Tutorial Guide Modal */}
      {isTutorial && tutStep > 0 && (
        <div className="fixed top-24 lg:top-8 right-4 lg:right-8 z-[200] max-w-xs w-full bg-slate-900 border border-yellow-500/50 rounded-3xl p-6 shadow-[0_0_40px_rgba(234,179,8,0.15)] animate-in slide-in-from-right-8 duration-500">
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-yellow-500 font-black uppercase text-[10px] tracking-widest"><Info className="w-4 h-4"/> {t('tutorialTitle')}</div>
              <span className="text-[10px] font-black text-slate-600">{tutStep}/4</span>
           </div>
           <p className="text-xs sm:text-sm text-slate-300 font-bold leading-relaxed mb-6">
              {tutStep === 1 && t('tut1')}
              {tutStep === 2 && t('tut2')}
              {tutStep === 3 && t('tut3')}
              {tutStep === 4 && t('tut4')}
           </p>
           <div className="flex gap-2">
              <button onClick={() => tutStep < 4 ? setTutStep(tutStep + 1) : setTutStep(0)} className="flex-1 py-2.5 bg-yellow-500 text-slate-950 font-black text-[10px] rounded-xl hover:bg-yellow-400 transition-all">{t('tutorialNext')}</button>
              <button onClick={() => setTutStep(0)} className="px-3 bg-slate-800 text-slate-500 rounded-xl hover:text-white transition-all"><XCircle className="w-4 h-4"/></button>
           </div>
        </div>
      )}

      {isMyTurn && (pendingTruceTarget !== null || (currentPlayer?.truceProposals?.size || 0) > 0) && (
        <div className="fixed inset-0 z-[250] bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center p-6">
           <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 space-y-6 sm:space-y-8 animate-in zoom-in-95 duration-300 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              {pendingTruceTarget !== null ? (
                <>
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto"><Handshake className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" /></div>
                    <h2 className="text-2xl sm:text-3xl font-black">{t('forceTruceTitle')}</h2>
                    <p className="text-slate-400 text-sm font-bold leading-relaxed">{t('forceTruceDesc', { name: players[pendingTruceTarget]?.name })}</p>
                  </div>
                  <div className="flex flex-col gap-3 pt-2">
                    <button onClick={() => { const truceRes = establishTruce(currentIdx, pendingTruceTarget!, players, grid); const nextLogs = addLog(currentIdx, t('truceForcedLog', { name: players[pendingTruceTarget!].name }), 'peace'); nextTurn(truceRes.grid, truceRes.players, nextLogs); }} className="w-full py-4 bg-cyan-600 text-white font-black rounded-2xl hover:bg-cyan-500 transition-all shadow-xl active:scale-95">{t('forceTruceAction')}</button>
                    <button onClick={() => nextTurn(grid, players, logs)} className="w-full py-4 bg-slate-800 text-slate-400 font-bold rounded-2xl hover:bg-slate-700 transition-all active:scale-95">{t('continueWar')}</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto"><Bird className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" /></div>
                    <h2 className="text-2xl sm:text-3xl font-black">{t('offerReceived')}</h2>
                    <p className="text-slate-400 text-sm font-bold leading-relaxed">{t('offerDesc', { name: players[Array.from(currentPlayer.truceProposals)[0] as number]?.name })}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button onClick={() => respondToTruce(Array.from(currentPlayer.truceProposals)[0] as number, true)} className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-500 transition-all active:scale-95">{t('accept')}</button>
                    <button onClick={() => respondToTruce(Array.from(currentPlayer.truceProposals)[0] as number, false)} className="flex-1 py-4 bg-red-900/50 text-red-400 font-black rounded-2xl hover:bg-red-900/80 transition-all active:scale-95">{t('decline')}</button>
                  </div>
                </>
              )}
           </div>
        </div>
      )}

      <aside className="hidden lg:flex w-72 bg-slate-900/40 backdrop-blur-3xl border-r border-white/5 flex-col z-20 shrink-0">
        <div className="p-8 border-b border-white/5 flex items-center gap-3"><Landmark className="w-6 h-6 text-yellow-500" /><h1 className="font-black tracking-tighter uppercase text-2xl">{t('title')}</h1></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
           <CivilizationIntel players={players} currentIdx={currentIdx} gameTurn={gameTurn} grid={grid} t={t} getPlayerScore={getPlayerScore} myPlayerId={myPlayerId} mode={mode} />
        </div>
        <div className="p-4 bg-slate-950/50 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest"><span>Year {gameTurn}</span><button onClick={resetToLanding} className="hover:text-white transition-all"><RotateCcw className="w-4 h-4"/></button></div>
      </aside>

      <section className="flex-1 flex flex-col relative overflow-hidden h-full">
        <div className="lg:hidden flex bg-slate-950/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 justify-between items-center z-50">
           <div className="flex items-center gap-2 font-black tracking-tighter uppercase text-xs sm:text-sm"><Landmark className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" /> {t('title')}</div>
           <div className="flex gap-2">
              <NavBtn active={mobileView === 'map'} icon={<LayoutGrid />} onClick={() => setMobileView('map')} />
              <NavBtn active={mobileView === 'status'} icon={<Users />} onClick={() => setMobileView('status')} />
              <NavBtn active={mobileView === 'logs'} icon={<List />} onClick={() => setMobileView('logs')} />
              <NavBtn active={false} icon={<RotateCcw />} onClick={resetToLanding} />
           </div>
        </div>

        <div className="flex-1 relative overflow-hidden flex flex-col">
          <div className={`flex-1 overflow-auto touch-pan-x touch-pan-y z-10 scrollbar-hide ${mobileView === 'map' ? 'block' : 'hidden lg:block'}`}>
            <div className="min-h-full min-w-full flex items-start sm:items-center justify-center p-6 sm:p-12 pb-[60vh] sm:pb-12 pt-24 sm:pt-12 px-20 sm:px-12">
              <div className="min-w-max bg-slate-900/60 p-4 sm:p-8 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-2xl">
                 {renderGrid}
              </div>
            </div>
          </div>
          {mobileView === 'status' && (
            <div className="lg:hidden flex-1 bg-slate-950 overflow-y-auto p-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-center mb-6"><h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{t('civStatus')}</h3><div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Year {gameTurn}</div></div>
              <CivilizationIntel players={players} currentIdx={currentIdx} gameTurn={gameTurn} grid={grid} t={t} getPlayerScore={getPlayerScore} myPlayerId={myPlayerId} mode={mode} />
            </div>
          )}
          {mobileView === 'logs' && (
            <div className="lg:hidden flex-1 bg-slate-950 overflow-y-auto p-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-center mb-6"><h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{t('logs')}</h3></div>
              <LogChronicle logs={logs} players={players} t={t} />
            </div>
          )}
        </div>

        {phase === 'play' && mobileView === 'map' && (
          <div className="absolute bottom-4 sm:bottom-8 left-0 right-0 z-[60] flex flex-col items-center gap-3 sm:gap-4 w-full px-3 sm:px-4 animate-in slide-in-from-bottom-8 duration-500">
             {currentPlayer && (
               <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-950/90 border border-white/10 rounded-full shadow-xl backdrop-blur-xl">
                 <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: currentPlayer.color }} />
                 <span className="text-[8px] sm:text-xs font-black uppercase tracking-widest" style={{ color: currentPlayer.color }}>{t('activePlayer', { name: currentPlayer.name })}</span>
               </div>
             )}
             <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full items-stretch sm:items-center justify-center max-w-5xl">
                <div className="bg-slate-900/90 backdrop-blur-3xl border border-white/10 p-2 sm:p-2.5 rounded-[1.8rem] sm:rounded-[2.5rem] flex flex-nowrap gap-2 sm:gap-3 shadow-2xl overflow-x-auto scrollbar-hide snap-x touch-pan-x items-center justify-start sm:justify-center">
                  <HUDButton icon={<SquareArrowUp />} label={t('growCap')} color="yellow" onClick={() => { if (!currentPlayer.capitalUpgrade) { const next = currentPlayer.capitalLevel + 1; const nextPlayers = [...players]; const p = {...nextPlayers[currentIdx]}; p.capitalUpgrade = { targetLevel: next, remaining: getUpgradeCooldown(next) }; nextPlayers[currentIdx] = p; const newLogs = addLog(currentIdx, t('capUpStart', { lv: next }), 'growth'); nextTurn(grid, nextPlayers, newLogs); } }} active={!!currentPlayer.capitalUpgrade} disabled={!isMyTurn || !!pendingTruceTarget} badge={currentPlayer.capitalUpgrade ? `${currentPlayer.capitalUpgrade.remaining}T` : null}/>
                  <HUDButton icon={<Building2 />} label={t('cityBuild')} color="emerald" onClick={handleCityGrow} disabled={!isMyTurn || !!pendingTruceTarget}/>
                  <HUDButton icon={<MapIcon />} label={t('expand')} color="blue" onClick={handleExpand} disabled={!isMyTurn || !!pendingTruceTarget} badge={expansionRemaining > 0 ? `+${expansionRemaining}` : null}/>
                  <div className="w-px h-8 bg-white/10 mx-1 shrink-0" />
                  <HUDButton icon={<Sword />} label={t('decWar')} color="red" onClick={handleWar} disabled={!isMyTurn || !!pendingTruceTarget}/>
                  <HUDButton icon={<Swords />} label={t('invade')} color="orange" onClick={handleInvasion} disabled={!isMyTurn || !!pendingTruceTarget || (currentPlayer.warWith?.size || 0) === 0}/>
                  <HUDButton icon={<Bird />} label={t('truce')} color="cyan" onClick={handleTruce} disabled={!isMyTurn || !!pendingTruceTarget || (currentPlayer.warWith?.size || 0) === 0}/>
                  {isTutorial && <HUDButton icon={<Info />} label="Tutorial" color="yellow" onClick={() => setTutStep(tutStep === 0 ? 1 : 0)} active={tutStep > 0} />}
                </div>
                <button onClick={() => nextTurn()} disabled={!isMyTurn} className="px-6 sm:px-10 py-4 sm:py-5 bg-white text-slate-950 rounded-2xl sm:rounded-[2rem] font-black text-sm sm:text-lg hover:bg-slate-100 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 shrink-0 disabled:opacity-20 uppercase tracking-tighter">
                  {t('endTurn')} <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6"/>
                </button>
             </div>
          </div>
        )}

        {phase === 'end' && (
          <div className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-[2.5rem] sm:rounded-[3rem] p-10 sm:p-12 text-center space-y-6 sm:space-y-8 animate-in zoom-in-95 duration-500 shadow-2xl">
               <div className="w-24 h-24 sm:w-32 sm:h-32 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto ring-4 ring-yellow-500/20"><Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 drop-shadow-glow" /></div>
               <div className="space-y-2">
                 <h2 className="text-4xl sm:text-6xl font-black tracking-tighter">{t('victory')}</h2>
                 <p className="text-xs sm:text-sm text-slate-400 font-black uppercase tracking-[0.2em] leading-relaxed px-4">{players.find(p => !p.eliminated && p.name)?.name} {t('winner')}</p>
               </div>
               <button onClick={resetToLanding} className="w-full py-5 bg-white text-slate-950 font-black text-xl rounded-2xl hover:bg-slate-100 active:scale-95 transition-all shadow-xl">{t('restart')}</button>
            </div>
          </div>
        )}
      </section>

      <aside className="hidden lg:flex w-80 bg-slate-900/40 backdrop-blur-3xl border-l border-white/5 flex-col z-20 shrink-0">
        <div className="p-8 border-b border-white/5"><h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">{t('logs')}</h3></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin"><LogChronicle logs={logs} players={players} t={t} /></div>
      </aside>
    </div>
  );
};

export default App;