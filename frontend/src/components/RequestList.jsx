import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, User, Tag, Search, CheckCircle, AlertCircle, Clock, FileText, Filter, CheckSquare, Link as LinkIcon } from 'lucide-react';
import RequestModal from './RequestModal';

const PART_MAP = {
  '01': '생산기획', '02': '영업물류', '03': '인사', '04': '회계', '05': '팀장', '06': '기타', '07': '개발'
};

const WORK_STAT_MAP = {
  '1': '완료', '2': '진행중', '3': '미착수', '4': '종결',
};

const RequestList = ({ filterStatus }) => {
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);
  const formatDate = (d) => d.toISOString().split('T')[0];

  const [dateFilters, setDateFilters] = useState({
    startDate: formatDate(lastMonth),
    endDate: formatDate(today)
  });

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  // 🌟 1. 상태 관리에 developer 항목 추가
  const [localFilters, setLocalFilters] = useState({
    status: filterStatus || 'ALL',
    category: 'ALL',
    part: 'ALL',
    developer: 'ALL'
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
    const s = String(val).trim();
    if (s === '1' || s === '1.0' || s === '완료') return '1';
    if (s === '2' || s === '2.0' || s === '진행중') return '2';
    if (s === '3' || s === '3.0' || s === '미착수') return '3';
    if (s === '4' || s === '4.0' || s === '종결') return '4';
    return s;
  };

  const getStatusBadge = (status) => {
    const normStatus = normalizeWorkStatus(status);

    switch (normStatus) {
      case '1': return <span className="flex items-center gap-1 bg-transparent text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/50">처리완료</span>;
      case '2': return <span className="flex items-center gap-1 bg-transparent text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/50">진행중</span>;
      case '3': return <span className="flex items-center gap-1 bg-transparent text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/50">미착수</span>;
      case '4': return <span className="flex items-center gap-1 bg-transparent text-gray-400 px-3 py-1 rounded-full text-xs font-bold border border-gray-500/50">종결</span>;
      default: return <span className="flex items-center gap-1 bg-transparent text-gray-400 px-3 py-1 rounded-full text-xs font-bold border border-gray-600">상태없음</span>;
    }
  };

  const getPartName = (partCode) => {
    if (!partCode) return '미지정';
    const code = String(partCode).padStart(2, '0');
    return PART_MAP[code] || partCode;
  };

  const normalizeDateStr = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.replace(/-/g, '').substring(0, 8);
  };

  const filteredRequests = requests.filter(req => {
    const normStatus = normalizeWorkStatus(req.WORK_YN);
    const matchStatus = localFilters.status === 'ALL' || normStatus === localFilters.status;
    const matchCategory = localFilters.category === 'ALL' || req.WGUBUN_CDNM === localFilters.category;
    const matchPart = localFilters.part === 'ALL' || String(req.PART).padStart(2, '0') === localFilters.part;

    // 🌟 2. 개발자(DEVELOPER2) 필터링 조건 추가
    const matchDeveloper = localFilters.developer === 'ALL' || req.DEVELOPER2 === localFilters.developer;

    const matchSearch =
      req.REASON?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.WGUBUN_NM?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.REQUESTER2?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.NO?.toString().includes(searchTerm);

    const reqDateNorm = normalizeDateStr(req.REQUEST_DE);
    const startNorm = normalizeDateStr(dateFilters.startDate);
    const endNorm = normalizeDateStr(dateFilters.endDate);

    const matchDate = reqDateNorm ? (reqDateNorm >= startNorm && reqDateNorm <= endNorm) : true;

    // 리턴 조건에 matchDeveloper 추가
    return matchStatus && matchCategory && matchPart && matchDeveloper && matchSearch && matchDate;
  });

  // 카테고리 및 개발자 목록 자동 추출 (중복 제거)
  const categories = ['ALL', ...new Set(requests.map(req => req.WGUBUN_CDNM).filter(Boolean))];
  const developers = ['ALL', ...new Set(requests.map(req => req.DEVELOPER2).filter(Boolean))]; // 🌟 3. 개발자 목록 추출

  return (
    <div className="space-y-6">
      {/* 1. 상단 검색 및 필터 영역 */}
      <div className="bg-[#1A1C23] p-5 rounded-xl border border-[#2D2F39] shadow-lg space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="text-blue-400" /> IT 지원 요청 목록
            <span className="ml-2 text-sm font-normal text-gray-500">{filteredRequests.length}건 검색됨</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[#2D2F39]">
          <div className="flex items-center gap-2 text-gray-400 text-sm whitespace-nowrap">
            <Filter size={14} /> 필터 상세:
          </div>

          <div className="flex items-center gap-2 bg-[#0E1117] p-1.5 px-3 rounded-lg border border-[#374151]">
            <input
              type="date"
              value={dateFilters.startDate}
              className="bg-transparent text-white border-none text-xs focus:outline-none focus:ring-0 cursor-pointer [color-scheme:dark]"
              onChange={(e) => setDateFilters({...dateFilters, startDate: e.target.value})}
            />
            <span className="text-gray-500 text-xs">~</span>
            <input
              type="date"
              value={dateFilters.endDate}
              className="bg-transparent text-white border-none text-xs focus:outline-none focus:ring-0 cursor-pointer [color-scheme:dark]"
              onChange={(e) => setDateFilters({...dateFilters, endDate: e.target.value})}
            />
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

          {/* 🌟 4. 개발자 필터 콤보박스 UI 추가 */}
          <select
            value={localFilters.developer}
            onChange={(e) => setLocalFilters({...localFilters, developer: e.target.value})}
            className="bg-[#0E1117] text-white text-xs p-2 rounded-lg border border-[#374151] cursor-pointer"
          >
            {developers.map(dev => (
              <option key={dev} value={dev}>{dev === 'ALL' ? '전체 담당자' : getPartName(dev)}</option>
            ))}
          </select>

          <div className="relative w-[240px]">
            <input
              type="text"
              placeholder="ID, 제목, 내용, 요청자 검색..."
              className="w-full bg-[#0E1117] text-white text-sm pl-10 pr-4 py-2 rounded-lg border border-[#374151] focus:outline-none focus:border-[#5E5CE6] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          </div>

          <button
            onClick={() => {
              // 🌟 5. 초기화 버튼 클릭 시 developer도 ALL로 초기화
              setLocalFilters({status:'ALL', category:'ALL', part:'ALL', developer:'ALL'});
              setDateFilters({startDate: formatDate(lastMonth), endDate: formatDate(today)});
              setSearchTerm('');
            }}
            className="ml-auto text-xs text-gray-500 hover:text-white underline whitespace-nowrap"
          >
            필터 초기화
          </button>
        </div>
      </div>

      {/* 2. 요청 목록 카드 영역 */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">데이터를 불러오는 중입니다...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.length > 0 ? filteredRequests.map((req, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedRequest(req)}
              className="bg-[#1A1C23] rounded-xl border border-[#2D2F39] p-6 shadow-lg cursor-pointer hover:border-[#5E5CE6] transition-all duration-200 flex flex-col gap-4 group"
            >
              {/* 상단: 요청번호 & 상태배지 */}
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-500">{req.NO}</span>
                {getStatusBadge(req.WORK_YN)}
              </div>

              {/* 중단: 제목 & 내용 */}
              <div>
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-blue-50">
                  {req.WGUBUN_NM || '제목 없음'}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                  {req.REASON || '요청 내용이 없습니다.'}
                </p>
              </div>

              {/* 하단: 2단 배치 영역 (카테고리/파트/요청일자 vs 요청자) */}
              <div className="flex justify-between items-end mt-auto pt-4 border-t border-[#2D2F39]">

                {/* 좌측: 카테고리 | 지정파트 & 요청일자 */}
                <div className="space-y-1">
                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    <span className="text-blue-400 font-medium">{req.WGUBUN_CDNM || '미지정'}</span>
                    <span className="text-gray-600">|</span>
                    <span>{getPartName(req.PART)}</span>
                    <span className="text-gray-600">|</span>
                    <span>{getPartName(req.DEVELOPER2)}</span>
                  </div>
                  <div className="text-sm text-gray-500 font-medium tracking-wide">
                    {req.REQUEST_DE}
                  </div>
                </div>

                {/* 우측: 요청자 */}
                <div className="space-y-1 text-right">
                  <div className="text-sm text-gray-400 flex items-center justify-end gap-1.5">
                    <User size={14} className="text-gray-500"/> {req.REQUESTER2 || '알수없음'}
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full text-center py-20 text-gray-400 bg-[#1A1C23] rounded-xl border border-[#2D2F39]">
              조건에 맞는 요청 건이 없습니다.
            </div>
          )}
        </div>
      )}

      {/* 모달 */}
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