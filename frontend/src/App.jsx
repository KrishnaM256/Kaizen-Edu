import './App.css'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Main from './common/Main.jsx'
import Home from './pagesKM/Home/Home.jsx'
import Login from './pagesPP/login.jsx'
import RegisterForm from './pagesPP/Register.jsx'
import PrivateRoute from './PrivateRoutes.jsx'
import ClassPage from './pagesKM/Pages/ClassPage.jsx'
import LecturePage from './pagesKM/Pages/LecturePage.jsx'
import TakePicture from './pagesPP/Viva/TakePicture.jsx'
import GiveViva from './pagesPP/Viva/GiveViva.jsx'

import GivePicture from './pagesPP/Quiz/GivePicture.jsx'
import GiveQuiz from './pagesPP/Quiz/GiveQuiz.jsx'
import temp from './Component/Temp.jsx';
// import StudentReport from './pages_rajas/StudentReport'
import FeedbackPage from './pages_rajas/FeedbackPage.jsx'
import PersonalizedFeedback from './pages_rajas/PersonalizedFeedback.jsx'
import Mindmap from './pages_rajas/Mindmap.jsx'
import Studentreport2 from './pages_rajas/Studentreport2.jsx'
import HomePage from './pagesPP/VideoCall/VideoMetting.jsx'
import VideoMeeting from './pagesPP/VideoCall/VideoMetting.jsx'
import RoomMeet from './pagesPP/VideoCall/RoomMeet.jsx'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/" element={<Home />} />
        <Route path="" element={<PrivateRoute />}>
          <Route path="/main" element={<Main />} />
          <Route path="/home" element={<Home />} />
          <Route path="/takepicture/:vivaId" element={<TakePicture />} />
          <Route path="/givepicture/:quizId" element={<GivePicture />} />
          <Route path="/give-quiz/:quizId" element={<GiveQuiz />} />
          <Route path="/give-viva/:vivaId" element={<GiveViva />} />
          <Route path="/takepicture/:vivaId" element={<TakePicture />} />
          <Route path="/give-viva/:vivaId" element={<GiveViva />} />
          {/* <Route path="/room" element={<VideoMeeting />} />{} */}
          <Route path="/room/:classId/:roomId" element={<RoomMeet />} />
          <Route path="/class/:id" element={<ClassPage />} />
          <Route path="/lecture/:id" element={<LecturePage />} />
          <Route path="/temp" element={<temp/>}/>

          <Route path="/mindmap" element={<Mindmap></Mindmap>} />
          <Route path="/report" element={<Studentreport2></Studentreport2>} />
          <Route path="/feedback" element={<FeedbackPage></FeedbackPage>} />
          <Route
            path="/personalized"
            element={<PersonalizedFeedback></PersonalizedFeedback>}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
