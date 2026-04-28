import React, { useState, useEffect } from 'react';
import { X, Search, Sparkles, Bot, History, ChevronRight } from 'lucide-react';
import axios from 'axios';

const RequestModal = ({ request, onClose, getStatusBadge, getPartName }) => {
  const [similarRequests, setSimilarRequests] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 모달이 열릴 때 현재 요청의 제목/내용을 기반으로 유사 건 조회
  useEffect(() => {
    if (request) {
      fetchSimilarRequests();
      setAiAnalysis(''); // 모달 바뀔 때 분석 내용 초기화
    }
  }, [request]);

  const fetchSimilarRequests = async () => {
    setIsSearching(true);
    try {
      // 백엔드의 유사 요청 조회 API 호출 (예시 주소)
      const res = await axios.get(`http://localhost:8000/api/similar?reason=${encodeURIComponent(request.REASON)}`);
      setSimilarRequests(res.data || []);
    } catch (e) {
      console.error("유사 내역 로드 실패", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAiAnalyze = async () => {
    if (similarRequests.length === 0) return;

    setIsAiLoading(true);
    try {
      // 유사 건들의 데이터를 AI에게 전달하여 분석 요청
      const res = await axios.post('http://localhost:8000/api/ai-analyze', {
        requests: similarRequests
      });
      setAiAnalysis(res.data.analysis);
    } catch (e) {
      console.error("AI 분석 실패", e);
      setAiAnalysis("AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!request) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      {/* 2단 구성을 위해 max-w-6xl로 확장 */}
      <div className="bg-[#1A1C23] w-full max-w-6xl rounded-2xl border border-[#2D2F39] shadow-2xl flex flex-col max-h-[90vh]">

        {/* 모달 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-[#2D2F39] shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            상세 요청 정보
            {getStatusBadge(request.WORK_YN)}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* 메인 컨텐츠 영역 (좌/우 분할) */}
        <div className="flex flex-1 overflow-hidden">

          {/* [좌측] 기존 요청 상세 내역 (기존 기능 그대로 유지) */}
          <div className="w-1/2 p-6 overflow-y-auto border-r border-[#2D2F39] space-y-6 custom-scrollbar">
            <div className="grid grid-cols-2 gap-6 bg-[#0E1117] p-4 rounded-xl border border-[#2D2F39]">
              <div>
                <div className="text-xs text-gray-500 mb-1">요청 번호</div>
                <div className="text-sm text-white font-medium">{request.NO}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">요청 일자</div>
                <div className="text-sm text-white font-medium">{request.REQUEST_DE}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">요청자</div>
                <div className="text-sm text-white font-medium">{request.REQUESTER2}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">카테고리</div>
                <div className="text-sm text-white font-medium">{request.WGUBUN_CDNM}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-gray-500 mb-1">파트</div>
                <div className="text-sm text-white font-medium">{getPartName(request.PART)}</div>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">요청 내용</div>
              <div className="bg-[#0E1117] p-4 rounded-xl border border-[#2D2F39] text-white text-sm whitespace-pre-wrap leading-relaxed min-h-[80px]">
                {request.REASON || '요청 내용이 없습니다.'}
              </div>
            </div>

            {/* 기존 하단 필드들 */}
            <div className="space-y-4">
              {request.RESPONSE && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <div className="text-xs text-blue-400 mb-2 font-bold">검토 내용</div>
                  <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-500/20 text-blue-100 text-sm">{request.RESPONSE}</div>
                </div>
              )}
              {request.CATCH_UP && (
                <div>
                  <div className="text-xs text-emerald-400 mb-2 font-bold">처리 내역 (Catch up)</div>
                  <div className="bg-emerald-900/10 p-4 rounded-xl border border-emerald-500/20 text-emerald-100 text-sm">{request.CATCH_UP}</div>
                </div>
              )}
              {request.LESSRESPONSE && (
                <div>
                  <div className="text-xs text-red-400 mb-2 font-bold">미진 사유</div>
                  <div className="bg-red-900/10 p-4 rounded-xl border border-red-500/20 text-red-100 text-sm">{request.LESSRESPONSE}</div>
                </div>
              )}
              {request.RMK && (
                <div>
                  <div className="text-xs text-yellow-400 mb-2 font-bold">비고</div>
                  <div className="bg-yellow-900/10 p-4 rounded-xl border border-yellow-500/20 text-yellow-100 text-sm">{request.RMK}</div>
                </div>
              )}
            </div>
          </div>

          {/* [우측] 유사 요청 목록 및 AI 분석 조치 내용 */}
          <div className="w-1/2 p-6 overflow-y-auto flex flex-col space-y-6 bg-[#16181D]">

            {/* 유사 요청 리스트 */}
            <div>
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Search size={16} className="text-blue-400" /> 과거 유사 요청 내역
              </h3>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {isSearching ? (
                  <div className="text-center py-10 text-gray-500 text-sm animate-pulse">유사 요청을 찾는 중...</div>
                ) : similarRequests.length > 0 ? (
                  similarRequests.map((sim, idx) => (
                    <div key={idx} className="bg-[#1A1C23] p-3 rounded-xl border border-[#2D2F39] hover:border-blue-500/50 transition-all group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-gray-500 font-mono">{sim.NO}</span>
                        {getStatusBadge(sim.WORK_YN)}
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-2 mb-2 group-hover:text-white">{sim.REASON}</p>
                      {sim.CATCH_UP && (
                        <div className="flex items-start gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/5 p-2 rounded-lg">
                          <History size={12} className="mt-0.5" />
                          <span className="line-clamp-1">{sim.CATCH_UP}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-600 text-sm">유사한 과거 요청이 없습니다.</div>
                )}
              </div>
            </div>

            {/* AI 분석 섹션 */}
            <div className="mt-auto border-t border-[#2D2F39] pt-6">
              <button
                onClick={handleAiAnalyze}
                disabled={isAiLoading || similarRequests.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-700 disabled:to-gray-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
              >
                {isAiLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    AI 분석 중...
                  </div>
                ) : (
                  <>
                    <Sparkles size={18} />
                    AI 조치 방안 분석하기
                  </>
                )}
              </button>

              {/* 분석 결과 출력 창 */}
              {aiAnalysis && (
                <div className="mt-4 bg-[#0E1117] border border-indigo-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-2 text-indigo-400 mb-3 text-sm font-bold">
                    <Bot size={18} />
                    AI 추천 조치 가이드
                  </div>
                  <div className="text-sm text-indigo-100/90 leading-relaxed whitespace-pre-wrap">
                    {aiAnalysis}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="p-4 border-t border-[#2D2F39] flex justify-end bg-[#1A1C23] shrink-0">
          <button
            onClick={onClose}
            className="bg-[#2D2F39] hover:bg-[#3d414d] text-white px-8 py-2 rounded-lg font-medium transition active:scale-95"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestModal;