import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Chart from 'react-apexcharts';
import { ClipboardList, Briefcase, TrendingUp, Upload, FileSpreadsheet } from 'lucide-react';

const PART_MAP = {
  '01': '생산기획', '02': '영업물류', '03': '인사', '04': '회계', '05': '팀장', '06': '기타', '07': '개발'
};

const WORK_STAT_MAP = {
  '1': '완료', '2': '진행중', '3': '미착수', '4': '종결',
};

const Dashboard = ({ onNavigate, setRequestFilter }) => {
  const [filters, setFilters] = useState({ startDate: '2026-04-01', endDate: '2026-04-24', part: '' });
  const [stats, setStats] = useState({ total: 0, completed: 0, in_progress: 0, pending: 0 });
  const [charts, setCharts] = useState({ category_stats: [], dept_stats: [], monthly_trend: [] });
  const [loading, setLoading] = useState(false);

  // 1. 파일 업로드를 위한 Ref 생성
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      const queryParams = {
        start_date: filters.startDate.replace(/-/g, ''),
        end_date: filters.endDate.replace(/-/g, ''),
        part: filters.part
      };

      const resStats = await axios.get('http://localhost:8000/api/stats', { params: queryParams });
      setStats({
        total: resStats.data.total || 0,
        completed: resStats.data.completed || 0,
        in_progress: resStats.data.in_progress || 0,
        pending: resStats.data.pending || 0
      });

      const resCharts = await axios.get('http://localhost:8000/api/dashboard-charts', { params: queryParams });
      setCharts({
        category_stats: resCharts.data.category_stats || [],
        dept_stats: resCharts.data.dept_stats || [],
        monthly_trend: resCharts.data.monthly_trend || []
      });
    } catch (e) {
      console.error("데이터 로드 실패:", e);
    }
  };

  // 2. 엑셀 업로드 버튼 클릭 핸들러
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // 3. 파일 선택 시 실행될 로직
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('http://localhost:8000/api/upload-excel', formData);
      alert('데이터가 성공적으로 업로드되었습니다.');
      fetchData(); // 데이터 새로고침
    } catch (err) {
      console.error("업로드 실패:", err);
      alert('업로드 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrillDown = (status) => {
    setRequestFilter(status);
    onNavigate('requests');
  };

  const metricCards = [
      { title: '📋 총 요청', value: stats.total, color: 'text-blue-400', status: 'ALL' },
      { title: '✅ 완료', value: stats.completed, color: 'text-emerald-400', status: '1' },
      { title: '🔄 진행중', value: stats.in_progress, color: 'text-yellow-400', status: '2' },
      { title: '🔴 미착수', value: stats.pending, color: 'text-red-400', status: '3' }
    ];

  const deptChartOptions = {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    theme: { mode: 'dark' },
    plotOptions: { bar: { borderRadius: 4, horizontal: false, distributed: true, dataLabels: { position: 'top' } } },
    dataLabels: {
      enabled: true,
      formatter: (val) => val + "건",
      offsetY: -20,
      style: { fontSize: '12px', fontWeight: 'bold', colors: ["#FFFFFF"] }
    },
    xaxis: {
     categories: charts.dept_stats.map(d => {
             const partCode = String(d.PART).padStart(2, '0');
             return PART_MAP[partCode] || String(d.PART);
           }),
           labels: { style: { colors: '#A0AEC0' } }
    },
    yaxis: { labels: { style: { colors: '#A0AEC0' } } },
    colors: ['#06B6D4', '#10B981', '#F59E0B', '#F97316', '#8B5CF6', '#EF4444', '#EC4899'],
    legend: { show: false },
    grid: { borderColor: '#2D2F39' }
  };

  const trendChartOptions = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false }, background: 'transparent' },
    theme: { mode: 'dark' },
    xaxis: { categories: charts.monthly_trend.map(m => m.month), labels: { style: { colors: '#A0AEC0' } } },
    yaxis: { labels: { style: { colors: '#A0AEC0' } } },
    colors: ['#32D74B', '#FFD60A', '#FF453A'],
    legend: { position: 'bottom', labels: { colors: '#FFFFFF' } },
    grid: { borderColor: '#2D2F39' },
    plotOptions: { bar: { borderRadius: 2 } }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#1A1C23] p-4 rounded-xl border border-[#2D2F39] shadow-lg">
        <h2 className="text-xl font-bold text-white">📊 통합 현황 대시보드</h2>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0E1117] p-1.5 rounded-lg border border-[#374151]">
            <input
              type="date"
              value={filters.startDate}
              className="bg-transparent text-white border-none text-sm focus:outline-none focus:ring-0 cursor-pointer [color-scheme:dark]"
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            />
            <span className="text-gray-500">~</span>
            <input
              type="date"
              value={filters.endDate}
              className="bg-transparent text-white border-none text-sm focus:outline-none focus:ring-0 cursor-pointer [color-scheme:dark]"
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
            />
          </div>

          <select
            value={filters.part}
            className="bg-[#0E1117] text-white text-sm p-2 rounded-lg border border-[#374151] focus:outline-none focus:border-[#5E5CE6] cursor-pointer"
            onChange={(e) => setFilters({...filters, part: e.target.value})}
          >
             <option value="">전체 파트</option>
             {Object.entries(PART_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          {/* 4. 시스템 정상 버튼 대신 엑셀 업로드 버튼 추가 */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".xlsx, .xls"
          />
          <button
            onClick={handleUploadClick}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-md"
          >
            <FileSpreadsheet size={16} />
            엑셀 업로드
          </button>
        </div>
      </div>

      {/* Row 1: Metrics */}
      <div className="grid grid-cols-4 gap-6">
        {metricCards.map((c, i) => (
          <div key={i} onClick={() => handleDrillDown(c.status)} className="bg-[#1A1C23] p-6 rounded-xl border border-[#2D2F39] shadow-lg cursor-pointer hover:border-[#5E5CE6] hover:-translate-y-1 transition-all duration-200">
            <div className={`text-sm mb-2 font-medium ${c.color}`}>{c.title}</div>
            <div className="text-3xl font-bold text-white">{c.value}<span className="text-sm text-gray-500 ml-2 font-normal">건</span></div>
          </div>
        ))}
      </div>

      {/* Row 2: Visualization */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#1A1C23] p-6 rounded-xl border border-[#2D2F39] shadow-lg">
          <h3 className="flex items-center gap-2 font-bold mb-6 text-white"><ClipboardList size={18} className="text-yellow-500"/> 카테고리별 요청 건수</h3>
          <div className="space-y-4">
            {charts.category_stats.map((c, i) => (
              <div key={i} className="flex items-center">
                <span className="w-40 text-sm text-gray-300">{c.WGUBUN_CDNM}</span>
                <div className="flex-1 h-2.5 bg-[#2D2F39] rounded-full mx-4 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{
                    width: `${(c.count / (stats.total || 1)) * 100}%`,
                    backgroundColor: ['#32D74B', '#FFD60A', '#06B6D4', '#FF453A'][i % 4]
                  }}></div>
                </div>
                <span className="w-8 text-right text-sm font-bold text-white">{c.count}건</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#1A1C23] p-6 rounded-xl border border-[#2D2F39] shadow-lg">
          <h3 className="flex items-center gap-2 font-bold mb-4 text-white"><Briefcase size={18} className="text-blue-400"/> 파트별 요청 건수</h3>
          <Chart options={deptChartOptions} series={[{ name: '요청 건수', data: charts.dept_stats.map(d => d.count) }]} type="bar" height={220} />
        </div>
      </div>

      {/* Row 3: Trend */}
      <div className="bg-[#1A1C23] p-6 rounded-xl border border-[#2D2F39] shadow-lg">
        <h3 className="flex items-center gap-2 font-bold mb-4 text-white"><TrendingUp size={18} className="text-orange-400"/> 월별 처리 현황 (2026년)</h3>
        <Chart options={trendChartOptions} series={[
          { name: '처리완료', data: charts.monthly_trend.map(m => m.done || 0) },
          { name: '진행중', data: charts.monthly_trend.map(m => m.in_progress || 0) },
          { name: '미처리', data: charts.monthly_trend.map(m => m.pending || 0) }
        ]} type="bar" height={250} />
      </div>
    </div>
  );
};

export default Dashboard;