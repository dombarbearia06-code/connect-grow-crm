import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type DragEvent, type FormEvent } from "react";
import {
  STAGES,
  formatBRL,
  stageLabel,
  useCrmStore,
  type Client,
  type Stage,
} from "@/lib/crm-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vetor — CRM pessoal de vendas" },
      {
        name: "description",
        content:
          "CRM pessoal de vendas: cadastro de clientes, funil de oportunidades e tarefas de follow-up em um só lugar.",
      },
      { property: "og:title", content: "Vetor — CRM pessoal de vendas" },
      {
        property: "og:description",
        content:
          "Cadastro de clientes, funil de vendas arrastável e tarefas de follow-up. Simples e direto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const stageBadge: Record<Stage, string> = {
  novo: "text-brand-deep bg-brand/10",
  negociacao: "text-amber-warm bg-amber-warm/15",
  ganho: "text-brand-deep bg-brand/10",
  perdido: "text-muted-foreground bg-black/5",
};

function Index() {
  const {
    data,
    addClient,
    moveClient,
    deleteClient,
    addTask,
    toggleTask,
    deleteTask,
  } = useCrmStore();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"client" | "task" | null>(null);
  const [dragOver, setDragOver] = useState<Stage | null>(null);

  const active = data.clients.filter(
    (c) => c.stage === "novo" || c.stage === "negociacao",
  );
  const pipelineValue = active.reduce((s, c) => s + c.value, 0);
  const pendingTasks = data.tasks.filter((t) => !t.done);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.clients;
    return data.clients.filter((c) =>
      [c.name, c.company, c.email].some((f) => f.toLowerCase().includes(q)),
    );
  }, [data.clients, search]);

  function onDrop(e: DragEvent, stage: Stage) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) moveClient(id, stage);
    setDragOver(null);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-body text-ink-soft">
      {/* ambient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-float-a absolute -top-32 -left-24 h-96 w-96 rounded-full bg-brand/25 blur-3xl" />
        <div className="animate-float-b absolute top-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-amber-warm/20 blur-3xl" />
        <div className="animate-float-a-slow absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Top bar */}
        <header className="glass-strong flex flex-wrap items-center gap-4 rounded-2xl px-4 py-4 ring-1 ring-black/5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-brand font-display text-lg font-semibold text-primary-foreground ring-1 ring-brand/30">
              V
            </div>
            <div>
              <p className="font-display text-lg leading-none font-semibold text-ink">
                Vetor
              </p>
              <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                CRM pessoal
              </p>
            </div>
          </div>
          <div className="glass hidden w-72 items-center gap-2 rounded-full px-4 py-2 ring-1 ring-black/5 md:flex">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente, empresa…"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setModal("task")}
              className="glass rounded-full px-4 py-2 text-sm font-medium text-ink-soft ring-1 ring-black/5 transition-colors hover:bg-white/80"
            >
              Nova tarefa
            </button>
            <button
              onClick={() => setModal("client")}
              className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-primary-foreground ring-1 ring-brand/40 transition-colors hover:bg-brand-deep"
            >
              + Novo cliente
            </button>
          </div>
        </header>

        {/* Metrics */}
        <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="glass rounded-2xl p-5 ring-1 ring-black/5">
            <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Total de clientes
            </p>
            <p className="mt-2 font-display text-3xl leading-none font-semibold text-ink">
              {data.clients.length}
            </p>
            <p className="mt-2 text-xs font-medium text-brand-deep">
              {data.clients.filter((c) => c.stage === "novo").length} novos no funil
            </p>
          </div>
          <div className="glass rounded-2xl p-5 ring-1 ring-black/5">
            <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Valor em negociação
            </p>
            <p className="mt-2 font-display text-3xl leading-none font-semibold text-ink">
              {formatBRL(pipelineValue)}
            </p>
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              {active.length} oportunidades ativas
            </p>
          </div>
          <div className="glass rounded-2xl p-5 ring-1 ring-black/5">
            <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Tarefas pendentes
            </p>
            <p className="mt-2 font-display text-3xl leading-none font-semibold text-ink">
              {pendingTasks.length}
            </p>
            <p className="mt-2 text-xs font-medium text-amber-warm">
              {data.tasks.length} no total
            </p>
          </div>
        </section>

        {/* Main grid */}
        <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          {/* Kanban */}
          <div className="glass rounded-2xl p-5 ring-1 ring-black/5 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-balance text-ink">
                Funil de vendas
              </h2>
              <span className="text-xs text-muted-foreground">arraste os cards</span>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {STAGES.map((stage) => {
                const cards = data.clients.filter((c) => c.stage === stage.id);
                return (
                  <div
                    key={stage.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(stage.id);
                    }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={(e) => onDrop(e, stage.id)}
                    className={`rounded-xl bg-white/40 p-3 ring-1 transition-colors ${
                      dragOver === stage.id ? "ring-brand/50 bg-brand/5" : "ring-black/5"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink">{stage.label}</span>
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-muted-foreground">
                        {cards.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {cards.map((c) => (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
                          className="cursor-grab rounded-lg bg-white/80 p-3 ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
                        >
                          <p className="text-sm font-medium text-ink">{c.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{c.company}</p>
                          <p
                            className={`mt-2 text-xs font-semibold ${
                              c.stage === "perdido" ? "text-muted-foreground" : "text-brand-deep"
                            }`}
                          >
                            {formatBRL(c.value)}
                          </p>
                        </div>
                      ))}
                      {cards.length === 0 && (
                        <p className="rounded-lg border border-dashed border-black/10 p-3 text-center text-[11px] text-muted-foreground">
                          Sem cards
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tarefas */}
          <div className="glass rounded-2xl p-5 ring-1 ring-black/5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-balance text-ink">
                Tarefas
              </h2>
              <span className="text-xs text-muted-foreground">follow-ups</span>
            </div>
            <div className="space-y-2">
              {data.tasks.map((t) => (
                <label
                  key={t.id}
                  className="group flex cursor-pointer items-start gap-3 rounded-lg bg-white/70 p-3 ring-1 ring-black/5 transition-colors hover:bg-white/90"
                >
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => toggleTask(t.id)}
                    className="mt-0.5 size-4 accent-brand"
                  />
                  <span className="min-w-0">
                    <span
                      className={`block text-sm ${
                        t.done ? "text-muted-foreground line-through" : "text-ink"
                      }`}
                    >
                      {t.title}
                    </span>
                    {t.clientName && (
                      <span className="block text-[11px] text-muted-foreground">
                        {t.clientName}
                      </span>
                    )}
                  </span>
                  <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                    {t.time}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      deleteTask(t.id);
                    }}
                    className="shrink-0 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    aria-label="Remover tarefa"
                  >
                    ✕
                  </button>
                </label>
              ))}
              {data.tasks.length === 0 && (
                <p className="rounded-lg border border-dashed border-black/10 p-3 text-center text-xs text-muted-foreground">
                  Nenhuma tarefa — adicione uma acima
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Clientes */}
        <section className="glass mt-5 rounded-2xl p-5 ring-1 ring-black/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-balance text-ink">
              Clientes
            </h2>
            <span className="text-xs text-muted-foreground">
              {filteredClients.length} registrados
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Empresa</th>
                  <th className="pb-3 font-medium">Contato</th>
                  <th className="pb-3 font-medium">Etapa</th>
                  <th className="pb-3 text-right font-medium">Valor</th>
                  <th className="pb-3 text-right font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredClients.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-white/60">
                    <td className="py-3 font-medium text-ink">{c.name}</td>
                    <td className="py-3 text-muted-foreground">{c.company}</td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {c.email}
                      {c.phone && <span className="block">{c.phone}</span>}
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${stageBadge[c.stage]}`}
                      >
                        {stageLabel(c.stage)}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium text-ink">
                      {formatBRL(c.value)}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => deleteClient(c.id)}
                        className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {modal === "client" && (
        <ClientModal
          onClose={() => setModal(null)}
          onSave={(c) => {
            addClient(c);
            setModal(null);
          }}
        />
      )}
      {modal === "task" && (
        <TaskModal
          clients={data.clients}
          onClose={() => setModal(null)}
          onSave={(t) => {
            addTask(t);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-strong w-full max-w-md rounded-2xl p-6 ring-1 ring-black/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-ink"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-black/10 bg-white/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-muted-foreground focus:border-brand/50";

function ClientModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (c: Omit<Client, "id" | "createdAt" | "lastContact">) => void;
}) {
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    onSave({
      name: String(f.get("name") || "").trim(),
      company: String(f.get("company") || "").trim(),
      email: String(f.get("email") || "").trim(),
      phone: String(f.get("phone") || "").trim(),
      stage: (f.get("stage") as Stage) || "novo",
      value: Number(f.get("value")) || 0,
    });
  }
  return (
    <ModalShell title="Novo cliente" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <input name="name" required placeholder="Nome do cliente" className={inputCls} />
        <input name="company" placeholder="Empresa" className={inputCls} />
        <div className="grid grid-cols-2 gap-3">
          <input name="email" type="email" placeholder="E-mail" className={inputCls} />
          <input name="phone" placeholder="Telefone" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input name="value" type="number" min="0" step="100" placeholder="Valor (R$)" className={inputCls} />
          <select name="stage" className={inputCls} defaultValue="novo">
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-deep"
        >
          Adicionar cliente
        </button>
      </form>
    </ModalShell>
  );
}

function TaskModal({
  clients,
  onClose,
  onSave,
}: {
  clients: Client[];
  onClose: () => void;
  onSave: (t: { title: string; time: string; clientName: string }) => void;
}) {
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    onSave({
      title: String(f.get("title") || "").trim(),
      time: String(f.get("time") || ""),
      clientName: String(f.get("client") || ""),
    });
  }
  return (
    <ModalShell title="Nova tarefa" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <input name="title" required placeholder="O que precisa ser feito?" className={inputCls} />
        <div className="grid grid-cols-2 gap-3">
          <input name="time" type="time" className={inputCls} />
          <select name="client" className={inputCls} defaultValue="">
            <option value="">Sem cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.company || c.name}>
                {c.company || c.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-deep"
        >
          Adicionar tarefa
        </button>
      </form>
    </ModalShell>
  );
}
