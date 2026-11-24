import { useId } from "react";
import type { Setting } from "../data/missionCases";
import { CAST, CharSVG, OrionFigure, TeacherFigure, type SpeakerId } from "./characters";
import type { Crowd } from "./ClassroomScene";

const PALETTE: Record<Setting, readonly [string, string]> = {
  studio: ["#221746", "#FF83BC"], auditorium: ["#211843", "#ECAEFF"],
  office: ["#152D4C", "#8EC5FF"], desk: ["#332044", "#FFC485"],
  market: ["#382340", "#FFB55F"], workshop: ["#192D45", "#94DAF6"],
  hall: ["#1B294B", "#92A6FF"], outdoor: ["#14424B", "#9CF2B2"],
  stage: ["#301C49", "#FF8EA9"], library: ["#332549", "#FAD59F"],
  digital: ["#112C50", "#76F1EB"],
};

function SetPieces({ setting, ink }: { setting: Setting; ink: string }) {
  switch (setting) {
    case "studio":
      return <g fill="#191631" stroke={ink} strokeWidth="4">
        <rect x="81" y="84" width="206" height="188" rx="20"/>
        <path d="M98 182h24l12-32 18 65 20-83 20 95 18-76 13 31h48" fill="none"/>
        <rect x="658" y="107" width="56" height="98" rx="28"/>
        <path d="M642 174v14a44 44 0 0 0 88 0v-14M686 232v48m-27 0h54" fill="none"/>
      </g>;
    case "auditorium":
      return <g fill={ink} opacity=".26">
        <path d="M94 46h53l161 266H24zM671 46h50l58 266H505z"/>
        <path d="M20 328h760v28H20zm36 46h688v23H56z"/>
      </g>;
    case "office":
      return <g fill="none" stroke={ink} opacity=".48" strokeWidth="4">
        <rect x="60" y="61" width="184" height="215" rx="12"/><path d="M152 61v215M60 166h184"/>
        <rect x="613" y="75" width="115" height="152" rx="8"/><path d="M629 106h82m-82 32h82m-82 32h58m-58 32h58"/>
        <path d="M265 325h272m-244 0v55m213-55v55" strokeWidth="12"/>
      </g>;
    case "desk":
      return <g stroke={ink} strokeWidth="4" fill="#27213D">
        <path d="M88 275h222v22H88zm24 22v86m166-86v86"/><path d="M164 273v-94h45l30 40h-61" fill="none"/>
        <circle cx="690" cy="132" r="48"/><path d="M690 101v33h24" fill="none"/>
      </g>;
    case "market":
      return <g stroke={ink} strokeWidth="4" fill="#3D243D">
        <path d="M53 263V93h214v170m-204-132h194M76 263h168v98H76z"/>
        <path d="M51 94h216l30 55H26z" fill={ink} opacity=".55"/><path d="M91 95l-12 53m65-53-3 53m56-53 10 53"/>
        <path d="M611 235h130v116H611zM626 207h100l15 28H611z"/>
      </g>;
    case "workshop":
      return <g stroke={ink} strokeWidth="4" fill="#162D42">
        <rect x="60" y="78" width="185" height="168" rx="10"/><path d="M99 113l40 57m-25-63 26 28m63-28-31 88m-60 4h31" fill="none"/>
        <path d="M603 255h140v22H603zm12 22v98m111-98v98M640 251v-43h64v43" />
      </g>;
    case "hall":
      return <g stroke={ink} strokeWidth="3" fill="#1A2850">
        {[55, 121, 187, 601, 668].map(x=><g key={x}><rect x={x} y="90" width="56" height="238" rx="5"/><path d={`M${x+14} 121h28m-28 12h28m-15 86h10`}/></g>)}
        <path d="M321 304V98h160v206" fill="none"/>
      </g>;
    case "outdoor":
      return <g>
        <circle cx="695" cy="82" r="45" fill="#FCE0A0" opacity=".85"/>
        <path d="M0 262l120-98 104 100 139-78 149 92 114-88 174 70v121H0z" fill="#2D735E"/>
        <path d="M0 310q180-75 360 0t440-5v104H0z" fill="#1D574E"/>
        <path d="M110 301v-119m588 120v-100" stroke="#693D3C" strokeWidth="17"/>
        <circle cx="107" cy="167" r="55" fill="#4A976D"/><circle cx="704" cy="185" r="51" fill="#4A976D"/>
      </g>;
    case "stage":
      return <g>
        <path d="M0 0h174Q151 143 70 307H0zm800 0H626q23 143 104 307h70z" fill="#872D65"/>
        <path d="M40 0q-2 194-30 293M98 0Q86 185 57 268m705-268q1 194 29 293m-90-293q12 185 41 268" stroke={ink} opacity=".34" fill="none" strokeWidth="4"/>
        <ellipse cx="400" cy="343" rx="230" ry="47" fill={ink} opacity=".2"/>
      </g>;
    case "library":
      return <g fill="#322745" stroke={ink} strokeWidth="3">
        {[54, 582].map(x=><g key={x}><rect x={x} y="72" width="162" height="256" rx="8"/>{[132, 202, 272].map(y=><g key={y}><path d={`M${x+9} ${y}h145`}/>{[19, 44, 69, 95, 124].map((offset,i)=><rect key={offset} x={x+offset} y={y-32} width={12+i%3*3} height="30" fill={ink} opacity={.25+i*.13}/>)}</g>)}</g>)}
      </g>;
    case "digital":
      return <g fill="#0E243F" stroke={ink} strokeWidth="4">
        <rect x="66" y="85" width="180" height="127" rx="12"/><path d="M95 120h112m-112 24h78m-78 24h101m-53 45v42m-35 0h70"/>
        <rect x="629" y="96" width="93" height="171" rx="12"/><path d="M648 127h55m-55 30h55m-55 29h33m-17 54h24"/>
      </g>;
  }
}

