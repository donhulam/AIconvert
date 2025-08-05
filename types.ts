
export type FileStatus = 'pending' | 'processing' | 'success' | 'error';

export interface FormattedRun {
  text: string;
  isBold?: boolean;
  isItalic?: boolean;
}

export interface FormattedParagraph {
  runs: FormattedRun[];
}

// New structure for table data
export interface TableCellContent {
  content: FormattedParagraph;
}

export interface FormattedTableRow {
  cells: TableCellContent[];
}

export interface FormattedTable {
  type: 'table';
  rows: FormattedTableRow[];
}

// New structure for a standard paragraph
export interface TypedFormattedParagraph {
  type: 'paragraph';
  content: FormattedParagraph;
}

// A content block can be either a paragraph or a table
export type ContentBlock = TypedFormattedParagraph | FormattedTable;

export type ExtractedContent = ContentBlock[];

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface AppFile {
  id: string;
  file: File;
  status: FileStatus;
  extractedContent?: ExtractedContent;
  errorMessage?: string;
  chatHistory?: ChatMessage[];
}
