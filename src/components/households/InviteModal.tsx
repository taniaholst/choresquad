"use client";
export default function InviteModal({
  code,
  onClose,
  onCopied,
}: {
  code: string;
  onClose: () => void;
  onCopied: () => void;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-lg w-80 space-y-4">
        <h2 className="text-lg font-medium">Invite to household</h2>
        <p className="text-sm">Share this invite code with others:</p>
        <div className="flex items-center gap-2">
          <code className="px-2 py-1 border rounded flex-1 text-center">
            {code}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(code);
              onCopied();
            }}
            className="border rounded px-2 py-1 text-sm"
          >
            Copy
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-3 border rounded px-4 py-2 w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
}
