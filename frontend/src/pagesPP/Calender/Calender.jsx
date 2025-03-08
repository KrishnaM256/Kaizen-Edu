import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import {
  createViewDay,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
} from '@schedule-x/calendar';
import { createEventsServicePlugin } from '@schedule-x/events-service';
import { createDragAndDropPlugin } from '@schedule-x/drag-and-drop';
import { createEventModalPlugin } from '@schedule-x/event-modal';
import { createScrollControllerPlugin } from '@schedule-x/scroll-controller';
import { createResizePlugin } from '@schedule-x/resize';
import { createEventRecurrencePlugin } from '@schedule-x/event-recurrence';
import { createCalendarControlsPlugin } from '@schedule-x/calendar-controls';
import { createCurrentTimePlugin } from '@schedule-x/current-time';
import { useState, useEffect, useRef } from 'react';
import '@schedule-x/theme-default/dist/index.css';
import { useSelector } from 'react-redux';
import axios from 'axios';
import '../../App.css'

const API = import.meta.env.VITE_BACKEND_URL;

function CalendarApp() {
  const eventsService = useState(() => createEventsServicePlugin())[0];
  const dragAndDropPlugin = useState(() => createDragAndDropPlugin())[0];
  const eventModalPlugin = useState(() => createEventModalPlugin())[0];
  const scrollControllerPlugin = useState(() => createScrollControllerPlugin({ initialScroll: '07:50' }))[0];
  const resizePlugin = useState(() => createResizePlugin())[0];
  const eventRecurrencePlugin = useState(() => createEventRecurrencePlugin())[0];
  const calendarControlsPlugin = useState(() => createCalendarControlsPlugin())[0];
  const currentTimePlugin = useState(() => createCurrentTimePlugin())[0];
  const { userInfo } = useSelector((state) => state.user);
  const [userid, setUserid] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [vivas, setVivas] = useState([]);
  const [schedule, setSchedule] = useState([]); // For teacher's schedule
  const [userRole, setUserRole] = useState(null);
  const [currentView, setCurrentView] = useState('week'); // Track the current view
  const calendarContainerRef = useRef(null); // Ref for the calendar container

  // Set user ID and role when userInfo changes
  useEffect(() => {
    if (userInfo?._id) setUserid(userInfo._id);
    if (userInfo?.role) setUserRole(userInfo.role);
  }, [userInfo?._id, userInfo?.role]);

  // Fetch data based on user role
  useEffect(() => {
    const fetchData = async () => {
      if (!userid) return;

      try {
        if (userRole === 'student') {
          // Fetch student data (assignments, quizzes, vivas)
          const response = await axios.get(`${API}/dashboard/getduedate/${userid}`);
          const data = response.data;
          setAssignments(data.assignments || []);
          setQuizzes(data.quizzes || []);
          setVivas(data.vivas || []);
        } else if (userRole === 'teacher') {
          // Fetch teacher's schedule
          const response = await axios.get(`${API}/timetable/${userid}`);
          const data = response.data;
          setSchedule(data.data?.schedule || []); // Use the schedule array from the API response
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [userid, userRole]);

  // Transform student data into calendar events
  const transformStudentDataToEvents = (data, type) => {
    return data.map((item, index) => ({
      id: `${type}-${index}`,
      title: `${item.classname} - ${item.name} (${type})`,
      start: item.duedate.split('T')[0], // Extract date part (YYYY-MM-DD)
      end: item.duedate.split('T')[0],   // Same as start for single-day events
    }));
  };

  // Transform teacher's schedule into calendar events
  const transformTeacherScheduleToEvents = (schedule) => {
    return schedule.map((item, index) => ({
      id: `schedule-${index}`,
      title: `${item.topic} (${item.hours} hours)`,
      start: item.date, // Use the date directly
      end: item.date,   // Same as start for single-day events
    }));
  };

  // Initialize the calendar
  const calendar = useCalendarApp({
    views: [createViewDay(), createViewWeek(), createViewMonthGrid(), createViewMonthAgenda()],
    defaultView: 'week',
    events: userRole === 'student'
      ? [
          ...transformStudentDataToEvents(assignments, 'Assignment'),
          ...transformStudentDataToEvents(quizzes, 'Quiz'),
          ...transformStudentDataToEvents(vivas, 'Viva'),
        ]
      : transformTeacherScheduleToEvents(schedule), // Use teacher's schedule
    plugins: [
      eventsService,
      dragAndDropPlugin,
      eventModalPlugin,
      scrollControllerPlugin,
      resizePlugin,
      eventRecurrencePlugin,
      calendarControlsPlugin,
      currentTimePlugin,
    ],
    callbacks: {
      onEventUpdate(event) {
        console.log('onEventUpdate', event);
      },
      onEventClick(event, e) {
        console.log('onEventClick', event, e);
      },
      onDoubleClickEvent(event, e) {
        console.log('onDoubleClickEvent', event, e);
      },
      onClickDate(date) {
        console.log('onClickDate', date);
      },
      onClickDateTime(dateTime) {
        console.log('onClickDateTime', dateTime);
      },
      onClickAgendaDate(date) {
        console.log('onClickAgendaDate', date);
      },
      onDoubleClickAgendaDate(date) {
        console.log('onDoubleClickAgendaDate', date);
      },
      onClickPlusEvents(date) {
        console.log('onClickPlusEvents', date);
      },
      onSelectedDateUpdate(date) {
        console.log('onSelectedDateUpdate', date);
      },
      onDoubleClickDateTime(dateTime) {
        console.log('onDoubleClickDateTime', dateTime);
      },
      onDoubleClickDate(date) {
        console.log('onDoubleClickDate', date);
      },
      onViewChange(view) {
        setCurrentView(view); // Update the current view
      },
    },
    calendars: {
      personal: {
        colorName: 'personal',
        lightColors: {
          main: '#f9d71c',
          container: '#fff5aa',
          onContainer: '#594800',
        },
        darkColors: {
          main: '#fff5c0',
          onContainer: '#fff5de',
          container: '#a29742',
        },
      },
      work: {
        colorName: 'work',
        lightColors: {
          main: '#f91c45',
          container: '#ffd2dc',
          onContainer: '#59000d',
        },
        darkColors: {
          main: '#ffc0cc',
          onContainer: '#ffdee6',
          container: '#a24258',
        },
      },
      leisure: {
        colorName: 'leisure',
        lightColors: {
          main: '#1cf9b0',
          container: '#dafff0',
          onContainer: '#004d3d',
        },
        darkColors: {
          main: '#c0fff5',
          onContainer: '#e6fff5',
          container: '#42a297',
        },
      },
      school: {
        colorName: 'school',
        lightColors: {
          main: '#1c7df9',
          container: '#d2e7ff',
          onContainer: '#002859',
        },
        darkColors: {
          main: '#c0dfff',
          onContainer: '#dee6ff',
          container: '#426aa2',
        },
      },
    },
    backgroundEvents: [
      {
        title: 'Out of office',
        start: '2025-02-11',
        end: '2025-02-11',
        style: {
          backgroundImage: 'repeating-linear-gradient(45deg, #ccc, #ccc 5px, transparent 5px, transparent 10px)',
          opacity: 0.5,
        },
        rrule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;',
      },
    ],
    dayBoundaries: {
      start: '10:00',
      end: '23:00',
    },
  });

  // Update calendar events when data changes
  useEffect(() => {
    eventsService.set(
      userRole === 'student'
        ? [
            ...transformStudentDataToEvents(assignments, 'Assignment'),
            ...transformStudentDataToEvents(quizzes, 'Quiz'),
            ...transformStudentDataToEvents(vivas, 'Viva'),
          ]
        : transformTeacherScheduleToEvents(schedule) // Use teacher's schedule
    );
  }, [assignments, quizzes, vivas, schedule, userRole]);

  // Apply dynamic styles based on the current view
  useEffect(() => {
    const calendarContainer = calendarContainerRef.current;
    if (calendarContainer) {
      if (currentView === 'month-grid') {
        calendarContainer.classList.add('month-view-large');
      } else {
        calendarContainer.classList.remove('month-view-large');
      }
    }
  }, [currentView]);

  return (
    <div ref={calendarContainerRef} className="calendar-container">
      <ScheduleXCalendar calendarApp={calendar} />
      

    </div>
  );
}

export default CalendarApp;