import { WizardShell } from "@/components/wizard/WizardShell";

export default function Home() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="pt-8 pb-4 text-center">
        <h1 className="text-2xl font-bold">Steam 게임 추천</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          장르와 태그로 나에게 맞는 Steam 게임을 찾아보세요
        </p>
      </header>
      <main className="mx-auto max-w-lg px-4 pb-12">
        <WizardShell />
      </main>
    </div>
  );
}
