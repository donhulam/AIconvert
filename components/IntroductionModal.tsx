import React from 'react';
import { XCircleIcon, LogoIcon } from './icons';

interface IntroductionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntroductionModal: React.FC<IntroductionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="max-h-[90vh] overflow-y-auto">
          <div className="p-6 sm:p-8 relative">
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
              aria-label="Close modal"
            >
              <XCircleIcon className="h-7 w-7" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <LogoIcon className="h-10 w-10 text-primary-500" />
              <h2 id="modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">
                Giới thiệu và Hướng dẫn sử dụng
              </h2>
            </div>

            <div className="text-gray-600 dark:text-gray-300 space-y-6 prose dark:prose-invert max-w-none">
              <section>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 !mb-2 !mt-0">Giới thiệu</h3>
                <p>
                  <strong>AI nhận dạng văn bản từ ảnh</strong> là một công cụ mạnh mẽ được thiết kế để nhận dạng và chuyển đổi tài liệu tĩnh (PDF, hình ảnh), bao gồm cả chữ viết tay, thành nội dung có cấu trúc, có thể chỉnh sửa và tương tác. 
                  Sử dụng API Gemini 2.5 Flash tiên tiến của Google, ứng dụng này trích xuất văn bản một cách chính xác, bảo toàn ngôn ngữ gốc và các định dạng phức tạp như bảng, chữ in đậm và in nghiêng. Sau khi trích xuất, bạn có thể trò chuyện với AI bằng tiếng Việt để nhanh chóng tìm hiểu và tóm tắt thông tin chi tiết từ tài liệu.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 !mb-3 !mt-6">Hướng dẫn sử dụng chi tiết</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-200">Bước 1: Tải tệp lên</h4>
                    <p className="!mt-1">
                      Kéo và thả tệp của bạn vào khu vực được chỉ định hoặc nhấp để mở trình duyệt tệp. Bạn có thể tải lên nhiều tệp cùng một lúc.
                    </p>
                    <ul className="list-disc list-inside !mt-2 text-sm">
                      <li><strong>Các định dạng được hỗ trợ:</strong> PDF, PNG, JPG, WEBP.</li>
                      <li><strong>Giới hạn:</strong> Kích thước tệp tối đa 10MB mỗi tệp.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-200">Bước 2: Xem lại và Xử lý</h4>
                    <p className="!mt-1">
                      Các tệp đã tải lên sẽ xuất hiện trong danh sách. Tại đây bạn có thể xem lại tên tệp, kích thước và xóa các tệp không cần thiết.
                    </p>
                    <p className="!mt-1">
                      Khi bạn đã sẵn sàng, hãy nhấp vào nút <strong>"Trích xuất văn bản"</strong>. Trí tuệ nhân tạo sẽ bắt đầu phân tích từng tệp. Trạng thái của mỗi tệp sẽ được cập nhật trong thời gian thực (Đang chờ → Đang xử lý → Thành công/Lỗi).
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-200">Bước 3: Tương tác với kết quả</h4>
                    <p className="!mt-1">
                      Sau khi xử lý thành công, một thẻ kết quả sẽ xuất hiện cho mỗi tệp.
                    </p>
                    <ul className="list-disc list-inside !mt-2 space-y-2">
                      <li><strong>Xem văn bản:</strong> Nội dung văn bản được trích xuất sẽ được hiển thị trong một hộp văn bản.</li>
                      <li><strong>Tải xuống (.DOCX):</strong> Nhấp vào nút "Tải xuống .DOCX" để lưu nội dung có định dạng (đậm, nghiêng, bảng) vào máy tính của bạn.</li>
                      <li><strong>Trò chuyện với tài liệu:</strong> Nhấp vào "Trò chuyện với tài liệu" để mở cửa sổ trò chuyện. Bạn có thể:
                        <ul className="list-[circle] list-inside pl-5 !mt-1">
                            <li>Đặt câu hỏi về nội dung tài liệu (ví dụ: "Tóm tắt các điểm chính").</li>
                            <li>Sử dụng các gợi ý có sẵn để bắt đầu cuộc trò chuyện.</li>
                            <li>Tải xuống câu trả lời của chatbot dưới dạng tệp .DOCX.</li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
              
              <section>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 !mb-2 !mt-6">Công nghệ</h3>
                <p>
                  Ứng dụng được xây dựng bằng React, TypeScript và Tailwind CSS cho giao diện người dùng hiện đại và đáp ứng. Sức mạnh cốt lõi đến từ mô hình <strong>Gemini 2.5 Flash</strong> của Google, đảm bảo khả năng trích xuất dữ liệu và trò chuyện thông minh hàng đầu.
                </p>
              </section>
            </div>

            <div className="mt-8 text-center">
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};