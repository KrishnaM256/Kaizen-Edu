import React, { useMemo, useState } from 'react'
import { extendTheme, styled } from '@mui/material/styles'
import PropTypes from 'prop-types'
import { Avatar, Typography, Box, IconButton, Stack } from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import HomeIcon from '@mui/icons-material/Home'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import BarChartIcon from '@mui/icons-material/BarChart'
import DescriptionIcon from '@mui/icons-material/Description'
import MicIcon from '@mui/icons-material/Mic'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import VisibilityIcon from '@mui/icons-material/Visibility'
import InsightsIcon from '@mui/icons-material/Insights'
import PersonIcon from '@mui/icons-material/Person'
import SchoolIcon from '@mui/icons-material/School'
import ProfileIcon from '@mui/icons-material/AccountCircleRounded';import LockIcon from '@mui/icons-material/Lock'
import PaletteIcon from '@mui/icons-material/Palette'
import { AppProvider } from '@toolpad/core/AppProvider'
import { DashboardLayout } from '@toolpad/core/DashboardLayout'
import { PageContainer } from '@toolpad/core/PageContainer'
import Grid from '@mui/material/Grid2'
import './Sidebar.css'
import Navbar from './Navbar'
import { logout } from '../redux/features/auth/authSlice'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
const API = import.meta.env.VITE_BACKEND_URL
import Dashboard from '@mui/icons-material/Dashboard'
import AllTeaching from '../pagesKM/Pages/AllTeaching'
import AssignMents from '../pagesKM/Pages/AssignMents'
import DashboardPage from '../pagesKM/Pages/DashboardPage'
import Calender from '../pagesPP/Calender/Calender'
import logo from './../assets/logo.png'
import CreateClass from '../pagesKM/Pages/CreateClass'
import { useGetAllClassesQuery } from '../redux/api/classApiSlice'
import ClassPage from '../pagesKM/Pages/ClassPage'
import UsersPage from '../pagesKM/Pages/UsersPage'
import TimetableGeneratorPage from '../pagesKM/Pages/TimetableGeneratorPage'
import TimetablePage from '../pagesKM/Pages/TimetablePage'
import Profile from '../pagesPP/Profile/Profile'

import Temp from '../Component/Temp'
import MentorMenteePage from '../pagesKM/Pages/MentorMenteePage'
import MentFindPage from './../pagesKM/Pages/MentFindPage'
const demoTheme = extendTheme({
  colorSchemes: { light: true },
  colorSchemeSelector: 'class',
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 600,
      lg: 1200,
      xl: 1536,
    },
  },
})

function useDemoRouter(initialPath) {
  const [pathname, setPathname] = React.useState(initialPath)
  console.log({ initialPath: pathname })
  const router = React.useMemo(() => {
    return {
      pathname,
      searchParams: new URLSearchParams(),
      navigate: (path) => setPathname(String(path)),
    }
  }, [pathname])
  return router
}

