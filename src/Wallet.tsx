import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet as WalletIcon, Loader2, Plus, Edit2, Trash2 } from "lucide-react";

/** Resposta da API GET /asset */
interface AssetFromApi {
  id: number;
  asset: string;
  quantity: number;
  averagePrice: number;
  quotation: number;
  difference: number;
  index: number;
  percentWallet?: number;
  value: number;
  bank?: {
    id: number;
    bank: string;
  };
  assetType?: {
    id: number;
    name: string;
  };
  subType?: {
    id: number;
    name: string;
    assetType?: {
      id: number;
      name: string;
    };
  };
}

export interface WalletAsset {
  id: number;
  ativo: string;
  banco: string;
  tipo: string;
  subTipo: string;
  quantidade: number;
  precoMedio: number;
  cotacao: number;
  diferenca: number;
  indice: number;
  valor: number;
  aporteMes: number;
  valorMesAnt: number;
  percentLucroMes: number;
  lucroRs: number;
  vencimento: string;
  percent: number;
}

type SortDirection = "asc" | "desc";

const COLUMNS: { key: keyof WalletAsset; label: string }[] = [
  { key: "ativo", label: "Ativo" },
  { key: "banco", label: "Banco" },
  { key: "tipo", label: "Tipo" },
  { key: "subTipo", label: "SubTipo" },
  { key: "quantidade", label: "Quantidade" },
  { key: "precoMedio", label: "Preço Médio" },
  { key: "cotacao", label: "Cotação" },
  { key: "indice", label: "Indice" },
  { key: "valor", label: "Valor" },
  { key: "lucroRs", label: "Lucro R$" },
  { key: "percent", label: "%" },
];

/** Em dev o Vite faz proxy de /api para localhost:8080 (evita CORS). Em prod use variável de ambiente. */
const API_URL = "/api/asset";
const API_BANKS_URL = "/api/asset/bank";
const API_ASSET_TYPES_URL = "/api/asset/asset-type";
const API_ASSET_SUB_TYPES_URL = "/api/asset/asset-sub-type/by-asset-type";

interface BankFromApi {
  id: number;
  bank: string;
}

interface AssetTypeFromApi {
  id: number;
  name: string;
}

interface SubTypeFromApi {
  id: number;
  name: string;
  assetType?: {
    id: number;
    name: string;
  };
}




/** Estado do formulário de cadastro (apenas campos necessários para o POST) */
interface CadastroForm {
  asset: string;
  quantity: number;
  averagePrice: number;
  quotation: number;
  bankId: number | null;
  assetTypeId: number | null;
  subTypeId: number | null;
}

const initialCadastroForm: CadastroForm = {
  asset: "",
  quantity: 0,
  averagePrice: 0,
  quotation: 0,
  bankId: null,
  assetTypeId: null,
  subTypeId: null,
};

const SELECT_CLASS = cn(
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
);

