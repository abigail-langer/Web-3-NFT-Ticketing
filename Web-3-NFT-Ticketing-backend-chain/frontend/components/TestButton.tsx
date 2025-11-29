"use client";

export default function TestButton() {
  return (
    <button 
      onClick={() => alert("测试按钮点击成功！")}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-bold"
    >
      🔴 测试按钮
    </button>
  );
}
