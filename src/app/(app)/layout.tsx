import { AppDataProvider } from "@/components/providers/AppDataProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { RestTimerProvider } from "@/components/providers/RestTimerProvider";
import { SyncProvider } from "@/components/providers/SyncProvider";
import { GlobalRestBar } from "@/components/rest/GlobalRestBar";
import { AppHeader } from "@/components/shell/AppHeader";
import { Dock, DockSpacer } from "@/components/shell/Dock";
import { KeyboardWatcher } from "@/components/shell/KeyboardWatcher";
import { UpdateWatcher } from "@/components/shell/UpdateWatcher";

/**
 * The signed-in app frame. It reads nothing on the server, so the main tabs are static and
 * Next.js can prefetch them; the middleware guards sign-in and AppDataProvider loads the
 * profile and prep on the device.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AppDataProvider>
        <SyncProvider>
          <RestTimerProvider>
            <AppHeader />
            <main className="mx-auto w-full max-w-[480px] px-4 pt-4 pb-[calc(4rem+env(safe-area-inset-bottom)+1rem)]">
              {children}
              <GlobalRestBar />
              <DockSpacer />
            </main>
            <Dock />
            <KeyboardWatcher />
            <UpdateWatcher />
          </RestTimerProvider>
        </SyncProvider>
      </AppDataProvider>
    </QueryProvider>
  );
}
