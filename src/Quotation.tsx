import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2 } from "lucide-react";

interface QuotationItem {
  id: number;
  name: string;
  value: number;
  dateLastUpdate: string;
  automaticUpdateValue: boolean;
}

type SortKey = keyof QuotationItem;
type SortDirection = "asc" | "desc";

const API_URL = "http://localhost:8084/app/quotation";
const API_INTEGRATIONS_URL = "http://localhost:8084/app/quotation/integrations";
const API_TOKEN = "Bearer 8cb7a3a5529cec195ed3adc5cd994e66";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

export default function Quotation() {
  const [rows, setRows] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formAutomaticUpdateValue, setFormAutomaticUpdateValue] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editValue, setEditValue] = useState<string>("0");
  const [editAutomaticUpdateValue, setEditAutomaticUpdateValue] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingQuotations, setUpdatingQuotations] = useState(false);
  const [integrationResultOpen, setIntegrationResultOpen] = useState(false);
  const [integrationResult, setIntegrationResult] = useState<unknown>(null);

  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((first, second) => {
      const firstValue = first[sortKey];
      const secondValue = second[sortKey];

      if (typeof firstValue === "number" && typeof secondValue === "number") {
        return sortDirection === "asc"
          ? firstValue - secondValue
          : secondValue - firstValue;
      }

      if (typeof firstValue === "boolean" && typeof secondValue === "boolean") {
        const firstNumber = Number(firstValue);
        const secondNumber = Number(secondValue);
        return sortDirection === "asc"
          ? firstNumber - secondNumber
          : secondNumber - firstNumber;
      }

      const firstText = String(firstValue ?? "");
      const secondText = String(secondValue ?? "");
      const comparison = firstText.localeCompare(secondText, "pt-BR", {
        sensitivity: "base",
      });
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [rows, sortDirection, sortKey]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const fetchQuotations = () => {
    return axios
      .get<QuotationItem[]>(API_URL)
      .then((response) => {
        setRows(Array.isArray(response.data) ? response.data : []);
        setError(null);
      })
      .catch((err) => {
        console.error("Erro ao buscar cotações:", err);
        setError("Erro ao buscar cotações. Verifique se a API está disponível.");
      });
  };

  const resetForm = () => {
    setFormName("");
    setFormAutomaticUpdateValue(true);
    setSubmitError(null);
  };

  const handleOpenDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formName.trim()) {
      setSubmitError("Informe o nome da cotação.");
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);

    axios
      .post(
        API_URL,
        {
          name: formName.trim(),
          automaticUpdateValue: formAutomaticUpdateValue,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: API_TOKEN,
          },
        }
      )
      .then(() => {
        setDialogOpen(false);
        resetForm();
        return fetchQuotations();
      })
      .catch((err) => {
        console.error("Erro ao cadastrar cotação:", err);
        const messageFromApi = err?.response?.data?.message;
        setSubmitError(messageFromApi ?? "Erro ao cadastrar cotação.");
      })
      .finally(() => {
        setSubmitLoading(false);
      });
  };

  const handleOpenEditDialog = (item: QuotationItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditValue(String(item.value));
    setEditAutomaticUpdateValue(item.automaticUpdateValue);
    setEditError(null);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingId == null) {
      setEditError("Cotação inválida para edição.");
      return;
    }

    if (!editName.trim()) {
      setEditError("Informe o nome da cotação.");
      return;
    }

    const parsedValue = Number(editValue);
    if (Number.isNaN(parsedValue)) {
      setEditError("Informe um valor numérico válido.");
      return;
    }

    setEditLoading(true);
    setEditError(null);

    axios
      .put(
        `${API_URL}/${editingId}`,
        {
          name: editName.trim(),
          value: parsedValue,
          automaticUpdateValue: editAutomaticUpdateValue,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then(() => {
        setEditDialogOpen(false);
        setEditingId(null);
        return fetchQuotations();
      })
      .catch((err) => {
        console.error("Erro ao editar cotação:", err);
        const messageFromApi = err?.response?.data?.message;
        setEditError(messageFromApi ?? "Erro ao editar cotação.");
      })
      .finally(() => {
        setEditLoading(false);
      });
  };

  const handleDelete = (item: QuotationItem) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a cotação \"${item.name}\"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);

    axios
      .delete(`${API_URL}/${item.id}`, {
        data: "",
      })
      .then(() => {
        fetchQuotations();
      })
      .catch((err) => {
        console.error("Erro ao excluir cotação:", err);
        const messageFromApi = err?.response?.data?.message;
        setError(messageFromApi ?? "Erro ao excluir cotação.");
      })
      .finally(() => {
        setDeletingId(null);
      });
  };

  const handleUpdateQuotations = () => {
    setUpdatingQuotations(true);
    setError(null);

    axios
      .post(API_INTEGRATIONS_URL, "")
      .then((response) => {
        setIntegrationResult(response.data ?? null);
        setIntegrationResultOpen(true);
        return fetchQuotations();
      })
      .catch((err) => {
        console.error("Erro ao atualizar cotações:", err);
        const messageFromApi = err?.response?.data?.message;
        setError(messageFromApi ?? "Erro ao atualizar cotações.");
      })
      .finally(() => {
        setUpdatingQuotations(false);
      });
  };

  useEffect(() => {
    fetchQuotations().finally(() => setLoading(false));
  }, []);

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Quotation</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleUpdateQuotations}
            disabled={updatingQuotations}
          >
            {updatingQuotations ? "Atualizando..." : "Atualizar Cotações"}
          </Button>
          <Button type="button" onClick={handleOpenDialog}>
            Cadastrar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-gray-500">Carregando cotações...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
                    onClick={() => handleSort("id")}
                  >
                    ID {sortIndicator("id")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
                    onClick={() => handleSort("name")}
                  >
                    Nome {sortIndicator("name")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
                    onClick={() => handleSort("value")}
                  >
                    Valor {sortIndicator("value")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
                    onClick={() => handleSort("dateLastUpdate")}
                  >
                    Última atualização {sortIndicator("dateLastUpdate")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
                    onClick={() => handleSort("automaticUpdateValue")}
                  >
                    Atualização automática {sortIndicator("automaticUpdateValue")}
                  </button>
                </TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    Nenhuma cotação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                sortedRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{formatCurrency(row.value)}</TableCell>
                    <TableCell>{formatDate(row.dateLastUpdate)}</TableCell>
                    <TableCell>
                      <Badge variant={row.automaticUpdateValue ? "default" : "secondary"}>
                        {row.automaticUpdateValue ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditDialog(row)}
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(row)}
                          disabled={deletingId === row.id}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          {deletingId === row.id ? "Excluindo..." : "Excluir"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar cotação</DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="quotation-name">Nome</Label>
              <Input
                id="quotation-name"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                placeholder="Ex.: VGIR11"
                autoComplete="off"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="quotation-automatic"
                type="checkbox"
                checked={formAutomaticUpdateValue}
                onChange={(event) => setFormAutomaticUpdateValue(event.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="quotation-automatic">Atualização automática</Label>
            </div>

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDialogOpen(false)}
                disabled={submitLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitLoading}>
                {submitLoading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cotação</DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-2">
              <Label htmlFor="edit-quotation-name">Nome</Label>
              <Input
                id="edit-quotation-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-quotation-value">Valor</Label>
              <Input
                id="edit-quotation-value"
                type="number"
                step="0.01"
                value={editValue}
                onChange={(event) => setEditValue(event.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="edit-quotation-automatic"
                type="checkbox"
                checked={editAutomaticUpdateValue}
                onChange={(event) => setEditAutomaticUpdateValue(event.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="edit-quotation-automatic">Atualização automática</Label>
            </div>

            {editError && <p className="text-sm text-red-600">{editError}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditDialogOpen(false)}
                disabled={editLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={editLoading}>
                {editLoading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={integrationResultOpen} onOpenChange={setIntegrationResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retorno da atualização de cotações</DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-auto rounded-md border border-gray-200 bg-gray-50 p-3">
            <pre className="whitespace-pre-wrap break-words text-xs text-gray-800">
              {JSON.stringify(integrationResult, null, 2) || "Sem conteúdo no retorno."}
            </pre>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIntegrationResultOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
