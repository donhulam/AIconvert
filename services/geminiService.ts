import { GoogleGenAI, Type, Content } from "@google/genai";
import { ExtractedContent, ChatMessage } from "../types";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Utility to convert a File object to a base64 string
const fileToGenerativePart = (file: File) => {
  return new Promise<{ mimeType: string; data: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error('Failed to read file as data URL.'));
      }
      // The result is a data URL: "data:<mime-type>;base64,<data>"
      // We need to extract the mime-type and the base64 data.
      const [header, data] = reader.result.split(',');
      if (!header || !data) {
        return reject(new Error('Invalid data URL format.'));
      }
      const mimeType = header.split(':')[1].split(';')[0];
      resolve({ mimeType, data });
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
};

const runSchema = {
    type: Type.OBJECT,
    properties: {
        text: { type: Type.STRING, description: "Nội dung văn bản." },
        isBold: { type: Type.BOOLEAN, description: "Văn bản có được in đậm hay không." },
        isItalic: { type: Type.BOOLEAN, description: "Văn bản có được in nghiêng hay không." },
    },
    required: ['text']
};

const paragraphContentSchema = {
    type: Type.OBJECT,
    properties: {
        runs: {
            type: Type.ARRAY,
            description: "Một danh sách các lần chạy văn bản tạo nên đoạn văn.",
            items: runSchema
        }
    },
    required: ['runs']
};

const responseSchema = {
  type: Type.ARRAY,
  description: "Một mảng các khối nội dung, có thể là đoạn văn hoặc bảng.",
  items: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ['paragraph', 'table'], description: "Loại khối nội dung." },
      content: { 
        ...paragraphContentSchema,
        description: "Nội dung của đoạn văn. Chỉ có mặt khi type là 'paragraph'."
      },
      rows: {
        type: Type.ARRAY,
        description: "Các hàng của bảng. Chỉ có mặt khi type là 'table'.",
        items: {
          type: Type.OBJECT,
          properties: {
            cells: {
              type: Type.ARRAY,
              description: "Các ô trong một hàng.",
              items: {
                type: Type.OBJECT,
                properties: {
                  content: paragraphContentSchema
                },
                required: ['content']
              }
            }
          },
          required: ['cells']
        }
      }
    },
    required: ['type']
  }
};


export const extractFormattedContentFromGemini = async (file: File): Promise<ExtractedContent> => {
  try {
    const generativePartData = await fileToGenerativePart(file);

    const imagePart = {
        inlineData: generativePartData
    };

    const textPart = {
      text: "Phân tích tài liệu này, bao gồm cả chữ viết tay, để trích xuất cấu trúc và nội dung văn bản, bao gồm cả các bảng. Giữ nguyên ngôn ngữ gốc. Trả về một đối tượng JSON tuân thủ lược đồ đã cho. JSON phải là một mảng các khối nội dung. Mỗi khối phải có một thuộc tính 'type' là 'paragraph' hoặc 'table'. - Nếu khối là một đoạn văn bản, nó phải có thuộc tính 'content' chứa một mảng các lần chạy văn bản với kiểu dáng (in đậm, in nghiêng). - Nếu khối là một bảng, nó phải có thuộc tính 'rows', là một mảng các hàng. Mỗi hàng là một mảng các ô, và mỗi ô chứa thuộc tính 'content' với văn bản được định dạng của ô đó. Không mô tả hình ảnh. Tập trung vào việc sao chép văn bản, bao gồm cả chữ viết tay, định dạng và cấu trúc bảng một cách chính xác.",
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, imagePart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        maxOutputTokens: 65536,
        thinkingConfig: {
            thinkingBudget: 16384,
        },
      }
    });

    if (response.text) {
      try {
        let jsonString = response.text.trim();
        if (jsonString.startsWith('```json')) {
            jsonString = jsonString.slice(7, -3).trim();
        } else if (jsonString.startsWith('```')) {
            jsonString = jsonString.slice(3, -3).trim();
        }
        
        const content = JSON.parse(jsonString);
        // Basic validation
        if (Array.isArray(content) && content.every(item => item.type === 'paragraph' || item.type === 'table')) {
          return content as ExtractedContent;
        }
        throw new Error("Dữ liệu JSON được phân tích cú pháp không khớp với lược đồ dự kiến.");
      } catch(e) {
        console.error("Failed to parse JSON response from Gemini:", e);
        throw new Error("Gemini trả về một phản hồi JSON không hợp lệ.");
      }
    } else {
      throw new Error("Gemini trả về một phản hồi trống.");
    }
  } catch (error) {
    console.error("Error in Gemini API call:", error);
    if (error instanceof Error) {
        throw new Error(`Không thể trích xuất văn bản: ${error.message}`);
    }
    throw new Error("Đã xảy ra lỗi không xác định trong quá trình trích xuất văn bản.");
  }
};


export const getChatbotResponse = async (documentText: string, history: ChatMessage[]): Promise<string> => {
    try {
        const systemInstruction = "Bạn là một trợ lý hữu ích. Dựa trên văn bản tài liệu được cung cấp, hãy trả lời câu hỏi của người dùng bằng tiếng Việt. Không sử dụng bất kỳ kiến thức bên ngoài nào. Nếu câu trả lời không có trong tài liệu, hãy nói bằng tiếng Việt rằng bạn không thể tìm thấy thông tin trong tài liệu đã cho.";

        const conversationHistory: Content[] = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));

        const contents: Content[] = [
            { role: 'user', parts: [{ text: `CONTEXT:\n---\n${documentText}\n---` }] },
            { role: 'model', parts: [{ text: "Được rồi, tôi đã có tài liệu. Tôi sẽ chỉ sử dụng ngữ cảnh này để trả lời câu hỏi của bạn bằng tiếng Việt. Bạn muốn biết điều gì?" }] },
            ...conversationHistory
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        if (response.text) {
            return response.text;
        } else {
            const candidate = response.candidates?.[0];
            if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
                 throw new Error(`Phản hồi của chatbot đã dừng vì lý do: ${candidate.finishReason}`);
            }
            throw new Error("Gemini trả về một phản hồi trống cho cuộc trò chuyện.");
        }
    } catch (error) {
        console.error("Lỗi trong cuộc gọi API Gemini Chat:", error);
        if (error instanceof Error) {
            throw new Error(`Lỗi chatbot: ${error.message}`);
        }
        throw new Error("Đã xảy ra lỗi không xác định khi giao tiếp với chatbot.");
    }
};