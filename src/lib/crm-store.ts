import { useCallback, useEffect, useState } from "react";

export type Stage = "novo" | "negociacao" | "ganho" | "perdido";

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: Stage;
  value: number;
  lastContact: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  time: string;
  clientName: string;
  done: boolean;
}

interface CrmData {
  clients: Client[];
  tasks: Task[];
}

const STORAGE_KEY = "vetor-crm-v1";

export const STAGES: { id: Stage; label: string }[] = [
  { id: "novo", label: "Novo" },
  { id: "negociacao", label: "Em negociação" },
  { id: "ganho", label: "Ganho" },
  { id: "perdido", label: "Perdido" },
];

export const stageLabel = (s: Stage) => STAGES.find((x) => x.id === s)?.label ?? s;

const seed: CrmData = {
  clients: [
    { id: "c1", name: "Marina Duarte", company: "Nimbus Software", email: "marina@nimbus.dev", phone: "(11) 98888-1201", stage: "novo", value: 18400, lastContact: "2026-09-27", createdAt: "2026-09-20" },
    { id: "c2", name: "Rafael Nogueira", company: "Vetor Labs", email: "rafael@vetorlabs.com", phone: "(11) 97777-3402", stage: "novo", value: 9200, lastContact: "2026-09-26", createdAt: "2026-09-22" },
    { id: "c3", name: "Camila Rocha", company: "Atlas Logística", email: "camila@atlaslog.com.br", phone: "(21) 96666-5510", stage: "negociacao", value: 42000, lastContact: "2026-09-25", createdAt: "2026-09-10" },
    { id: "c4", name: "Eduardo Lima", company: "Vela Energia", email: "eduardo@velaenergia.com", phone: "(31) 95555-7811", stage: "negociacao", value: 67500, lastContact: "2026-09-24", createdAt: "2026-09-05" },
    { id: "c5", name: "Beatriz Alves", company: "Orbe Studio", email: "bia@orbestudio.com", phone: "(41) 94444-2290", stage: "ganho", value: 31000, lastContact: "2026-09-21", createdAt: "2026-08-28" },
    { id: "c6", name: "Paulo Mendes", company: "Kite Financeiro", email: "paulo@kitefin.com", phone: "(51) 93333-8844", stage: "perdido", value: 12000, lastContact: "2026-09-12", createdAt: "2026-08-15" },
  ],
  tasks: [
    { id: "t1", title: "Ligar para Camila sobre proposta", time: "09:30", clientName: "Atlas Logística", done: false },
    { id: "t2", title: "Enviar contrato para Beatriz", time: "11:00", clientName: "Orbe Studio", done: false },
    { id: "t3", title: "Follow-up com Eduardo", time: "14:00", clientName: "Vela Energia", done: true },
    { id: "t4", title: "Preparar demo para Marina", time: "16:00", clientName: "Nimbus Software", done: false },
  ],
};

function load(): CrmData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CrmData;
  } catch {
    // ignore
  }
  return seed;
}

export function useCrmStore() {
  const [data, setData] = useState<CrmData>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [data]);

  const addClient = useCallback((c: Omit<Client, "id" | "createdAt" | "lastContact">) => {
    const today = new Date().toISOString().slice(0, 10);
    setData((d) => ({
      ...d,
      clients: [
        { ...c, id: crypto.randomUUID(), createdAt: today, lastContact: today },
        ...d.clients,
      ],
    }));
  }, []);

  const moveClient = useCallback((id: string, stage: Stage) => {
    setData((d) => ({
      ...d,
      clients: d.clients.map((c) =>
        c.id === id
          ? { ...c, stage, lastContact: new Date().toISOString().slice(0, 10) }
          : c,
      ),
    }));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setData((d) => ({ ...d, clients: d.clients.filter((c) => c.id !== id) }));
  }, []);

  const addTask = useCallback((t: Omit<Task, "id" | "done">) => {
    setData((d) => ({
      ...d,
      tasks: [...d.tasks, { ...t, id: crypto.randomUUID(), done: false }],
    }));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
  }, []);

  return { data, addClient, moveClient, deleteClient, addTask, toggleTask, deleteTask };
}

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
