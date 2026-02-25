import React, { useEffect, useState } from "react";
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
import { Wallet as WalletIcon, Loader2, Plus } from "lucide-react";

/** Resposta da API GET /asset */
interface AssetFromApi {
  id: number;
  asset: string;
  quantity: number;
  averagePrice: number;
  quotation: number;
  difference: number;
  index: number;
  value: number;
  assetCategory: {
    id: number;
    category: string;
  };
}

export interface WalletAsset {
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

const COLUMNS: { key: keyof WalletAsset; label: string }[] = [
  { key: "ativo", label: "Ativo" },
  { key: "banco", label: "Banco" },
  { key: "tipo", label: "Tipo" },
  { key: "subTipo", label: "SubTipo" },
  { key: "quantidade", label: "Quantidade" },
  { key: "precoMedio", label: "Preço Médio" },
  { key: "cotacao", label: "Cotação" },
  { key: "diferenca", label: "Diferença" },
  { key: "indice", label: "Indice" },
  { key: "valor", label: "Valor" },
  { key: "aporteMes", label: "Aporte Mês" },
  { key: "valorMesAnt", label: "Valor Mês Ant." },
  { key: "percentLucroMes", label: "% Lucro Mês" },
  { key: "lucroRs", label: "Lucro R$" },
  { key: "vencimento", label: "Vencimento" },
  { key: "percent", label: "%" },
];

/** Em dev o Vite faz proxy de /api para localhost:8080 (evita CORS). Em prod use variável de ambiente. */
const API_URL = "/api/asset";
const API_BANKS_URL = "/api/asset/bank";
const API_ASSET_TYPES_URL = "/api/asset/asset-type";
const API_ASSET_SUB_TYPES_URL = "/api/asset/asset-sub-type/by-asset-type";
const API_ASSET_CATEGORIES_URL = "/api/asset/asset-category";

interface BankFromApi {
  id: number;
  bank: string;
}

interface AssetTypeFromApi {
  id: number;
  name: string;
}

interface AssetSubTypeFromApi {
  id: number;
  name: string;
  assetType: { id: number; name: string };
}

interface AssetCategoryFromApi {
  id: number;
  category: string;
}

/** Estado do formulário de cadastro (apenas campos necessários para o POST) */
interface CadastroForm {
  asset: string;
  quantity: number;
  averagePrice: number;
  quotation: number;
  assetCategoryId: number | null;
  bankId: number | null;
  assetTypeId: number | null;
  assetSubTypeId: number | null;
}

const initialCadastroForm: CadastroForm = {
  asset: "",
  quantity: 0,
  averagePrice: 0,
  quotation: 0,
  assetCategoryId: null,
  bankId: null,
  assetTypeId: null,
  assetSubTypeId: null,
};

const SELECT_CLASS = cn(
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
);

function mapApiToWalletAsset(item: AssetFromApi): WalletAsset {
  const lucroRs = item.value - item.quantity * item.averagePrice;
  return {
    ativo: item.asset,
    banco: "",
    tipo: item.assetCategory?.category ?? "",
    subTipo: "",
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
    percent: item.index,
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CadastroForm>(initialCadastroForm);
  const [banks, setBanks] = useState<BankFromApi[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetTypeFromApi[]>([]);
  const [assetSubTypes, setAssetSubTypes] = useState<AssetSubTypeFromApi[]>([]);
  const [assetCategories, setAssetCategories] = useState<AssetCategoryFromApi[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const refetchAssets = () => {
    axios
      .get<AssetFromApi[]>(API_URL)
      .then((res) => setAssets(res.data.map(mapApiToWalletAsset)))
      .catch((err) => {
        console.error("Erro ao buscar carteira:", err);
        setError("Erro ao buscar ativos da carteira.");
      });
  };

  const updateForm = <K extends keyof CadastroForm>(key: K, value: CadastroForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpenCadastro = () => {
    setForm(initialCadastroForm);
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleCloseCadastro = () => {
    setDialogOpen(false);
    setForm(initialCadastroForm);
    setSubmitError(null);
  };

  const handleSubmitCadastro = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      form.assetCategoryId == null ||
      form.bankId == null ||
      form.assetTypeId == null ||
      form.assetSubTypeId == null
    ) {
      setSubmitError("Preencha Categoria, Banco, Tipo e SubTipo.");
      return;
    }
    setSubmitLoading(true);
    setSubmitError(null);
    axios
      .post(API_URL, {
        asset: form.asset,
        quantity: form.quantity,
        averagePrice: form.averagePrice,
        quotation: form.quotation,
        assetCategory: { id: form.assetCategoryId },
        bank: { id: form.bankId },
        assetType: { id: form.assetTypeId },
        assetSubType: { id: form.assetSubTypeId },
      })
      .then(() => {
        refetchAssets();
        handleCloseCadastro();
      })
      .catch((err) => {
        console.error("Erro ao cadastrar ativo:", err);
        setSubmitError(
          err.response?.data?.message ?? "Erro ao cadastrar ativo. Tente novamente."
        );
      })
      .finally(() => setSubmitLoading(false));
  };

  useEffect(() => {
    axios
      .get<AssetFromApi[]>(API_URL)
      .then((res) => setAssets(res.data.map(mapApiToWalletAsset)))
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
        console.error("Erro ao buscar tipos de ativo:", err);
        setAssetTypes([]);
      });
    axios
      .get<AssetCategoryFromApi[]>(API_ASSET_CATEGORIES_URL)
      .then((res) => setAssetCategories(res.data))
      .catch((err) => {
        console.error("Erro ao buscar categorias:", err);
        setAssetCategories([]);
      });
  }, [dialogOpen]);

  useEffect(() => {
    if (!dialogOpen || form.assetTypeId == null) {
      setAssetSubTypes([]);
      return;
    }
    axios
      .get<AssetSubTypeFromApi[]>(`${API_ASSET_SUB_TYPES_URL}/${form.assetTypeId}`)
      .then((res) => setAssetSubTypes(res.data))
      .catch((err) => {
        console.error("Erro ao buscar subtipos:", err);
        setAssetSubTypes([]);
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
            className="shrink-0"
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
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={COLUMNS.length}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Nenhum ativo na carteira.
                    </TableCell>
                  </TableRow>
                ) : (
                  assets.map((row, index) => (
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
            <DialogTitle>Cadastrar Ativo</DialogTitle>
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
                  <Label htmlFor="assetCategoryId">Categoria</Label>
                  <select
                    id="assetCategoryId"
                    value={form.assetCategoryId ?? ""}
                    onChange={(e) =>
                      updateForm(
                        "assetCategoryId",
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    className={SELECT_CLASS}
                  >
                    <option value="">Selecione a categoria</option>
                    {assetCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.category}
                      </option>
                    ))}
                  </select>
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
                  <Label htmlFor="assetTypeId">Tipo</Label>
                  <select
                    id="assetTypeId"
                    value={form.assetTypeId ?? ""}
                    onChange={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      updateForm("assetTypeId", v);
                      updateForm("assetSubTypeId", null);
                    }}
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
                  <Label htmlFor="assetSubTypeId">SubTipo</Label>
                  <select
                    id="assetSubTypeId"
                    value={form.assetSubTypeId ?? ""}
                    onChange={(e) =>
                      updateForm(
                        "assetSubTypeId",
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
                    {assetSubTypes.map((s) => (
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
                disabled={submitLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="success" disabled={submitLoading}>
                {submitLoading ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
