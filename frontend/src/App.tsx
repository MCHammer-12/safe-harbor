import { Switch, Route } from 'wouter';
import NotFound from '@/pages/not-found';
import HomePage from '@/pages/HomePage';
import ImpactDashboardPage from '@/pages/ImpactDashboard';
import AdminDashboardPage from '@/pages/AdminDashboard';
import CaseloadInventoryPage from '@/pages/CaseloadInventory';
import DonorDashboardPage from '@/pages/DonorDashboard';
import DonorsContributionsPage from '@/pages/DonorsContributions';
import ProcessRecordingPage from '@/pages/ProcessRecording';
import MlIntegrationPage from '@/pages/MlIntegrationPage';
import SocialMediaDashboardPage from '@/pages/SocialMediaDashboard';

export default function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/impact" component={ImpactDashboardPage} />
      <Route path="/donor" component={DonorDashboardPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/admin/ml-integration" component={MlIntegrationPage} />
      <Route path="/caseload" component={CaseloadInventoryPage} />
      <Route path="/donors" component={DonorsContributionsPage} />
      <Route path="/social" component={SocialMediaDashboardPage} />
      <Route path="/process-recordings" component={ProcessRecordingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}
