import SecurityChrome from "../SecurityChrome";

export default function WorkspacePage() {
    return (
        <SecurityChrome>
            <iframe
                className="legacy-frame"
                title="DeliveryPro.AI Workspace"
                src="/legacy/workspace.html"
            />
        </SecurityChrome>
    );
}
