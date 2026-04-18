"use client";

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-300 border-t-purple-600" />
                <p className="text-sm text-purple-200">Loading...</p>
            </div>
        </div>
    );
}