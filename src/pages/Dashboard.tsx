import { Wallet } from "lucide-react";

export default function Dashboard() {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Tổng quan tài chính</h1>
      </header>
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-muted-foreground">
        <div className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background via-card to-card/50">
          <div className="bg-primary/5 border-b">
            <div className="text-xl flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Tình hình tài chính hiện tại
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