function mapApiToWalletAsset(item: AssetFromApi): WalletAsset {
  const lucroRs = item.value - item.quantity * item.averagePrice;
  return {
    id: item.id,
    ativo: item.asset,
    banco: item.bank?.bank ?? "",
    tipo: item.subType?.assetType?.name ?? item.assetType?.name ?? "",
    subTipo: item.subType?.name ?? "",
    quantidade: item.quantity,
    precoMedio: item.averagePrice,
    cotacao: item.quotation,
    diferenca: item.difference,
    indice: item.index,
    valor: item.value,
    aporteMes: 0,
    valorMesAnt: 0,
    percentLucroMes: 0,
    lucroRs,
    vencimento: "",
    percent: item.percentWallet ?? 0,
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function getCellClassName(key: keyof WalletAsset, value: unknown): string {
  const isPositive =
    typeof value === "number" && value >= 0;
  const isNegative =
    typeof value === "number" && value < 0;
  if (
    (key === "lucroRs" || key === "diferenca" || key === "indice") &&
    (isPositive || isNegative)
  ) {
    return isPositive ? "text-emerald-600 font-medium" : "text-red-600 font-medium";
  }
  return "";
}

export default function Wallet() {
  const [assets, setAssets] = useState<WalletAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<keyof WalletAsset | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<number | null>(null);
  const [form, setForm] = useState<CadastroForm>(initialCadastroForm);
  const [banks, setBanks] = useState<BankFromApi[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetTypeFromApi[]>([]);
  const [subTypes, setSubTypes] = useState<SubTypeFromApi[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mapAssetsResponse = (res: { status: number; data: AssetFromApi[] | null | undefined }) => {
    if (res.status === 204 || !Array.isArray(res.data)) {
      return [];
    }
    return res.data.map(mapApiToWalletAsset);
  };

  const sortedAssets = useMemo(() => {
    if (sortBy == null) return assets;

    const sorted = [...assets].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aString = String(aValue ?? "");
      const bString = String(bValue ?? "");
      const comparison = aString.localeCompare(bString, "pt-BR", { sensitivity: "base" });
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [assets, sortBy, sortDirection]);

  const handleSort = (key: keyof WalletAsset) => {
    if (sortBy === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(key);
    setSortDirection("asc");
  };

  const refetchAssets = () => {
    axios
      .get<AssetFromApi[]>(API_URL)
      .then((res) => {
        setAssets(mapAssetsResponse(res));
        setError(null);
      })
      .catch((err) => {
        console.error("Erro ao buscar carteira:", err);
        setError("Erro ao buscar ativos da carteira.");
      });
  };

  const updateForm = <K extends keyof CadastroForm>(key: K, value: CadastroForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpenCadastro = () => {
    setEditingAssetId(null);
    setForm(initialCadastroForm);
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleOpenEditar = (asset: WalletAsset) => {
    setEditingAssetId(asset.id);
    // Buscar dados completos do ativo para edição
    const assetData = assets.find((a) => a.id === asset.id);
    if (assetData) {
      // Buscar detalhes completos da API
      axios
        .get<AssetFromApi>(`${API_URL}/${asset.id}`)
        .then((res) => {
          const data = res.data;
          setForm({
            asset: data.asset,
            quantity: data.quantity,
            averagePrice: data.averagePrice,
            quotation: data.quotation,
            bankId: data.bank?.id ?? null,
            assetTypeId: data.subType?.assetType?.id ?? data.assetType?.id ?? null,
            subTypeId: data.subType?.id ?? null,
          });
          setSubmitError(null);
          setDialogOpen(true);
        })
        .catch((err) => {
          console.error("Erro ao buscar detalhes do ativo:", err);
          setSubmitError("Erro ao carregar dados do ativo para edição.");
        });
    }
  };

  const handleDeleteAsset = (asset: WalletAsset) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir o ativo "${asset.ativo}"? Esta ação não pode ser desfeita.`
      )
    ) {
      axios
        .delete(`${API_URL}/${asset.id}`)
        .then(() => {
          refetchAssets();
        })
        .catch((err) => {
          console.error("Erro ao excluir ativo:", err);
          alert(
            err.response?.data?.message ?? "Erro ao excluir ativo. Tente novamente."
          );
        });
    }
  };

  const handleCloseCadastro = () => {
    setDialogOpen(false);
    setEditingAssetId(null);
    setForm(initialCadastroForm);
    setSubmitError(null);
  };

  const handleSubmitCadastro = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      form.bankId == null ||
      form.assetTypeId == null ||
      form.subTypeId == null
    ) {
      setSubmitError("Preencha Banco, Tipo e SubTipo.");
      return;
    }
    setSubmitLoading(true);
    setSubmitError(null);

    const payload = {
      asset: form.asset,
      quantity: form.quantity,
      averagePrice: form.averagePrice,
      quotation: form.quotation,
      bank: { id: form.bankId },
      subType: { id: form.subTypeId },
    };

    const request = editingAssetId
      ? axios.put(`${API_URL}/${editingAssetId}`, payload)
      : axios.post(API_URL, payload);

    request
      .then(() => {
        refetchAssets();
        handleCloseCadastro();
      })
      .catch((err) => {
        console.error("Erro na operação:", err);
        setSubmitError(
          err.response?.data?.message ?? 
          `Erro ao ${editingAssetId ? "editar" : "cadastrar"} ativo. Tente novamente.`
        );
      })
      .finally(() => setSubmitLoading(false));
  };

  useEffect(() => {
    axios
      .get<AssetFromApi[]>(API_URL)
      .then((res) => {
        setAssets(mapAssetsResponse(res));
        setError(null);
      })
      .catch((err) => {
        console.error("Erro ao buscar carteira:", err);
        setError(
          "Erro ao buscar ativos da carteira. Verifique o servidor e o endpoint."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!dialogOpen) return;
    axios
      .get<BankFromApi[]>(API_BANKS_URL)
      .then((res) => setBanks(res.data))
      .catch((err) => {
        console.error("Erro ao buscar bancos:", err);
        setBanks([]);
      });
    axios
      .get<AssetTypeFromApi[]>(API_ASSET_TYPES_URL)
      .then((res) => setAssetTypes(res.data))
      .catch((err) => {
        console.error("Erro ao buscar tipos:", err);
        setAssetTypes([]);
      });
    setSubTypes([]);
  }, [dialogOpen]);

  useEffect(() => {
    // load subtypes whenever type changes while dialog open
    if (!dialogOpen || form.assetTypeId == null) {
      setSubTypes([]);
      return;
    }
    axios
      .get<SubTypeFromApi[]>(`${API_ASSET_SUB_TYPES_URL}/${form.assetTypeId}`)
      .then((res) => setSubTypes(res.data))
      .catch((err) => {
        console.error("Erro ao buscar subtipos:", err);
        setSubTypes([]);
      });
  }, [dialogOpen, form.assetTypeId]);

  if (loading) {
    return (
      <div className="w-full">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <WalletIcon className="h-5 w-5 text-emerald-600" />
              Carteira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Carregando ativos...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <WalletIcon className="h-5 w-5 text-red-600" />
              Carteira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="overflow-hidden border-0 shadow-md">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b bg-muted/30 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <WalletIcon className="h-5 w-5 text-emerald-600" />
              Carteira
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {assets.length} ativo{assets.length !== 1 ? "s" : ""} na carteira
            </p>
          </div>
          <Button
            type="button"
            variant="success"
            onClick={handleOpenCadastro}
            className="shrink-0 text-white"
          >
            <Plus className="h-4 w-4" />
            Cadastrar Ativo
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {COLUMNS.map(({ key, label }) => (
                    <TableHead
                      key={key}
                      className="whitespace-nowrap bg-muted/50 font-semibold text-foreground"
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(key)}
                        className="inline-flex items-center gap-1 text-black"
                      >
                        {label}
                        <span className="text-xs text-black/70">
                          {sortBy === key ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      </button>
                    </TableHead>
                  ))}
                  <TableHead className="whitespace-nowrap bg-muted/50 font-semibold text-foreground">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAssets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={COLUMNS.length + 1}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Nenhum ativo na carteira.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAssets.map((row, index) => (
                    <TableRow
                      key={index}
                      className={cn(
                        "transition-colors",
                        index % 2 === 1 && "bg-muted/20"
                      )}
                    >
                      {COLUMNS.map(({ key }) => {
                        const value = row[key];
                        const isNumber = typeof value === "number";
                        const isCurrency =
                          key === "precoMedio" ||
                          key === "cotacao" ||
                          key === "valor" ||
                          key === "aporteMes" ||
                          key === "valorMesAnt" ||
                          key === "lucroRs" ||
                          key === "diferenca";
                        const isPercent =
                          key === "indice" ||
                          key === "percentLucroMes" ||
                          key === "percent";

                        return (
                          <TableCell
                            key={key}
                            className={cn(
                              "whitespace-nowrap",
                              getCellClassName(key, value)
                            )}
                          >
                            {isNumber && isCurrency && formatCurrency(value)}
                            {isNumber && isPercent && formatPercent(value)}
                            {isNumber && !isCurrency && !isPercent && value}
                            {typeof value === "string" && (value || "—")}
                          </TableCell>
                        );
                      })}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditar(row)}
                            className="h-8 w-8 p-0 text-black"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteAsset(row)}
                            className="h-8 w-8 p-0 text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="flex h-[50vh] w-[50vw] min-h-[320px] min-w-[280px] max-h-[90vh] max-w-[90vw] flex-col p-6"
          onClose={handleCloseCadastro}
        >
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {editingAssetId ? "Editar Ativo" : "Cadastrar Ativo"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmitCadastro}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              {submitError && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                  {submitError}
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="asset">Ativo</Label>
                  <Input
                    id="asset"
                    type="text"
                    value={form.asset}
                    onChange={(e) => updateForm("asset", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="any"
                    value={form.quantity === 0 ? "" : form.quantity}
                    onChange={(e) =>
                      updateForm("quantity", e.target.value === "" ? 0 : Number(e.target.value))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="averagePrice">Preço Médio</Label>
                  <Input
                    id="averagePrice"
                    type="number"
                    step="any"
                    value={form.averagePrice === 0 ? "" : form.averagePrice}
                    onChange={(e) =>
                      updateForm(
                        "averagePrice",
                        e.target.value === "" ? 0 : Number(e.target.value)
                      )
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quotation">Cotação</Label>
                  <Input
                    id="quotation"
                    type="number"
                    step="any"
                    value={form.quotation === 0 ? "" : form.quotation}
                    onChange={(e) =>
                      updateForm("quotation", e.target.value === "" ? 0 : Number(e.target.value))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankId">Banco</Label>
                  <select
                    id="bankId"
                    value={form.bankId ?? ""}
                    onChange={(e) =>
                      updateForm("bankId", e.target.value === "" ? null : Number(e.target.value))
                    }
                    className={SELECT_CLASS}
                  >
                    <option value="">Selecione o banco</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bank}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assetTypeId">Tipo</Label>
                  <select
                    id="assetTypeId"
                    value={form.assetTypeId ?? ""}
                    onChange={(e) =>
                      updateForm(
                        "assetTypeId",
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    className={SELECT_CLASS}
                  >
                    <option value="">Selecione o tipo</option>
                    {assetTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subTypeId">SubTipo</Label>
                  <select
                    id="subTypeId"
                    value={form.subTypeId ?? ""}
                    onChange={(e) =>
                      updateForm(
                        "subTypeId",
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    disabled={form.assetTypeId == null}
                    className={cn(SELECT_CLASS, form.assetTypeId == null && "opacity-60")}
                  >
                    <option value="">
                      {form.assetTypeId == null
                        ? "Selecione o tipo primeiro"
                        : "Selecione o subtipo"}
                    </option>
                    {subTypes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter className="shrink-0 gap-2 border-t pt-4 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseCadastro}
                className="text-black"
                disabled={submitLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="success" className="text-white" disabled={submitLoading}>
                {submitLoading
                  ? editingAssetId
                    ? "Editando..."
                    : "Cadastrando..."
                  : editingAssetId
                  ? "Editar"
                  : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
