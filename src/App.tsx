import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Residents from './pages/Residents';
import NewResident from './pages/NewResident';
import ResidentDetail from './pages/ResidentDetail';
import MedicalRecords from './pages/MedicalRecords';
import MedicalRecordDetail from './pages/MedicalRecordDetail';
import CarePlans from './pages/CarePlans';
import CarePlanDetail from './pages/CarePlanDetail';
import DailyMonitoring from './pages/DailyMonitoring';
import DailyRecord from './pages/DailyRecord';
import Protocols from './pages/Protocols';
import ProtocolExecution from './pages/ProtocolExecution';
import Egress from './pages/Egress';
import Export from './pages/Export';
import Staff from './pages/Staff';
import Complaints from './pages/Complaints';
import Contracts from './pages/Contracts';
import OperatingPermit from './pages/OperatingPermit';
import SenamaReport from './pages/SenamaReport';
import Medications from './pages/Medications';
import InstitutionalProfile from './pages/InstitutionalProfile';
import Resources from './pages/Resources';
import OrgChart from './pages/OrgChart';
import VisitorLog from './pages/VisitorLog';
import Incidents from './pages/Incidents';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="residents" element={<Residents />} />
            <Route path="residents/new" element={<NewResident />} />
            <Route path="residents/:id" element={<ResidentDetail />} />
            <Route path="medical-records" element={<MedicalRecords />} />
            <Route path="medical-records/:id" element={<MedicalRecordDetail />} />
            <Route path="care-plans" element={<CarePlans />} />
            <Route path="care-plans/:id" element={<CarePlanDetail />} />
            <Route path="daily-monitoring" element={<DailyMonitoring />} />
            <Route path="daily-monitoring/:id" element={<DailyRecord />} />
            <Route path="protocols" element={<Protocols />} />
            <Route path="protocols/:id/execute" element={<ProtocolExecution />} />
            <Route path="egress" element={<Egress />} />
            <Route path="export" element={<Export />} />
            <Route path="staff" element={<Staff />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="permits" element={<OperatingPermit />} />
            <Route path="senama-report" element={<SenamaReport />} />
            <Route path="medications" element={<Medications />} />
            <Route path="institutional-profile" element={<InstitutionalProfile />} />
            <Route path="resources" element={<Resources />} />
            <Route path="org-chart" element={<OrgChart />} />
            <Route path="visitor-log" element={<VisitorLog />} />
            <Route path="incidents" element={<Incidents />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;