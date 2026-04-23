import { Switch, Route, Router as WouterRouter } from "wouter";
import { ToastContainer } from "@/components/Toast";
import Landing from "@/pages/Landing";
import TeacherDashboard from "@/pages/TeacherDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import Exam from "@/pages/Exam";
import Results from "@/pages/Results";
import Leaderboard from "@/pages/Leaderboard";
import TeacherAnalytics from "@/pages/TeacherAnalytics";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/teacher" component={TeacherDashboard} />
      <Route path="/student" component={StudentDashboard} />
      <Route path="/exam" component={Exam} />
      <Route path="/results" component={Results} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/analytics" component={TeacherAnalytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <ToastContainer />
    </>
  );
}

export default App;