type Avatar = { hair: string; hairStyle: string; skin: string; shirt: string };

export function MissionSetting({ setting, props, avatar, speaker, crowd, orion, speaking }: {
  setting: Setting; props: readonly string[]; avatar: Avatar; speaker?: SpeakerId;
  crowd: Crowd; orion: boolean; speaking?: "student" | "teacher" | "peer" | null;
}) {
  const id = useId();
  const [background, accent] = PALETTE[setting];
  const positive = crowd === "engaged" || crowd === "applause";
  const concerned = crowd === "doubtful" || crowd === "distracted" || crowd === "tense";
  const peer = speaker === "sofia" || speaker === "daniela" ? CAST[speaker] : CAST.lucas;
  const mood = concerned ? "worried" : positive ? "happy" : "thinking";

  return (
    <svg viewBox="0 0 800 450" className="w-full h-full block" aria-hidden="true">
      <defs>
        <radialGradient id={id}><stop stopColor={accent} stopOpacity=".3"/><stop offset="1" stopColor={background}/></radialGradient>
      </defs>
      <path d="M0 0h800v450H0z" fill={background}/>
      <path d="M0 0h800v450H0z" fill={`url(#${id})`}/>
      <path d="M0 314h800v136H0z" fill="#100D27" opacity=".47"/>
      <SetPieces setting={setting} ink={accent}/>
      <ellipse cx="400" cy="378" rx="225" ry="39" fill="#0A102B" opacity=".44"/>
      <g transform="translate(236,112)">
        <CharSVG {...avatar} size={222} mood={concerned?"nervous":"confident"} look="right"/>
      </g>
      <g transform="translate(404,118)">
        {speaker === "garcia" ? <TeacherFigure size={213} mood={mood} look="left"/>
          : <CharSVG {...peer} size={218} mood={mood} look="left" pose={positive?"hand":concerned?"arms":"stand"}/>}
      </g>
      {speaking && (
        <g className="lx-react" transform={speaking === "student" ? "translate(324,68)" : "translate(493,70)"}>
          <rect width="88" height="29" rx="14.5" fill="#22D3EE" stroke="#E9FDFF" strokeWidth="2"/>
          <path d="M18 11v7m7-11v15m7-11v7" stroke="#05202A" strokeWidth="2.5" strokeLinecap="round"/>
          <text x="40" y="19" fontSize="12" fontWeight="800" fontFamily="Poppins,sans-serif" fill="#05202A">Habla</text>
        </g>
      )}
      {orion && <g transform="translate(623,243)"><OrionFigure size={132} glow/></g>}
      {props.map((prop, i) => (
        <g key={prop} transform={`translate(${106 + i * 78},392)`}>
          <rect x="-28" y="-27" width="56" height="51" rx="15" fill={background} stroke={accent} strokeOpacity=".56"/>
          <text textAnchor="middle" y="8" fontSize="27">{prop}</text>
        </g>
      ))}
    </svg>
  );
}
