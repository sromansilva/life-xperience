import { OrionChat } from "../../OrionChat";
import { StudentLayout } from "../../layouts/StudentLayout";
import Home from "./Home";
import Map from "./Map";
import World from "./World";
import Progress from "./Progress";
import Avatar from "./Avatar";
import Mission from "./Mission";
import Results from "./Results";
import { useMission } from "./useMission";

export default function StudentArea() {
  const state = useMission();
  const { appScreen, selectedWorld, startMission, continueMission, confetti, levelUpShow,
    reducedMotion, particles, animXP, decisionDialogOpen, orionMissionContext, exitPractice, logout,
    me, orionChat, setOrionChat } = state;
  return (
    <StudentLayout confetti={confetti} levelUpShow={levelUpShow} reducedMotion={reducedMotion}
      particles={particles} animXP={animXP} decisionDialogOpen={decisionDialogOpen}
      orionMissionContext={orionMissionContext} exitPractice={exitPractice} logout={logout}>
      {appScreen === "home" && <Home onStartMission={startMission} onContinueMission={continueMission} />}
      {appScreen === "map" && <Map onContinueMission={continueMission} />}
      {appScreen === "skill" && selectedWorld && <World worldId={selectedWorld.id} onStartMission={startMission} onContinueMission={continueMission} />}
      {appScreen === "sim" && <Mission state={state} />}
      {appScreen === "results" && <Results state={state} />}
      {appScreen === "orion" && <OrionChat studentName={me.name} messages={orionChat} onMessagesChange={setOrionChat} missionContext={orionMissionContext} />}
      {appScreen === "dash" && <Progress animXP={animXP} />}
      {appScreen === "avatar" && <Avatar />}
    </StudentLayout>
  );
}
