import React from 'react';
import { X } from 'lucide-react';

const RequestModal = ({ request, onClose, getStatusBadge, getPartName }) => {
  if (!request) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-[#1A1C23] w-full max-w-2xl rounded-2xl border border-[#2D2F39] shadow-2xl flex flex-col max-h-[90vh]">

        {/* 모달 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-[#2D2F39]">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            상세 요청
            {getStatusBadge(request.WORK_YN)}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* 모달 내용 (스크롤 영역) */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* 상단 기본 정보 그리드 */}
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
            <div>
              <div className="text-xs text-gray-500 mb-1">파트</div>
              <div className="text-sm text-white font-medium">{getPartName(request.PART)}</div>
            </div>
          </div>

          {/* 1. 요청 내용 (기본 색상) */}
          <div>
            <div className="text-xs text-gray-500 mb-2 font-bold">요청 내용</div>
            <div className="bg-[#0E1117] p-4 rounded-xl border border-[#2D2F39] text-white text-sm whitespace-pre-wrap leading-relaxed min-h-[80px]">
              {request.REASON || '요청 내용이 없습니다.'}
            </div>
          </div>

          {/* 2. 검토 내용 (파란색 테마) - 데이터가 있을 때만 렌더링 */}
          {request.RESPONSE && (
            <div>
              <div className="text-xs text-blue-400 mb-2 font-bold">검토 내용</div>
              <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 text-blue-100 text-sm whitespace-pre-wrap leading-relaxed">
                {request.RESPONSE}
              </div>
            </div>
          )}

          {/* 3. 처리 내역 (초록색 테마) */}
          {request.CATCH_UP && (
            <div>
              <div className="text-xs text-emerald-400 mb-2 font-bold">처리 내역 (Catch up)</div>
              <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/30 text-emerald-100 text-sm whitespace-pre-wrap leading-relaxed">
                {request.CATCH_UP}
              </div>
            </div>
          )}

          {/* 4. 미진 사유 (빨간색 테마) */}
          {request.LESSRESPONSE && (
            <div>
              <div className="text-xs text-red-400 mb-2 font-bold">미진 사유</div>
              <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/30 text-red-100 text-sm whitespace-pre-wrap leading-relaxed">
                {request.LESSRESPONSE}
              </div>
            </div>
          )}

          {/* 5. 비고 (노란색 테마) */}
          {request.RMK && (
            <div>
              <div className="text-xs text-yellow-400 mb-2 font-bold">비고</div>
              <div className="bg-yellow-900/20 p-4 rounded-xl border border-yellow-500/30 text-yellow-100 text-sm whitespace-pre-wrap leading-relaxed">
                {request.RMK}
              </div>
            </div>
          )}

        </div>

        {/* 모달 푸터 */}
        <div className="p-6 border-t border-[#2D2F39] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#2D2F39] hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestModal;