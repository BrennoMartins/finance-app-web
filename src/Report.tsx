import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBarChart2, Loader2 } from "lucide-react";

interface AssetTypeReportItem {
  assetTypeId: number;
  assetTypeName: string;
  totalValue: number;
}

interface AssetSubTypeReportItem {
  assetSubTypeId: number;
  assetSubTypeName: string;
  totalValue: number;
}

interface AssetBySubTypeReportItem {
  assetName: string;
  totalValue: number;
}

const API_REPORT_BY_TYPE_URL = "/api/reports/assets/by-type";
const API_REPORT_BY_SUB_TYPE_URL = "/api/reports/assets/by-sub-type";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const PIE_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

export default function Report() {
  const [typeRows, setTypeRows] = useState<AssetTypeReportItem[]>([]);
  const [subTypeRows, setSubTypeRows] = useState<AssetSubTypeReportItem[]>([]);
  const [assetRows, setAssetRows] = useState<AssetBySubTypeReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subTypeLoading, setSubTypeLoading] = useState(true);
  const [subTypeError, setSubTypeError] = useState<string | null>(null);
  const [assetLoading, setAssetLoading] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [selectedTypeSegmentKey, setSelectedTypeSegmentKey] = useState<number | null>(null);
  const [selectedSubTypeSegmentKey, setSelectedSubTypeSegmentKey] = useState<number | null>(
    null
  );
  const [selectedAssetSegmentKey, setSelectedAssetSegmentKey] = useState<string | null>(null);

  const typeTotalValue = typeRows.reduce((acc, row) => acc + row.totalValue, 0);
  const subTypeTotalValue = subTypeRows.reduce((acc, row) => acc + row.totalValue, 0);
  const assetTotalValue = assetRows.reduce((acc, row) => acc + row.totalValue, 0);
  const pieRadius = 88;
  const pieStroke = 40;
  const pieSize = 240;
  const pieCircumference = 2 * Math.PI * pieRadius;

  const buildSegments = (
    items: { key: string | number; label: string; value: number }[],
    totalValue: number
  ) => {
    if (totalValue <= 0 || items.length === 0) return [];

    let offset = 0;
    return items.map((item, index) => {
      const ratio = item.value / totalValue;
      const length = ratio * pieCircumference;
      const percent = ratio * 100;
      const mid = offset + length / 2;
      const angle = -90 + (mid / pieCircumference) * 360;
      const angleRad = (angle * Math.PI) / 180;
      const labelRadius = pieRadius + 36;
      const labelX = pieSize / 2 + Math.cos(angleRad) * labelRadius;
      const labelY = pieSize / 2 + Math.sin(angleRad) * labelRadius;
      const segment = {
        key: item.key,
        label: item.label,
        value: item.value,
        color: PIE_COLORS[index % PIE_COLORS.length],
        length,
        offset,
        percent,
        labelX,
        labelY,
      };
      offset += length;
      return segment;
    });
  };

  const typePieSegments = buildSegments(
    typeRows.map((row) => ({
      key: row.assetTypeId,
      label: row.assetTypeName,
      value: row.totalValue,
    })),
    typeTotalValue
  );

  const subTypePieSegments = buildSegments(
    subTypeRows.map((row) => ({
      key: row.assetSubTypeId,
      label: row.assetSubTypeName,
      value: row.totalValue,
    })),
    subTypeTotalValue
  );

  const assetPieSegments = buildSegments(
    assetRows.map((row) => ({
      key: row.assetName,
      label: row.assetName,
      value: row.totalValue,
    })),
    assetTotalValue
  );

  useEffect(() => {
    axios
      .get<AssetTypeReportItem[]>(API_REPORT_BY_TYPE_URL)
      .then((typeRes) => {
        setTypeRows(typeRes.status === 204 || !Array.isArray(typeRes.data) ? [] : typeRes.data);
      })
      .catch((err) => {
        console.error("Erro ao buscar relatório por tipo:", err);
        setError("Erro ao buscar relatório de ativos por tipo.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSubTypeLoading(true);
    setSubTypeError(null);
    setSelectedSubTypeSegmentKey(null);
    setAssetRows([]);
    setAssetError(null);
    setAssetLoading(false);
    setSelectedAssetSegmentKey(null);

    axios
      .get<AssetSubTypeReportItem[]>(API_REPORT_BY_SUB_TYPE_URL, {
        params: selectedTypeSegmentKey == null ? undefined : { id: selectedTypeSegmentKey },
      })
      .then((subTypeRes) => {
        setSubTypeRows(
          subTypeRes.status === 204 || !Array.isArray(subTypeRes.data) ? [] : subTypeRes.data
        );
      })
      .catch((err) => {
        console.error("Erro ao buscar relatório por subtipo:", err);
        setSubTypeError("Erro ao buscar relatório de ativos por subtipo.");
        setSubTypeRows([]);
      })
      .finally(() => setSubTypeLoading(false));
  }, [selectedTypeSegmentKey]);

  useEffect(() => {
    if (selectedSubTypeSegmentKey == null) {
      setAssetRows([]);
      setAssetError(null);
      setAssetLoading(false);
      setSelectedAssetSegmentKey(null);
      return;
    }

    setAssetLoading(true);
    setAssetError(null);
    setSelectedAssetSegmentKey(null);

    axios
      .get<AssetBySubTypeReportItem[]>(
        `/api/reports/assets/${selectedSubTypeSegmentKey}/by-sub-type`
      )
      .then((assetRes) => {
        setAssetRows(assetRes.status === 204 || !Array.isArray(assetRes.data) ? [] : assetRes.data);
      })
      .catch((err) => {
        console.error("Erro ao buscar relatório por ativo do subtipo:", err);
        setAssetError("Erro ao buscar relatório de ativos do subtipo.");
        setAssetRows([]);
      })
      .finally(() => setAssetLoading(false));
  }, [selectedSubTypeSegmentKey]);

  useEffect(() => {
    if (
      selectedTypeSegmentKey != null &&
      !typeRows.some((row) => row.assetTypeId === selectedTypeSegmentKey)
    ) {
      setSelectedTypeSegmentKey(null);
    }
    if (
      selectedSubTypeSegmentKey != null &&
      !subTypeRows.some((row) => row.assetSubTypeId === selectedSubTypeSegmentKey)
    ) {
      setSelectedSubTypeSegmentKey(null);
    }
    if (
      selectedAssetSegmentKey != null &&
      !assetRows.some((row) => row.assetName === selectedAssetSegmentKey)
    ) {
      setSelectedAssetSegmentKey(null);
    }
  }, [
    typeRows,
    subTypeRows,
    assetRows,
    selectedTypeSegmentKey,
    selectedSubTypeSegmentKey,
    selectedAssetSegmentKey,
  ]);

  useEffect(() => {
    if (
      loading ||
      error ||
      (typeRows.length === 0 && subTypeRows.length === 0 && assetRows.length === 0)
    ) {
      setAnimateIn(false);
      return;
    }

    const timer = window.setTimeout(() => setAnimateIn(true), 80);
    return () => window.clearTimeout(timer);
  }, [loading, error, typeRows.length, subTypeRows.length, assetRows.length]);

  const selectedSubTypeLabel =
    selectedSubTypeSegmentKey == null
      ? null
      : subTypeRows.find((row) => row.assetSubTypeId === selectedSubTypeSegmentKey)
          ?.assetSubTypeName ?? null;

  const renderPieChart = (
    title: string,
    totalValue: number,
    segments: {
      key: string | number;
      label: string;
      value: number;
      color: string;
      length: number;
      offset: number;
      percent: number;
      labelX: number;
      labelY: number;
    }[],
    selectedKey: string | number | null,
    onSelectKey: (nextKey: string | number | null) => void,
    sectionLoading?: boolean,
    sectionError?: string | null
  ) => {
    if (sectionLoading) {
      return (
        <div className="rounded-md border bg-muted/20 p-4">
          <p className="mb-2 text-sm font-medium text-foreground">{title}</p>
          <div className="flex h-32 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando...</span>
          </div>
        </div>
      );
    }

    if (sectionError) {
      return (
        <div className="rounded-md border border-red-200 bg-red-50/50 p-4">
          <p className="mb-2 text-sm font-medium text-foreground">{title}</p>
          <div className="flex h-20 items-center justify-center text-sm text-red-600">
            {sectionError}
          </div>
        </div>
      );
    }

    if (segments.length === 0 || totalValue <= 0) {
      return (
        <div className="rounded-md border bg-muted/20 p-4">
          <p className="mb-2 text-sm font-medium text-foreground">{title}</p>
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            Nenhum dado encontrado.
          </div>
        </div>
      );
    }

    return (
      <div className="h-full rounded-md border bg-muted/20 p-4">
        <p className="mb-2 text-sm font-medium text-foreground">{title}</p>
        <div className="mx-auto flex w-full max-w-[320px] items-center justify-center">
          <div
            className="relative transition-all duration-700 ease-out"
            style={{
              opacity: animateIn ? 1 : 0,
              transform: animateIn ? "scale(1)" : "scale(0.92)",
            }}
          >
            <svg
              width={320}
              height={300}
              viewBox={`-36 -36 ${pieSize + 72} ${pieSize + 72}`}
              aria-label={title}
              className="overflow-visible"
              onClick={() => onSelectKey(null)}
            >
              <circle
                cx={pieSize / 2}
                cy={pieSize / 2}
                r={pieRadius}
                fill="none"
                stroke="rgba(148, 163, 184, 0.2)"
                strokeWidth={pieStroke}
              />

              {segments.map((segment) => (
                <circle
                  key={segment.key}
                  cx={pieSize / 2}
                  cy={pieSize / 2}
                  r={pieRadius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={pieStroke}
                  strokeDasharray={`${segment.length} ${pieCircumference}`}
                  strokeDashoffset={-segment.offset}
                  transform={`rotate(-90 ${pieSize / 2} ${pieSize / 2})`}
                  className="cursor-pointer transition-all duration-300"
                  style={{
                    opacity: selectedKey == null || selectedKey === segment.key ? 1 : 0.2,
                    filter:
                      selectedKey == null || selectedKey === segment.key
                        ? "none"
                        : "blur(1.5px)",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectKey(selectedKey === segment.key ? null : segment.key);
                  }}
                >
                  <title>
                    {`${segment.label}: ${formatCurrency(segment.value)} (${segment.percent.toFixed(2)}%)`}
                  </title>
                </circle>
              ))}

              {segments.map((segment) => (
                <g
                  key={`${segment.key}-label`}
                  className="transition-all duration-300"
                  style={{
                    opacity: selectedKey == null || selectedKey === segment.key ? 1 : 0.35,
                    filter:
                      selectedKey == null || selectedKey === segment.key
                        ? "none"
                        : "blur(0.8px)",
                  }}
                >
                  <text
                    x={segment.labelX}
                    y={segment.labelY - 6}
                    textAnchor={segment.labelX >= pieSize / 2 ? "start" : "end"}
                    className="fill-foreground text-[11px] font-semibold"
                  >
                    {segment.label}
                  </text>
                  <text
                    x={segment.labelX}
                    y={segment.labelY + 8}
                    textAnchor={segment.labelX >= pieSize / 2 ? "start" : "end"}
                    className="fill-muted-foreground text-[10px]"
                  >
                    {segment.percent.toFixed(2)}%
                  </text>
                </g>
              ))}
            </svg>

            <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-semibold">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileBarChart2 className="h-5 w-5 text-emerald-600" />
              Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Carregando relatório...</span>
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
              <FileBarChart2 className="h-5 w-5 text-red-600" />
              Report
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
        <CardHeader className="border-b bg-muted/30 pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileBarChart2 className="h-5 w-5 text-emerald-600" />
            Report
          </CardTitle>
          <p className="text-sm text-muted-foreground">Resumo de ativos por tipo</p>
        </CardHeader>
        <CardContent className="p-6">
          {typeRows.length === 0 && subTypeRows.length === 0 ? (
            <div className="flex h-44 items-center justify-center text-muted-foreground">
              Nenhum dado encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-3 items-start gap-4">
              {renderPieChart(
                "Resumo por tipo de ativo",
                typeTotalValue,
                typePieSegments,
                selectedTypeSegmentKey,
                (nextKey) =>
                  setSelectedTypeSegmentKey(typeof nextKey === "number" ? nextKey : null)
              )}

              {renderPieChart(
                "Resumo por subtipo de ativo",
                subTypeTotalValue,
                subTypePieSegments,
                selectedSubTypeSegmentKey,
                (nextKey) =>
                  setSelectedSubTypeSegmentKey(typeof nextKey === "number" ? nextKey : null),
                subTypeLoading,
                subTypeError
              )}

              {selectedSubTypeSegmentKey == null ? (
                <div className="h-full rounded-md border bg-muted/20 p-4">
                  <p className="mb-2 text-sm font-medium text-foreground">
                    Resumo por ativo do subtipo
                  </p>
                  <div className="flex h-32 items-center justify-center text-muted-foreground">
                    Selecione um subtipo no segundo gráfico.
                  </div>
                </div>
              ) : (
                renderPieChart(
                  selectedSubTypeLabel
                    ? `Resumo por ativo de ${selectedSubTypeLabel}`
                    : "Resumo por ativo do subtipo",
                  assetTotalValue,
                  assetPieSegments,
                  selectedAssetSegmentKey,
                  (nextKey) =>
                    setSelectedAssetSegmentKey(typeof nextKey === "string" ? nextKey : null),
                  assetLoading,
                  assetError
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
