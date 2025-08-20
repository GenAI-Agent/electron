"use client";

interface BookSearchProps {
  bookName: string;
  setBookName: (name: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  isComposing: boolean;
  setIsComposing: (composing: boolean) => void;
}

export default function BookSearch({
  bookName,
  setBookName,
  onSearch,
  isSearching,
  isComposing,
  setIsComposing,
}: BookSearchProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (isComposing) return;
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className="mb-6 rounded-lg bg-white p-4 shadow-lg">
      <h2 className="mb-2 text-xl font-semibold">單本書籍價格查詢</h2>
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
        <div className="flex-grow">
          <input
            type="text"
            value={bookName}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onChange={(e) => setBookName(e.target.value)}
            placeholder="請輸入書籍名稱"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          onClick={onSearch}
          disabled={isSearching || !bookName.trim()}
          className="group relative flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-2 text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"></div>
          <div className="relative z-10">
            {isSearching ? "搜索中..." : "查詢書籍"}
          </div>
        </button>
      </div>
    </div>
  );
}
