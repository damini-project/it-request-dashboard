import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, User, Tag, Search, CheckCircle, AlertCircle, Clock, FileText, Filter, CheckSquare } from 'lucide-react';
import RequestModal from './RequestModal';

const PART_MAP = {
  '01': '생산기획', '02': '회계', '03': '인사', '04': '영업', '05': '구매', '06': '물류', '07': 'IT'
};

const WORK_STAT_MAP = {
  '1': '완료', '2': '진행중', '3': '미착수', '4': '종결',
};

const RequestList = ({ filterStatus }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [localFilters, setLocalFilters] = useState({
    status: filterStatus || 'ALL',
    category: 'ALL',
    part: 'ALL'
  });

  useEffect(() => {
    if (filterStatus) {
      setLocalFilters(prev => ({ ...prev, status: filterStatus }));
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/api/requests');
      setRequests(res.data || []);
    } catch (e) {
      console.error("데이터 로드 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  const normalizeWorkStatus = (val) => {
    if (!val) return '';
    const s = String(val).trim(); // 공백 제거
    if (s === '1' || s === '1.0' || s === '완료') return '1';
    if (s === '2' || s === '2.0' || s === '진행중') return '2';
    if (s === '3' || s === '3.0' || s === '미착수') return '3';
    if (s === '4' || s === '4.0' || s === '종결') return '4';
    return s;
  };

  const getStatusBadge = (status) => {
    // raw status 값을 정규화 함수에 한 번 통과시킵니다.
    const normStatus = normalizeWorkStatus(status);

    switch (normStatus) {
      case '1': // 완료
        return <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-500/30"><CheckCircle size={12}/> 완료</span>;
      case '2': // 진행중
        return <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-full text-xs font-bold border border-yellow-500/30"><Clock size={12}/> 진행중</span>;
      case '3': // 미착수
        return <span className="flex items-center gap-1 bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full text-xs font-bold border border-red-500/30"><AlertCircle size={12}/> 미착수</span>;
      case '4': // 종결
        return <span className="flex items-center gap-1 bg-gray-500/20 text-gray-400 px-2.5 py-1 rounded-full text-xs font-bold border border-gray-500/30"><CheckSquare size={12}/> 종결</span>;
      default:
        return <span className="flex items-center gap-1 bg-[#2D2F39] text-gray-400 px-2.5 py-1 rounded-full text-xs font-bold border border-gray-600">상태없음 ({status})</span>; // 원인 파악을 위해 이상한 값이면 괄호 안에 출력해 줍니다.
    }
  };

  const getPartName = (partCode) => {
    if (!partCode) return '미지정';
    const code = String(partCode).padStart(2, '0');
    return PART_MAP[code] || partCode;
  };

  const filteredRequests = requests.filter(req => {
    // 🔥 필터링할 때도 정규화된 값을 기준으로 비교합니다.
    const normStatus = normalizeWorkStatus(req.WORK_YN);
    const matchStatus = localFilters.status === 'ALL' || normStatus === localFilters.status;
    const matchCategory = localFilters.category === 'ALL' || req.WGUBUN_CDNM === localFilters.category;
    const matchPart = localFilters.part === 'ALL' || String(req.PART).padStart(2, '0') === localFilters.part;
    const matchSearch =
      req.REASON?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.WGUBUN_NM?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.REQUESTER2?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.NO?.toString().includes(searchTerm);

    return matchStatus && matchCategory && matchPart && matchSearch;
  });

  const categories = ['ALL', ...new Set(requests.map(req => req.WGUBUN_CDNM).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="bg-[#1A1C23] p-5 rounded-xl border border-[#2D2F39] shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="text-blue-400" /> IT 지원 요청 목록
            <span className="ml-2 text-sm font-normal text-gray-500">{filteredRequests.length}건 검색됨</span>
          </h2>

          <div className="relative w-80">
            <input
              type="text"
              placeholder="ID, 제목, 내용, 요청자 검색..."
              className="w-full bg-[#0E1117] text-white text-sm pl-10 pr-4 py-2.5 rounded-lg border border-[#374151] focus:outline-none focus:border-[#5E5CE6] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-[#2D2F39]">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Filter size={14} /> 필터 상세:
          </div>

          <select
            value={localFilters.status}
            onChange={(e) => setLocalFilters({...localFilters, status: e.target.value})}
            className="bg-[#0E1117] text-white text-xs p-2 rounded-lg border border-[#374151] cursor-pointer"
          >
            <option value="ALL">전체 상태</option>
            {Object.entries(WORK_STAT_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          <select
            value={localFilters.category}
            onChange={(e) => setLocalFilters({...localFilters, category: e.target.value})}
            className="bg-[#0E1117] text-white text-xs p-2 rounded-lg border border-[#374151] cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'ALL' ? '전체 카테고리' : cat}</option>
            ))}
          </select>

          <select
            value={localFilters.part}
            onChange={(e) => setLocalFilters({...localFilters, part: e.target.value})}
            className="bg-[#0E1117] text-white text-xs p-2 rounded-lg border border-[#374151] cursor-pointer"
          >
            <option value="ALL">전체 파트</option>
            {Object.entries(PART_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          <button
            onClick={() => {setLocalFilters({status:'ALL', category:'ALL', part:'ALL'}); setSearchTerm('');}}
            className="ml-auto text-xs text-gray-500 hover:text-white underline"
          >
            필터 초기화
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">데이터를 불러오는 중입니다...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRequests.length > 0 ? filteredRequests.map((req, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedRequest(req)}
              className="bg-[#1A1C23] rounded-xl border border-[#2D2F39] p-5 shadow-lg cursor-pointer hover:border-[#5E5CE6] hover:-translate-y-1 transition-all duration-200 flex flex-col group"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold text-gray-500 bg-[#0E1117] px-2 py-1 rounded group-hover:text-blue-400 transition-colors">No. {req.NO}</span>
                {getStatusBadge(req.WORK_YN)}
              </div>

              <h3 className="text-lg font-bold text-white mb-4 line-clamp-2 flex-1 group-hover:text-blue-50">
                {req.REASON || '제목 없음'}
              </h3>

              <div className="space-y-2 text-sm text-gray-400 border-t border-[#2D2F39] pt-4 mt-auto">
                <div className="flex items-center gap-2"><Tag size={14} className="text-blue-400"/> {req.WGUBUN_CDNM || '카테고리 미지정'}</div>
                <div className="flex items-center gap-2"><Tag size={14} className="text-blue-400"/> {getPartName(req.PART)}</div>
                <div className="flex items-center gap-2"><User size={14} className="text-orange-400"/> {req.REQUESTER2}</div>
                <div className="flex items-center gap-2"><Calendar size={14} className="text-emerald-400"/> {req.REQUEST_DE?.substring(0, 10)}</div>
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center py-20 text-gray-400 bg-[#1A1C23] rounded-xl border border-[#2D2F39]">
              조건에 맞는 요청 건이 없습니다.
            </div>
          )}
        </div>
      )}

      {selectedRequest && (
        <RequestModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          getStatusBadge={getStatusBadge}
          getPartName={getPartName}
        />
      )}
    </div>
  );
};

export default RequestList;