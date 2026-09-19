import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import ServersDashboardPage from '@/pages/ServersDashboardPage';
import ServerOverviewPage from '@/pages/ServerOverviewPage';
import RequestsPage from '@/pages/RequestsPage';
import EventsPage from '@/pages/EventsPage';
import PollsPage from '@/pages/PollsPage';
import GalleryPage from '@/pages/GalleryPage';
import MapsPage from '@/pages/MapsPage';
import AdminPage from '@/pages/AdminPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'servers', element: <ServersDashboardPage /> },
      { path: 'requests', element: <RequestsPage /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'polls', element: <PollsPage /> },
      { path: 'gallery', element: <GalleryPage /> },
      { path: 'maps', element: <MapsPage /> },
      { path: 'servers/:name', element: <ServerOverviewPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default router;
