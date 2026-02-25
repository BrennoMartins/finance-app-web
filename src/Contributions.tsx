import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "./components/ui/dialog";
import { Button } from "./components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./components/ui/table";

type Contribution = {
  id: number;
  contributionDate: string; // ISO date
  value: number;
};

export default function Contributions() {
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function fetchContributions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "http://localhost:8080/asset/investments-contribution"
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Contribution[];
      setContributions(data);
    } catch (err: any) {
      setError(err?.message ?? "Erro ao buscar aportes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContributions();
  }, []);

  async function handleCreate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setMessage(null);

    if (!date) {
      setMessage("Por favor, selecione a data do aporte.");
      return;
    }

    const numeric = parseFloat(amount.replace(",", "."));
    if (isNaN(numeric) || numeric <= 0) {
      setMessage("Por favor, informe um valor de aporte válido.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        "http://localhost:8080/asset/investments-contribution",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contributionDate: date, value: numeric }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      setMessage("Aporte cadastrado com sucesso.");
      setDate("");
      setAmount("");
      setOpen(false);
      await fetchContributions();
    } catch (err: any) {
      setMessage(err?.message ?? "Erro ao cadastrar aporte");
    } finally {
      setSubmitting(false);
    }
  }

  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="mx-auto w-full max-w-4xl">

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-md bg-white p-6 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Aportes</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchContributions}>
                Atualizar
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="success" size="sm">Cadastrar Aporte</Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cadastrar Aporte</DialogTitle>
                    <DialogDescription>
                      Informe a data e o valor do aporte.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Data do Aporte</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-40 sm:w-64 rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Valor do Aporte</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">R$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-40 sm:w-64 rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                    </div>

                    {message && <p className="text-sm text-gray-700">{message}</p>}

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline" size="sm">Cancelar</Button>
                      </DialogClose>
                      <Button type="submit" variant="success" size="sm" disabled={submitting}>
                        {submitting ? "Cadastrando..." : "Cadastrar"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {loading ? (
            <p>Carregando...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : contributions.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhum aporte encontrado.</p>
          ) : (
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {contributions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{new Date(c.contributionDate).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{currency.format(c.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="hidden md:block" />
      </div>
    </div>
  );
}