function DemoPageContent({ pathname }) {
  return (
    <Box
      sx={{
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Typography>Dashboard content for {pathname}</Typography>
    </Box>
  )
}

DemoPageContent.propTypes = {
  pathname: PropTypes.string.isRequired,
}

const Skeleton = styled('div')(({ theme, height }) => ({
  backgroundColor: theme.palette.action.hover,
  borderRadius: theme.shape.borderRadius,
  height,
  content: '" "',
}))

function CustomAppTitle() {
  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Typography
        variant="h6"
        fontWeight={'bold'}
        color="#1565C0"
        fontFamily={'cursive'}
      >
        Kaizen.Edu
      </Typography>
    </Stack>
  )
}

export default function Main(props) {
  const { userInfo } = useSelector((state) => state.user)
  const { data, isLoading, error } = useGetAllClassesQuery(userInfo._id)

  const NAVIGATION = [
    {
      kind: 'header',
      title: 'Main',
    },
    {
      segment: 'dashboard',
      title: 'Dashboard',
      icon: <DashboardIcon />,
    },
    {
      segment: 'class',
      title: 'Home',
      icon: <HomeIcon />,
    },
    {
      segment: 'calender',
      title: 'Calender',
      icon: <CalendarMonthIcon />,
    },
    {
      segment: 'mentor-mentee',
      title: 'Mentor-Mentee',
      icon: <SupervisorAccountIcon />,
    },
    {
      kind: 'divider',
    },
    {
      kind: 'header',
      title: 'Teaching & Scheduling',
    },
    {
      segment: 'class',
      title: 'Teaching',
      icon: <LibraryBooksIcon />,
      children:
        !isLoading && Array.isArray(data?.classes) // Ensure data.classes is an array
          ? data.classes.map((classItem) => ({
              segment: classItem._id,
              title: classItem.name,
            }))
          : [], // Default to an empty array if invalid
    },
    {
      segment: 'timetable',
      title: 'Timetable Generator',
      icon: <CalendarMonthIcon />,
    },
    {
      segment: 'progress-tracking',
      title: 'Progress Tracking',
      icon: <TrendingUpIcon />,
    },
    {
      kind: 'divider',
    },
    {
      kind: 'header',
      title: 'User Management',
    },
    {
      segment: 'students',
      title: 'Students',
      icon: <SchoolIcon />,
    },
    {
      kind: 'divider',
    },
    {
      kind: 'header',
      title: 'Settings',
    },
    {
      segment: 'profile',
      title: 'Profile',
      icon: <ProfileIcon />,
    },
    {
      segment: 'security',
      title: 'Security & Privacy',
      icon: <LockIcon />,
    },
    {
      segment: 'theme',
      title: 'Theme & UI',
      icon: <PaletteIcon />,
    },
  ]

  const { window } = props

  const router = useDemoRouter('/dashboard')
  const demoWindow = window !== undefined ? window() : undefined
  console.log({ router: router })
  const dispatch = useDispatch()

  const [session, setSession] = useState({
    user: {
      name: userInfo.name,
      email: userInfo.email,
      image: userInfo.profile_pic,
    },
  })
  const authentication = useMemo(() => {
    return {
      signIn: () => {
        setSession({
          user: {
            name: userInfo.name,
            email: userInfo.email,
            image: userInfo.profile_pic,
          },
        })
      },
      signOut: async () => {
        const URL = `${API}/user/logout-user`
        const response = await axios.get(URL, {
          withCredentials: true,
        })
        dispatch(logout())
      },
    }
  }, [])

  return (
    <>
      <AppProvider
        session={session}
        authentication={authentication}
        navigation={NAVIGATION}
        router={router}
        theme={demoTheme}
        window={demoWindow}
      >
        <DashboardLayout
          sidebarExpandedWidth={270}
          slots={{
            appTitle: CustomAppTitle,
          }}
        >
          {router.pathname == '/dashboard' && <DashboardPage />}
          {router.pathname=='/calender' && <Calender/>}
          {router.pathname=='/profile' && <Profile/>}
          {router.pathname == '/class' && (
            <AllTeaching useDemoRouter={useDemoRouter} />
          )}
          {router.pathname == '/createClass' && <CreateClass />}
          {router.pathname == '/quizzes' && <AllTeaching />}
          {router.pathname == '/viva' && <AllTeaching />}
          {router.pathname == '/attendance' && <AllTeaching />}
          {/* {router.pathname == '/progress-tracking' && <Temp />} */}
          {router.pathname == '/students' && <UsersPage />}
          {router.pathname == '/timetable' && <TimetablePage />}
          {router.pathname == '/mentor-mentee' && <MentFindPage />}
          {router.pathname?.startsWith('/class/') && (
            <ClassPage classId={router.pathname.split('/')[2]} />
          )}
        </DashboardLayout>
      </AppProvider>
    </>
  )
}
