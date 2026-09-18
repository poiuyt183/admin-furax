"use client";

import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  ChevronDown,
  Globe,
  Eye,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  analyzeSeo,
  type SeoCheck,
  type SeoGrade,
  type SeoInput,
} from "../seo-analyzer";

const GRADE_CONFIG: Record<
  SeoGrade,
  { label: string; className: string; bgClassName: string }
> = {
  A: {
    label: "Xuất sắc",
    className: "text-emerald-700 dark:text-emerald-400",
    bgClassName: "bg-emerald-100 dark:bg-emerald-950",
  },
  B: {
    label: "Tốt",
    className: "text-blue-700 dark:text-blue-400",
    bgClassName: "bg-blue-100 dark:bg-blue-950",
  },
  C: {
    label: "Trung bình",
    className: "text-yellow-700 dark:text-yellow-400",
    bgClassName: "bg-yellow-100 dark:bg-yellow-950",
  },
  D: {
    label: "Yếu",
    className: "text-orange-700 dark:text-orange-400",
    bgClassName: "bg-orange-100 dark:bg-orange-950",
  },
  F: {
    label: "Kém",
    className: "text-red-700 dark:text-red-400",
    bgClassName: "bg-red-100 dark:bg-red-950",
  },
};

const BULLET_COLOR = {
  pass: "bg-emerald-500",
  warning: "bg-orange-400",
  fail: "bg-red-500",
};

const STATUS_ICON = {
  pass: <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />,
  warning: <AlertTriangle className="size-4 shrink-0 text-orange-500" />,
  fail: <XCircle className="size-4 shrink-0 text-red-500" />,
};

/* ─────────────── Google SERP Preview ─────────────── */

function SerpPreview({
  title,
  slug,
  description,
}: {
  title: string;
  slug: string;
  description: string;
}) {
  const displayTitle = title || "Tiêu đề bài viết";
  const displayDesc = description || "Thêm meta description để hiển thị mô tả ở đây...";
  const truncatedTitle =
    displayTitle.length > 60
      ? `${displayTitle.slice(0, 57)}...`
      : displayTitle;
  const truncatedDesc =
    displayDesc.length > 160
      ? `${displayDesc.slice(0, 157)}...`
      : displayDesc;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Eye className="size-4" />
        Xem trước trên Google
      </div>
      <div className="rounded-lg border bg-white dark:bg-zinc-950 p-4 space-y-1 shadow-sm">
        {/* URL breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-muted">
            <Globe className="size-3 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-foreground/70">
              yoursite.com
            </p>
            <p className="truncate text-xs text-foreground/50">
              yoursite.com › blog › {slug || "duong-dan-bai-viet"}
            </p>
          </div>
        </div>
        {/* Title */}
        <h3 className="text-xl leading-snug text-[#1a0dab] dark:text-blue-400 hover:underline cursor-pointer line-clamp-1">
          {truncatedTitle}
        </h3>
        {/* Description */}
        <p className="text-sm leading-relaxed text-[#4d5156] dark:text-zinc-400 line-clamp-2">
          {truncatedDesc}
        </p>
      </div>
    </div>
  );
}

/* ─────────────── Score Ring ─────────────── */

function ScoreRing({
  score,
  maxScore,
  grade,
}: {
  score: number;
  maxScore: number;
  grade: SeoGrade;
}) {
  const pct = Math.round((score / maxScore) * 100);
  const config = GRADE_CONFIG[grade];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex size-20 items-center justify-center">
        <svg className="size-20 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${pct * 2.64} 264`}
            strokeLinecap="round"
            className={config.className}
          />
        </svg>
        <span className={`absolute text-xl font-bold ${config.className}`}>
          {pct}
        </span>
      </div>
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${config.className} ${config.bgClassName}`}
      >
        {config.label}
      </span>
    </div>
  );
}

/* ─────────────── Check Item (Yoast-style) ─────────────── */

function CheckItem({ check }: { check: SeoCheck }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-start gap-2.5 py-1.5 text-left group"
        onClick={() => setExpanded(!expanded)}
      >
        <span
          className={`mt-1.5 size-2.5 shrink-0 rounded-full ${BULLET_COLOR[check.status]}`}
        />
        <span className="flex-1 text-sm text-foreground/80 group-hover:text-foreground transition-colors">
          {check.message}
        </span>
        <ChevronDown
          className={`mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && check.suggestion && (
        <div className="ml-5 mb-1 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          💡 {check.suggestion}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Check Group (Problems / Improvements / Good) ─────────────── */

function CheckGroup({
  title,
  checks,
  defaultOpen = false,
}: {
  title: string;
  checks: SeoCheck[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (checks.length === 0) return null;

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="flex-1 text-sm font-medium">
          {title}{" "}
          <span className="text-muted-foreground font-normal">
            ({checks.length})
          </span>
        </span>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t px-3 py-2 space-y-0.5">
          {checks.map((check) => (
            <CheckItem key={check.id} check={check} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Main Modal ─────────────── */

interface SeoScoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postData: Omit<SeoInput, "focusKeyword">;
}

export function SeoScoreModal({
  open,
  onOpenChange,
  postData,
}: SeoScoreModalProps) {
  const [focusKeyword, setFocusKeyword] = useState("");

  const result = useMemo(
    () =>
      analyzeSeo({
        ...postData,
        focusKeyword: focusKeyword.trim() || undefined,
      }),
    [postData, focusKeyword],
  );

  const failChecks = result.checks.filter((c) => c.status === "fail");
  const warnChecks = result.checks.filter((c) => c.status === "warning");
  const passChecks = result.checks.filter((c) => c.status === "pass");

  const serpTitle = postData.metaTitle || postData.title;
  const serpDesc = postData.metaDescription || postData.excerpt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="size-5" />
            Kiểm tra SEO
          </DialogTitle>
          <DialogDescription>
            Phân tích bài viết theo chuẩn SEO trước khi xuất bản.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Focus keyword */}
          <div className="space-y-1.5">
            <Label htmlFor="focus-keyword" className="text-sm font-medium">
              Từ khóa trọng tâm
            </Label>
            <Input
              id="focus-keyword"
              placeholder="Nhập từ khóa muốn xếp hạng trên Google..."
              value={focusKeyword}
              onChange={(e) => setFocusKeyword(e.target.value)}
            />
          </div>

          <Separator />

          {/* Google SERP Preview */}
          <SerpPreview
            title={serpTitle}
            slug={postData.slug}
            description={serpDesc}
          />

          <Separator />

          {/* Score overview */}
          <div className="flex items-center gap-5">
            <ScoreRing
              score={result.totalScore}
              maxScore={result.maxScore}
              grade={result.grade}
            />
            <div className="flex-1 space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tổng điểm SEO</span>
                <span className="font-semibold">
                  {result.totalScore}/{result.maxScore}
                </span>
              </div>
              <Progress
                value={(result.totalScore / result.maxScore) * 100}
                className="h-2"
              />
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-red-500" />
                  {failChecks.length} vấn đề
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-orange-400" />
                  {warnChecks.length} cải thiện
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  {passChecks.length} tốt
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Grouped analysis — Yoast style */}
          <div className="space-y-2">
            <CheckGroup
              title="Vấn đề"
              checks={failChecks}
              defaultOpen={true}
            />
            <CheckGroup
              title="Cần cải thiện"
              checks={warnChecks}
              defaultOpen={true}
            />
            <CheckGroup
              title="Kết quả tốt"
              checks={passChecks}
              defaultOpen={false}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
