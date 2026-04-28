import { useState } from 'react';
import { BarChart3, ListChecks } from 'lucide-react';
import Dashboard from './components/Dashboard';
import RequestList from './components/RequestList';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [requestFilter, setRequestFilter] = useState('ALL');

  return (
    <div className="flex h-screen w-full bg-[#0E1117] overflow-hidden text-white">
      {/* Sidebar */}
      <div className="w-64 bg-[#1A1C23] border-r border-[#2D2F39] p-4 flex flex-col justify-between">
        <div>
          <h1 className="text-xl font-bold p-4 mb-4">🖥️ IT 관리 시스템</h1>
          <nav className="space-y-2">
            <button
              onClick={() => { setCurrentView('dashboard'); setRequestFilter('ALL'); }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg ${currentView === 'dashboard' ? 'bg-[#2D2F39]' : 'hover:bg-[#2D2F39]'}`}
            >
              <BarChart3 size={20} /> 📊 대시보드
            </button>
            <button
              onClick={() => { setCurrentView('requests'); setRequestFilter('ALL'); }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg ${currentView === 'requests' ? 'bg-[#2D2F39]' : 'hover:bg-[#2D2F39]'}`}
            >
              <ListChecks size={20} /> 📋 요청 목록
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-[#2D2F39]">
          <div className="text-sm font-bold">👤 안다민 | 정보시스템팀</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {currentView === 'dashboard' ? (
          <Dashboard onNavigate={setCurrentView} setRequestFilter={setRequestFilter} />
        ) : (
          <RequestList filterStatus={requestFilter} />
        )}
      </div>
    </div>
  );
}

export default App;
